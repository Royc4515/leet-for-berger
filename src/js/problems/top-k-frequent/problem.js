/**
 * Problem: Top K Frequent
 *
 * Return the k values that appear most often. The canonical frequency-count problem: one pass
 * builds a value -> count table, and everything after that (sorting, bucketing, a heap) works
 * on the counts instead of the raw array.
 *
 * Output order is fixed so judging is exact: higher count first, ties broken by smaller value.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: count, then sort by (count desc, value asc).
 * @param {number[]} nums
 * @param {number} k
 * @returns {number[]}
 */
export function reference(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, k)
    .map(([v]) => v);
}

const MAX_N = 100000;
const LIMIT = 10000;

function randomNums(seed, n, spread) {
  const rnd = mulberry32(seed);
  // Squaring the uniform skews the draw so a few values are much more common than the rest.
  return Array.from({ length: n }, () => Math.floor(rnd() * rnd() * (2 * spread + 1)) - spread);
}

const distinct = (nums) => new Set(nums).size;

const visible = [
  { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2], note: '1 appears three times, 2 twice.' },
  { args: [[1], 1], expected: [1], note: 'A single value.' },
  { args: [[4, 4, 6, 6, 5], 2], expected: [4, 6], note: '4 and 6 tie; the smaller value comes first.' },
  { args: [[-1, -1, 2, 2, 2, -3], 3], expected: [2, -1, -3], note: 'k can include every distinct value.' },
  { args: [[7, 7, 7, 7], 1], expected: [7], note: 'One value repeated.' },
];

// Hidden tests: ties at the cut-off, negatives, k equal to the number of distinct values, and
// 10^5 elements where re-counting for every candidate is too slow.
const big1 = randomNums(11, MAX_N, LIMIT);
const big2 = randomNums(13, MAX_N, 50);
const mid = randomNums(7, 2000, 100);
const hiddenArgs = [
  [[3, 0, 1, 0], 1],
  [[5, 3, 3, 5, 9, 9, 1], 3],
  [[-10000, 10000, -10000], 2],
  [[1, 2, 3, 4, 5], 5],
  [[2, 2, 1, 1, 3, 3, 3], 2],
  [mid, 10],
  [big1, 25],
  [big2, distinct(big2)],
  [Array.from({ length: MAX_N }, (_, i) => (i % 20001) - LIMIT), 3],
  [randomNums(17, MAX_N, LIMIT), 1],
];

export const problem = {
  id: 'top-k-frequent',
  title: 'Top K Frequent',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Frequency Count', 'Bucket Sort'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the
    <code>k</code> values that occur most often.</p>
    <p>Order the result by how often each value occurs, most frequent first. When two values occur
    equally often, the smaller value comes first (this also decides who makes the cut at position k).</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    '1 <= k <= number of distinct values in nums',
    'Target complexity: O(n + d log d) for d distinct values, or O(n) with buckets',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What single pass over the array tells you how often every value appears?',
    'Once you have the counts, do you still need the original array?',
    'How would you order (value, count) pairs so the answer is simply the first k?',
    'Counts are between 1 and n. Could a bucket per count avoid sorting altogether?',
  ],

  signature: {
    name: 'topKFrequent',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, nums (JSON array) then k.
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
      return { ok: false, error: 'Both lines must be valid JSON.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= LIMIT)) return { ok: false, error: 'Values must be integers within +-10^4.' };
    if (!Number.isInteger(k) || k < 1 || k > distinct(nums)) return { ok: false, error: 'k must be between 1 and the number of distinct values.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
