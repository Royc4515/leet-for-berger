/**
 * Problem: Target Range
 *
 * First and last index of a value in a sorted array. Two lower-bound binary searches answer it:
 * the first index with value >= target, and the first index with value >= target + 1 (integers
 * only, so that is the first index past the run). Finding one match and then walking outwards
 * degrades to O(n) when the run is long, which the hidden tests include.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * First index whose value is >= x (nums.length if none).
 * @param {number[]} nums
 * @param {number} x
 */
function lowerBound(nums, x) {
  let lo = 0;
  let hi = nums.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] >= x) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Reference: two lower bounds; an empty run means the target is absent.
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
export function reference(nums, target) {
  const l = lowerBound(nums, target);
  const r = lowerBound(nums, target + 1);
  return l === r ? [-1, -1] : [l, r - 1];
}

/** Seeded sorted array of n values in [lo, hi]. */
function sortedNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1))).sort((x, y) => x - y);
}

const dense = sortedNums(7, MAX_N, -50, 50);
const sparse = sortedNums(11, MAX_N, -MAX_V, MAX_V);

const visible = [
  { args: [[5, 7, 7, 8, 8, 10], 8], expected: [3, 4], note: 'The two 8s sit at indices 3 and 4.' },
  { args: [[5, 7, 7, 8, 8, 10], 6], expected: [-1, -1], note: '6 is not in the array.' },
  { args: [[], 0], expected: [-1, -1], note: 'An empty array contains nothing.' },
  { args: [[2], 2], expected: [0, 0], note: 'A run of length one starts and ends at the same index.' },
  { args: [[1, 2, 2, 2, 2, 3], 2], expected: [1, 4], note: 'Both ends of a longer run.' },
];

// Hidden tests: targets below and above every value, runs touching either end, the extreme values,
// and 10^5 values where the whole array is the target (walking outwards from a match is O(n)).
const hiddenArgs = [
  [[1], 0],
  [[1, 3], 3],
  [[3, 3, 3, 4], 3],
  [[1, 2, 3], 4],
  [[-MAX_V, -MAX_V, MAX_V], MAX_V],
  [sortedNums(5, 500, 0, 20), 13],
  [new Array(MAX_N).fill(7), 7],
  [dense, 0],
  [dense, 51],
  [sparse, sparse[77777]],
];

export const problem = {
  id: 'target-range',
  title: 'Target Range',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search'],
  timeLimitMs: 3000,
  argNames: ['nums', 'target'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code> sorted in non-decreasing order and an integer
    <code>target</code>, return <code>[first, last]</code>: the smallest and the largest index
    at which <code>target</code> appears.</p>
    <p>If <code>target</code> does not appear, return <code>[-1, -1]</code>. Aim for
    <code>O(log n)</code> time.</p>
  `,
  constraints: [
    '0 <= nums.length <= 10^5',
    '-10^9 <= nums[i], target <= 10^9',
    'nums is sorted in non-decreasing order',
    'Target complexity: O(log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, target = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Finding any one copy of the target is a plain binary search. Why is walking outwards from it not enough?',
    'Can you change the binary search so it keeps going left after a match, to find the first copy?',
    'Is "the last index of target" the same as "one before the first index of something larger"?',
    'What does your search return when every value is smaller than the target, or the array is empty?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Run two lower-bound binary searches: <code>l</code>, the first index whose value is
    <code>&gt;= target</code>, and <code>r</code>, the first index whose value is
    <code>&gt;= target + 1</code>. The copies of <code>target</code> occupy exactly
    <code>[l, r)</code>.</p>
    <h4>Why it works</h4>
    <p>The array is sorted, so every value before <code>l</code> is smaller than <code>target</code> and
    every value from <code>r</code> on is larger. Because the values are integers, nothing lies strictly
    between <code>target</code> and <code>target + 1</code>, so the run in between is all copies. If
    <code>l == r</code> the run is empty and the answer is <code>[-1, -1]</code>; otherwise it is
    <code>[l, r - 1]</code>.</p>
    <h4>Complexity</h4>
    <p>O(log n) time for two binary searches, O(1) space. Finding one copy and walking outwards is O(n)
    when most of the array equals <code>target</code>.</p>
    <h4>Pitfall</h4>
    <p>A lower bound returns <code>nums.length</code> when every value is smaller, so check before reading
    <code>nums[l]</code>; comparing <code>l</code> with <code>r</code> avoids the read altogether and also
    covers the empty array. In fixed-width languages, <code>target + 1</code> stays in range here because
    <code>target &lt;= 10^9</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'searchRange',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'target', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array, then target, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter nums on line 1 and target on line 2.' };
    let nums;
    let target;
    try {
      nums = JSON.parse(lines[0]);
      target = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array and target as an integer, for example [5,7,7,8] then 7.' };
    }
    if (!Array.isArray(nums) || nums.length > MAX_N) return { ok: false, error: 'nums must have at most 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return { ok: false, error: 'nums must be sorted in non-decreasing order.' };
    if (!Number.isInteger(target) || Math.abs(target) > MAX_V) return { ok: false, error: 'target must be an integer within +-10^9.' };
    return { ok: true, args: [nums, target] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
