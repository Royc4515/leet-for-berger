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
 * @property {'ok'|'error'|'compile-error'|'timeout'|'skipped'|'unsupported'} state
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
 * @param {(actual: unknown, expected: unknown, tc: TestCase) => boolean} [compare] see comparatorFor
 */
export function judge(suite, raw, compare = deepEqual) {
  const byId = new Map(raw.map((r) => [r.id, r]));
  const cases = suite.map((tc) => {
    const r = byId.get(tc.id) ?? { id: tc.id, state: 'skipped' };
    let status;
    if (r.state === 'ok') status = compare(r.actual, tc.expected, tc) ? 'pass' : 'fail';
    else if (r.state === 'timeout') status = 'timeout';
    else if (r.state === 'error') status = 'error';
    else if (r.state === 'compile-error') status = 'compile-error';
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
    case 'compile-error':
      return 'Compile Error';
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

/*
 * Judge modes. Most problems have one right answer per case and use 'exact' (deepEqual). A problem
 * whose answer is legitimately random declares `judge: '<mode>'`, and the mode decides from the
 * case's args, the reference's expected value and the user's actual value. Modes run here, on the
 * main thread, after the worker is done: expected values still never reach a worker, and judge()
 * still redacts hidden cases afterwards.
 */

// 6.5 standard deviations: a fair pick fails one bucket with probability about 1e-10, so even a
// submission with a hundred checked buckets fails by chance less than once in 10^8.
const UNIFORM_SIGMAS = 6.5;
// A run is checked for fairness only when every member is expected at least this many times.
const UNIFORM_MIN_EXPECTED = 100;

/**
 * Is a run of random picks plausibly uniform over `members`? Each member's count must sit within
 * UNIFORM_SIGMAS binomial standard deviations of the mean. Short runs are not checked.
 * @param {Map<number, number>} counts picks per value
 * @param {number} picks total picks in the run
 * @param {number} size number of members during the run
 */
export function plausiblyUniform(counts, picks, size) {
  if (size < 2) return true;
  const mean = picks / size;
  if (mean < UNIFORM_MIN_EXPECTED) return true;
  const sd = Math.sqrt(picks * (1 / size) * (1 - 1 / size));
  if (counts.size !== size) return false; // some member was never picked
  for (const c of counts.values()) if (Math.abs(c - mean) > UNIFORM_SIGMAS * sd + 1) return false;
  return true;
}

/**
 * 'randomized-set': a design test whose class keeps a set of ints with insert(val) -> bool,
 * remove(val) -> bool and getRandom() -> int. Every call but getRandom must equal the reference's
 * result exactly (expected holds null at getRandom positions). A getRandom result must be a current
 * member, and every run of getRandom calls on an unchanged set that is long enough (at least 100
 * expected picks per member) must look uniform (within 6.5 standard deviations per member).
 * @param {unknown} actual
 * @param {unknown[]} expected
 * @param {{ args: [string[], unknown[][]] }} tc
 */
export function checkRandomizedSet(actual, expected, tc) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const [ops, argLists] = tc.args;
  const members = new Set();
  let counts = new Map();
  let picks = 0;
  const runIsFair = () => {
    const ok = plausiblyUniform(counts, picks, members.size);
    counts = new Map();
    picks = 0;
    return ok;
  };
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === 'getRandom') {
      if (!members.has(actual[i])) return false;
      counts.set(actual[i], (counts.get(actual[i]) ?? 0) + 1);
      picks++;
      continue;
    }
    if (!deepEqual(actual[i], expected[i])) return false;
    if (!runIsFair()) return false;
    const v = argLists[i][0];
    if (ops[i] === 'insert') members.add(v);
    else if (ops[i] === 'remove') members.delete(v);
  }
  return runIsFair();
}

/** Every judge mode by name. 'exact' is the default when a problem declares none. */
export const JUDGE_MODES = {
  exact: (actual, expected) => deepEqual(actual, expected),
  'randomized-set': checkRandomizedSet,
};

/**
 * The comparison judge() should use for a problem: a comparator the problem supplies itself
 * (SQL problems compare result sets), else its `judge` mode (default 'exact').
 * @param {{ judge?: string, compare?: Function }} problem
 * @returns {(actual: unknown, expected: unknown, tc: TestCase) => boolean}
 */
export function comparatorFor(problem) {
  if (typeof problem.compare === 'function') return problem.compare;
  const mode = problem.judge ?? 'exact';
  const fn = JUDGE_MODES[mode];
  if (!fn) throw new Error(`Unknown judge mode "${mode}"`);
  return fn;
}
