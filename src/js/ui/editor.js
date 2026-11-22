/**
 * Monaco editor bootstrap with a plain <textarea> fallback.
 *
 * Monaco is loaded from a pinned CDN build via its AMD loader (no bundler needed).
 * If the CDN is unreachable the platform must still be usable, so after a timeout we
 * fall back to a textarea that implements the same tiny interface.
 */

import { TS_COMPILER_OPTIONS, AMBIENT_TYPES } from '../engine/typescript.js';

// don't touch / pinned: Monaco's AMD paths and worker layout change between majors.
const MONACO_VERSION = '0.52.2';
const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;
const LOAD_TIMEOUT_MS = 12000;

/**
 * One TypeScript configuration for the editor's squiggles and the judge (ui/ts-compiler.js), so
 * the editor underlines what a Submit would reject. Set before any model exists: changing it
 * later restarts the TypeScript worker under a live editor.
 * @param {any} monaco
 */
function configureTypeScript(monaco) {
  const ts = monaco.languages?.typescript;
  if (!ts) return;
  // allowNonTsExtensions: Monaco's own default, needed for models without a .ts file name.
  ts.typescriptDefaults.setCompilerOptions({ ...TS_COMPILER_OPTIONS, allowNonTsExtensions: true });
  ts.typescriptDefaults.addExtraLib(AMBIENT_TYPES, 'file:///lfb-globals.d.ts');
}

let monacoPromise = null;

/**
 * Monaco's CancellationError: its constructor sets both message and name to "Canceled".
 * Matched exactly so no other error is ever swallowed.
 * @param {unknown} reason
 */
export function isMonacoCancellation(reason) {
  return reason instanceof Error && reason.name === 'Canceled' && reason.message === 'Canceled';
}

// don't touch / closing an editor cancels some of Monaco's in-flight work by design (for example
// its link detector), and a few of those promises have no rejection handler, so a close can leak
// an uncaught "Canceled". It is not a failure, but left alone it trips the zero-console-errors
// invariant. Only Monaco's exact cancellation error is ignored. This only works because Monaco
// loads with CORS (see loadMonaco): errors from a no-CORS cross-origin script are "muted" and
// never reach the page's handlers.
let cancellationGuardInstalled = false;
function installCancellationGuard() {
  if (cancellationGuardInstalled) return;
  cancellationGuardInstalled = true;
  window.addEventListener('unhandledrejection', (e) => {
    if (isMonacoCancellation(e.reason)) e.preventDefault();
  });
  window.addEventListener('error', (e) => {
    if (isMonacoCancellation(e.error)) e.preventDefault();
  });
}

/**
 * Runs `load` while every <script> the page creates is requested with CORS. Monaco's AMD loader
 * creates its own script tags and has no option for this, so creation is wrapped for exactly the
 * duration of the load and restored afterwards.
 * @param {(done: () => void) => void} load calls done() when loading has finished either way
 */
function withCorsScripts(load) {
  const native = document.createElement;
  // don't touch / without crossOrigin the CDN scripts are no-CORS, their errors are muted and the
  // cancellation guard above cannot see them. jsDelivr answers with Access-Control-Allow-Origin: *.
  document.createElement = function createElement(tag, options) {
    const el = native.call(this, tag, options);
    if (String(tag).toLowerCase() === 'script') el.crossOrigin = 'anonymous';
    return el;
  };
  load(() => {
    document.createElement = native;
  });
}

/** @returns {Promise<any|null>} the monaco namespace, or null when unavailable */
export function loadMonaco() {
  if (monacoPromise) return monacoPromise;
  installCancellationGuard();
  monacoPromise = new Promise((outerResolve) => withCorsScripts((loaded) => {
    const resolve = (value) => {
      loaded();
      outerResolve(value);
    };
    const timer = setTimeout(() => resolve(null), LOAD_TIMEOUT_MS);

    // don't touch / Monaco's language workers are cross-origin (CDN). Browsers refuse
    // `new Worker(cdnUrl)`, so we hand Monaco a same-origin data: URL that importScripts
    // the CDN worker. Removing this produces "Could not create web worker" console errors.
    self.MonacoEnvironment = {
      getWorkerUrl() {
        const src = `self.MonacoEnvironment={baseUrl:'${MONACO_BASE}/'};importScripts('${MONACO_BASE}/vs/base/worker/workerMain.js');`;
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(src)}`;
      },
    };

    const script = document.createElement('script');
    script.src = `${MONACO_BASE}/vs/loader.js`;
    script.onload = () => {
      window.require.config({ paths: { vs: `${MONACO_BASE}/vs` } });
      window.require(
        ['vs/editor/editor.main'],
        () => {
          clearTimeout(timer);
          configureTypeScript(window.monaco);
          document.fonts?.ready.then(() => window.monaco?.editor?.remeasureFonts?.());
          resolve(window.monaco);
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
      );
    };
    script.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    document.head.append(script);
  }));
  return monacoPromise;
}

/**
 * @typedef {Object} EditorHandle
 * @property {() => string} getValue
 * @property {(v: string) => void} setValue
 * @property {(lang: string) => void} setLanguage
 * @property {(cb: (v: string) => void) => void} onChange
 * @property {(keys: 'run'|'submit', cb: () => void) => void} addAction
 * @property {() => void} layout
 * @property {() => void} focus
 * @property {() => void} dispose
 * @property {boolean} isFallback
 */

/**
 * @param {HTMLElement} host
 * @param {{ value: string, language: string }} opts
 * @returns {Promise<EditorHandle>}
 */
export async function createEditor(host, { value, language }) {
  const monaco = await loadMonaco();
  if (!host.isConnected) return fallbackEditor(host, { value }); // view left while loading
  if (!monaco) return fallbackEditor(host, { value });

  const editor = monaco.editor.create(host, {
    value,
    language,
    theme: 'vs-dark',
    automaticLayout: false, // we call layout() from the resizer; the built-in polling is laggy
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    autoIndent: 'full',
    formatOnPaste: true,
    tabSize: 4,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderLineHighlight: 'all',
    padding: { top: 12 },
    bracketPairColorization: { enabled: true },
  });

  const ro = new ResizeObserver(() => editor.layout());
  ro.observe(host);

  return {
    isFallback: false,
    getValue: () => editor.getValue(),
    setValue: (v) => {
      // pushEditOperations keeps Ctrl+Z able to undo "Reveal Solution" / "Reset".
      const model = editor.getModel();
      editor.pushUndoStop();
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: v }], () => null);
      editor.pushUndoStop();
    },
    setLanguage: (lang) => monaco.editor.setModelLanguage(editor.getModel(), lang),
    onChange: (cb) => editor.onDidChangeModelContent(() => cb(editor.getValue())),
    addAction: (kind, cb) => {
      const keybinding =
        kind === 'run' ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote : monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter;
      editor.addAction({ id: `lfb-${kind}`, label: kind === 'run' ? 'Run Code' : 'Submit', keybindings: [keybinding], run: cb });
    },
    layout: () => editor.layout(),
    focus: () => editor.focus(),
    dispose: () => {
      ro.disconnect();
      // don't touch / editor first, then its model. Disposing the model while the editor is still
      // attached fires model events into live contributions, which cancel in-flight requests and
      // surface as uncaught "Canceled" errors (fails the zero-console-errors invariant).
      const model = editor.getModel();
      editor.dispose();
      model?.dispose();
    },
  };
}

function fallbackEditor(host, { value }) {
  const ta = document.createElement('textarea');
  ta.className = 'fallback-editor';
  ta.spellcheck = false;
  ta.value = value;
  ta.setAttribute('aria-label', 'Code editor');
  // Tab inserts spaces instead of moving focus: unusable for code otherwise.
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end');
    }
  });
  host.replaceChildren(ta);
  const actions = [];
  const onKey = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const kind = e.key === 'Enter' ? 'submit' : e.key === "'" ? 'run' : null;
    const a = actions.find((x) => x.kind === kind);
    if (a) {
      e.preventDefault();
      a.cb();
    }
  };
  ta.addEventListener('keydown', onKey);
  return {
    isFallback: true,
    getValue: () => ta.value,
    setValue: (v) => (ta.value = v),
    setLanguage: () => {},
    onChange: (cb) => ta.addEventListener('input', () => cb(ta.value)),
    addAction: (kind, cb) => actions.push({ kind, cb }),
    layout: () => {},
    focus: () => ta.focus(),
    dispose: () => ta.remove(),
  };
}
