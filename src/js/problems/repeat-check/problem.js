/**
 * Problem: Repeat Check
 *
 * Equivalent to LeetCode 217 (Contains Duplicate); statement and tests are written for this
 * project. Determine whether an integer array contains any value at least twice. Tracking seen
 * numbers in a hash set answers in O(n) average time and O(n) space, whereas checking every pair
 * takes O(n^2).
 *
 * Classic wrong answers: checking only adjacent elements without sorting, comparing only against
 * nums[0], using a direct-indexed boolean array that fails on negative values or +-10^9, sorting
 * with `a - b` in C/C++ (signed 32-bit overflow on -10^9 and 10^9), and the O(n^2) pair scan on
 * 10^5 distinct values.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000000000;

/**
 * Reference: insert values into a hash set and return true on the first collision.
 * @param {number[]} nums
 * @returns {boolean}
 */
export function reference(nums) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
}

/** Seeded packed array of n strictly distinct values across [-10^9, 10^9], shuffled. */
function distinctNums(seed, n) {
  const rnd = mulberry32(seed);
  const out = [];
  // Step by an irregular positive stride from -5e8 so every element is strictly distinct in O(n)
  // without allocating a Set inside the generator.
  let cur = -500000000 + Math.floor(rnd() * 1000);
  for (let i = 0; i < n; i++) {
    cur += 1 + Math.floor(rnd() * 4000);
    out.push(cur);
  }
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function distinctWithLateDup(seed, n) {
  const arr = distinctNums(seed, n);
  // Duplicate the last two elements (neither at index 0) so first-element-only scans fail.
  arr[n - 1] = arr[n - 2];
  return arr;
}

const visible = [
  { args: [[1, 2, 3, 1]], expected: true, note: '1 appears at indices 0 and 3.' },
  { args: [[1, 2, 3, 4]], expected: false, note: 'All four values are distinct.' },
  { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true, note: 'Multiple values repeat.' },
  { args: [[42]], expected: false, note: 'A single element cannot contain a duplicate.' },
  { args: [[-7, 0, 7, -7]], expected: true, note: 'Negative values count just like positive ones.' },
];

// Hidden tests: minimum duplicate pair, negative extremes, duplicate only at ends,
// sorted distinct, unsorted with middle duplicate, duplicate at the very last pair of 10^5,
// plus max-size 10^5 all-distinct inputs that time out O(n^2) pair scans.
const hiddenArgs = [
  [[0, 0]],
  [[-MAX_ABS, MAX_ABS]],
  [[-MAX_ABS, 5, 12, -MAX_ABS]],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  [[10, 2, 8, 4, 6, 1, 9, 3, 7, 5, 4]],
  [distinctNums(2171, MAX_N)],
  [distinctWithLateDup(2172, MAX_N)],
  [distinctNums(2173, MAX_N)],
  [distinctWithLateDup(2174, MAX_N)],
  [Array.from({ length: MAX_N }, (_, i) => i - 50000)],
];

export const problem = {
  id: 'repeat-check',
  title: 'Repeat Check',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Hash Set', 'Sorting'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  statementHtml: `
    <p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears
    <strong>at least twice</strong> in the array, and return <code>false</code> if every element
    is distinct.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'Target complexity: O(n) time, O(n) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'What is the cost of checking every pair (i, j), and what happens when nums has 10^5 distinct elements?',
    'Which data structure lets you test whether you have seen a value before in O(1) average time?',
    'Can you also solve this without a hash set by reordering the values first? What is the time/space trade-off?',
    'Why would a fixed-size boolean lookup array fail on values between -10^9 and 10^9?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Walk through <code>nums</code> once while inserting each value into a hash set. If the
    current value is already in the set, return <code>true</code> immediately; if the loop finishes
    without a collision, return <code>false</code>.</p>
    <h4>Why it works</h4>
    <p>When a value appears for the second time, its first occurrence is guaranteed to be in the set.
    Every element is inserted at most once and queried once.</p>
    <h4>Complexity</h4>
    <p>O(n) average time and O(n) space. Sorting first and checking adjacent elements gives O(n log n)
    time and O(1) extra space if mutating the input is allowed.</p>
    <h4>Pitfall</h4>
    <p>Values range from <code>-10^9</code> to <code>10^9</code>, so a direct-indexed array will not
    fit in memory, and in C/C++ sorting with <code>a - b</code> overflows 32-bit integers on
    <code>-10^9</code> and <code>10^9</code> (use comparisons instead).</p>
  `,

  signature: {
    name: 'hasRepeat',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'bool',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [6000, 12000, 24000, 48000, 96000, 192000],
    // All elements are strictly distinct so neither a hash set nor a sort-and-scan can exit early.
    input: (n, seed) => [distinctNums(seed, n)],
  },

  /**
   * Custom input: nums as a JSON array of integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,3,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'nums must be an array of 1 to 10^5 integers.' };
    }
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) {
      return { ok: false, error: 'Every value must be an integer from -10^9 to 10^9.' };
    }
    return { ok: true, args: [nums] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
