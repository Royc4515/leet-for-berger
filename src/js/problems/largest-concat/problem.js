/**
 * Problem: Largest Concat
 *
 * Arrange non-negative integers so that writing them side by side gives the largest number. The
 * lesson is a custom comparator: a goes before b exactly when the string a + b beats b + a. Plain
 * descending numeric order fails (9 must precede 10), and plain descending string order fails on
 * shared prefixes (3 must precede 30, but 34 must precede 3).
 *
 * The result can have up to 1000 digits, so it is returned as a string; all zeros collapse to "0".
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100;
const MAX_V = 1000000000;

/**
 * Reference: sort by the pairwise concatenation order, then join.
 * @param {number[]} nums
 * @returns {string}
 */
export function reference(nums) {
  const parts = nums.map(String);
  // a before b when a+b is larger; equal-length strings compare like the numbers they spell.
  parts.sort((a, b) => {
    const ab = a + b;
    const ba = b + a;
    return ab > ba ? -1 : ab < ba ? 1 : 0;
  });
  // Only the largest value can lead; if it is 0 every value is 0.
  return parts[0] === '0' ? '0' : parts.join('');
}

function randomNums(seed, n, pool) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => pool(rnd));
}

const anyValue = (rnd) => Math.floor(rnd() * (MAX_V + 1));
// Values built from few digits share long prefixes, which is where a naive string sort breaks.
const sharedPrefix = (rnd) => {
  const len = 1 + Math.floor(rnd() * 5);
  let s = '';
  for (let i = 0; i < len; i++) s += rnd() < 0.5 ? '1' : rnd() < 0.5 ? '0' : '2';
  return Number(s);
};

const visible = [
  { args: [[10, 2]], expected: '210', note: '"2" + "10" = "210" beats "10" + "2" = "102".' },
  { args: [[3, 30, 34, 5, 9]], expected: '9534330', note: '3 goes before 30 ("330" > "303"), but 34 goes before 3.' },
  { args: [[0, 0]], expected: '0', note: 'All zeros give "0", not "00".' },
  { args: [[1]], expected: '1', note: 'A single number is the answer as it is.' },
  { args: [[121, 12]], expected: '12121', note: '"12" + "121" = "12121" beats "121" + "12" = "12112".' },
];

// Hidden tests: all zeros of any length, zeros mixed with a non-zero, shared prefixes that break a
// plain string sort, concatenations that overflow 64 bits if compared as numbers, and the maximum size.
const hiddenArgs = [
  [[0]],
  [[0, 0, 0, 0]],
  [[0, 1, 0]],
  [[3, 30, 300, 33, 303]],
  [[1000000000, 1000000000, 999999999]],
  [[9, 99, 999, 98, 989, 1, 10, 100]],
  [randomNums(7, MAX_N, anyValue)],
  [randomNums(11, MAX_N, sharedPrefix)],
  [Array(MAX_N).fill(0)],
  [randomNums(13, MAX_N, (rnd) => (rnd() < 0.5 ? 0 : Math.floor(rnd() * 21)))],
];

export const problem = {
  id: 'largest-concat',
  title: 'Largest Concat',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sorting', 'Custom Comparator', 'Greedy'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a list of non-negative integers <code>nums</code>. Put them in an order so
    that writing them one after another, with no separators, forms the largest possible
    number.</p>
    <p>The result can be far too long for any integer type, so return it as a string. It must not
    have leading zeros: if every value is <code>0</code>, return <code>"0"</code>.</p>
  `,
  constraints: [
    '1 <= nums.length <= 100',
    '0 <= nums[i] <= 10^9',
    'Target complexity: O(n log n) comparisons',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Does sorting the numbers from largest to smallest work? Try 9 and 10.',
    'Does sorting their digit strings in reverse alphabetical order work? Try 3 and 30, then 3 and 34.',
    'For just two values a and b, how can you tell for sure which one should come first?',
    'If that two-value rule is your comparator, what does a sort with it produce for the whole list?',
    'What does your result look like when every value is 0?',
  ],

  signature: {
    name: 'largestNumber',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'string',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [3,30,34,5,9].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 100 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 10^9.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
