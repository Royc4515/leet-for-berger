/**
 * Problem: Zeros to End
 *
 * Push every zero to the back while the other values keep their order. A read pointer scans
 * everything and a write pointer marks where the next kept value goes: the same compaction move
 * as removing duplicates or filtering in place, done in one pass with no shifting.
 *
 * The classic version rearranges the array in place; here the rearranged array is returned so
 * every language judges the same value.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

/**
 * Reference: compact the non-zero values to the front, then fill the tail with zeros.
 * @param {number[]} nums
 * @returns {number[]}
 */
export function reference(nums) {
  const out = nums.filter((v) => v !== 0);
  while (out.length < nums.length) out.push(0);
  return out;
}

const MAX_N = 100000;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/** Seeded values where each slot is zero with probability `zeroRate`. */
function randomWithZeros(seed, n, zeroRate) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => (rnd() < zeroRate ? 0 : Math.floor(rnd() * 2000001) - 1000000 || 1));
}

const visible = [
  { args: [[0, 4, 0, 2, 9]], expected: [4, 2, 9, 0, 0], note: 'Non-zero values keep their relative order.' },
  { args: [[0]], expected: [0], note: 'A single zero stays where it is.' },
  { args: [[1, 2, 3]], expected: [1, 2, 3], note: 'Nothing to move.' },
  { args: [[0, 0, 1]], expected: [1, 0, 0], note: 'Several zeros in front of one value.' },
  { args: [[-1, 0, -2, 0, 0, 5]], expected: [-1, -2, 5, 0, 0, 0], note: 'Negative values are not zeros.' },
];

// Hidden tests: zero at the end already, all zeros, 32-bit extremes, and three inputs of 10^5
// values where removing each zero by shifting the rest of the array is quadratic.
const hiddenArgs = [
  [[5, 0]],
  [[0, 0, 0, 0]],
  [[INT_MIN, 0, INT_MAX, 0, -1]],
  [[7]],
  [[1, 0, 1, 0, 1, 0]],
  [randomWithZeros(7, 1000, 0.3)],
  [randomWithZeros(11, MAX_N, 0.5)],
  [[...new Array(MAX_N / 2).fill(0), ...Array.from({ length: MAX_N / 2 }, (_, i) => i + 1)]],
  [[...new Array(MAX_N - 1).fill(0), 42]],
  [randomWithZeros(13, MAX_N, 0.02)],
];

export const problem = {
  id: 'zeros-to-end',
  title: 'Zeros to End',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'In-place Compaction'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, move every <code>0</code> to the end of the
    array. All other values must stay in the same order relative to each other.</p>
    <p>Return the rearranged array. Work as if you had to do it in place: one pass, no second
    array of the same size, and no shifting the whole tail for every zero you find.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-2^31 <= nums[i] <= 2^31 - 1',
    'Target complexity: O(n) time, O(1) extra space if done in place',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you deleted each zero and shifted everything after it, how much work could 5 * 10^4 zeros cost?',
    'Where should the first non-zero value end up? And the second?',
    'Could one index read every value while another remembers where the next non-zero value belongs?',
    'Once all non-zero values are placed, what belongs in the remaining slots?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>A read index visits every value while a write index marks where the next non-zero value belongs.
    Each non-zero value is placed at the write slot (swapped there in Python, copied there in
    JavaScript) and the write index steps forward. Everything from the write index onward ends up as
    zeros.</p>
    <h4>Why it works</h4>
    <p>Invariant: the slots before <code>write</code> hold exactly the non-zero values seen so far, in
    their original order, because they are placed in the order they are read. <code>write</code> never
    passes <code>read</code>, so no value is overwritten before it has been read. When the scan ends,
    the number of slots from <code>write</code> to the end equals the number of zeros.</p>
    <h4>Complexity</h4>
    <p>O(n) time: one pass, plus at most one fill pass for the copy version. O(1) extra space. Deleting
    each zero and shifting the tail is O(n^2), billions of moves when half of 10^5 values are zero.</p>
    <h4>Pitfall</h4>
    <p>Removing zeros by shifting, or bubbling each zero to the end with neighbour swaps. Both pass the
    small examples and time out on long inputs with many zeros. Also remember that only <code>0</code>
    moves: negative values stay in place.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'moveZeroes',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [0,1,0,3].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= INT_MIN && v <= INT_MAX)) return { ok: false, error: 'Values must be 32-bit signed integers.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Half the values are zero at random positions, so the write pointer lags the read pointer and the zero fill is long.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      const nums = intArray(n, rng, { min: 1, max: 2147483647 });
      for (let i = 0; i < n; i++) if (rng() < 0.5) nums[i] = 0;
      return [nums];
    },
  },
};

export default problem;
