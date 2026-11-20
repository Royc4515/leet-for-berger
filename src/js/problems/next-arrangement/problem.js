/**
 * Problem: Next Arrangement
 *
 * List every arrangement (ordering) of a multiset in dictionary order; given one, return the one
 * that comes right after it, or the very first one when the input is already the last. Values may
 * repeat, so equal arrangements are one entry in the list.
 *
 * The classic O(n) answer: find the rightmost position `i` whose value is smaller than its right
 * neighbor (the suffix after it is non-increasing, so it is the largest arrangement of those
 * values), swap `i` with the rightmost value larger than it, then reverse the suffix to make it
 * the smallest arrangement. The original problem rewrites the array in place; here the solution
 * returns the resulting array, which every harness can judge. Limits are 10^5 elements, so
 * generating arrangements one by one cannot finish.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_LEN = 100000;
const MAX_VAL = 100000;

/**
 * Reference: pivot, swap, reverse the suffix. Works on a copy.
 * @param {number[]} nums
 * @returns {number[]} the next arrangement in dictionary order, or the sorted array after the last
 */
export function reference(nums) {
  const a = nums.slice();
  const n = a.length;
  let i = n - 2;
  // Strict "<": with equal neighbors, no larger arrangement can start by changing either of them.
  while (i >= 0 && a[i] >= a[i + 1]) i--;
  if (i >= 0) {
    let j = n - 1;
    while (a[j] <= a[i]) j--;
    [a[i], a[j]] = [a[j], a[i]];
  }
  // The suffix after the pivot is non-increasing, so reversing it makes it the smallest ordering.
  for (let l = i + 1, r = n - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
  return a;
}

/** `n` seeded integers in [0, maxVal]. */
function randomArray(seed, n, maxVal) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (maxVal + 1)));
}

const visible = [
  { args: [[1, 2, 3]], expected: [1, 3, 2], note: 'Only the last two values can still move up.' },
  { args: [[3, 2, 1]], expected: [1, 2, 3], note: 'Already the last arrangement, so wrap around to the first (sorted).' },
  { args: [[1, 1, 5]], expected: [1, 5, 1], note: 'With repeated values 1, 1, 5 there are only three arrangements; [1, 5, 1] is next.' },
  { args: [[5]], expected: [5], note: 'One element: the only arrangement is also the last.' },
  { args: [[1, 3, 2]], expected: [2, 1, 3], note: 'The suffix [3, 2] cannot grow, so the 1 moves up to 2 and the rest restarts as small as possible.' },
];

// Hidden tests: wrap-around with equal values, a duplicate-heavy middle pivot (swapping with the
// nearest larger value instead of the rightmost one fails), a pivot early in the array, and five
// lists of 10^5 values: sorted ascending (pivot at the end), strictly descending (wrap-around),
// a descending tail after a single small first value (pivot at index 0), random with a wide value
// range, and random over only 4 distinct values.
const descending = Array.from({ length: MAX_LEN }, (_, i) => MAX_LEN - i);
const hiddenInputs = [
  [2, 3, 1],
  [1, 5, 1],
  [2, 2, 2],
  [1, 2, 3, 6, 5, 4],
  [4, 2, 0, 2, 3, 2, 0],
  Array.from({ length: MAX_LEN }, (_, i) => i),
  descending,
  [0, ...descending.slice(0, MAX_LEN - 1)],
  randomArray(11, MAX_LEN, MAX_VAL),
  randomArray(13, MAX_LEN, 3),
];

/** @param {unknown} v */
const isValue = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_VAL;

export const problem = {
  id: 'next-arrangement',
  title: 'Next Arrangement',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Array Manipulation'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>An <em>arrangement</em> of <code>nums</code> is any reordering of its values. List all the
    different arrangements in dictionary order, comparing them from the first position (so
    <code>[1, 2, 3]</code> comes before <code>[1, 3, 2]</code>). Values can repeat, and arrangements that
    look the same count once.</p>
    <p>Return the arrangement that comes right after <code>nums</code> in that list. If
    <code>nums</code> is the last one, return the first one, which is <code>nums</code> sorted ascending.</p>
    <p>Return the resulting array. The intended solution rearranges the values it was given and needs
    only a few extra variables.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '0 <= nums[i] <= 10^5',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Write out all arrangements of [1, 2, 3, 4] in order. Which positions change from one to the next, and which stay?',
    'Look at the tail of the array. When is the tail already the largest it can be, and what does that tell you about where the change has to happen?',
    'Once you know which position must grow, which value should replace it so the step up is as small as possible?',
    'After that swap, everything to the right is in some order. Which order makes the whole thing the next one and not a later one?',
    'What do you do when no position can grow at all?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>From the right, find the first position <code>i</code> with <code>nums[i] &lt; nums[i + 1]</code>. Then
    find the rightmost value after it that is larger than <code>nums[i]</code>, swap the two, and reverse
    everything after position <code>i</code>. If no such <code>i</code> exists, the array is the last
    arrangement and a full reverse gives the first.</p>
    <h4>Why it works</h4>
    <p>The part after <code>i</code> is non-increasing, so it is already the largest arrangement of its own
    values: no change inside it can give a bigger result. To get a bigger result, position <code>i</code>
    has to take the smallest larger value available, which is the rightmost one bigger than it
    (equal values sit together, the rightmost is safe). The swap keeps the suffix non-increasing, and
    reversing a non-increasing suffix makes it the smallest ordering, so nothing fits between the old
    arrangement and the new one.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one scan to find the pivot, one to find the swap partner, one reverse. O(1) extra space.</p>
    <h4>Pitfall</h4>
    <p>Use strict comparisons when looking for the pivot: with equal neighbors (<code>[2, 2, 1]</code>), a
    non-strict test treats a position as growable when it is not. Skipping the reverse leaves the suffix
    large, and swapping with the nearest instead of the rightmost larger value overshoots when values
    repeat.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'nextArrangement',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the values as one JSON array, for example [1,2,3].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,3].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_LEN) return { ok: false, error: 'Enter 1 to 10^5 values as a JSON array.' };
    if (!nums.every(isValue)) return { ok: false, error: 'Every value must be an integer from 0 to 10^5.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
