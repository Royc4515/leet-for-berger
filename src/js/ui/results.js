/**
 * Execution console renderer (docs/DESIGN.md, Atlas): one verdict line, then the 15 cases as a row
 * of hexes (5 that open, 10 hidden with a lock that show pass or fail only), then the open case.
 * The hexes resolve left to right; failures get no extra motion. Renders only what judge()
 * returns: hidden cases arrive here already stripped of inputs and outputs (invariant 3).
 */
import { shareButton } from './share.js';
import { h, mount } from './dom.js';
import { preview } from '../engine/harness.js';
import { reducedMotion, burst, shake, DUR } from './motion.js';

/** Makes tab and panel ids unique across renders (one console at a time, but re-renders overlap). */
let resultSeq = 0;

const STATUS_LABEL = {
  pass: 'Passed',
  fail: 'Wrong Answer',
  error: 'Runtime Error',
  'compile-error': 'Compile Error',
  timeout: 'Time Limit',
  skipped: 'Not Run',
  unsupported: 'Unsupported',
};

/**
 * The console before the first run: what will happen and the shortcuts.
 * @param {HTMLElement} el
 * @param {string} [message]
 */
export function renderIdle(el, message = 'Run tries your code on the 15 tests without recording it. Submit records the result.') {
  mount(
    el,
    h(
      'div.console-idle',
      {},
      h('div.idle-hexes', { 'aria-hidden': 'true' }, Array.from({ length: 15 }, (_, i) => h(`span.idle-hex${i < 5 ? '.is-open' : ''}`))),
      h('p', {}, message),
      h('p.console-keys', {}, h('kbd', {}, "Ctrl '"), ' run  ', h('kbd', {}, 'Ctrl Enter'), ' submit'),
    ),
  );
}

/**
 * Work in progress (booting a runtime, running, submitting).
 * @param {HTMLElement} el
 * @param {string} message
 */
export function renderPending(el, message) {
  mount(el, h('div.console-pending', {}, h('span.spinner', { 'aria-hidden': 'true' }), h('span', {}, message)));
}

/**
 * No verdict to show (custom input invalid, runner unreachable): a plain message, first line first.
 * @param {HTMLElement} el
 * @param {string} message
 */
export function renderError(el, message) {
  mount(el, h('div.console-error', {}, h('strong.console-error-head', {}, 'Could not run'), h('pre.console-error-body', {}, message)));
}

/**
 * @param {HTMLElement} el
 * @param {ReturnType<import('../engine/harness.js').judge>} result
 * @param {{ kind: 'run'|'submit', argNames: string[], elapsedMs: number, next?: { href: string, title: string }|null, firstSolve?: boolean, share?: (() => import('../data/share.js').SharePayload)|null }} meta
 *   next: where "Next problem" goes after an Accepted submit (practice only); share: what the
 *   "Share" button sends after an Accepted submit (practice only: the problem and the language)
 */
export function renderResult(el, result, { kind, argNames, elapsedMs, next = null, firstSolve = false, share = null }) {
  const visible = result.cases.filter((c) => c.visible);
  const hidden = result.cases.filter((c) => !c.visible);
  const verdictClass = result.accepted ? 'ok' : result.verdict === 'Language Not Supported Yet' ? 'muted' : 'bad';

  // ARIA tabs pattern: one tab per visible case, the detail below is their tabpanel. Each tab says
  // its status in words for screen readers; the dot is only colour.
  const uid = ++resultSeq;
  const detail = h('div.case-detail', { role: 'tabpanel', id: `case-panel-${uid}`, tabindex: '0' });
  const select = (i, { focus = false } = {}) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.setAttribute('tabindex', j === i ? '0' : '-1');
    });
    detail.setAttribute('aria-labelledby', tabs[i].id);
    showCase(detail, visible[i], argNames);
    if (focus) tabs[i].focus();
  };
  const tabs = visible.map((c, i) =>
    h(
      `button.case-tab.st-${c.status}`,
      {
        type: 'button',
        role: 'tab',
        id: `case-tab-${uid}-${i}`,
        'aria-controls': detail.id,
        'aria-selected': 'false',
        tabindex: '-1',
        title: STATUS_LABEL[c.status],
        onClick: () => select(i),
      },
      h('span.case-hex', { 'aria-hidden': 'true' }),
      h('span.case-num', {}, c.custom ? 'Custom' : String(c.id)),
      h('span.sr-only', {}, `${c.custom ? '' : ` (case ${c.id})`}, ${STATUS_LABEL[c.status]}`),
    ),
  );
  const tabList = h('div.case-tabs', { role: 'tablist', 'aria-label': 'Visible test cases' }, tabs);
  tabList.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select((next + tabs.length) % tabs.length, { focus: true });
  });
  // Open the first non-passing visible case: that is the one the user needs to look at.
  const firstBad = visible.findIndex((c) => c.status !== 'pass');
  select(firstBad === -1 ? 0 : firstBad);

  const accepted = result.accepted && kind === 'submit';
  const root = h(
    `div.result.v-${verdictClass}${accepted ? '.is-accepted' : ''}${reducedMotion() ? '' : '.is-resolving'}`,
    {},
    h(
      'div.result-head',
      {},
      h(`span.verdict.${verdictClass}`, {}, result.verdict),
      h('span.result-meta', {}, `${result.passed} / ${result.total} tests passed`),
      h('span.result-meta', {}, kind === 'submit' ? 'Submission' : 'Run'),
      h('span.result-meta', {}, `${Math.round(elapsedMs)} ms`),
      accepted && firstSolve ? h('span.tag.tag-lamp.first-solve', {}, 'First solve') : null,
      accepted && share ? shareButton({ name: 'Share your solve', get: share }) : null,
      accepted && next ? h('a.btn.btn-primary.btn-sm.next-problem', { href: next.href }, `Next: ${next.title}`) : null,
    ),
    h(
      'div.case-strip',
      {},
      h('div.case-group', {}, h('div.section-label', {}, 'Open cases 1-5'), tabList),
      h(
        'div.case-group.case-group-hidden',
        {},
        h('div.section-label', {}, 'Hidden cases 6-15'),
        h(
          'div.hidden-grid',
          { role: 'list' },
          hidden.map((c) =>
            h(
              `div.hidden-pill.st-${c.status}`,
              { role: 'listitem', title: `Hidden test ${c.id}: ${STATUS_LABEL[c.status]}` },
              h('span.case-hex', { 'aria-hidden': 'true' }),
              h('span.case-num', {}, `#${c.id}`),
              h('span.pill-status', {}, c.status === 'pass' ? 'Pass' : 'Fail'),
            ),
          ),
        ),
      ),
    ),
    detail,
    h('p.hidden-note', {}, 'Hidden cases show pass or fail only. Their inputs stay private, the way an interview judge works.'),
  );
  // Stagger index for the resolve animation: open cases first, then hidden, left to right.
  [...root.querySelectorAll('.case-tab, .hidden-pill')].forEach((c, i) => c.style.setProperty('--i', String(i)));
  mount(el, root);
  // Accepted: green hexes burst from the verdict as the cases finish resolving (amber and green, and
  // a bigger burst, on a first solve). A failed submit gives the word a short shake. Decoration only.
  const word = root.querySelector('.verdict');
  if (accepted) {
    setTimeout(() => {
      if (word.isConnected) burst(word, firstSolve ? { count: 26, colors: ['var(--ok)', 'var(--accent)', 'var(--ok)', 'var(--focus)'], spread: 150 } : { count: 14, spread: 100 });
    }, DUR.stage);
  } else if (verdictClass === 'bad' && kind === 'submit') shake(word);
}

/**
 * Growth estimate line under an Accepted submission's verdict (docs/adr/0004-complexity-feedback.md).
 * Starts as a "timing" note and is replaced by the estimate. Plain text inside the console's live
 * region, so screen readers hear the result once it lands.
 * @param {HTMLElement} el the console body holding a rendered result
 * @returns {{ show: (text: { headline: string, note: string }, verdict: string) => void, remove: () => void }}
 */
export function renderGrowthLine(el) {
  const box = h('div.growth.growth-pending', {}, h('span.spinner', { 'aria-hidden': 'true' }), ' Growth estimate: timing your code on larger inputs...');
  const head = el.querySelector('.result-head');
  if (head) head.after(box);
  else el.append(box);
  return {
    show({ headline, note }, verdict) {
      box.className = `growth growth-${verdict.replace(/\s+/g, '-')}`;
      mount(box, h('div.growth-head', {}, headline), h('div.growth-note', {}, note));
    },
    remove: () => box.remove(),
  };
}

function showCase(el, c, argNames) {
  const rows = [
    ['Input', c.args.map((a, i) => `${argNames[i] ?? `arg${i}`} = ${preview(a)}`).join('\n')],
    ['Expected', preview(c.expected)],
  ];
  if (!['skipped', 'unsupported', 'timeout', 'compile-error'].includes(c.status)) rows.push(['Actual', preview(c.actual)]);
  if (c.error) rows.push(['Error', c.error]);
  if (c.status === 'timeout') rows.push(['Error', 'Exceeded the time limit. Check your complexity against the constraints.']);
  if (c.stdout) rows.push(['Stdout', c.stdout.trimEnd()]);
  mount(
    el,
    h(`div.case-status.st-${c.status}`, {}, h('span.case-status-word', {}, `${c.custom ? 'Custom case' : `Case ${c.id}`}: ${STATUS_LABEL[c.status]}`), c.timeMs != null ? h('span.case-time', {}, ` · ${c.timeMs.toFixed(1)} ms`) : ''),
    rows.map(([label, value]) =>
      h('div.io-row', {}, h('div.io-label', {}, label), h(`pre.io-value${label === 'Error' ? '.io-error' : ''}`, {}, value)),
    ),
  );
}
