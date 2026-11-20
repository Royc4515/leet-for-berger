/**
 * Problem: Streak Watch (design)
 *
 * Equivalent to LeetCode 2526; statement and tests are written for this project. A monitor is told
 * a target value and a length k, then receives readings one at a time; after each reading it says
 * whether the last k readings were all the target. One counter of the current run of target
 * readings answers in O(1): it grows on a target, drops to 0 on anything else, and the answer is
 * "counter >= k".
 *
 * Classic wrong answers: scanning the last k readings on every call (O(k) per call, too slow at
 * k = 50,000 with 10^5 calls), counting all target readings so far instead of the current run, and
 * resetting the run when it reaches k (a long streak must keep answering true).
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_OPS = 100000;
const MAX_VAL = 1000000000;
const MAX_K = 100000;

/**
 * Reference simulation.
 * @param {string[]} ops operation names, ops[0] === 'StreakWatch'
 * @param {number[][]} args argument list per operation
 * @returns {(boolean|null)[]}
 */
export function reference(ops, args) {
  let target = 0;
  let k = 0;
  let run = 0;
  return ops.map((op, i) => {
    if (op === 'observe') {
      run = args[i][0] === target ? run + 1 : 0;
      return run >= k;
    }
    [target, k] = args[i];
    return null;
  });
}

/** Builds a test from the constructor arguments and a list of readings. */
function watch(target, k, readings) {
  return [['StreakWatch', ...Array(readings.length).fill('observe')], [[target, k], ...readings.map((r) => [r])]];
}

/** Seeded readings in 1..range. */
function randomReadings(seed, n, range) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * range));
}

/** All target readings, except that every `gap`-th reading is a different value. */
function brokenRuns(target, n, gap) {
  return Array.from({ length: n }, (_, i) => ((i + 1) % gap === 0 ? target + 1 : target));
}

const visible = [
  { args: watch(4, 3, [4, 4, 4, 3]), expected: [null, false, false, true, false], note: 'Three 4s in a row, then a 3 ends the streak.' },
  { args: watch(3, 1, [3, 2, 3]), expected: [null, true, false, true], note: 'With k = 1 only the latest reading matters.' },
  { args: watch(7, 2, [7, 1, 7]), expected: [null, false, false, false], note: 'Two 7s were seen, but never two in a row.' },
  { args: watch(5, 2, [5, 5, 5, 5]), expected: [null, false, true, true, true], note: 'A streak longer than k keeps answering true.' },
  { args: watch(1, 5, [1, 1]), expected: [null, false, false], note: 'Fewer than k readings so far: not enough to answer true.' },
];

// Hidden tests: k = 1, 32-bit-sized values, a streak that is cut and restarted, random mixes, and
// 10^5 calls: a run of 99,999 targets against k = 50,000 and k = 99,999 (a scan of the last k
// readings per call is far too slow), runs cut every 49,999 readings, k that is never reached, and
// a target that alternates with another value.
const hiddenArgs = [
  watch(1, 1, [1]),
  watch(MAX_VAL, 2, [MAX_VAL, MAX_VAL, 1, MAX_VAL, MAX_VAL, MAX_VAL]),
  watch(2, 3, [2, 2, 3, 2, 2, 2, 2, 1, 2, 2]),
  watch(2, 3, randomReadings(81, 1000, 3)),
  watch(5, 50000, Array(MAX_OPS - 1).fill(5)),
  watch(5, 50000, brokenRuns(5, MAX_OPS - 1, 49999)),
  watch(1, 5, randomReadings(83, MAX_OPS - 1, 2)),
  watch(MAX_VAL, MAX_K, Array(MAX_OPS - 1).fill(MAX_VAL)),
  watch(8, 2, Array.from({ length: MAX_OPS - 1 }, (_, i) => (i % 2 === 0 ? 8 : 9))),
  watch(7, MAX_OPS - 1, Array(MAX_OPS - 1).fill(7)),
];

export const problem = {
  id: 'streak-watch',
  title: 'Streak Watch',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Data Stream', 'Running Counter'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A sensor reports integer readings one at a time. Implement the class
    <code>StreakWatch</code> to tell whether the sensor is stuck on one value:</p>
    <ul>
      <li><code>StreakWatch(target, k)</code> creates a monitor that watches for the value
      <code>target</code> repeated <code>k</code> times in a row.</li>
      <li><code>observe(reading)</code> records a new reading and returns <code>true</code> if the
      last <code>k</code> readings recorded so far are all equal to <code>target</code>. If fewer
      than <code>k</code> readings have been recorded, it returns <code>false</code>.</li>
    </ul>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor).</p>
  `,
  constraints: [
    '1 <= target, reading <= 10^9',
    '1 <= k <= 10^5',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(1) per call',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Checking the last k readings from scratch on every call costs O(k). What would it cost for k = 50,000 and 100,000 calls?',
    'To answer "are the last k all the target", what do you need to know about the readings right now, besides their values?',
    'What does a reading that is not the target do to the current streak? What does a target reading do?',
    'Does the answer change from true to false when the streak grows beyond k?',
    'Once the streak is tracked by one number, is any history of readings still needed?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep one counter: the length of the current run of target readings ending at the latest
    reading. A target reading adds one to it; any other reading sets it to zero. The monitor answers
    <code>true</code> exactly when the counter is at least <code>k</code>.</p>
    <h4>Why it works</h4>
    <p>The last k readings are all the target if and only if the run of target readings that ends now
    is at least k long. The counter is that run length by construction: it extends with every target
    and breaks at the first other value. Nothing older than the current run matters, so no list of
    past readings is needed.</p>
    <h4>Complexity</h4>
    <p>O(1) time per call and O(1) space: a counter and the two constructor values.</p>
    <h4>Pitfall</h4>
    <p>Scanning the last k readings each call is correct but O(k) per call, about 2.5 * 10^9 steps for
    k = 50,000 and 10^5 calls. Counting every target reading ever seen, instead of the current run,
    answers true after two separated 7s with k = 2. And resetting the counter once it reaches k makes
    a long streak answer true only every k-th time.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'StreakWatch',
    constructor: {
      params: [
        { name: 'target', type: 'int' },
        { name: 'k', type: 'int' },
      ],
    },
    methods: [{ name: 'observe', params: [{ name: 'reading', type: 'int' }], returns: 'bool' }],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops.length > MAX_OPS) return { ok: false, error: 'At most 10^5 calls.' };
    const inRange = (v, max) => Number.isInteger(v) && v >= 1 && v <= max;
    if (ops[0] !== 'StreakWatch' || !Array.isArray(args[0]) || args[0].length !== 2 || !inRange(args[0][0], MAX_VAL) || !inRange(args[0][1], MAX_K)) {
      return { ok: false, error: 'The first call must be "StreakWatch" with [target, k]: target 1 to 10^9, k 1 to 10^5.' };
    }
    for (let i = 1; i < ops.length; i++) {
      if (ops[i] !== 'observe') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      if (!Array.isArray(args[i]) || args[i].length !== 1 || !inRange(args[i][0], MAX_VAL)) return { ok: false, error: `observe needs one reading from 1 to 10^9 (call ${i}).` };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
