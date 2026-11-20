/**
 * Problem: Bounded Sum Pairs
 *
 * Equivalent to LeetCode 2563 (Count the Number of Fair Pairs); statement and tests are written for
 * this project. Count the pairs of positions i < j whose values add up to something in
 * [lower, upper]. The pair order is irrelevant, so sort a copy; then "pairs with sum <= x" is
 * counted with two pointers in one pass, and the answer is atMost(upper) - atMost(lower - 1).
 *
 * Number ranges: a sum of two values is within +-2 * 10^9, which still fits in 32 bits, but the
 * count can reach n(n - 1) / 2 = 4,999,950,000, so it is returned as a 64-bit integer.
 *
 * Classic wrong answers: a 32-bit count, checking every pair (O(n^2), about 5 * 10^9 sums at the
 * max size), sorting and then counting ordered pairs or the pair (i, i), and "< upper" or "> lower"
 * with an exclusive bound.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Pairs i < j of the sorted array with sum <= limit, in one two-pointer pass.
 * @param {number[]} sorted ascending values
 * @param {number} limit
 * @returns {number}
 */
function pairsAtMost(sorted, limit) {
  let count = 0;
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    if (sorted[lo] + sorted[hi] <= limit) {
      // lo pairs with every index in (lo, hi]: they are all at most sorted[hi].
      count += hi - lo;
      lo++;
    } else {
      hi--;
    }
  }
  return count;
}

/**
 * Reference: sort a copy, then count pairs with sum <= upper minus pairs with sum <= lower - 1.
 * @param {number[]} nums
 * @param {number} lower
 * @param {number} upper
 * @returns {number} the number of pairs i < j with lower <= nums[i] + nums[j] <= upper
 */
export function reference(nums, lower, upper) {
  const sorted = Float64Array.from(nums).sort();
  return pairsAtMost(sorted, upper) - pairsAtMost(sorted, lower - 1);
}

/** n seeded values in [lo, hi]. */
function randomValues(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[0, 1, 7, 4, 4, 5], 3, 6], expected: 6, note: 'The 0 pairs with 4, 4 and 5; the 1 pairs with 4, 4 and 5. Those six sums are 4, 4, 5, 5, 5, 6.' },
  { args: [[1, 7, 9, 2, 5], 11, 11], expected: 1, note: 'Only 9 + 2 = 11. Both bounds are inclusive.' },
  { args: [[1, 1, 1], 2, 2], expected: 3, note: 'Equal values still form separate pairs by position: (0,1), (0,2), (1,2).' },
  { args: [[5], 0, 10], expected: 0, note: 'One element has no pair.' },
  { args: [[-5, -3, 2, 4, -1], -4, 1], expected: 6, note: 'Negative values are allowed: -5 + 2, -5 + 4, -3 + 2, -3 + 4, -3 + -1 and 2 + -1 all land in [-4, 1].' },
];

const bigRandom = randomValues(41, MAX_N, -MAX_V, MAX_V);
const mid = randomValues(7, 1000, -20, 20);
const small = randomValues(3, 12, -6, 6);

// Hidden tests: one element, two equal elements on a bound, equal values, a small seeded array, the
// extreme values -10^9 and 10^9 on the bounds (sums of exactly +-2 * 10^9), a seeded mid-size array,
// and five arrays of 10^5: all zeros with lower = upper = 0 (the answer 4,999,950,000 overflows 32
// bits), full range values with the whole range allowed, narrow bounds on a full range, small values
// with a tight window, and an ascending array.
const hiddenArgs = [
  [[7], -MAX_V, MAX_V],
  [[3, 3], 6, 6],
  [Array(30).fill(4), 8, 8],
  [small, -3, 3],
  [[-MAX_V, MAX_V, MAX_V, -MAX_V, 0], -MAX_V, MAX_V],
  [mid, -5, 5],
  [Array(MAX_N).fill(0), 0, 0],
  [bigRandom, -MAX_V, MAX_V],
  [bigRandom, -1000000, 1000000],
  [randomValues(43, MAX_N, -50, 50), -10, 10],
];

export const problem = {
  id: 'bounded-sum-pairs',
  title: 'Bounded Sum Pairs',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sorting', 'Two Pointers', 'Binary Search'],
  timeLimitMs: 3000,
  argNames: ['nums', 'lower', 'upper'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array of integers <code>nums</code> and two integers <code>lower</code> and
    <code>upper</code>.</p>
    <p>Return the number of pairs of positions <code>(i, j)</code> with <code>i &lt; j</code> such that
    <code>lower &lt;= nums[i] + nums[j] &lt;= upper</code>. Both bounds are inclusive. Positions count,
    not values: two equal values at different positions make different pairs.</p>
    <p>The answer can be larger than a 32-bit integer, so it is returned as a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= lower <= upper <= 10^9',
    'The answer can reach 4,999,950,000, so it does not fit in 32 bits',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, lower = ${t.args[1]}, upper = ${t.args[2]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'The condition only looks at the sum of two values, never at where they sit. What could you do to the array first without changing the answer?',
    'Once the array is sorted, if nums[i] + nums[j] fits under a limit, what do you know about every value between them?',
    'Counting pairs inside a window [lower, upper] is hard directly. Is counting the pairs with a sum of at most some x easier?',
    'How can two counts, each of the form "sum at most x", give the number of pairs in the window?',
    'How large can the answer get, and which type holds it in your language?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The positions only decide which pair is which, not whether it qualifies, so sort a copy of the
    array. Then count the pairs with sum at most <code>x</code> using two pointers: with
    <code>lo</code> and <code>hi</code> at the two ends, if <code>sorted[lo] + sorted[hi] &lt;= x</code>
    then <code>sorted[lo]</code> works with every index in <code>(lo, hi]</code> (all of them are at
    most <code>sorted[hi]</code>), so add <code>hi - lo</code> and move <code>lo</code> up; otherwise
    <code>sorted[hi]</code> is too big for every remaining partner, so move <code>hi</code> down. The
    answer is <code>count(upper) - count(lower - 1)</code>.</p>
    <h4>Why it works</h4>
    <p>The pairs with sum at most <code>upper</code> are the pairs with sum below <code>lower</code>
    plus the pairs in the window, and the integer just below <code>lower</code> is
    <code>lower - 1</code>, so subtracting the two counts leaves exactly the window. Each step of the
    two-pointer loop either settles one value of <code>lo</code> or retires one value of
    <code>hi</code>, so a pass is O(n).</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort and O(n) for the two passes. Sums of two values stay within 2 * 10^9, which fits in
    32 bits, but the count up to 4,999,950,000 needs a 64-bit integer.</p>
    <h4>Pitfall</h4>
    <p>Checking every pair is correct but about 5 * 10^9 sums at the maximum size. Subtracting
    <code>count(lower)</code> instead of <code>count(lower - 1)</code> drops the pairs that sum to
    exactly <code>lower</code>, because the bound is inclusive. A 32-bit counter wraps on a long array
    of zeros, and counting each pair from both sides doubles the answer.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'countBoundedPairs',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'lower', type: 'int' },
      { name: 'upper', type: 'int' },
    ],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: three lines, nums as a JSON array, then lower, then upper.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 3) return { ok: false, error: 'Enter three lines: nums (a JSON array), then lower, then upper.' };
    let nums;
    let lower;
    let upper;
    try {
      nums = JSON.parse(lines[0]);
      lower = JSON.parse(lines[1]);
      upper = JSON.parse(lines[2]);
    } catch {
      return { ok: false, error: 'Line 1 must be a JSON array; lines 2 and 3 must be integers.' };
    }
    const inRange = (v) => Number.isInteger(v) && v >= -MAX_V && v <= MAX_V;
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 values.' };
    if (!nums.every(inRange)) return { ok: false, error: 'nums values must be integers from -10^9 to 10^9.' };
    if (!inRange(lower) || !inRange(upper)) return { ok: false, error: 'lower and upper must be integers from -10^9 to 10^9.' };
    if (lower > upper) return { ok: false, error: 'lower must not exceed upper.' };
    return { ok: true, args: [nums, lower, upper] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1], args[2]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random values over a wide
  // range, so the sort does real work, and a window that keeps about a quarter of the pairs in range.
  growth: {
    target: 'n log n',
    n: 'nums.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: -1e9, max: 1e9 }), -500000000, 500000000],
  },
};

export default problem;
