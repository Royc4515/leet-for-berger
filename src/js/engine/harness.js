/**
 * Test harness: builds the 15-case suite and scores runner output.
 *
 * Pure module (no DOM, no workers) so it runs identically in the browser and under
 * `node --test`. Runners live in ./runners and only execute code; all judging is here.
 */

export const VISIBLE_COUNT = 5;
export const HIDDEN_COUNT = 10;
export const TOTAL_COUNT = VISIBLE_COUNT + HIDDEN_COUNT;

/**
 * @typedef {Object} TestCase
 * @property {number} id          1-based position in the suite
 * @property {boolean} visible    true for cases 1-5 (detailed feedback)
 * @property {boolean} custom     true if built from the user's custom input
 * @property {unknown[]} args
 * @property {unknown} expected
 */

/**
 * Build exactly 15 cases: 5 visible + 10 hidden.
 *
 * On "Run Code" with custom input, the custom case takes slot 1 and the canonical
 * visible cases shift down (the last one drops). The total stays 15 by design: the
 * spec says every run executes 15 cases, and a fixed count keeps the UI layout stable.
 * "Submit" never includes custom input, so a verdict is always judged on the canonical suite.
 *
 * @param {object} problem
 * @param {{ customArgs?: unknown[] }} [opts]
 * @returns {TestCase[]}
 */
export function buildSuite(problem, opts = {}) {
  if (problem.visibleTests.length !== VISIBLE_COUNT || problem.hiddenTests.length !== HIDDEN_COUNT) {
    throw new Error(
      `Problem "${problem.id}" must define exactly ${VISIBLE_COUNT} visible and ${HIDDEN_COUNT} hidden tests.`,
    );
  }

  const visible = problem.visibleTests.map((t) => ({ ...t, custom: false }));
  if (opts.customArgs) {
    visible.unshift({ args: opts.customArgs, expected: problem.solveReference(opts.customArgs), custom: true });
    visible.length = VISIBLE_COUNT;
  }

  const hidden = problem.hiddenTests.map((t) => ({ ...t, custom: false }));
  return [
    ...visible.map((t, i) => ({ id: i + 1, visible: true, ...t })),
    ...hidden.map((t, i) => ({ id: VISIBLE_COUNT + i + 1, visible: false, ...t })),
  ];
}

/**
 * Structural equality that treats JSON-equivalent values as equal.
 * Python returns lists where JS returns arrays, and both cross the worker boundary
 * as plain data, so a canonical JSON compare is the honest cross-language check.
 * @param {unknown} a
 * @param {unknown} b
 */
export function deepEqual(a, b) {
  return canonical(a) === canonical(b);
}

function canonical(v) {
  if (v === undefined) return 'undefined';
  return JSON.stringify(v, (_k, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Sort keys so {a,b} and {b,a} compare equal.
      return Object.keys(val)
        .sort()
        .reduce((acc, k) => ((acc[k] = val[k]), acc), {});
    }
    return val;
  });
}

/**
 * @typedef {Object} RawResult  what a runner reports per case
 * @property {number} id
 * @property {'ok'|'error'|'timeout'|'skipped'|'unsupported'} state
 * @property {unknown} [actual]
 * @property {string} [error]
 * @property {string} [stdout]
 * @property {number} [timeMs]
 */

/**
 * Merge runner output with the suite and decide pass/fail per case.
 * Hidden cases are redacted here (not in the UI) so expected values and inputs
 * for hidden tests never reach the rendering layer.
 * @param {TestCase[]} suite
 * @param {RawResult[]} raw
 * @param {(actual: unknown, expected: unknown) => boolean} [compare]
 */
export function judge(suite, raw, compare = deepEqual) {
  const byId = new Map(raw.map((r) => [r.id, r]));
  const cases = suite.map((tc) => {
    const r = byId.get(tc.id) ?? { id: tc.id, state: 'skipped' };
    let status;
    if (r.state === 'ok') status = compare(r.actual, tc.expected) ? 'pass' : 'fail';
    else if (r.state === 'timeout') status = 'timeout';
    else if (r.state === 'error') status = 'error';
    else if (r.state === 'unsupported') status = 'unsupported';
    else status = 'skipped';

    const base = { id: tc.id, visible: tc.visible, custom: tc.custom, status, timeMs: r.timeMs ?? null };
    if (!tc.visible) return base;
    return { ...base, args: tc.args, expected: tc.expected, actual: r.actual, error: r.error, stdout: r.stdout };
  });

  const passed = cases.filter((c) => c.status === 'pass').length;
  const firstFailure = cases.find((c) => c.status !== 'pass');
  return {
    cases,
    passed,
    total: cases.length,
    accepted: passed === cases.length,
    verdict: verdictFor(cases, firstFailure),
  };
}

function verdictFor(cases, firstFailure) {
  if (!firstFailure) return 'Accepted';
  if (cases.some((c) => c.status === 'unsupported')) return 'Language Not Supported Yet';
  switch (firstFailure.status) {
    case 'timeout':
      return 'Time Limit Exceeded';
    case 'error':
      return 'Runtime Error';
    case 'skipped':
      return 'Not Executed';
    default:
      return 'Wrong Answer';
  }
}

/**
 * Short, safe preview of a value for the console.
 * Hidden-scale inputs (10^5 chars) would freeze the DOM if printed raw.
 * @param {unknown} v
 * @param {number} [max]
 */
export function preview(v, max = 160) {
  const s = v === undefined ? 'undefined' : JSON.stringify(v);
  if (s === undefined) return String(v);
  return s.length > max ? `${s.slice(0, max)}... (${s.length} chars)` : s;
}
