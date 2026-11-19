/**
 * Problem: Rising Chain
 *
 * Length of the longest strictly increasing subsequence. The textbook O(n^2) DP is correct, but n
 * is raised to 10^5 here (LeetCode allows 2500), so it needs the O(n log n) "tails" method: tails[k]
 * is the smallest value that ends an increasing subsequence of length k + 1, and each element
 * replaces the first tail that is >= it. Using "first tail > it" instead counts equal values as
 * increasing, which the duplicate-heavy hidden tests catch.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 1000000000;

/**
 * Reference: tails array with a lower-bound binary search.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const tails = [];
  for (const v of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = v;
  }
  return tails.length;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4, note: 'One longest chain is [2, 3, 7, 101].' },
  { args: [[0, 1, 0, 3, 2, 3]], expected: 4, note: '[0, 1, 2, 3].' },
  { args: [[7, 7, 7, 7]], expected: 1, note: 'Equal values do not count as increasing.' },
  { args: [[5]], expected: 1, note: 'A single element is a chain of length 1.' },
  { args: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], expected: 6, note: '[1, 3, 6, 7, 9, 10].' },
];

// Hidden tests: a strictly decreasing run, duplicates inside an increasing run, extreme values,
// a sawtooth, then 10^5 elements (random wide range, heavy duplicates, sorted ascending, and a
// slow staircase) where the O(n^2) DP is far too slow.
const hiddenArgs = [
  [[5, 4, 3, 2, 1]],
  [[1, 2, 2, 2, 3, 3, 4]],
  [[MAX_ABS, -MAX_ABS, 0, MAX_ABS - 1, -MAX_ABS + 1]],
  [[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9]],
  [randomNums(127, 1000, -50, 50)],
  [randomNums(131, MAX_N, -MAX_ABS, MAX_ABS)],
  [randomNums(137, MAX_N, 1, 20)],
  [Array.from({ length: MAX_N }, (_, i) => i - 50000)],
  [Array.from({ length: MAX_N }, (_, i) => Math.floor(i / 7) - (i % 7))],
  [randomNums(139, MAX_N, -1000, 1000).map((v, i) => v + 20 * i)],
];

export const problem = {
  id: 'rising-chain',
  title: 'Rising Chain',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Binary Search', 'Patience Sorting'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, return the length of its longest
    <strong>strictly increasing subsequence</strong>.</p>
    <p>A subsequence keeps the original order but may skip elements: <code>[3, 7, 101]</code> is a
    subsequence of <code>[10, 3, 2, 7, 101]</code>. Equal neighbors do not count as increasing.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 2500)',
    '-10^9 <= nums[i] <= 10^9',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you knew the longest chain ending at every earlier index, how would you get the one ending at i? What does that cost?',
    'Among all chains of the same length, which one is the most useful to extend later?',
    'Suppose tails[k] is the smallest possible last value of a chain of length k + 1. What order are the tails in?',
    'Given that order, how do you find which tail a new value should replace, and why replace rather than append?',
    'For a strictly increasing chain, should a value equal to a tail replace it or go after it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep an array <code>tails</code> where <code>tails[k]</code> is the smallest value that can end
    a strictly increasing subsequence of length <code>k + 1</code>. For each element, binary search
    the first tail that is greater than or equal to it and replace that tail, or append if there is
    none. The answer is the length of <code>tails</code>.</p>
    <h4>Why it works</h4>
    <p>The tails are strictly increasing, which is what makes the binary search valid. Replacing a tail
    with a smaller value keeps the same length but makes it easier to extend later, and appending
    happens exactly when the element extends the longest chain so far. <code>tails</code> is not
    itself a subsequence, only its length is meaningful.</p>
    <h4>Complexity</h4>
    <p>O(n log n) time: one binary search per element. O(n) space for <code>tails</code>. The classic
    DP over all earlier elements is O(n^2), 10^10 steps at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>Search for the first tail <code>&gt;= x</code>, not <code>&gt; x</code>. With the strict
    version an equal value is appended after itself, so runs of duplicates are counted as
    increasing.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'lengthOfLis',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [10,9,2,5,3,7].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers from -10^9 to 10^9.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Random values: the
  // O(n^2) DP compares every pair whatever the input.
  growth: {
    target: 'n log n',
    n: 'nums.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [randomNums(seed, n, -MAX_ABS, MAX_ABS)],
  },
};

export default problem;
