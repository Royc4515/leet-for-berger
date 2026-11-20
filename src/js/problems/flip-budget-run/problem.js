/**
 * Problem: Flip Budget Run
 *
 * The longest stretch of ones in a binary array if at most k zeros may be flipped. Equivalent view:
 * the longest window that contains at most k zeros. A window grows on the right and, whenever it
 * holds more than k zeros, its left edge moves right until it holds k again. With n = 10^5 and a
 * large k, trying every start and extending is about 5 * 10^9 steps.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;

/**
 * Reference: variable-size window with a count of zeros inside it.
 * @param {number[]} nums array of 0 and 1
 * @param {number} k flips allowed
 * @returns {number}
 */
export function reference(nums, k) {
  let left = 0;
  let zeros = 0;
  let best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] === 0) zeros++;
    while (zeros > k) {
      if (nums[left] === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}

/** Seeded 0/1 array of length n where each element is 1 with probability `ones`. */
function randomBits(seed, n, ones) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(rnd() < ones ? 1 : 0);
  return out;
}

const visible = [
  { args: [[1, 0, 1, 1, 0, 1], 1], expected: 4, note: 'Flip the first 0: positions 0 to 3 are 1, 1, 1, 1.' },
  { args: [[0, 0, 0], 0], expected: 0, note: 'No flips and no ones: the best run has length 0.' },
  { args: [[0, 1, 0, 0, 1, 1, 0, 1], 2], expected: 5, note: 'Positions 1 to 5 hold two zeros. Flip them for five ones; either neighbour is a third zero.' },
  { args: [[1, 1, 1], 3], expected: 3, note: 'More flips than zeros: the whole array is already ones.' },
  { args: [[0, 0, 0, 0], 2], expected: 2, note: 'Only two flips are allowed, so only two zeros can join up.' },
];

// Hidden tests: one element, k = 0 with ones separated by zeros, k larger than the number of zeros,
// the best window at the very start and at the very end (off-by-one on the window edges), a window
// that must slide past an early cluster, then max-size inputs: all zeros with k = n / 2, seeded
// bits with a large k, seeded sparse ones with a small k, and all ones.
const hiddenArgs = [
  [[0], 1],
  [[1, 1, 0, 1, 1, 1, 0, 1], 0],
  [[1, 0, 1, 0, 1], 5],
  [[1, 1, 1, 0, 0, 0, 0, 0, 1], 1],
  [[0, 0, 0, 0, 0, 1, 1, 1, 0, 1], 2],
  [[1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1], 3],
  [Array(MAX_N).fill(0), MAX_N / 2],
  [randomBits(51, MAX_N, 0.5), 40000],
  [randomBits(52, MAX_N, 0.2), 5000],
  [Array(MAX_N).fill(1), 0],
];

export const problem = {
  id: 'flip-budget-run',
  title: 'Flip Budget Run',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Two Pointers'],
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a binary array <code>nums</code> and an integer <code>k</code>. You may change
    at most <code>k</code> of the <code>0</code>s into <code>1</code>s.</p>
    <p>Return the length of the longest run of consecutive <code>1</code>s you can have in the array
    after making those changes.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    'nums[i] is 0 or 1',
    '0 <= k <= nums.length',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If a stretch of the array contains exactly k zeros, what is the longest run of ones you can turn it into?',
    'So what are you really searching for: which stretches can be made all ones, and how do you rate them?',
    'When you extend a stretch on the right and it now holds one zero too many, which end do you move and by how much?',
    'Do you have to recount the zeros of the stretch each time, or can you keep a counter as the ends move?',
    'When does the left end stop moving, and does the right end ever move backwards?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Flipping at most <code>k</code> zeros is the same as choosing a window that contains at most
    <code>k</code> zeros: flip all of them and the whole window is ones. So find the longest window
    with at most <code>k</code> zeros. Move the right edge one step at a time and count the zeros
    inside. When the count exceeds <code>k</code>, move the left edge right until it is back to
    <code>k</code>, dropping a zero from the count whenever the edge leaves one.</p>
    <h4>Why it works</h4>
    <p>For each right edge the left edge ends at the smallest start that keeps the window valid, so
    the window ending there is the longest valid one. The left edge only moves forward, because a
    window that was too full stays too full if its left edge moves back. The best length over all
    right edges is the answer.</p>
    <h4>Complexity</h4>
    <p>O(n) time, each edge moves forward at most n times. O(1) space. Trying every start and
    extending until the budget is used is O(n^2), about 5 * 10^9 steps at the limits.</p>
    <h4>Pitfall</h4>
    <p>Shrink with a loop, not a single step: one new zero can be paid for by moving the left edge
    past many ones before it passes a zero. Also handle <code>k = 0</code> (longest run of ones as
    is) and a <code>k</code> that is larger than the number of zeros (the answer is the whole
    array).</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'longestRunWithFlips',
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
   * Custom input: nums as a JSON array on line 1, k on line 2.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter nums on line 1 (a JSON array) and k on line 2.' };
    let nums;
    let k;
    try {
      nums = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array and k as an integer, for example [1,0,1,1,0,1] then 1.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must be an array of 1 to 10^5 values.' };
    if (!nums.every((v) => v === 0 || v === 1)) return { ok: false, error: 'Every value of nums must be 0 or 1.' };
    if (!Number.isInteger(k) || k < 0 || k > nums.length) return { ok: false, error: 'k must be an integer from 0 to nums.length.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Seeded bits with k = n / 10
  // flips: a solution that extends from every start does work proportional to n times the window.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 1 }), Math.floor(n / 10)],
  },
};

export default problem;
