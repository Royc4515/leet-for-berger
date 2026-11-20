/**
 * Problem: Best Run Sum
 *
 * Largest sum of a non-empty contiguous subarray. Kadane's scan keeps the best sum of a run that
 * ends at the current index: either extend the previous run or start fresh here. The classic slips
 * are returning 0 for an all-negative array (the run must be non-empty) and the O(n^2) "try every
 * start" loop, which is far too slow at n = 10^5.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_ABS = 10000;

/**
 * Reference: Kadane's scan.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let best = nums[0];
  let run = nums[0];
  for (let i = 1; i < nums.length; i++) {
    run = Math.max(run, 0) + nums[i];
    best = Math.max(best, run);
  }
  return best;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, note: 'The run [4, -1, 2, 1] adds up to 6.' },
  { args: [[1]], expected: 1, note: 'A single element is the only run.' },
  { args: [[5, 4, -1, 7, 8]], expected: 23, note: 'Taking everything is best: the -1 is paid back by what follows.' },
  { args: [[-3, -1, -2]], expected: -1, note: 'Every value is negative, so the best run is the single largest value.' },
  { args: [[2, -1, 2]], expected: 3, note: 'Crossing the -1 is worth it.' },
];

// Hidden tests: one negative value, zeros, all negative (an answer of 0 is wrong), a dip that is
// worth crossing next to one that is not, then 10^5 elements where checking every start is O(n^2).
const hiddenArgs = [
  [[-5]],
  [[0, 0, 0]],
  [randomNums(3, 1000, -MAX_ABS, -1)],
  [[3, -4, 5]],
  [[-1, MAX_ABS, -1]],
  [randomNums(5, 1000, -50, 40)],
  [randomNums(7, MAX_N, -MAX_ABS, MAX_ABS)],
  [Array(MAX_N).fill(MAX_ABS)],
  [randomNums(11, MAX_N, -MAX_ABS, -1)],
  [randomNums(13, MAX_N, -101, 100)],
];

export const problem = {
  id: 'best-run-sum',
  title: 'Best Run Sum',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Kadane', 'Dynamic Programming'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer array <code>nums</code>. Pick a <strong>non-empty</strong> run of
    consecutive elements so that their sum is as large as possible, and return that sum.</p>
    <p>A run may be a single element or the whole array. It may not be empty, so the answer for an
    all-negative array is negative.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you knew the best run that ends exactly at index i - 1, what are the only two choices for the best run ending at i?',
    'When is it better to drop everything before index i and start a new run there?',
    'Do you need the whole table of "best run ending here", or only the previous entry?',
    'What should you start the answer at so an all-negative array still returns a real element?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan once, keeping the best sum of a run that ends at the current element. That run either
    extends the previous one or starts fresh here, and it starts fresh exactly when the previous
    best is negative.</p>
    <h4>Why it works</h4>
    <p>Every run ends somewhere. If the best run ending at <code>i - 1</code> has sum
    <code>r</code>, the best run ending at <code>i</code> is <code>max(r, 0) + nums[i]</code>: a
    negative prefix only lowers the total. Taking the maximum of these values over all positions
    covers every possible run.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space: two numbers updated per element. Trying every start is O(n^2),
    about 5 * 10^9 sums at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>The run must be non-empty. Starting the answer at <code>0</code> returns 0 for an
    all-negative array; start it at <code>nums[0]</code> so the answer is a real element.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxSubArray',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [-2,1,-3,4].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers from -10^4 to 10^4.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random signs: the running sum resets often and the best run keeps changing, and the single pass reads everything.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [1024000, 2048000, 4096000, 8192000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: -1e4, max: 1e4 })],
  },
};

export default problem;
