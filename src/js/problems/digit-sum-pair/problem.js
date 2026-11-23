/**
 * Problem: Digit Sum Pair
 *
 * Equivalent to LeetCode 2342 (Max Sum of a Pair With Equal Sum of Digits); statement and tests
 * are written for this project. Group the numbers by digit sum. Only the two largest numbers in a
 * group can form that group's best pair, so one pass that remembers the largest number seen for
 * each digit sum (at most 82 sums for values up to 10^9) finds the answer in O(n).
 *
 * Classic wrong answers: pairing a number with itself (i must differ from j, but two equal values
 * at different indices are allowed), returning 0 instead of -1 when no pair exists, sorting by
 * value and pairing only neighbours, and the O(n^2) scan over every pair, which times out at 10^5
 * numbers. The best sum is at most 2 * 10^9 (10^9 twice), which still fits in a signed 32-bit
 * integer (2^31 - 1 is about 2.147 * 10^9).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, intArray, shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/** Sum of the decimal digits of a non-negative integer. */
function digitSum(v) {
  let s = 0;
  for (let x = v; x > 0; x = Math.floor(x / 10)) s += x % 10;
  return s;
}

/**
 * Reference: one pass, the largest value seen so far for each digit sum.
 * @param {number[]} nums
 * @returns {number} largest nums[i] + nums[j] (i != j) with equal digit sums, or -1
 */
export function reference(nums) {
  const largest = new Map();
  let best = -1;
  for (const v of nums) {
    const s = digitSum(v);
    const prev = largest.get(s);
    if (prev !== undefined) {
      best = Math.max(best, prev + v);
      if (v > prev) largest.set(s, v);
    } else largest.set(s, v);
  }
  return best;
}

/** Values with pairwise different digit sums: one per sum from 1 to `count`, shuffled. */
function distinctSums(seed, count) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let s = 1; s <= count; s++) {
    // The smallest number with digit sum s: (s % 9) followed by s / 9 nines.
    out.push(Number(`${s % 9 || ''}${'9'.repeat(Math.floor(s / 9))}`));
  }
  return shuffle(out, rnd);
}

const visible = [
  { args: [[18, 43, 36, 13, 7]], expected: 54, note: '18 and 36 both have digit sum 9 (54); 43 and 7 have digit sum 7 (50).' },
  { args: [[10, 12, 19, 14]], expected: -1, note: 'The digit sums are 1, 3, 10 and 5: no two are equal.' },
  { args: [[51, 71, 17, 24, 42]], expected: 93, note: '51 and 42 have digit sum 6 (93); 71 and 17 have digit sum 8 (88).' },
  { args: [[5, 5]], expected: 10, note: 'Two equal values at different positions are a valid pair.' },
  { args: [[229, 398, 269, 317, 420, 464, 491, 218, 439]], expected: 955, note: '464 and 491 share digit sum 14 (955); 317 and 218 share digit sum 11 (535).' },
];

// Hidden tests: a single number (-1), 81 numbers with pairwise different digit sums (-1), the two
// largest values below 10^9 that share a digit sum, 10^9 itself with 10^8 and 1, 10^5 random
// values, 10^5 powers of ten (digit sum 1; two copies of 10^9 give the largest possible answer,
// 2 * 10^9), 10^5 copies of one value, 10^5 small values (digit sums crowd into a few groups), a small random
// case, and a case where the largest value has no partner.
const hiddenArgs = (() => {
  const rnd = mulberry32(2342);
  const powers = Array.from({ length: MAX_N }, () => 10 ** randInt(rnd, 0, 9));
  return [
    [[7]],
    [distinctSums(2342, 81)],
    [[999999998, 123, 999999989, 456]],
    [[1, 100000000, 1000000000]],
    [intArray(MAX_N, mulberry32(11), { min: 1, max: MAX_V })],
    [powers],
    [Array(MAX_N).fill(999999999)],
    [intArray(MAX_N, mulberry32(13), { min: 1, max: 100 })],
    [intArray(20, mulberry32(17), { min: 1, max: 1000 })],
    [[999999999, 18, 27, 90]],
  ];
})();

export const problem = {
  id: 'digit-sum-pair',
  title: 'Digit Sum Pair',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Map', 'Grouping', 'Running Maximum'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>nums</code> of positive integers. Choose two different indices
    <code>i</code> and <code>j</code> such that the sum of the decimal digits of <code>nums[i]</code> equals
    the sum of the decimal digits of <code>nums[j]</code>.</p>
    <p>Return the largest possible value of <code>nums[i] + nums[j]</code>, or <code>-1</code> if no two
    numbers have the same digit sum.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '1 <= nums[i] <= 10^9',
    'Target complexity: O(n) (a digit sum takes at most 10 steps)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which numbers are allowed to be paired at all? What property do they share?',
    'Within one group of numbers with the same digit sum, which pair gives the largest sum?',
    'How many different digit sums can a number up to 10^9 have?',
    'Walking the array once, what single value per digit sum do you need to remember to pair the current number with the best partner so far?',
    'What should you return when no group has two numbers, and can two equal values form a pair?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Two numbers can be paired only if their digit sums are equal, so the numbers split into groups by digit
    sum. Inside a group the best pair is its two largest numbers. Walk the array once and keep, for every digit
    sum, the largest number seen so far: each new number pairs with that one, and then may replace it.</p>
    <h4>Why it works</h4>
    <p>When the second largest number of a group arrives, the largest so far is either already stored (and the
    pair is counted then) or arrives later and pairs with it then. Either way the two largest numbers of every
    group meet exactly once. A digit sum is at most 81 for values up to 10<sup>9</sup>, so an array of 82
    slots works as well as a hash map.</p>
    <h4>Complexity</h4>
    <p>O(n) time, with at most 10 digit steps per number, and O(1) extra space for the 82 slots.</p>
    <h4>Pitfall</h4>
    <p>A number cannot pair with itself, but two equal numbers at different positions can. Return
    <code>-1</code>, not 0, when no pair exists. Checking every pair takes about 5 * 10<sup>9</sup> steps at
    the full size. The largest answer is 2 * 10<sup>9</sup> (10<sup>9</sup> twice), which still fits in a
    32-bit integer, but adding a third number on top would not.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maximumSum',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one JSON array of positive integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of positive integers, e.g. [18,43,36,13,7].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 numbers.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_V)) return { ok: false, error: 'Every number must be an integer from 1 to 10^9.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Random values up to 10^9 spread over all 81 digit sums, so every group keeps growing and every
  // number is compared with its group's best; nothing can stop early.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [62500, 125000, 250000, 500000, 1000000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: MAX_V })],
  },
};

export default problem;
