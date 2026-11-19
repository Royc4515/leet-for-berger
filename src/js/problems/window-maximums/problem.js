/**
 * Problem: Window Maximums
 *
 * The maximum of every window of k consecutive values. Recomputing each window is O(nk); the
 * monotonic deque keeps, in order, only the indices that can still become a window maximum
 * (each smaller than everything before it), so every index is pushed and popped once: O(n).
 *
 * With n = 10^5 and k = n / 2 the O(nk) scan does about 2.5 * 10^9 comparisons, which the hidden
 * tests use to separate the two.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 10000;

/**
 * Reference: deque of indices whose values strictly decrease from front to back.
 * @param {number[]} nums
 * @param {number} k
 * @returns {number[]}
 */
export function reference(nums, k) {
  const dq = new Array(nums.length);
  let head = 0;
  let tail = 0;
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;
    dq[tail++] = i;
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}

/** Seeded values in [lo, hi]. */
function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7], note: 'Windows [1,3,-1], [3,-1,-3], [-1,-3,5], [-3,5,3], [5,3,6], [3,6,7].' },
  { args: [[1], 1], expected: [1], note: 'One window holding one value.' },
  { args: [[4, 2, 12, 3], 4], expected: [12], note: 'k equals the length: a single window covering everything.' },
  { args: [[9, 8, 7, 6, 5], 2], expected: [9, 8, 7, 6], note: 'Decreasing values: the maximum leaves through the left edge each step.' },
  { args: [[-5, -5, -2, -5], 2], expected: [-5, -2, -2], note: 'Negative values and repeats.' },
];

// Hidden tests: k = 1 (output equals input), repeated maxima that leave one at a time, an old
// maximum that must expire exactly when it leaves, and 10^5 values with k = n / 2 where
// rescanning every window times out.
const hiddenArgs = [
  [[7, 2, 4], 1],
  [[1, 3, 1, 2, 0, 5], 3],
  [[5, 5, 5, 1, 1, 1], 3],
  [[10, 1, 1, 1, 9, 1], 4],
  [[-MAX_V, MAX_V, -MAX_V, MAX_V], 2],
  [randomNums(7, 1000, -50, 50), 17],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - Math.floor(i / 5)), MAX_N / 2],
  [randomNums(11, MAX_N, -MAX_V, MAX_V), MAX_N / 2],
  [Array.from({ length: MAX_N }, (_, i) => (i % 2000) - 1000), 30000],
  [randomNums(13, MAX_N, -MAX_V, MAX_V), MAX_N],
];

export const problem = {
  id: 'window-maximums',
  title: 'Window Maximums',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Monotonic Deque'],
  timeLimitMs: 3000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A window of width <code>k</code> starts over the first <code>k</code> values of the
    integer array <code>nums</code> and slides right one position at a time until it covers the
    last <code>k</code> values.</p>
    <p>Return an array with the largest value inside the window at each position, from left to
    right. There are <code>nums.length - k + 1</code> windows.</p>
  `,
  constraints: [
    '1 <= k <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    'Target complexity: O(n) time (O(n * k) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}, k = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If a value is followed later by a larger one inside the window, can the earlier value ever be a window maximum again?',
    'Which values are worth remembering, and in what order would they sit?',
    'What structure lets you drop candidates from both ends cheaply?',
    'How do you know when the current front candidate has slid out of the window?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep a deque of indices whose values strictly decrease from front to back. Each new value first
    evicts from the back every index whose value is no larger, then joins; the front is the window
    maximum once any index that slid out on the left is dropped.</p>
    <h4>Why it works</h4>
    <p>If an earlier value is no larger than a later one in the same window, the later one outlives it in
    every future window, so the earlier value can never be a maximum again and is safe to discard. What
    remains is decreasing, so the front holds the largest value whose index is still inside the window.
    Indices enter in order, so only the front can fall out of range.</p>
    <h4>Complexity</h4>
    <p>O(n) time: each index is pushed once and popped at most once. O(k) space for the deque, plus the
    output. Rescanning every window is O(n * k), about 2.5 * 10^9 comparisons at <code>n = 10^5</code>
    and <code>k = n / 2</code>.</p>
    <h4>Pitfall</h4>
    <p>Store indices, not values: an index tells you directly when the front has left the window, while a
    value-only deque breaks easily on duplicate values. In JavaScript, popping the front with
    <code>Array.shift</code> is O(n) per call and quietly makes the whole scan quadratic; use a head
    index instead.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxSlidingWindow',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array, then k, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter nums on line 1 and k on line 2.' };
    let nums;
    let k;
    try {
      nums = JSON.parse(lines[0]);
      k = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array and k as an integer, for example [1,3,-1] then 2.' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^4.' };
    if (!Number.isInteger(k) || k < 1 || k > nums.length) return { ok: false, error: 'k must be an integer from 1 to nums.length.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
