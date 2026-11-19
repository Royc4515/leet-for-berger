/**
 * Problem: Subarray Sum K
 *
 * Count the contiguous subarrays whose sum is exactly k. The canonical "prefix sum + hash map"
 * problem: a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] = k, so for every j we
 * only need to know how many earlier prefixes equal prefix[j] - k.
 *
 * Negative values are what make it interesting: they break the sliding window that works for
 * positive-only arrays, and at n = 10^5 checking every subarray is O(n^2). The count itself can
 * reach n(n+1)/2, about 5 * 10^9, so it is returned as a 64-bit integer.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000;
const MAX_K = 10000000;

/**
 * Reference: running prefix sum, counting earlier prefixes equal to (prefix - k).
 * @param {number[]} nums
 * @param {number} k
 * @returns {number}
 */
export function reference(nums, k) {
  const seen = new Map([[0, 1]]);
  let prefix = 0;
  let count = 0;
  for (const v of nums) {
    prefix += v;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[1, 1, 1], 2], expected: 2, note: 'The first two ones and the last two ones.' },
  { args: [[1, 2, 3], 3], expected: 2, note: '[1, 2] and [3].' },
  { args: [[1, -1, 0], 0], expected: 3, note: '[1, -1], [0] and [1, -1, 0]. The empty subarray does not count.' },
  { args: [[5], 5], expected: 1, note: 'A single element can be the whole subarray.' },
  { args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4, note: '[3, 4], [7], [7, 2, -3, 1] and [1, 4, 2].' },
];

// Hidden tests: k = 0 (the empty subarray must not be counted), negatives that defeat a sliding
// window, a count beyond 32 bits (10^5 zeros), and 10^5 elements where O(n^2) is far too slow.
const hiddenArgs = [
  [[0], 0],
  [[1], 0],
  [[-1, -1, 1], 0],
  [[0, 0, 0, 0, 0], 0],
  [[1, -1, 1, -1, 1], 1],
  [randomNums(7, 1000, -5, 5), 3],
  [Array(MAX_N).fill(0), 0],
  [randomNums(11, MAX_N, -MAX_ABS, MAX_ABS), 0],
  [randomNums(13, MAX_N, -2, 2), 3],
  [Array(MAX_N).fill(MAX_ABS), MAX_K],
];

export const problem = {
  id: 'subarray-sum-k',
  title: 'Subarray Sum K',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Prefix Sum', 'Hash Map'],
  timeLimitMs: 3000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code> and an integer <code>k</code>, count how many
    non-empty <strong>contiguous</strong> subarrays of <code>nums</code> add up to exactly
    <code>k</code>.</p>
    <p>Subarrays at different positions count separately, even when they hold the same values.
    The count can exceed 32 bits; return it as a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-1000 <= nums[i] <= 1000',
    '-10^7 <= k <= 10^7',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Would a sliding window work here? What do negative numbers do to the "shrink when too big" rule?',
    'If prefix[j] is the sum of the first j elements, how do you write the sum of a subarray with two prefixes?',
    'For a fixed end position, which earlier prefix values would make the subarray sum equal k?',
    'What could you keep while scanning so that "how many earlier prefixes equal X" is a constant-time lookup?',
    'What must the map hold before the first element, so subarrays that start at index 0 are counted?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep a running prefix sum. A subarray ending at the current element sums to <code>k</code>
    exactly when some earlier prefix equals <code>prefix - k</code>. A hash map from prefix value to how
    often it has occurred gives that count in O(1), and the answer adds it up.</p>
    <h4>Why it works</h4>
    <p>The sum of <code>nums[i..j]</code> is <code>prefix[j + 1] - prefix[i]</code>, so each earlier
    prefix equal to <code>prefix - k</code> marks one distinct start position. The map starts as
    <code>{0: 1}</code>, the empty prefix, so subarrays that start at index 0 count. Looking up before
    inserting the current prefix keeps the empty subarray out when <code>k</code> is <code>0</code>.</p>
    <h4>Complexity</h4>
    <p>O(n) time with constant-time map operations. O(n) space for up to n + 1 distinct prefix values.
    Checking every subarray is O(n^2), about 5 * 10^9 sums at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>Reaching for a sliding window: with negative values, extending the window can lower the sum, so
    the shrink rule breaks. And the count can reach about 5 * 10^9 (many zeros with <code>k = 0</code>),
    so the counter must be a 64-bit integer.</p>
  `,

  signature: {
    name: 'subarraySum',
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
   * Custom input: two lines, nums as a JSON array, then k.
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
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers from -1000 to 1000.' };
    if (!Number.isInteger(k) || Math.abs(k) > MAX_K) return { ok: false, error: 'k must be an integer from -10^7 to 10^7.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Every subarray has to
  // be counted, so trying all start and end pairs is n^2 / 2 whatever the values.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [randomNums(seed, n, -MAX_ABS, MAX_ABS), 7],
  },
};

export default problem;
