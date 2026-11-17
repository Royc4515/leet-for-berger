/**
 * Problem: Merged Median
 *
 * The median of two sorted arrays without merging them. Finding the k-th smallest of the union
 * can discard about k/2 candidates per step: compare the (k/2)-th remaining value of each array,
 * and the smaller one, with everything before it, cannot be the k-th. That gives
 * O(log(m + n)) instead of the O(m + n) merge.
 *
 * LeetCode returns the median as a double. To keep judging exact, this version returns twice the
 * median as a 64-bit integer: the sum of the two middle values when the total length is even,
 * twice the middle value when it is odd. Values span the full 32-bit range, so that sum can
 * exceed 32 bits.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * k-th smallest (1-based) of the union of a[i..] and b[j..], discarding k/2 values per step.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} k
 */
function kth(a, b, k) {
  let i = 0;
  let j = 0;
  for (;;) {
    if (i >= a.length) return b[j + k - 1];
    if (j >= b.length) return a[i + k - 1];
    if (k === 1) return Math.min(a[i], b[j]);
    const p = Math.floor(k / 2);
    // An array with fewer than p values left cannot hold the k-th among its first p, so the
    // other array's first p go. Otherwise the side with the smaller p-th value goes.
    const x = i + p - 1 < a.length ? a[i + p - 1] : Infinity;
    const y = j + p - 1 < b.length ? b[j + p - 1] : Infinity;
    if (x < y) i += p;
    else j += p;
    k -= p;
  }
}

/**
 * Reference: twice the median, from the two middle order statistics of the union.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @returns {number}
 */
export function reference(nums1, nums2) {
  const total = nums1.length + nums2.length;
  return kth(nums1, nums2, Math.floor((total + 1) / 2)) + kth(nums1, nums2, Math.floor((total + 2) / 2));
}

/** Seeded sorted array of n values in [lo, hi]. */
function sortedNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1))).sort((x, y) => x - y);
}

const visible = [
  { args: [[1, 3], [2]], expected: 4, note: 'Merged: [1, 2, 3]. The median is 2, so return 4.' },
  { args: [[1, 2], [3, 4]], expected: 5, note: 'Merged: [1, 2, 3, 4]. The median is 2.5; return 2 + 3 = 5.' },
  { args: [[], [7]], expected: 14, note: 'One array may be empty. The median is 7.' },
  { args: [[-5, -1], [-3]], expected: -6, note: 'Merged: [-5, -3, -1]. Twice the median is -6.' },
  { args: [[1, 1, 1], [1, 1, 1]], expected: 2, note: 'Repeated values: both middle values are 1.' },
];

// Hidden tests: an empty first array, one array entirely below the other, an array much shorter
// than the other, middle values near the 32-bit limits whose sum overflows an int, and two pairs
// of 10^5-element arrays.
const hiddenArgs = [
  [[2], []],
  [[1, 2, 3], [4, 5, 6, 7]],
  [[10, 20, 30, 40], [1]],
  [[INT_MAX, INT_MAX], [INT_MAX - 1]],
  [[INT_MIN], [INT_MIN, INT_MIN + 5]],
  [sortedNums(7, 37, -100, 100), sortedNums(8, 1000, -100, 100)],
  [sortedNums(9, 1, 0, 0), sortedNums(10, MAX_N, INT_MIN, INT_MAX)],
  [sortedNums(11, MAX_N, INT_MIN, INT_MAX), sortedNums(12, MAX_N, INT_MIN, INT_MAX)],
  [sortedNums(13, MAX_N, 2000000000, INT_MAX), sortedNums(14, MAX_N - 1, 2100000000, INT_MAX)],
  [sortedNums(15, MAX_N, INT_MIN, -2000000000), []],
];

export const problem = {
  id: 'merged-median',
  title: 'Merged Median',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Binary Search', 'Divide and Conquer'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['nums1', 'nums2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given two arrays <code>nums1</code> and <code>nums2</code>, each sorted in ascending
    order, consider the median of all their values together.</p>
    <p>So the answer is an exact integer, return <strong>twice the median</strong> as a 64-bit
    integer:</p>
    <ul>
      <li>if the total number of values is odd, twice the middle value;</li>
      <li>if it is even, the sum of the two middle values.</li>
    </ul>
    <p>For example, the median of <code>[1, 2, 3, 4]</code> is 2.5, so the answer is
    <code>5</code>. Aim for <code>O(log(m + n))</code> time.</p>
  `,
  constraints: [
    '0 <= nums1.length, nums2.length <= 10^5 (raised from LeetCode\'s 1000)',
    '1 <= nums1.length + nums2.length',
    '-2^31 <= nums1[i], nums2[i] <= 2^31 - 1 (the answer can exceed 32 bits)',
    'Both arrays are sorted in non-decreasing order',
    'Return type is long: twice the median, not the median',
    'Target complexity: O(log(m + n)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums1 = ${JSON.stringify(t.args[0])}, nums2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Merging works in O(m + n). Which values of the merge do you actually need?',
    'Can you phrase the median as "the k-th smallest value" for one or two values of k?',
    'Compare the (k/2)-th value of each array. What can you say about the values before the smaller one?',
    'What happens when one array has fewer than k/2 values left, or none at all?',
    'Two middle values near 2^31 - 1: does their sum fit in the type you add them in?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'medianTimesTwo',
    params: [
      { name: 'nums1', type: 'int[]' },
      { name: 'nums2', type: 'int[]' },
    ],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums1 and nums2 as JSON arrays, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter nums1 on line 1 and nums2 on line 2, as JSON arrays.' };
    let a;
    let b;
    try {
      a = JSON.parse(lines[0]);
      b = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON arrays, for example [1,3] then [2].' };
    }
    for (const [name, arr] of [['nums1', a], ['nums2', b]]) {
      if (!Array.isArray(arr) || arr.length > MAX_N) return { ok: false, error: `${name} must be an array of at most 10^5 values.` };
      if (!arr.every((v) => Number.isInteger(v) && v >= INT_MIN && v <= INT_MAX)) return { ok: false, error: `${name} values must be 32-bit integers.` };
      for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return { ok: false, error: `${name} must be sorted in ascending order.` };
    }
    if (a.length + b.length < 1) return { ok: false, error: 'At least one array must be non-empty.' };
    return { ok: true, args: [a, b] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
