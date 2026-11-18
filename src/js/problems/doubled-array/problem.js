/**
 * Problem: Doubled Array
 *
 * Return the array followed by a copy of itself. A warm-up in index arithmetic: allocate 2n
 * slots once and fill position i and i + n from nums[i], instead of growing a list while
 * iterating over it (which, in some languages, never terminates or reallocates repeatedly).
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: one allocation of 2n, two writes per element.
 * @param {number[]} nums
 * @returns {number[]}
 */
export function reference(nums) {
  const n = nums.length;
  const out = new Array(2 * n);
  for (let i = 0; i < n; i++) {
    out[i] = nums[i];
    out[i + n] = nums[i];
  }
  return out;
}

const MAX_N = 1000;
const MAX_V = 1000;

/** n seeded values in [1, 1000]. */
function randomValues(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * MAX_V));
}

const visible = [
  { args: [[1, 2, 1]], expected: [1, 2, 1, 1, 2, 1], note: 'The second half repeats the first, in the same order.' },
  { args: [[1, 3, 2, 1]], expected: [1, 3, 2, 1, 1, 3, 2, 1], note: 'Position i and position i + n hold the same value.' },
  { args: [[7]], expected: [7, 7], note: 'A single element appears twice.' },
  { args: [[5, 4, 3, 2, 1]], expected: [5, 4, 3, 2, 1, 5, 4, 3, 2, 1], note: 'Not sorted, not reversed: copied as is.' },
  { args: [[1000, 1]], expected: [1000, 1, 1000, 1], note: 'Values keep their positions.' },
];

// Hidden tests: equal values, two elements, the bounds, and arrays of 1000 values.
const hiddenArgs = [
  [[1]],
  [[2, 2, 2]],
  [[1000, 999]],
  [[3, 1, 4, 1, 5, 9, 2, 6]],
  [randomValues(167, 10)],
  [randomValues(173, 100)],
  [randomValues(179, 999)],
  [randomValues(181, MAX_N)],
  [Array.from({ length: MAX_N }, (_, i) => i + 1)],
  [new Array(MAX_N).fill(MAX_V)],
];

export const problem = {
  id: 'doubled-array',
  title: 'Doubled Array',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Array', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code> of length <code>n</code>, return an array
    <code>ans</code> of length <code>2n</code> where <code>ans[i] == nums[i]</code> and
    <code>ans[i + n] == nums[i]</code> for every <code>0 &lt;= i &lt; n</code>.</p>
    <p>In other words, <code>ans</code> is <code>nums</code> followed by another copy of
    <code>nums</code>.</p>
  `,
  constraints: [
    '1 <= nums.length <= 1000',
    '1 <= nums[i] <= 1000',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How long is the answer, and can you create it at that size from the start?',
    'For an index i in nums, which two positions of the answer receive nums[i]?',
    'If you append to nums while looping over it, when does your loop stop?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'doubleArray',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 1000 values.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 1 to 1000.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
