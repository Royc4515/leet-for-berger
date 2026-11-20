/**
 * Problem: Balanced Cuts
 *
 * Equivalent to LeetCode 410; statement and tests are written for this project. Cut an array of
 * non-negative integers into exactly k non-empty contiguous parts so that the largest part sum is
 * as small as possible. Binary search the answer: a cap is feasible when a greedy left-to-right
 * pass needs at most k parts, and feasibility only ever flips from no to yes as the cap grows.
 *
 * Limits are raised past the original (10^4 values, each up to 10^6, so sums reach 10^10 and the
 * answer is a 64-bit value). The classic O(n^2 * k) table then needs about 2.5 * 10^9 steps and
 * times out.
 *
 * Classic wrong answers: cutting whenever a part reaches total / k (parts can still end up
 * heavier than the best split), returning max(largest value, ceil(total / k)), and summing in a
 * 32-bit integer, which overflows on the large cases.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 10000;
const MAX_VALUE = 1000000;
const MAX_K = 50;

/**
 * Reference: smallest cap for which the greedy pass uses at most k parts.
 * @param {number[]} nums
 * @param {number} k
 * @returns {number}
 */
export function reference(nums, k) {
  let lo = 0;
  let hi = 0;
  for (const v of nums) {
    lo = Math.max(lo, v);
    hi += v;
  }
  const fits = (cap) => {
    let parts = 1;
    let sum = 0;
    for (const v of nums) {
      if (sum + v > cap) {
        parts++;
        sum = v;
      } else {
        sum += v;
      }
    }
    return parts <= k;
  };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Seeded array of `n` values in [lo, hi], a share `zeros` of them forced to 0. */
function randomNums(seed, n, lo, hi, zeros = 0) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => (rnd() < zeros ? 0 : lo + Math.floor(rnd() * (hi - lo + 1))));
}

const visible = [
  { args: [[7, 2, 5, 10, 8], 2], expected: 18, note: '[7, 2, 5] and [10, 8] have sums 14 and 18, and no cut does better than 18.' },
  { args: [[1, 2, 3, 4, 5], 2], expected: 9, note: '[1, 2, 3] and [4, 5] have sums 6 and 9, which beats [1, 2, 3, 4] and [5] with 10 and 5.' },
  { args: [[1, 4, 4], 3], expected: 4, note: 'Three parts from three values: every value stands alone, so the answer is the largest value.' },
  { args: [[5, 5, 5, 5], 2], expected: 10, note: 'Two equal halves of 10.' },
  { args: [[2, 3, 1, 2, 4, 3], 5], expected: 4, note: 'Five parts from six values: only one pair is joined. Joining 1 and 2 costs 3, so the largest part stays 4, the largest single value.' },
];

// Hidden tests: a single value, all zeros, k equal to the length, a 1..10 ramp, a dominant value,
// two near-uniform arrays, and 10^4 values at the limits: random with k = 50 (sum around 5 *
// 10^9), all 10^6 with k = 1 (sum 10^10), 40% zeros, and a spiky array of 10^6 and 1.
const hiddenArgs = [
  [[5], 1],
  [[0, 0, 0, 0], 2],
  [[3, 1, 4, 1, 5, 9, 2, 6], 8],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3],
  [[1, 1, 1, 1000000, 1, 1, 1], 4],
  [[2, 3, 4, 4, 2, 3, 1, 10], 3],
  [randomNums(11, MAX_N, 0, MAX_VALUE), MAX_K],
  [Array(MAX_N).fill(MAX_VALUE), 1],
  [randomNums(13, MAX_N, 0, MAX_VALUE, 0.4), 37],
  [Array.from({ length: MAX_N }, (_, i) => (i % 2 === 0 ? MAX_VALUE : 1)), MAX_K],
];

export const problem = {
  id: 'balanced-cuts',
  title: 'Balanced Cuts',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Binary Search on the Answer', 'Greedy', 'Dynamic Programming'],
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>nums</code> of non-negative integers and an integer
    <code>k</code>. Cut the array into exactly <code>k</code> non-empty parts, each a run of
    neighboring values, so that the part with the largest sum is as light as possible.</p>
    <p>Return that smallest possible largest sum. The sum can exceed the 32-bit range, so the
    result is a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^4',
    '0 <= nums[i] <= 10^6',
    '1 <= k <= min(50, nums.length)',
    'The total can reach 10^10, so the answer needs a 64-bit integer',
    'Target complexity: O(n log(sum)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Instead of searching for the cuts, what if someone handed you a limit L and asked "can every part stay at or below L?"',
    'For a fixed L, how would you walk left to right and decide where each part should end, and how many parts does that need?',
    'If L works, does a larger L also work? What does that say about the set of workable limits?',
    'What are the smallest and the largest values the answer could possibly take?',
    'If the greedy pass uses fewer than k parts, can you always split further without raising the maximum, and what size should your sums be stored in?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Turn the question around. For a limit <code>L</code>, walk left to right and start a new
    part only when adding the next value would pass <code>L</code>. If that takes at most
    <code>k</code> parts, <code>L</code> is enough. The answer is the smallest <code>L</code> that
    is enough, found by binary search between the largest single value and the total.</p>
    <h4>Why it works</h4>
    <p>A bigger limit never needs more parts, so "enough" flips from no to yes exactly once as
    <code>L</code> grows. The greedy pass is optimal for a fixed limit: ending a part as late as
    possible never hurts the rest. If it needs fewer than <code>k</code> parts, cut some part
    further; splitting never raises the maximum, and there are always enough values since
    <code>k</code> is at most the length.</p>
    <h4>Complexity</h4>
    <p>About 34 rounds of binary search (the total is at most 10^10), each a pass over the array:
    O(n log(sum)) time, O(1) extra space. The table that tries every cut position for every part
    count is O(n^2 * k), about 2.5 * 10^9 steps here.</p>
    <h4>Pitfall</h4>
    <p>Cutting whenever a part reaches <code>total / k</code> is not optimal, and neither is
    <code>max(largest value, ceil(total / k))</code>. The total reaches 10^10, so a 32-bit
    accumulator overflows; use a 64-bit type for the sum, the bounds and the midpoint.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'minLargestPart',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'long',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, nums as a JSON array and k as an integer.
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
      return { ok: false, error: 'Both lines must be valid JSON, for example [7,2,5,10,8] and 2.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^4 values.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_VALUE)) return { ok: false, error: 'Every value must be an integer from 0 to 10^6.' };
    if (!Number.isInteger(k) || k < 1 || k > Math.min(MAX_K, nums.length)) return { ok: false, error: 'k must be an integer from 1 to min(50, nums.length).' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Values up to 10^6 and k = 50: the binary search over the total takes about 35 passes of n values.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1e6 }), 50],
  },
};

export default problem;
