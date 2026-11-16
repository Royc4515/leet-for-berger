/**
 * Monaco editor bootstrap with a plain <textarea> fallback.
 *
 * Monaco is loaded from a pinned CDN build via its AMD loader (no bundler needed).
 * If the CDN is unreachable the platform must still be usable, so after a timeout we
 * fall back to a textarea that implements the same tiny interface.
 */

// don't touch / pinned: Monaco's AMD paths and worker layout change between majors.
const MONACO_VERSION = '0.52.2';
const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min`;
const LOAD_TIMEOUT_MS = 12000;

let monacoPromise = null;

/** @returns {Promise<any|null>} the monaco namespace, or null when unavailable */
export function loadMonaco() {
  if (monacoPromise) return monacoPromise;
  monacoPromise = new Promise((resolve) => {
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
  });
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
      editor.getModel()?.dispose();
      editor.dispose();
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
