/**
 * Problem: Equal After Deletes
 *
 * Delete at most k elements of an array, then take the longest contiguous stretch whose values are
 * all equal. How long can it be? Equivalently: find a window in which one value fills all but at
 * most k positions, and report how many positions that value fills.
 *
 * A sliding window answers it in O(n). The window grows one element per step and is allowed to be
 * "bad" (more than k elements that are not its most frequent value) only by sliding forward without
 * growing. The best count of one value ever seen inside the window is the answer, and it never has
 * to be lowered, which is why the window may keep a stale maximum.
 *
 * Limits are raised to 10^5 elements so trying every start and extending it (O(n^2), about 5 * 10^9
 * steps) times out.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;

/**
 * Reference: a window that never shrinks. `best` is the highest count of one value seen in any
 * window so far; when the window needs more than k deletions it slides by one instead of growing.
 * @param {number[]} nums values in 1..nums.length
 * @param {number} k deletions allowed
 * @returns {number}
 */
export function reference(nums, k) {
  const count = new Array(nums.length + 1).fill(0);
  let best = 0;
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    best = Math.max(best, ++count[nums[right]]);
    if (right - left + 1 - best > k) count[nums[left++]]--;
  }
  return best;
}

/** `n` seeded values in 1..maxV. */
function randomValues(seed, n, maxV) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxV));
}

/** Runs of one value (length 1..maxRun), so equal values sit close together but with interruptions. */
function blocks(seed, n, maxRun, maxV) {
  const rnd = mulberry32(seed);
  const out = [];
  while (out.length < n) {
    const v = 1 + Math.floor(rnd() * maxV);
    const len = Math.min(1 + Math.floor(rnd() * maxRun), n - out.length);
    for (let i = 0; i < len; i++) out.push(v);
  }
  return out;
}

const visible = [
  { args: [[2, 2, 1, 2, 3, 2, 1], 2], expected: 4, note: 'Delete the 1 and the 3: the 2s at positions 0, 1, 3 and 5 close up into a stretch of four. Two deletions is the budget.' },
  { args: [[1, 1, 2, 2, 2, 1, 1], 0], expected: 3, note: 'With no deletions it is the longest run of equal values: the three 2s.' },
  { args: [[1], 0], expected: 1, note: 'A single element is already an equal stretch.' },
  { args: [[1, 2, 3, 4, 5], 4], expected: 1, note: 'No value repeats, so deleting cannot make a stretch longer than 1.' },
  { args: [[3, 1, 3, 1, 3, 1, 3], 3], expected: 4, note: 'Delete the three 1s: four 3s. The answer counts the elements that remain, not the 7 positions the window covered.' },
];

// Hidden: one element, all distinct with a huge k, alternating values, a value that is frequent
// overall but spread too thin for k, a stretch that needs exactly k deletions, and five arrays at
// 10^5 elements (two values with k = 0, few values with a small k, runs, k = n, many values with a
// large k) where extending from every start is too slow.
const hiddenInputs = [
  [[1], 1],
  [[5, 4, 3, 2, 1], 5],
  [[1, 2, 1, 2, 1, 2, 1, 2], 4],
  [[1, 1, 2, 3, 4, 5, 6, 7, 8, 1, 1, 9], 2],
  [[2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2], 3],
  [randomValues(61, MAX_N, 2), 0],
  [randomValues(67, MAX_N, 30), 500],
  [blocks(71, MAX_N, 200, MAX_N), 100],
  [randomValues(73, MAX_N, MAX_N), MAX_N],
  [randomValues(79, MAX_N, 1000), 40000],
];

/** @param {unknown} v @param {number} n */
const inRange = (v, n) => Number.isInteger(v) && v >= 1 && v <= n;

export const problem = {
  id: 'equal-after-deletes',
  title: 'Equal After Deletes',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sliding Window', 'Frequency Count'],
  timeLimitMs: 2000,
  argNames: ['nums', 'k'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer array <code>nums</code> and an integer <code>k</code>. You may delete
    at most <code>k</code> elements of <code>nums</code>; the remaining elements close up around the
    gaps.</p>
    <p>Return the length of the longest contiguous stretch of the resulting array in which every
    element is equal. Since <code>nums</code> is never empty, the answer is at least 1.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '1 <= nums[i] <= nums.length',
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
    'Pick one target value. Which elements would you delete to make a stretch of that value as long as possible, and how many deletions would a given stretch cost?',
    'For a stretch of the original array, what does the cost depend on: its length and what else?',
    'A window is affordable when its length minus the count of its most common value is at most k. How would you grow the window and what makes it too expensive?',
    'When the window is too expensive, do you have to remove from the left until it is affordable again, or is it enough to slide it forward?',
    'What exactly should you return: the length of the window, or something else?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Deleting elements to make a stretch equal means choosing a window of the original array and
    deleting everything in it that is not its most common value. That costs
    <code>window length - count of the most common value</code> deletions, so the window is
    affordable when this is at most <code>k</code>. What survives is the count of that value, and
    that is what the question asks for.</p>
    <p>Slide a window with a right edge that moves every step. Keep a count per value and the best count
    seen so far. If the window has become too expensive, move the left edge by one, so the window
    slides instead of growing.</p>
    <h4>Why it works</h4>
    <p>The window never shrinks, so it only grows when a better count appears. The stored best may be
    stale (its value may have left the window), but a stale best only stops the window from growing;
    to grow again, some value must beat it, a real improvement. So the final best is the largest count
    of one value over all affordable windows.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(n) space for the counts (values are at most <code>n</code>, so an array works
    instead of a map). Extending from every start costs O(n^2), about 5 * 10^9 steps at the largest size.</p>
    <h4>Pitfall</h4>
    <p>Returning the window length counts the deleted elements too. Returning the most frequent value's
    total count ignores that the copies are far apart and cost more than <code>k</code> to join.
    Looking only at runs of equal values is the case <code>k = 0</code>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'longestEqualSubarray',
    params: [
      { name: 'nums', type: 'int[]' },
      { name: 'k', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, the array as JSON then k.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter the array as JSON on the first line and k on the second.' };
    let nums;
    try {
      nums = JSON.parse(lines[0]);
    } catch {
      return { ok: false, error: 'The first line is the array as JSON, for example [2,2,1,2,3,2,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'The array has between 1 and 10^5 integers.' };
    }
    if (!nums.every((v) => inRange(v, nums.length))) return { ok: false, error: 'Every value is an integer from 1 to the array length.' };
    if (!/^\d+$/.test(lines[1])) return { ok: false, error: 'k is a non-negative integer.' };
    const k = Number(lines[1]);
    if (k > nums.length) return { ok: false, error: 'k is between 0 and the array length.' };
    return { ok: true, args: [nums, k] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Values from 1..50 (always within 1..n) so counts build up and the window keeps sliding; k = n / 4 lets the window stay large.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: 50 }), n >> 2],
  },
};

export default problem;
