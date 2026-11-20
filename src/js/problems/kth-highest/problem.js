/**
 * Problem: Kth Highest Value
 *
 * The k-th largest value of an unsorted array, counting duplicates. Three standard answers:
 * sort (O(n log n)), a min-heap of size k (O(n log k)), or quickselect (O(n) on average). The
 * classic wrong answers are deduplicating the values and a quickselect whose pivot choice goes
 * quadratic on sorted or all-equal input; both are covered by the hidden tests.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

/**
 * Reference: sort descending and index. Simple on purpose, since it doubles as the oracle that
 * every hidden expectation is computed with.
 * @param {number[]} nums
 * @param {number} k
 * @returns {number}
 */
export function reference(nums, k) {
  // Typed arrays sort numerically; plain arrays would sort as strings.
  const a = Int32Array.from(nums).sort();
  return a[a.length - k];
}

const MAX_N = 100000;
const MAX_V = 10000;

/** Seeded values in [-range, range]. */
function randomValues(seed, n, range) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (2 * range + 1)) - range);
}

const visible = [
  { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5, note: 'Sorted descending: 6, 5, 4, ... The 2nd value is 5.' },
  { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4, note: 'Duplicates count: 6, 5, 5, 4. The 4th value is 4, not 3.' },
  { args: [[7], 1], expected: 7, note: 'One element.' },
  { args: [[-1, -1, -1], 2], expected: -1, note: 'Every value is the same.' },
  { args: [[2, -5, 9, 0], 4], expected: -5, note: 'k = n asks for the smallest value.' },
];

// Hidden tests: k = 1 and k = n, negatives, duplicates around the answer, and four inputs of
// 10^5 values: random, already sorted, reverse sorted and all equal. A quickselect that always
// takes the first or last element as pivot is quadratic on the sorted and all-equal ones.
const hiddenArgs = [
  [[1, 2], 1],
  [[5, 5, 4, 4, 3, 3], 3],
  [[-10000, 10000, 0, -1, 1], 5],
  [randomValues(3, 50, 5), 17],
  [randomValues(5, 1000, MAX_V), 1],
  [randomValues(7, MAX_N, MAX_V), 31337],
  [Array.from({ length: MAX_N }, (_, i) => (i % (2 * MAX_V + 1)) - MAX_V).sort((x, y) => x - y), 1],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - (i % (2 * MAX_V + 1))).sort((x, y) => y - x), MAX_N],
  [new Array(MAX_N).fill(42), 50000],
  [randomValues(11, MAX_N, 3), 66666],
];

export const problem = {
  id: 'kth-highest',
  title: 'Kth Highest Value',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Heap', 'Quickselect', 'Sorting'],
  timeLimitMs: 3000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the
    <code>k</code>-th largest value in the array.</p>
    <p>Positions count, not distinct values: if the array were sorted in descending order, the
    answer is the value at position <code>k</code> (1-based). So in <code>[5, 5, 4]</code> the
    2nd largest value is 5.</p>
    <p>Sorting works. Can you do better, in O(n log k) with a heap or O(n) on average?</p>
  `,
  constraints: [
    '1 <= k <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    'Duplicates count separately',
    'Target complexity: O(n log k) or O(n) average (an O(n^2) selection times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you only kept the k largest values seen so far, which one of them is the answer?',
    'Which structure lets you look at and drop the smallest of those k values quickly?',
    'Quicksort places one pivot at its final position. If that position is not the one you want, which side do you still need?',
    'What happens to your partitioning when the input is already sorted, or every value is equal?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Quickselect. The k-th largest is the value at index <code>n - k</code> in ascending order.
    Partition around a pivot, then continue only in the part that contains that index.</p>
    <h4>Why it works</h4>
    <p>Hoare partitioning splits <code>[l, r]</code> into <code>[l, j]</code>, all values
    <code>&lt;=</code> the pivot, and <code>[j + 1, r]</code>, all values <code>&gt;=</code> it. The
    value that sorting would place at the target index lies in whichever part contains that index,
    so the other part is dropped. Selecting by position is what makes duplicates count
    separately.</p>
    <h4>Complexity</h4>
    <p>O(n) average time, O(1) extra space (a loop, no recursion), O(n^2) in the worst case. Sorting
    is O(n log n); a min-heap of the k largest is O(n log k).</p>
    <h4>Pitfall</h4>
    <p>Pivot choice and equal values. A first-element pivot is quadratic on sorted input, and a
    partition that sends every equal value to one side is quadratic on an array of one repeated
    value. The middle element as pivot plus Hoare's scans, which stop on equal values from both
    sides, keep both cases balanced.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findKthLargest',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array on the first line, k on the second.
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [3,2,1], and k as an integer.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^4.' };
    if (!Number.isInteger(k) || k < 1 || k > nums.length) return { ok: false, error: 'k must be an integer from 1 to nums.length.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random values in the statement range (many duplicates at large n) with k in the middle, the hardest rank for the selection.
  growth: {
    target: 'n log n',
    n: 'nums.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: -1e4, max: 1e4 }), (n >> 1) + 1],
  },
};

export default problem;
