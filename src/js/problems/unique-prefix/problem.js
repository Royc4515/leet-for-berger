/**
 * Problem: Unique Prefix
 *
 * A sorted array keeps equal values side by side, so removing duplicates is one compaction pass:
 * a read pointer scans, a write pointer marks where the next new value belongs, and a value is new
 * exactly when it differs from the last one kept.
 *
 * The classic version overwrites the array in place and returns how many values are kept; here
 * the kept values are returned as an array, so every language judges the same value. The array
 * itself can be reused as the output buffer: nothing is read after it is overwritten.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000000000;

/**
 * Reference: keep a value when it differs from the last kept one.
 * @param {number[]} nums sorted in non-decreasing order
 * @returns {number[]}
 */
export function reference(nums) {
  const out = [];
  for (const v of nums) if (out.length === 0 || out[out.length - 1] !== v) out.push(v);
  return out;
}

/** A sorted array built from runs: each run repeats a fresh value `runLen(rnd)` times, up to n values. */
function runs(seed, n, runLen, start = -MAX_ABS, step = 3) {
  const rnd = mulberry32(seed);
  const out = [];
  let v = start;
  while (out.length < n) {
    const len = Math.min(runLen(rnd), n - out.length);
    for (let i = 0; i < len; i++) out.push(v);
    // A gap of at least 1 keeps values strictly increasing between runs; the cap keeps them in range.
    v += 1 + Math.floor(rnd() * step);
  }
  return out;
}

const visible = [
  { args: [[1, 1, 2]], expected: [1, 2], note: 'The second 1 repeats the last kept value, so it is dropped.' },
  { args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], expected: [0, 1, 2, 3, 4], note: 'Runs of any length collapse to one value, including a run of three.' },
  { args: [[-3]], expected: [-3], note: 'A single value has nothing to remove.' },
  { args: [[5, 5, 5, 5]], expected: [5], note: 'One run: only its first value stays.' },
  { args: [[-2, -1, 0, 1]], expected: [-2, -1, 0, 1], note: 'No duplicates, so the result equals the input.' },
];

// Hidden: a pair, a run at the very end, a triple run (keeping two copies of each value fails it),
// both extremes of the value range, and five arrays at 10^5 values: all equal, all distinct,
// short runs, long runs, and pairs, where removing by shifting the tail for every duplicate is too slow.
const hiddenInputs = [
  [7, 7],
  [1, 2, 3, 3, 3],
  [4, 4, 4, 9, 9, 9, 9],
  [-1000000000, -1000000000, 1000000000, 1000000000],
  new Array(MAX_N).fill(-1000000000),
  runs(31, MAX_N, () => 1, -MAX_ABS, 3),
  runs(37, MAX_N, (rnd) => 1 + Math.floor(rnd() * 3)),
  runs(41, MAX_N, (rnd) => 1 + Math.floor(rnd() * 1000)),
  runs(43, MAX_N, () => 2),
  runs(47, MAX_N, (rnd) => (rnd() < 0.5 ? 1 : 50000)),
];

/** @param {unknown} v */
const isInt = (v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS;

export const problem = {
  id: 'unique-prefix',
  title: 'Unique Prefix',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'In-place Compaction'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The integer array <code>nums</code> is sorted in non-decreasing order. Return a new array that
    holds each distinct value of <code>nums</code> exactly once, in the same order.</p>
    <p>Think of it as compacting the array in place: the distinct values form a prefix, and everything
    after it is ignored. Aim for one pass and no shifting of the tail for each duplicate you find.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'nums is sorted in non-decreasing order',
    'Target complexity: O(n) time, O(1) extra space if done in place',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'The array is sorted. Where do two equal values have to be, relative to each other?',
    'Looking at one value, which single earlier value decides whether it is new?',
    'If you deleted each duplicate and shifted everything after it, how much work could 10^5 values cost?',
    'Could one index read every value while another remembers where the next new value belongs?',
    'After the scan, how do you know how many values to return?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Two indices walk the array. The read index visits every value. The write index points at the
    next slot of the result. A value is new when it differs from the last value kept, so copy it to
    the write slot and step the write index; otherwise skip it. The first value is always kept.</p>
    <h4>Why it works</h4>
    <p>Sorting puts equal values next to each other, so the last value kept is the only one a new value
    can duplicate: anything older is strictly smaller. Invariant: the slots before the write index hold
    the distinct values seen so far, in order. The write index never passes the read index, so no value is
    overwritten before it has been read.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space when the array is reused as the output buffer. Removing every
    duplicate with a shift of the tail is O(n^2): about 10^10 moves for 10^5 values in pairs.</p>
    <h4>Pitfall</h4>
    <p>Comparing each value with the next one (and looping to the end of the array) drops the last
    value or reads past the end. Comparing with the very first value only works for the first run.
    Allowing a value twice (a rule from the harder version of this task) leaves a run of three with
    two copies left.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'removeDuplicates',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the sorted array as JSON.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the array as JSON, for example [0,0,1,1,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'Enter between 1 and 10^5 integers as a JSON array.' };
    }
    if (!nums.every(isInt)) return { ok: false, error: 'Every value is an integer between -10^9 and 10^9.' };
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < nums[i - 1]) return { ok: false, error: 'The array must be sorted in non-decreasing order.' };
    }
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
