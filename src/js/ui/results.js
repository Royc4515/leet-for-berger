/**
 * Execution console renderer: verdict header, 5 detailed visible cases, 10 hidden pass/fail pills.
 */
import { h, mount } from './dom.js';
import { preview } from '../engine/harness.js';

const STATUS_LABEL = {
  pass: 'Passed',
  fail: 'Wrong Answer',
  error: 'Runtime Error',
  timeout: 'Time Limit',
  skipped: 'Not Run',
  unsupported: 'Unsupported',
};

export function renderIdle(el, message = 'Run your code to see results. Ctrl+\' runs, Ctrl+Enter submits.') {
  mount(el, h('div.console-idle', {}, h('span.console-prompt', {}, '$'), ' ', message));
}

export function renderPending(el, message) {
  mount(el, h('div.console-idle', {}, h('span.spinner', { 'aria-hidden': 'true' }), ' ', message));
}

export function renderError(el, message) {
  mount(el, h('div.console-error', {}, message));
}

/**
 * @param {HTMLElement} el
 * @param {ReturnType<import('../engine/harness.js').judge>} result
 * @param {{ kind: 'run'|'submit', argNames: string[], elapsedMs: number }} meta
 */
export function renderResult(el, result, { kind, argNames, elapsedMs }) {
  const visible = result.cases.filter((c) => c.visible);
  const hidden = result.cases.filter((c) => !c.visible);
  const verdictClass = result.accepted ? 'ok' : result.verdict === 'Language Not Supported Yet' ? 'muted' : 'bad';

  const detail = h('div.case-detail');
  const tabs = visible.map((c, i) =>
    h(
      `button.case-tab.st-${c.status}`,
      {
        type: 'button',
        'aria-pressed': i === 0 ? 'true' : 'false',
        title: STATUS_LABEL[c.status],
        onClick: (e) => {
          tabs.forEach((t) => t.setAttribute('aria-pressed', 'false'));
          e.currentTarget.setAttribute('aria-pressed', 'true');
          showCase(detail, c, argNames);
        },
      },
      h('span.dot'),
      c.custom ? 'Custom' : `Case ${c.id}`,
    ),
  );
  // Open the first non-passing visible case: that is the one the user needs to look at.
  const firstBad = visible.findIndex((c) => c.status !== 'pass');
  const openIdx = firstBad === -1 ? 0 : firstBad;
  tabs.forEach((t, i) => t.setAttribute('aria-pressed', i === openIdx ? 'true' : 'false'));
  showCase(detail, visible[openIdx], argNames);

  mount(
    el,
    h(
      'div.result-head',
      {},
      h(`span.verdict.${verdictClass}`, {}, result.verdict),
      h('span.result-meta', {}, `${result.passed} / ${result.total} tests passed`),
      h('span.result-meta', {}, kind === 'submit' ? 'Submission' : 'Run'),
      h('span.result-meta', {}, `${Math.round(elapsedMs)} ms`),
    ),
    h('div.section-label', {}, 'Detailed cases (1-5)'),
    h('div.case-tabs', { role: 'group', 'aria-label': 'Visible test cases' }, tabs),
    detail,
    h('div.section-label', {}, 'Hidden cases (6-15)'),
    h(
      'div.hidden-grid',
      {},
      hidden.map((c) =>
        h(`div.hidden-pill.st-${c.status}`, { title: `Hidden test ${c.id}: ${STATUS_LABEL[c.status]}` }, h('span.dot'), `#${c.id}`, h('span.pill-status', {}, c.status === 'pass' ? 'Pass' : 'Fail')),
      ),
    ),
  );
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
  if (c.status !== 'skipped' && c.status !== 'unsupported' && c.status !== 'timeout') rows.push(['Actual', preview(c.actual)]);
  if (c.error) rows.push(['Error', c.error]);
  if (c.status === 'timeout') rows.push(['Error', 'Exceeded the time limit. Check your complexity against the constraints.']);
  if (c.stdout) rows.push(['Stdout', c.stdout.trimEnd()]);
  mount(
    el,
    h(`div.case-status.st-${c.status}`, {}, STATUS_LABEL[c.status], c.timeMs != null ? ` · ${c.timeMs.toFixed(1)} ms` : ''),
    rows.map(([label, value]) =>
      h('div.io-row', {}, h('div.io-label', {}, label), h(`pre.io-value${label === 'Error' ? '.io-error' : ''}`, {}, value)),
    ),
  );
}
