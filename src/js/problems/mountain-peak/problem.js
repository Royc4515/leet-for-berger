/**
 * Problem: Mountain Peak
 *
 * Index of the peak of a "mountain" array: strictly increasing, then strictly decreasing. Comparing
 * nums[mid] with nums[mid + 1] tells which slope mid is on (rising means the peak is to the right,
 * falling means it is at mid or to the left), so binary search finds it in O(log n).
 *
 * LeetCode's version accepts any local peak, which needs a checker rather than an exact expected
 * value. Restricting the input to a single mountain makes the peak unique, so the answer is exact
 * while the O(log n) idea is unchanged. Either slope may be empty: a strictly increasing array
 * peaks at its last index, a strictly decreasing one at index 0.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: binary search on the slope at mid.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Seeded mountain of n values peaking at index `peak`: values fall by random positive steps
 * walking away from the peak in both directions, so both slopes are strict.
 */
function mountain(seed, n, peak, maxStep) {
  const rnd = mulberry32(seed);
  const out = new Array(n);
  out[peak] = MAX_V - Math.floor(rnd() * 10);
  for (let i = peak - 1; i >= 0; i--) out[i] = out[i + 1] - 1 - Math.floor(rnd() * maxStep);
  for (let i = peak + 1; i < n; i++) out[i] = out[i - 1] - 1 - Math.floor(rnd() * maxStep);
  return out;
}

const visible = [
  { args: [[1, 3, 5, 4, 2]], expected: 2, note: 'Rises to 5 at index 2, then falls.' },
  { args: [[0, 10, 5, 2]], expected: 1, note: 'The peak can be early.' },
  { args: [[7]], expected: 0, note: 'A single value is its own peak.' },
  { args: [[1, 2, 3, 4]], expected: 3, note: 'Only rising: the peak is the last index.' },
  { args: [[9, 4, -2]], expected: 0, note: 'Only falling: the peak is the first index.' },
];

// Hidden tests: two values in both orders, the peak one step from either end (off-by-one in the
// mid + 1 comparison), negative values, and 10^5 values with the peak at the start, the end or in
// between.
const hiddenArgs = [
  [[1, 2]],
  [[2, 1]],
  [[1, 3, 2]],
  [[-10, -5, -1, -3]],
  [[1, 2, 3, 4, 5, 6, 7, 8, 0]],
  [mountain(7, 1000, 1, 50)],
  [mountain(11, MAX_N, 0, 10000)],
  [mountain(13, MAX_N, MAX_N - 1, 10000)],
  [mountain(17, MAX_N, 64321, 10000)],
  [mountain(19, MAX_N, MAX_N - 2, 10000)],
];

export const problem = {
  id: 'mountain-peak',
  title: 'Mountain Peak',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The integer array <code>nums</code> is a <em>mountain</em>: its values strictly increase
    up to some index <code>p</code> and strictly decrease after it. Either side may be empty, so
    a strictly increasing or strictly decreasing array is also a mountain.</p>
    <p>Return <code>p</code>, the index of the largest value. Because the array is a single
    mountain, there is exactly one such index. Aim for <code>O(log n)</code> time.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 1000)',
    '-10^9 <= nums[i] <= 10^9',
    'nums strictly increases to the peak and strictly decreases after it (unique answer)',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Pick any index mid. Comparing nums[mid] with one neighbour, can you tell which side of the peak you are on?',
    'If nums[mid] < nums[mid + 1], can the peak be at mid or to its left?',
    'When nums[mid] > nums[mid + 1], should mid stay in your search range?',
    'With lo < hi, can mid + 1 ever run past the end of the array?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findPeakElement',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,3,5,4,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    // Walk up the strict rise, then down the strict fall; a mountain ends exactly at the last index.
    let i = 0;
    while (i + 1 < nums.length && nums[i] < nums[i + 1]) i++;
    while (i + 1 < nums.length && nums[i] > nums[i + 1]) i++;
    if (i !== nums.length - 1) return { ok: false, error: 'nums must strictly increase, then strictly decrease.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
