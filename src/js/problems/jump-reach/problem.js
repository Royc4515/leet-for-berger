/**
 * Problem: Jump Reach
 *
 * Each cell says how far you may jump forward from it; decide whether the last index is reachable
 * from index 0. Greedy: keep the farthest index reachable so far, and fail the moment the scan
 * walks past it. Trying every jump length from every cell is O(n * max jump), which explodes once
 * jumps are long; n and the jump values are raised to 10^5 so that it does.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 100000;

/**
 * Reference: farthest-reach scan.
 * @param {number[]} nums
 * @returns {boolean}
 */
export function reference(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** A countdown m, m-1, ..., 1 that ends in a 0 at index m, so every path stalls there. */
function stallAt(m, n) {
  const nums = Array.from({ length: n }, (_, i) => (i < m ? m - i : 1));
  nums[m] = 0;
  return nums;
}

const visible = [
  { args: [[2, 3, 1, 1, 4]], expected: true, note: 'Jump 1 step to index 1, then 3 steps to the last index.' },
  { args: [[3, 2, 1, 0, 4]], expected: false, note: 'Every path lands on index 3, whose value is 0.' },
  { args: [[0]], expected: true, note: 'You already stand on the last index.' },
  { args: [[2, 0, 0]], expected: true, note: 'One jump of length 2 skips both zeros.' },
  { args: [[1, 0, 1, 0]], expected: false, note: 'Index 1 is a dead end and index 2 is out of reach.' },
];

// Hidden tests: a 0 at the start that blocks, a 0 at the end that does not matter, one long jump
// over a field of zeros, a wall right before the end, random sparse jumps, and 10^5-element arrays
// with long jumps where exploring every jump length is far too slow.
const hiddenArgs = [
  [[0, 1]],
  [[1, 1, 0]],
  [[5, 0, 0, 0, 0, 0]],
  [[4, 3, 2, 1, 0, 0]],
  [randomNums(17, 1000, 0, 3)],
  [[MAX_V, ...Array(MAX_N - 1).fill(0)]],
  [stallAt(50000, MAX_N)],
  [[...Array(MAX_N - 2).fill(1), 0, 7]],
  [randomNums(19, MAX_N, 0, MAX_V)],
  [Array.from({ length: MAX_N }, (_, i) => (i % 1000 === 999 ? 0 : 1000))],
];

export const problem = {
  id: 'jump-reach',
  title: 'Jump Reach',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Farthest Reach'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You start on index <code>0</code> of an array <code>nums</code> of non-negative integers.
    From index <code>i</code> you may jump forward by any distance from <code>1</code> up to
    <code>nums[i]</code> (a value of <code>0</code> means you cannot move from there).</p>
    <p>Return <code>true</code> if some sequence of jumps lands exactly on the last index, and
    <code>false</code> otherwise.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 10^4)',
    '0 <= nums[i] <= 10^5',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you can reach index i, which other indices can you certainly reach too?',
    'Could the set of reachable indices ever have a gap in it?',
    'What single number would describe everything you can reach so far?',
    'While scanning left to right, how do you notice that you are standing somewhere you could never have arrived?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'canJump',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'bool',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [2,3,1,1,4].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 10^5.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
