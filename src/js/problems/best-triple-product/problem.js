/**
 * Problem: Best Triple Product
 *
 * Equivalent to LeetCode 628 (Maximum Product of Three Numbers); statement and tests are written
 * for this project. Find the maximum product of any three elements at distinct indices in an
 * integer array. Because two negative numbers multiply to a positive number, the answer is always
 * either the product of the three largest values or the product of the two smallest values and the
 * largest.
 *
 * Classic wrong answers: multiplying only the three largest values (misses two large negatives
 * times the largest positive), initializing the best product to 0 (fails on all-negative arrays),
 * deduplicating values or using strict `>` / `<` when shifting tied extremes (breaks
 * [1000, 1000, 1000]), and O(n^2) or O(n^3) loops that time out at 10^5 elements.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000;

/**
 * Reference: one linear pass tracking the three largest and two smallest elements.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let max1 = -Infinity;
  let max2 = -Infinity;
  let max3 = -Infinity;
  let min1 = Infinity;
  let min2 = Infinity;
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    if (v >= max1) {
      max3 = max2;
      max2 = max1;
      max1 = v;
    } else if (v >= max2) {
      max3 = max2;
      max2 = v;
    } else if (v > max3) {
      max3 = v;
    }
    if (v <= min1) {
      min2 = min1;
      min1 = v;
    } else if (v < min2) {
      min2 = v;
    }
  }
  const topThree = max1 * max2 * max3;
  const twoLowOneHigh = min1 * min2 * max1;
  return topThree > twoLowOneHigh ? topThree : twoLowOneHigh;
}

/** Seeded packed array of n integers in [min, max]. */
function randomNums(seed, n, min, max) {
  const rnd = mulberry32(seed);
  const out = [];
  const span = max - min + 1;
  for (let i = 0; i < n; i++) out.push(min + Math.floor(rnd() * span));
  return out;
}

/**
 * Fast packed SMI array generator for multi-million-element growth runs: pre-fills a contiguous
 * packed array with a 32-bit LCG so input generation stays far under the timing budget.
 */
function fastGrowthNums(seed, n) {
  const out = new Array(n).fill(0);
  let x = (seed | 0) || 1;
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) | 0;
    out[i] = ((x >>> 0) % 2001) - 1000;
  }
  return out;
}

const visible = [
  { args: [[1, 2, 3]], expected: 6, note: 'Only one triple exists: 1 * 2 * 3 = 6.' },
  { args: [[1, 2, 3, 4]], expected: 24, note: 'The three largest numbers give 2 * 3 * 4 = 24.' },
  { args: [[-10, -10, 5, 2]], expected: 500, note: 'Two negative numbers times the largest positive: (-10) * (-10) * 5 = 500.' },
  { args: [[-1, -2, -3]], expected: -6, note: 'When all values are negative, the three closest to zero maximize the product.' },
  { args: [[-5, -4, -3, -2, 0]], expected: 0, note: 'Picking zero beats any product of three negative numbers.' },
];

// Hidden tests: extreme negative triple (-10^9, catches max = 0 init), duplicate extremes (catches
// deduplicating into a set), two negatives beating three positives, extremes hidden at the end of
// a 10^5 array, all zeros, all negatives at 10^5, and seeded 10^5 arrays.
const hiddenArgs = [
  [[-1000, -1000, -1000]],
  [[1000, 1000, 1000, -1000, -1000]],
  [[-100, -98, 1, 2, 3, 4]],
  [[0, 0, 0, 0]],
  [[-10, -9, -8, -1, -2, -3]],
  [[...Array(MAX_N - 3).fill(1), -999, -998, 997]],
  [randomNums(6281, MAX_N, -MAX_ABS, MAX_ABS)],
  [randomNums(6282, MAX_N, -MAX_ABS, -1)],
  [randomNums(6283, MAX_N, -50, 50)],
  [[...Array(MAX_N - 2).fill(-2), -1000, 1000]],
];

export const problem = {
  id: 'best-triple-product',
  title: 'Best Triple Product',
  difficulty: 'Easy',
  topics: ['arrays-strings', 'greedy'],
  patterns: ['Greedy', 'Math', 'Sorting'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  statementHtml: `
    <p>Given an integer array <code>nums</code> with at least three elements, choose three elements
    at <strong>distinct indices</strong> whose product is as large as possible, and return that
    product.</p>
  `,
  constraints: [
    '3 <= nums.length <= 10^5',
    '-1000 <= nums[i] <= 1000',
    'The answer fits in a signed 32-bit integer (-10^9 to 10^9)',
    'Target complexity: O(n) time, O(1) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'If every number were positive, which three numbers would you pick?',
    'When negative numbers are present, how many negatives can appear in an optimal triple?',
    'Which exact handful of extreme elements from the array can ever be part of the best product?',
    'Can you find those five extreme values in a single scan without sorting the whole array?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>The largest product of three numbers must come from one of two candidates: the three largest
    values (<code>max1 * max2 * max3</code>), or the two most negative values multiplied by the
    single largest value (<code>min1 * min2 * max1</code>). Track those five extremes in one linear
    scan and return the larger product.</p>
    <h4>Why it works</h4>
    <p>In sorted order <code>a[0] &lt;= a[1] &lt;= ... &lt;= a[n-1]</code>, taking three positives
    or three negatives is maximized by the three rightmost elements <code>a[n-3] * a[n-2] * a[n-1]</code>,
    while taking two negatives and one positive is maximized by <code>a[0] * a[1] * a[n-1]</code>.
    All sign cases (all positive, mixed, with zeros, all negative) reduce to the max of those two.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space. Sorting the array first also works in O(n log n) time.</p>
    <h4>Pitfall</h4>
    <p>Do not deduplicate values (<code>[1000, 1000, 1000]</code> needs all three copies), use
    <code>&gt;=</code> / <code>&lt;=</code> when shifting tied extremes, and never initialize the
    maximum product to <code>0</code> because an all-negative array has a negative answer.</p>
  `,

  signature: {
    name: 'maxTripleProduct',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [512000, 1024000, 2048000, 4096000, 8192000],
    // Seeded values across [-1000, 1000] force a full pass (and O(n^2) / O(n^3) triple loops
    // immediately blow up). Note: n and n log n share the linear growth bucket.
    input: (n, seed) => [fastGrowthNums(seed, n)],
  },

  /**
   * Custom input: nums as a JSON array of 3 to 10^5 integers in [-1000, 1000].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array of at least 3 integers, for example [-10,-10,5,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 3 || nums.length > MAX_N) {
      return { ok: false, error: 'nums must be an array of 3 to 10^5 integers.' };
    }
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) {
      return { ok: false, error: 'Every value must be an integer from -1000 to 1000.' };
    }
    return { ok: true, args: [nums] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
