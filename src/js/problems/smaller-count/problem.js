/**
 * Problem: Smaller Count
 *
 * For every element, how many elements of the array are strictly smaller. Comparing every pair is
 * O(n^2); because the values live in a tiny range (0 to 100), counting how often each value occurs
 * and taking a running total of those counts answers every element in O(n + range). This is the
 * counting-sort idea without the final sort.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 100;

/**
 * Reference: frequency table, then counts of strictly smaller values by prefix sum.
 * @param {number[]} nums
 * @returns {number[]}
 */
export function reference(nums) {
  const freq = new Array(MAX_V + 1).fill(0);
  for (const v of nums) freq[v]++;
  const smaller = new Array(MAX_V + 1).fill(0);
  for (let v = 1; v <= MAX_V; v++) smaller[v] = smaller[v - 1] + freq[v - 1];
  return nums.map((v) => smaller[v]);
}

function randomNums(seed, n, maxV) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (maxV + 1)));
}

const visible = [
  { args: [[8, 1, 2, 2, 3]], expected: [4, 0, 1, 1, 3], note: 'Four values are below 8; the two 2s are not smaller than each other.' },
  { args: [[6, 5, 4, 8]], expected: [2, 1, 0, 3], note: 'Each answer is the element\'s position in sorted order when values are distinct.' },
  { args: [[7, 7, 7, 7]], expected: [0, 0, 0, 0], note: 'Equal values never count as smaller.' },
  { args: [[0]], expected: [0], note: 'A single element has nothing smaller.' },
  { args: [[100, 0, 50]], expected: [2, 0, 1], note: 'Both ends of the value range.' },
];

// Hidden tests: duplicates of the smallest and largest values, a strictly decreasing run, and
// 10^5 elements where comparing every pair is far too slow.
const hiddenArgs = [
  [[0, 0]],
  [[1, 0]],
  [[0, MAX_V]],
  [[5, 4, 3, 2, 1]],
  [[2, 2, 1, 1, 0, 0, MAX_V, MAX_V]],
  [randomNums(7, 500, MAX_V)],
  [randomNums(11, MAX_N, MAX_V)],
  [Array(MAX_N).fill(MAX_V)],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - (i % (MAX_V + 1)))],
  [Array.from({ length: MAX_N }, (_, i) => (i % 1000 === 999 ? MAX_V : 0))],
];

export const problem = {
  id: 'smaller-count',
  title: 'Smaller Count',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Counting', 'Prefix Sum', 'Counting Sort'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, return an array <code>answer</code> of the same
    length where <code>answer[i]</code> is the number of indices <code>j</code> with
    <code>nums[j] &lt; nums[i]</code>. Equal values do not count.</p>
    <p>The values are small (from 0 to 100), but the array can be long, so comparing every pair of
    elements is too slow.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '0 <= nums[i] <= 100',
    'Target complexity: O(n + 101) time',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Two elements with the same value: do they always get the same answer?',
    'There are only 101 possible values. What could you count once, up front, for each of them?',
    'If you know how many times each value appears, how do you get "how many are smaller than v" for every v?',
    'Does the count for value v include the copies of v itself? Check the [7, 7, 7, 7] example.',
  ],

  signature: {
    name: 'smallerNumbersThanCurrent',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array on one line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [8,1,2,2,3].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 100.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
