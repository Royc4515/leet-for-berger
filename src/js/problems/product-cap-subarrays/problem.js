/**
 * Problem: Product Cap Subarrays
 *
 * Equivalent to LeetCode 713 with larger limits (n up to 10^5, values to 10^4, k to 10^9);
 * statement and tests are written for this project. Count the contiguous subarrays of positive
 * integers whose product is strictly below k. Every value is at least 1, so a product never
 * shrinks as a window grows: a sliding window works, and each right end adds (right - left + 1)
 * subarrays, all the windows that end there and still fit.
 *
 * Number ranges: the window product is below k * max(nums) before it is shrunk, under 10^13, so a
 * 64-bit integer holds it in every language (and it is exact in a JavaScript number). The answer
 * can reach n(n + 1) / 2 = 5,000,050,000, which does not fit in 32 bits, so it is returned as a
 * 64-bit integer.
 *
 * Classic wrong answers: a 32-bit count, counting one subarray per right end instead of
 * right - left + 1, skipping the k <= 1 guard (the window would shrink past its own start), and
 * testing every subarray, O(n^2), which times out on the long windows of the max-size tests.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 10000;
const MAX_K = 1000000000;

/**
 * Reference: sliding window over the running product.
 * @param {number[]} nums positive integers
 * @param {number} k product bound, 0 <= k <= 10^9
 * @returns {number} subarrays with product < k
 */
export function reference(nums, k) {
  // don't touch / with k <= 1 no product can be below k (every product is at least 1), and the
  // shrink loop below would otherwise run past the right end of the window.
  if (k <= 1) return 0;
  let product = 1;
  let left = 0;
  let count = 0;
  for (let right = 0; right < nums.length; right++) {
    product *= nums[right];
    while (product >= k) product /= nums[left++];
    count += right - left + 1;
  }
  return count;
}

/** n seeded values in [lo, hi]. */
function randomValues(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** Mostly ones with a rare value in [2, 9]: windows stay long, so testing every subarray is O(n^2). */
function sparseSpikes(seed, n, oneIn) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => (rnd() * oneIn < 1 ? 2 + Math.floor(rnd() * 8) : 1));
}

const visible = [
  { args: [[10, 5, 2, 6], 100], expected: 8, note: 'Singles: 10, 5, 2, 6. Pairs: 10*5 = 50, 5*2 = 10, 2*6 = 12. Triple 5*2*6 = 60. The triple 10*5*2 = 100 is not below 100.' },
  { args: [[1, 2, 3], 0], expected: 0, note: 'Every product is at least 1, so none is below 0.' },
  { args: [[4, 4, 4], 4], expected: 0, note: 'A product equal to k does not count.' },
  { args: [[1, 1, 1], 2], expected: 6, note: 'Every subarray of ones has product 1.' },
  { args: [[3, 7], 100], expected: 3, note: '3, 7 and 3*7 = 21 are all below 100.' },
];

// Hidden tests: a single element below k and one equal to k, k = 1 on ones, a small seeded array,
// alternating 10000 and 1 (a 1 next to a big value must not join it), and five arrays at the
// maximum 10^5 elements: all ones with k = 2 (the answer 5,000,050,000 overflows 32 bits), values
// 1..10 and 1..10000 with k = 10^9, 1..3 with k = 10^6, and mostly ones with rare spikes, whose
// windows are tens of thousands of elements long.
const hiddenArgs = [
  [[1], 2],
  [[10000], 10000],
  [[1, 1, 1, 1, 1], 1],
  [randomValues(7, 30, 1, 20), 1000],
  [Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? 10000 : 1)), 10000],
  [Array(MAX_N).fill(1), 2],
  [randomValues(11, MAX_N, 1, 10), MAX_K],
  [randomValues(13, MAX_N, 1, MAX_V), MAX_K],
  [randomValues(17, MAX_N, 1, 3), 1000000],
  [sparseSpikes(19, MAX_N, 1000), MAX_K],
];

export const problem = {
  id: 'product-cap-subarrays',
  title: 'Product Cap Subarrays',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Two Pointers'],
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>nums</code> of positive integers and an integer <code>k</code>.</p>
    <p>Return how many contiguous, non-empty subarrays of <code>nums</code> have a product that is
    strictly less than <code>k</code>. Subarrays at different positions count separately, even when
    they hold the same values.</p>
    <p>The answer can be larger than a 32-bit integer, so it is returned as a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '1 <= nums[i] <= 10^4',
    '0 <= k <= 10^9',
    'The answer can reach 5,000,050,000, so it does not fit in 32 bits',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Every number is at least 1. What happens to a subarray\'s product when you add an element to it?',
    'If a window already fits under k, what can you say about every smaller window inside it?',
    'For a fixed right end, how many subarrays ending there have a product below k, and how do you find the leftmost start?',
    'When the product reaches k or more, which end of the window do you move, and how do you update the product without recomputing it?',
    'What goes wrong when k is 0 or 1, and how large can the count get?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep a window <code>[left, right]</code> and its running product. Extend <code>right</code> one
    element at a time, multiply, and while the product is <code>k</code> or more, divide out
    <code>nums[left]</code> and move <code>left</code> forward. Then every window that ends at
    <code>right</code> and starts anywhere from <code>left</code> to <code>right</code> is valid, which
    is <code>right - left + 1</code> new subarrays.</p>
    <h4>Why it works</h4>
    <p>All values are at least 1, so a longer window never has a smaller product. That makes the best
    <code>left</code> for each right end monotone: it only moves forward, so each element enters and
    leaves the window once.</p>
    <h4>Complexity</h4>
    <p>O(n) time, O(1) space. Number sizes: before shrinking, the product is below
    <code>k * 10^4 &lt; 10^13</code>, safe in a 64-bit integer. The count is a sum of up to
    <code>n(n + 1) / 2</code> = 5,000,050,000, which needs a 64-bit counter.</p>
    <h4>Pitfall</h4>
    <p>With <code>k &lt;= 1</code> no product qualifies; without an early return the shrink loop
    divides past the window and the count goes negative or wrong. Adding 1 per right end instead of
    <code>right - left + 1</code> misses the shorter subarrays. A 32-bit counter overflows on a long
    run of ones. Checking every subarray is correct but O(n^2): mostly-ones input keeps windows tens
    of thousands long.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'countProductBelow',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, nums as a JSON array and then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: nums (a JSON array), then k.' };
    let nums;
    let k;
    try {
      nums = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Line 1 must be a JSON array and line 2 an integer.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 values.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_V)) return { ok: false, error: 'nums values must be integers from 1 to 10^4.' };
    if (!Number.isInteger(k) || k < 0 || k > MAX_K) return { ok: false, error: 'k must be an integer from 0 to 10^9.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Values in 1..10 with k = 10^9: the window holds about ten elements, so it keeps sliding and the division loop runs about once per step.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: 10 }), 1e9],
  },
};

export default problem;
