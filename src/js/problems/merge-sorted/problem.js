/**
 * Problem: Merge Sorted
 *
 * Combine two already sorted arrays into one sorted array. The point is not the result (sorting
 * the concatenation gets that too) but the merge step itself: two read heads, one comparison per
 * output element, O(m + n). It is the inner loop of merge sort and of every k-way merge.
 *
 * The classic version merges in place into a buffer with spare room at the end; here the merged
 * array is returned so every language judges the same value.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: two read heads, always take the smaller front value.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @returns {number[]}
 */
export function reference(nums1, nums2) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < nums1.length && j < nums2.length) out.push(nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++]);
  while (i < nums1.length) out.push(nums1[i++]);
  while (j < nums2.length) out.push(nums2[j++]);
  return out;
}

const MAX_LEN = 100000;
const MAX_V = 1000000000;

/** A seeded sorted array of n values in [lo, hi]. */
function sortedRandom(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1))).sort((a, b) => a - b);
}

const isSorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

const visible = [
  { args: [[1, 4, 7], [2, 4, 9]], expected: [1, 2, 4, 4, 7, 9], note: 'Equal values from both arrays are all kept.' },
  { args: [[5], []], expected: [5], note: 'An empty second array leaves the first unchanged.' },
  { args: [[], [3]], expected: [3], note: 'The first array can be empty too.' },
  { args: [[6, 7, 8], [1, 2, 3]], expected: [1, 2, 3, 6, 7, 8], note: 'Every value of the second array comes first.' },
  { args: [[-3, 0, 0, 7], [-5, 0, 9]], expected: [-5, -3, 0, 0, 0, 7, 9], note: 'Negative values and repeats.' },
];

// Hidden tests: identical arrays, one side exhausted early, extreme values, interleaving that
// alternates on every element, and two inputs of 10^5 + 10^5 values where repeated insertion
// into a growing array is quadratic.
const hiddenArgs = [
  [[2, 2, 2], [2, 2]],
  [[1, 2, 3, 100], [4, 5, 6]],
  [[-MAX_V, MAX_V], [-MAX_V, 0, MAX_V]],
  [[], [-1, -1, 0]],
  [[0], [0]],
  [sortedRandom(7, 500, -50, 50), sortedRandom(8, 300, -50, 50)],
  [Array.from({ length: 1000 }, (_, i) => 2 * i), Array.from({ length: 1000 }, (_, i) => 2 * i + 1)],
  [sortedRandom(11, MAX_LEN, -MAX_V, MAX_V), sortedRandom(12, MAX_LEN, -MAX_V, MAX_V)],
  [sortedRandom(13, MAX_LEN, 0, MAX_V), sortedRandom(14, MAX_LEN, -MAX_V, 0)],
  [[], sortedRandom(17, MAX_LEN, -1000, 1000)],
];

export const problem = {
  id: 'merge-sorted',
  title: 'Merge Sorted',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Merge'],
  timeLimitMs: 2000,
  argNames: ['nums1', 'nums2'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You get two integer arrays, <code>nums1</code> and <code>nums2</code>, each already
    sorted in non-decreasing order. Return a single array that holds every value of both, also in
    non-decreasing order. Repeated values appear as many times as they occur in total.</p>
    <p>Sorting the concatenation would work, but both inputs are already sorted. Aim for
    O(m + n) time, where m and n are the two lengths, by walking both arrays once.</p>
    <p>Follow-up for the interview: the classic version stores the result inside
    <code>nums1</code>, which has n spare slots at its end. Which end should you fill first so
    that nothing is overwritten before it is read?</p>
  `,
  constraints: [
    '0 <= nums1.length, nums2.length <= 10^5',
    '1 <= nums1.length + nums2.length',
    '-10^9 <= nums1[i], nums2[j] <= 10^9',
    'Both arrays are sorted in non-decreasing order',
    'Target complexity: O(m + n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums1 = ${JSON.stringify(t.args[0])}, nums2 = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which two values are the only candidates for the smallest value of the result?',
    'After you take one of them, what changes and what stays the same?',
    'What happens when one array runs out before the other?',
    'If the result had to live in nums1 with spare room at the end, why is filling from the back safe?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'mergeSorted',
    params: [
      { name: 'nums1', type: 'int[]' },
      { name: 'nums2', type: 'int[]' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, nums1 then nums2, each a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: nums1 and nums2, each a JSON array.' };
    let a;
    let b;
    try {
      a = JSON.parse(lines[0]);
      b = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(a) || !Array.isArray(b) || a.length > MAX_LEN || b.length > MAX_LEN) return { ok: false, error: 'Each array may hold at most 10^5 values.' };
    if (a.length + b.length < 1) return { ok: false, error: 'At least one array must be non-empty.' };
    if (![...a, ...b].every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    if (!isSorted(a) || !isSorted(b)) return { ok: false, error: 'Both arrays must be sorted in non-decreasing order.' };
    return { ok: true, args: [a, b] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
