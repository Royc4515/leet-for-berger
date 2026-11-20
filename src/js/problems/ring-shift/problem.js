/**
 * Problem: Ring Shift
 *
 * Move every value of an array k places to the right, with the values that fall off the end
 * coming back in at the front. k can be far larger than the array, so only k mod n matters. The
 * original problem rotates in place; here the solution returns the rotated array, which every
 * harness can judge.
 *
 * Reference: slice and concatenate at the cut point n - (k mod n), O(n). The in-place version
 * reverses the whole array, then the first k and the last n - k values separately. With k up to
 * 10^9, rotating by one step k times needs about 10^14 operations and times out.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const MAX_K = 1000000000;
const MAX_VAL = 1000000000;

/**
 * Reference: the last (k mod n) values move to the front.
 * @param {number[]} nums
 * @param {number} k steps to the right, at least 0
 * @returns {number[]} the rotated array
 */
export function reference(nums, k) {
  const n = nums.length;
  const cut = n - (k % n);
  return nums.slice(cut).concat(nums.slice(0, cut));
}

/** `n` seeded integers in [-MAX_VAL, MAX_VAL]. */
function randomArray(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (2 * MAX_VAL + 1)) - MAX_VAL);
}

const visible = [
  { args: [[1, 2, 3, 4, 5, 6, 7], 3], expected: [5, 6, 7, 1, 2, 3, 4], note: 'The last three values, 5 6 7, move to the front.' },
  { args: [[-1, -100, 3, 99], 2], expected: [3, 99, -1, -100], note: 'Values may be negative.' },
  { args: [[1, 2], 5], expected: [2, 1], note: 'Five steps on two values is the same as one step.' },
  { args: [[7], 10], expected: [7], note: 'One value never changes.' },
  { args: [[1, 2, 3], 0], expected: [1, 2, 3], note: 'Zero steps.' },
];

// Hidden tests: k equal to n, a multiple of n, k just above n, one step, a huge k on three
// values, and five arrays of 10^5 values: k = 10^9, k = n - 1, k = 1, k = a multiple of n, and a
// length that does not divide k.
const big = randomArray(11, MAX_LEN);
const hiddenInputs = [
  [[1, 2, 3], 3],
  [[1, 2, 3, 4], 8],
  [[1, 2, 3, 4, 5], 7],
  [[1, 2, 3, 4, 5, 6], 1],
  [[0, 0, 1], MAX_K],
  [big, MAX_K],
  [big, MAX_LEN - 1],
  [randomArray(13, MAX_LEN), 1],
  [randomArray(17, MAX_LEN), MAX_LEN * 7],
  [randomArray(19, 99991), MAX_K - 1],
];

/** @param {unknown} v */
const isValue = (v) => Number.isInteger(v) && v >= -MAX_VAL && v <= MAX_VAL;

export const problem = {
  id: 'ring-shift',
  title: 'Ring Shift',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Array Manipulation', 'Math'],
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>nums</code> and a non-negative integer <code>k</code>. Shift every
    value <code>k</code> places to the right. A value that moves past the last position comes back in at
    the front, as if the array were a ring.</p>
    <p>Return the shifted array. For <code>[1, 2, 3, 4, 5, 6, 7]</code> and <code>k = 3</code> the result
    is <code>[5, 6, 7, 1, 2, 3, 4]</code>. Note that <code>k</code> can be much larger than the length of
    the array.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    '0 <= k <= 10^9',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'After shifting by exactly the length of the array, what does the array look like? What does that say about large values of k?',
    'Where does the value at index i end up after k steps? What happens when i + k runs past the end?',
    'Could you move each value straight to its final index? What goes wrong if you write over a value you have not moved yet?',
    'Look at the result as two blocks, the last k values and the first n - k values. What happens to the order of values when you reverse the whole array?',
    'After reversing everything, which two ranges still have their values in the wrong inner order, and how do you fix both?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Reduce <code>k</code> to <code>k mod n</code>. Then reverse the whole array, reverse its first
    <code>k</code> values, and reverse the remaining <code>n - k</code> values.</p>
    <h4>Why it works</h4>
    <p>The answer is the last <code>k</code> values followed by the first <code>n - k</code>, each block in its
    original inner order. Reversing the whole array puts the last <code>k</code> values at the front
    and the first <code>n - k</code> at the back, but both blocks are backwards. Reversing each block
    separately turns it around again, and the blocks stay where they are.</p>
    <h4>Complexity</h4>
    <p>O(n) time (each value is touched at most twice) and O(1) extra space. Taking
    <code>k mod n</code> first makes the cost independent of how large <code>k</code> is.</p>
    <h4>Pitfall</h4>
    <p>Rotating one step at a time, <code>k</code> times, is O(n * k): about 10^14 operations at the limits.
    Forgetting <code>k mod n</code> breaks every case with <code>k &gt;= n</code> (the cut index goes
    negative or past the end), and a copy into a new array at <code>(i + k) % n</code> works but uses
    O(n) extra memory.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'ringShift',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, the values as a JSON array, then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: nums as a JSON array, then k.' };
    let nums;
    let k;
    try {
      nums = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,3], and k as an integer.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_LEN) return { ok: false, error: 'nums must have 1 to 10^5 values.' };
    if (!nums.every(isValue)) return { ok: false, error: 'Every value must be an integer from -10^9 to 10^9.' };
    if (!Number.isInteger(k) || k < 0 || k > MAX_K) return { ok: false, error: 'k must be an integer from 0 to 10^9.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
