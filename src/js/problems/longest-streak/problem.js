/**
 * Problem: Longest Streak
 *
 * Length of the longest run of consecutive integers hidden in an unsorted array. The canonical
 * hash-set membership problem: O(1) "is x here?" checks, and the trick of only starting a count
 * at the beginning of a run, turn an apparently sort-based problem into O(n).
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: start counting only where x - 1 is absent.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue;
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}

const MAX_N = 100000;

function shuffle(rnd, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One run of `len` consecutive values from `start`, plus scattered fillers, shuffled. */
function runPlusNoise(seed, len, start, noise) {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: len }, (_, i) => start + i);
  for (let i = 0; i < noise; i++) a.push(Math.floor(rnd() * 2e9) - 1e9);
  return shuffle(rnd, a);
}

function randomSpread(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * 2e9) - 1e9);
}

const visible = [
  { args: [[100, 4, 200, 1, 3, 2]], expected: 4, note: '1, 2, 3, 4 form the longest run.' },
  { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9, note: '0 through 8; the repeated 0 does not extend it.' },
  { args: [[]], expected: 0, note: 'No numbers, no run.' },
  { args: [[1, 2, 0, 1]], expected: 3, note: 'Duplicates count once.' },
  { args: [[-2, -1, 5, 0, 1]], expected: 4, note: 'Runs can cross zero.' },
];

// Hidden tests: duplicates, extremes, a run that is the whole input but shuffled, and 10^5
// numbers where walking every run from every element (instead of only from run starts) is O(n^2).
const hiddenArgs = [
  [[7]],
  [[1, 1, 1]],
  [[1000000000, -1000000000, 999999999]],
  [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]],
  [[10, 5, 12, 3, 55, 30, 4, 11, 2]],
  [runPlusNoise(7, 500, -250, 500)],
  [runPlusNoise(11, MAX_N, 1, 0)],
  [randomSpread(13, MAX_N)],
  [runPlusNoise(17, 60000, -30000, 40000)],
  [runPlusNoise(19, 50000, 900000000, 50000)],
];

export const problem = {
  id: 'longest-streak',
  title: 'Longest Streak',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Set', 'Run Starts'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an unsorted array of integers <code>nums</code>, return the length of the longest
    run of consecutive integers that all appear in it (like 4, 5, 6, 7). The values can appear in
    any order and may repeat; a repeated value counts once.</p>
    <p>Aim for linear time.</p>
  `,
  constraints: [
    '0 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Sorting solves it. What does sorting cost, and is there something cheaper than order?',
    'Which question would you like to answer in O(1): "is x in the array"?',
    'If you count a run from every number in it, how much repeated work is there?',
    'How can you tell, with one lookup, that a number is the first of its run?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Put every value in a hash set. A value <code>x</code> starts a run only when
    <code>x - 1</code> is missing; from each start, count upward while <code>x + 1</code>,
    <code>x + 2</code>, ... are in the set, and keep the longest count.</p>
    <h4>Why it works</h4>
    <p>Every run of consecutive integers has exactly one first number, the one whose predecessor is
    absent. Counting only from those starts measures each run once and in full, so the maximum over
    all starts is the longest run. The set also collapses repeated values, which the statement says
    count once.</p>
    <h4>Complexity</h4>
    <p>O(n) time: building the set is O(n), and each value is visited by the inner loop at most once,
    as part of its own run. O(n) space for the set. Sorting first would cost O(n log n).</p>
    <h4>Pitfall</h4>
    <p>Starting a count from every value, not only from run starts. A single run of 10^5 numbers
    then costs about 5 * 10^9 lookups. Also remember the empty array: the answer is <code>0</code>,
    not <code>1</code>.</p>
  `,

  signature: {
    name: 'longestStreak',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [100,4,200,1].' };
    }
    if (!Array.isArray(nums) || nums.length > MAX_N) return { ok: false, error: 'nums must be an array of at most 10^5 numbers.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= 1e9)) return { ok: false, error: 'Values must be integers within +-10^9.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). One run of n
  // consecutive values, shuffled: walking up from every value instead of only from run starts
  // costs n^2 / 2, and a set lookup per value is all the target allows.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
    input: (n, seed) => [runPlusNoise(seed, n, -Math.floor(n / 2), 0)],
  },
};

export default problem;
