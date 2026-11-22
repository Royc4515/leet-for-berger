/**
 * Problem workspace: description | editor + console, with resizers, actions and the mentor panel.
 *
 * A "session" (interview / battle) can wrap the workspace. It contributes a header strip,
 * can disable assistance (reveal, mentor), and receives every judged result.
 *
 * @typedef {Object} WorkspaceSession
 * @property {'interview'|'battle'} kind
 * @property {HTMLElement} [banner]          strip rendered above the split
 * @property {boolean} allowAssist           reveal + mentor enabled?
 * @property {(ev: { kind: 'run'|'submit', result: any, problemId: string }) => void} onResult
 * @property {HTMLElement} [problemSwitcher] interview: tabs between problems
 * @property {Map<string, string>} [drafts]  in-memory drafts: sessions start from starter code, never from practice drafts
 */
import { h, mount, trustedHtml, toast, confirmDialog, difficulty } from '../dom.js';
import { attachResizer } from '../resizer.js';
import { createEditor } from '../editor.js';
import { renderIdle, renderPending, renderResult, renderError, renderGrowthLine } from '../results.js';
import { buildSuite, judge, comparatorFor } from '../../engine/harness.js';
import { estimateGrowth, describeGrowth, shouldRetryGrowth } from '../../engine/growth.js';
import { getRunner, isRemote } from '../../engine/runners/index.js';
import { recordSubmission, markRevealed } from '../../state/progress.js';
import { loadDraft, saveDraft, clearDraft } from '../../state/drafts.js';
import { TOPICS, loadSolution, catalogEntry } from '../../problems/index.js';
import { createProblemContext } from '../problem-context.js';
import { createProblemExtras } from '../problem-extras.js';
import { services } from '../../auth/services.js';
import { shouldAutoSync } from '../../auth/github-sync.js';
import { createMentorPanel } from '../mentor-panel.js';

const LANG_KEY = 'lfb:lang';

/** The saved language when this problem offers it; SQL problems offer only SQL. */
function preferredLanguage(languages) {
  const fallback = languages.some((x) => x.id === 'javascript') ? 'javascript' : languages[0].id;
  try {
    const l = localStorage.getItem(LANG_KEY);
    return languages.some((x) => x.id === l) ? l : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {HTMLElement} root
 * @param {{ problem: any, store: any, session?: WorkspaceSession }} opts
 * @returns {() => void} cleanup
 */
export function renderWorkspace(root, { problem, store, session = null }) {
  const cleanups = [];
  const languages = problem.languages;
  let language = preferredLanguage(languages);
  let editor = null;
  let running = false;
  let lastResult = null;
  let disposed = false;
  const allowAssist = session ? session.allowAssist : true;
  // Java, C++, C, C# and Go run on the remote runner when one is configured, in practice mode only.
  const onServer = (lang) => !session && isRemote(lang);

  // Sessions keep code in memory so an interview never opens on a solution typed (or revealed) in practice.
  const drafts = session?.drafts
    ? {
        load: (lang) => session.drafts.get(`${problem.id}:${lang}`) ?? null,
        save: (lang, code) => session.drafts.set(`${problem.id}:${lang}`, code),
        clear: (lang) => session.drafts.delete(`${problem.id}:${lang}`),
      }
    : {
        load: (lang) => loadDraft(problem.id, lang),
        save: (lang, code) => saveDraft(problem.id, lang, code),
        clear: (lang) => clearDraft(problem.id, lang),
      };

  /* ---------- Left: description ---------- */
  const customToggle = h('input#custom-toggle', { type: 'checkbox' });
  const customInput = h('textarea#custom-input.custom-input', {
    rows: 3,
    spellcheck: 'false',
    placeholder: problem.customInputExample ?? '"abcabc"',
    'aria-label': 'Custom test input',
  });
  const topicLabels = problem.topics.map((t) => TOPICS.find((x) => x.id === t)?.label ?? t);
  // Sessions keep companies but drop complexity (a hint) and family links (they leave the session).
  const context = createProblemContext({
    problem,
    progress: store.get().problems[problem.id],
    titleOf: (id) => catalogEntry(id)?.title ?? null,
    showComplexity: allowAssist,
    showFamily: !session,
  });
  /** Saves one submission to the user's GitHub repository (ADR 0007); the toast says how it went. */
  function pushToGitHub({ language: lang, code, verdict, passed, total, assisted }) {
    services.github
      .push({ problemId: problem.id, title: problem.title, difficulty: problem.difficulty, language: lang, code, verdict, passed, total, assisted })
      .then((r) => !disposed && toast(`Saved to GitHub: ${r.repo}`, 'success'))
      .catch((err) => !disposed && toast(`GitHub sync failed: ${err.message}`, 'error', 6000));
  }

  // Practice only: a walkthrough or past code would defeat a timed session.
  const extras = session
    ? null
    : createProblemExtras({
        problem,
        store,
        getLanguage: () => language,
        languageLabel: (id) => languages.find((l) => l.id === id)?.label ?? id,
        loadSolution,
        canPush: () => Boolean(services.github?.get()?.linked),
        onPush: (entry) =>
          pushToGitHub({ language: entry.language, code: entry.code, verdict: entry.verdict, passed: entry.passed, total: entry.total, assisted: Boolean(store.get().problems[problem.id]?.revealed) }),
        onLoadCode: (lang, code) => {
          if (!editor) return;
          if (lang !== language && languages.some((l) => l.id === lang)) {
            langSelect.value = lang;
            langSelect.dispatchEvent(new Event('change'));
          }
          editor.setValue(code);
          toast('Code loaded from your history. Ctrl+Z restores what you had.', 'info');
        },
      });
  if (extras) cleanups.push(extras.dispose);

  const left = h(
    'section.pane.pane-left',
    { 'aria-label': 'Problem description' },
    session?.problemSwitcher ?? null,
    h(
      'header.problem-head',
      {},
      h('h1.problem-title', {}, problem.title),
      h('div.problem-tags', {}, difficulty(problem.difficulty), topicLabels.map((t) => h('span.tag', {}, t)), problem.patterns.map((p) => h('span.tag.tag-muted', {}, p))),
    ),
    context.el,
    trustedHtml('div.statement', problem.statementHtml),
    h('h2.block-title', {}, 'Examples'),
    problem.examples.map((ex, i) =>
      h(
        'div.example',
        {},
        h('div.example-title', {}, `Example ${i + 1}`),
        h('pre', {}, h('b', {}, 'Input: '), ex.input, '\n', h('b', {}, 'Output: '), ex.output, ex.explanation ? ['\n', h('b', {}, 'Explanation: '), ex.explanation] : null),
      ),
    ),
    h('h2.block-title', {}, 'Constraints'),
    h('ul.constraints', {}, problem.constraints.map((c) => h('li', {}, h('code', {}, c)))),
    extras?.el ?? null,
    h(
      'div.custom-card',
      {},
      h('div.custom-head', {}, h('h2.block-title', {}, 'Custom Test Input'), h('label.switch', { for: 'custom-toggle' }, customToggle, h('span', {}, 'Use on Run'))),
      h('p.hint-text', {}, 'Runs as Case 1 on "Run Code". Submissions always use the official 15 tests. JSON string or bare text.'),
      customInput,
    ),
  );
  customInput.addEventListener('input', () => {
    if (customInput.value.trim()) customToggle.checked = true;
  });

  /* ---------- Right: toolbar + editor + console ---------- */
  const langSelect = h(
    'select.select',
    { 'aria-label': 'Language' },
    languages.map((l) => h('option', { value: l.id, selected: l.id === language }, l.label + (l.executable || onServer(l.id) ? '' : ' (editor only)'))),
  );
  const runBtn = h('button.btn.btn-secondary', { type: 'button', title: "Run Code (Ctrl+')" }, 'Run Code');
  const submitBtn = h('button.btn.btn-primary', { type: 'button', title: 'Submit (Ctrl+Enter)' }, 'Submit');
  const revealBtn = h('button.btn.btn-ghost', { type: 'button', disabled: !allowAssist, title: allowAssist ? 'Load the optimal solution' : 'Disabled in this mode' }, 'Reveal Solution');
  const runnerNote = h('span.runner-note', { title: 'Compiled and run on the code server; judged in your browser' }, 'Runs on the server');
  const showRunnerNote = () => {
    runnerNote.hidden = !onServer(language);
  };
  showRunnerNote();
  const resetBtn = h('button.btn.btn-ghost.btn-icon', { type: 'button', title: 'Reset to starter code', 'aria-label': 'Reset to starter code' }, '↺');
  const mentorBtn = h('button.btn.btn-ghost', { type: 'button', disabled: !allowAssist, 'aria-pressed': 'false', title: allowAssist ? 'Socratic hints' : 'Disabled in this mode' }, 'AI Mentor');

  const editorHost = h('div.editor-host', {}, h('div.editor-loading', {}, h('span.spinner'), ' Loading editor...'));
  const consoleBody = h('div.console-body', { 'aria-live': 'polite' });
  renderIdle(consoleBody);

  const rowHandle = h('div.resizer.resizer-y', { 'aria-label': 'Resize editor and console' });
  const right = h(
    'section.pane.pane-right',
    { 'aria-label': 'Code editor and console' },
    h('div.toolbar', {}, langSelect, resetBtn, runnerNote, h('div.toolbar-spacer'), mentorBtn, revealBtn, runBtn, submitBtn),
    h('div.editor-split', {}, editorHost, rowHandle, h('div.console', {}, h('div.console-title', {}, 'Execution Console'), consoleBody)),
  );
  const editorSplit = right.querySelector('.editor-split');

  const mentor = createMentorPanel({
    getContext: () => ({ problem, language, code: editor?.getValue() ?? '', lastResult }),
    onClose: () => toggleMentor(false),
  });

  const colHandle = h('div.resizer.resizer-x', { 'aria-label': 'Resize description and editor' });
  const split = h('div.workspace', {}, left, colHandle, right, mentor.el);
  mount(root, session?.banner ?? null, split);
  root.classList.add('view-workspace');

  cleanups.push(
    attachResizer({ handle: colHandle, container: split, axis: 'x', cssVar: '--left-size', storageKey: 'lfb:split:x', min: 0.22, max: 0.65, initial: 0.4, onResize: () => editor?.layout() }),
    attachResizer({ handle: rowHandle, container: editorSplit, axis: 'y', cssVar: '--editor-size', storageKey: 'lfb:split:y', min: 0.2, max: 0.85, initial: 0.62, onResize: () => editor?.layout() }),
    () => root.classList.remove('view-workspace'),
  );

  function toggleMentor(open = !split.classList.contains('mentor-open')) {
    split.classList.toggle('mentor-open', open);
    mentorBtn.setAttribute('aria-pressed', String(open));
    if (open) mentor.focus();
    requestAnimationFrame(() => editor?.layout());
  }
  mentorBtn.addEventListener('click', () => toggleMentor());

  /* ---------- Editor ---------- */
  const codeFor = (lang) => drafts.load(lang) ?? problem.starterCode[lang];
  const monacoLang = (lang) => languages.find((l) => l.id === lang).monaco;

  createEditor(editorHost, { value: codeFor(language), language: monacoLang(language) }).then((ed) => {
    if (disposed) return ed.dispose();
    editor = ed;
    if (ed.isFallback) toast('Monaco could not load (offline?). Using a plain editor.', 'warn');
    let saveTimer;
    ed.onChange((v) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => drafts.save(language, v), 400);
    });
    ed.addAction('run', () => execute('run'));
    ed.addAction('submit', () => execute('submit'));
    ed.focus();
  });
  cleanups.push(() => editor?.dispose());

  langSelect.addEventListener('change', () => {
    if (editor) drafts.save(language, editor.getValue());
    language = langSelect.value;
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      /* ignore */
    }
    editor?.setLanguage(monacoLang(language));
    editor?.setValue(codeFor(language));
    // Pyodide takes seconds to boot; start it now rather than on the first Run.
    if (language === 'python') getRunner('python').warmUp()?.catch(() => {});
    if (onServer(language)) getRunner(language).warmUp()?.catch(() => {});
    showRunnerNote();
  });
  if (language === 'python' || language === 'sql') getRunner(language).warmUp()?.catch(() => {});

  resetBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Reset code?', body: 'Your current code for this language will be replaced by the starter code.', confirmLabel: 'Reset', danger: true });
    if (!ok || !editor) return;
    drafts.clear(language);
    editor.setValue(problem.starterCode[language]);
  });

  revealBtn.addEventListener('click', async () => {
    if (!allowAssist || !editor) return;
    const ok = await confirmDialog({
      title: 'Reveal the optimal solution?',
      body: 'The O(n) solution replaces your code (Ctrl+Z restores it). The problem is marked as "assisted" in your progress.',
      confirmLabel: 'Reveal',
    });
    if (!ok) return;
    let code;
    try {
      code = await loadSolution(problem.id, language);
    } catch (err) {
      toast(`Could not load the solution: ${err.message}`, 'error');
      return;
    }
    if (disposed || !editor) return;
    editor.setValue(code);
    store.update((s) => markRevealed(s, problem.id));
    toast('Solution loaded. Read it, then try to rewrite it from memory.', 'info');
  });

  /* ---------- Growth estimate (docs/adr/0004-complexity-feedback.md) ---------- */
  let growthRun = null;

  /** Cancels a growth measurement in flight and waits until its runner is free again. */
  async function stopGrowth() {
    const run = growthRun;
    growthRun = null;
    if (!run) return;
    run.stopped = true;
    run.runner.cancelGrowth();
    await run.done;
  }

  /**
   * After an Accepted submit, times the same code on growing inputs and adds one line to the
   * console. Starts after the verdict has painted and never changes it.
   */
  function startGrowth(code, lang) {
    const runner = getRunner(lang);
    const line = renderGrowthLine(consoleBody);
    const run = { runner, stopped: false, done: null };
    run.done = (async () => {
      // Two frames: the verdict is on screen before any timing work starts.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      if (run.stopped || disposed) return;
      const BUDGET_MS = 5000;
      const measure = (budgetMs) =>
        runner.measureGrowth({
          code,
          entry: problem.signatures[lang].entry,
          adapter: problem.adapters?.[lang] ?? null,
          growth: problem.growth,
          // Python runs about 50x slower, so fewer calls per size keep it inside the same budget.
          reps: lang === 'python' ? 3 : 5,
          budgetMs,
        });
      const started = performance.now();
      let res = await measure(BUDGET_MS);
      let est = null;
      for (let pass = 0; pass < 2; pass++) {
        if (run.stopped || disposed || res.cancelled) return;
        if (res.error) {
          const first = String(res.error).split('\n').find((l) => l.trim()) ?? 'error';
          line.show({ headline: 'Growth estimate: unavailable (the code failed on a larger generated input).', note: first }, 'inconclusive');
          return;
        }
        est = estimateGrowth(res.samples, problem.growth.target);
        const elapsed = performance.now() - started;
        // A transient JIT state can make one size uniformly slow; one fresh pass, in budget, settles it.
        if (pass > 0 || !shouldRetryGrowth(est, elapsed, BUDGET_MS)) break;
        res = await measure(BUDGET_MS - elapsed);
      }
      line.show(describeGrowth(est, problem.growth), est.verdict);
    })().catch((err) => {
      if (!run.stopped && !disposed) line.show({ headline: 'Growth estimate: unavailable.', note: err.message }, 'inconclusive');
    });
    growthRun = run;
  }
  cleanups.push(() => {
    stopGrowth();
  });

  /* ---------- Execution ---------- */
  async function execute(kind) {
    if (running || !editor) return;
    await stopGrowth();
    if (running) return;
    let customArgs;
    if (kind === 'run' && customToggle.checked && customInput.value.trim()) {
      const parsed = problem.parseCustomInput(customInput.value);
      if (!parsed.ok) {
        renderError(consoleBody, `Custom input: ${parsed.error}`);
        return;
      }
      customArgs = parsed.args;
    }

    running = true;
    runBtn.disabled = submitBtn.disabled = true;
    root.classList.add('is-running');
    const started = performance.now();
    renderPending(consoleBody, kind === 'submit' ? 'Submitting...' : 'Running...');

    try {
      const suite = buildSuite(problem, { customArgs });
      const code = editor.getValue();
      const raw = await getRunner(language, { session: Boolean(session) }).run({
        code,
        signature: problem.signature,
        entry: problem.signatures[language].entry,
        adapter: problem.adapters?.[language] ?? null,
        cases: suite.map(({ id, args }) => ({ id, args })),
        timeLimitMs: problem.timeLimitMs,
        onStatus: (s) => !disposed && renderPending(consoleBody, s),
      });
      if (disposed) return;
      // The problem decides how answers are compared: SQL result sets, judge modes, or exact JSON.
      const result = judge(suite, raw, comparatorFor(problem));
      lastResult = result;
      renderResult(consoleBody, result, { kind, argNames: problem.argNames, elapsedMs: performance.now() - started });

      const executable = languages.find((l) => l.id === language).executable || onServer(language);
      if (kind === 'submit' && executable) {
        store.update((s) => recordSubmission(s, { problemId: problem.id, accepted: result.accepted, detail: { language, verdict: result.verdict, passed: result.passed, total: result.total, code } }));
        const github = services.github;
        const revealed = Boolean(store.get().problems[problem.id]?.revealed);
        if (github && shouldAutoSync({ accepted: result.accepted, revealed, link: github.get(), practice: !session })) {
          pushToGitHub({ language, code, verdict: result.verdict, passed: result.passed, total: result.total, assisted: false });
        }
        toast(result.accepted ? 'Accepted. Nice work.' : `${result.verdict}: ${result.passed}/15`, result.accepted ? 'success' : 'error');
      }
      session?.onResult({ kind, result, problemId: problem.id });
      // Practice only: in interview and battle the clock is running, and timing would compete for the CPU.
      // TypeScript times its transpiled JavaScript in the same worker.
      const timeable = language === 'javascript' || language === 'typescript' || language === 'python';
      if (kind === 'submit' && result.accepted && problem.growth && timeable && !session) startGrowth(code, language);
    } catch (err) {
      if (disposed) return;
      // No verdict to show (server unreachable or busy): say so plainly, nothing is recorded.
      renderError(consoleBody, err.remote ? err.message : `Internal error: ${err.message}`);
    } finally {
      running = false;
      runBtn.disabled = submitBtn.disabled = false;
      root.classList.remove('is-running');
    }
  }
  runBtn.addEventListener('click', () => execute('run'));
  submitBtn.addEventListener('click', () => execute('submit'));

  return () => {
    disposed = true;
    if (running && onServer(language)) getRunner(language).cancel();
    if (editor) drafts.save(language, editor.getValue());
    cleanups.forEach((fn) => fn());
  };
}
