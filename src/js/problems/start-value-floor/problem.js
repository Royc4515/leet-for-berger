/**
 * Problem: Start Value Floor
 *
 * Find the smallest positive starting value such that adding the numbers one at a time never lets
 * the running total drop below 1. The running total is the start plus a prefix sum, so the worst
 * moment is the lowest prefix sum. Trying start = 1, 2, 3, ... and simulating each is the trap:
 * with 10^5 numbers of up to 10^4 in size the answer can be about 10^9.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 10000;

/**
 * Reference: start - (lowest prefix sum) must be at least 1, and start itself must be at least 1.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let sum = 0;
  let lowest = 0;
  for (const v of nums) {
    sum += v;
    if (sum < lowest) lowest = sum;
  }
  return 1 - lowest;
}

/** Seeded array of n values in [min, max]. */
function randomNums(seed, n, min, max) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(min + Math.floor(rnd() * (max - min + 1)));
  return out;
}

const visible = [
  { args: [[-3, 2, -3, 4, 2]], expected: 5, note: 'Prefix sums are -3, -1, -4, 0, 2. The lowest is -4, so start at 5.' },
  { args: [[1, 2]], expected: 1, note: 'The totals only grow, so the smallest positive start works.' },
  { args: [[1, -2, -3]], expected: 5, note: 'Prefix sums are 1, -1, -4. Starting at 5 gives 6, 4, 1.' },
  { args: [[-5]], expected: 6, note: 'One step down by 5 needs a start of 6 to land on 1.' },
  { args: [[2, -2]], expected: 1, note: 'The total returns to the start but never goes below it.' },
];

// Hidden tests: one element each way, a total that returns to zero and then dips one lower,
// the lowest point in the middle then a long climb, the lowest point at the very end, then
// max-size inputs: all -10^4 (answer 10^9 + 1, so simulating each start times out), all +10^4,
// seeded noise with negative drift, and noise with positive drift.
const hiddenArgs = [
  [[7]],
  [[-1]],
  [[3, -3, -1, 1]],
  [[-2, -2, 9, 9, 9, -30, 1]],
  [[5, 5, -4, -4, -4, -4]],
  [Array(MAX_N).fill(-MAX_ABS)],
  [Array(MAX_N).fill(MAX_ABS)],
  [randomNums(41, MAX_N, -MAX_ABS, MAX_ABS - 2000)],
  [randomNums(42, MAX_N, -MAX_ABS + 2000, MAX_ABS)],
  [[...Array(MAX_N / 2).fill(MAX_ABS), ...Array(MAX_N / 2).fill(-MAX_ABS)]],
];

export const problem = {
  id: 'start-value-floor',
  title: 'Start Value Floor',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Prefix Sum'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You begin with a positive integer <code>start</code> and then add the numbers of
    <code>nums</code> to it one at a time, from left to right. After every addition the running
    total must be at least <code>1</code>.</p>
    <p>Return the smallest positive integer <code>start</code> for which that holds.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'After k steps, what is the running total in terms of start and the first k numbers?',
    'Which single step is the most dangerous one, and what do you know about the total there?',
    'If the lowest prefix sum is -4, what is the smallest start that keeps the total at 1 or more?',
    'What if every prefix sum is positive: can the answer be 0?',
    'How large can the answer get, and is it wise to try starts one by one?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>After <code>k</code> steps the total is <code>start + prefix[k]</code>, where
    <code>prefix[k]</code> is the sum of the first <code>k</code> numbers. All of these must be at
    least 1, and the tightest one belongs to the lowest prefix sum. So scan once, track the lowest
    prefix sum <code>low</code> (starting from 0 for "no steps yet"), and the answer is
    <code>1 - low</code>.</p>
    <h4>Why it works</h4>
    <p>The condition <code>start + prefix[k] &gt;= 1</code> for all <code>k</code> is equivalent to
    <code>start &gt;= 1 - min(prefix)</code>. Seeding the minimum with 0 also covers the requirement
    that <code>start</code> itself is at least 1, so the answer is never below 1.</p>
    <h4>Complexity</h4>
    <p>O(n) time, O(1) space. Simulating each candidate start from 1 upward costs the answer times
    n, and the answer can be about 10^9.</p>
    <h4>Pitfall</h4>
    <p>The off-by-one: the total must reach 1, not 0, so the answer is <code>1 - low</code>, not
    <code>-low</code>. And when every prefix sum is positive the answer is 1, not 0 or a negative
    number.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minStartValue',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [-3,2,-3,4,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must be an array of 1 to 10^5 integers.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Every value must be an integer from -10^4 to 10^4.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
