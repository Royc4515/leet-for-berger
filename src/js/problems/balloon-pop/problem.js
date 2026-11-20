/**
 * Problem: Balloon Pop
 *
 * Pop every balloon; popping one earns the product of it and its current neighbors. Interval DP
 * with the key twist of choosing the balloon popped LAST in a range: its neighbors at that
 * moment are the range's fixed borders, so the two sides become independent subproblems.
 * dp[l][r] over open intervals between borders, O(n^3).
 *
 * Classic wrong answers: greedy (pop the smallest first, or the one with the largest product
 * now), choosing the balloon popped FIRST (its neighbors change afterwards, so the subproblems
 * are not independent), and trying every order, which is n!.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 300;
const MAX_V = 100;

/**
 * Reference: dp[l][r] = best total for popping everything strictly between borders l and r.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const v = [1, ...nums, 1];
  const size = v.length;
  const dp = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let gap = 2; gap < size; gap++) {
    for (let l = 0; l + gap < size; l++) {
      const r = l + gap;
      let best = 0;
      for (let k = l + 1; k < r; k++) best = Math.max(best, dp[l][k] + dp[k][r] + v[l] * v[k] * v[r]);
      dp[l][r] = best;
    }
  }
  return dp[0][size - 1];
}

function randomNums(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[3, 1, 5, 8]], expected: 167, note: 'Pop 1, 5, 3, 8: 3*1*5 + 3*5*8 + 1*3*8 + 1*8*1 = 15 + 120 + 24 + 8.' },
  { args: [[1, 5]], expected: 10, note: 'Pop 1 (1*1*5), then 5 (1*5*1).' },
  { args: [[7]], expected: 7, note: 'A lone balloon has the imaginary 1s on both sides.' },
  { args: [[0, 0, 0]], expected: 0, note: 'Every product contains a 0.' },
  { args: [[2, 4, 8, 4, 2]], expected: 182, note: 'Popping the smallest balloon first only collects 88.' },
];

// Hidden tests: zeros that split the row, a greedy trap, a descending row, a valley, then the
// full 300 balloons (random, all 100s) where trying every order is hopeless and only the O(n^3)
// interval DP finishes. Only two cases are at full size: Python needs about half a second each.
const hiddenArgs = [
  [[9, 76, 64, 21]],
  [[5, 0, 5, 0, 5]],
  [[1, 1, 1, 1, 1, 1]],
  [[35, 16, 83, 87, 84, 59, 48, 41]],
  [Array.from({ length: 40 }, (_, i) => 40 - i)],
  [randomNums(197, 120, 0, 9)],
  [randomNums(199, MAX_N, 0, MAX_V)],
  [Array(MAX_N).fill(MAX_V)],
  [Array.from({ length: 200 }, (_, i) => Math.abs(100 - i))],
  [randomNums(211, 150, 1, 3)],
];

export const problem = {
  id: 'balloon-pop',
  title: 'Balloon Pop',
  difficulty: 'Hard',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Interval DP'],
  timeLimitMs: 4000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A row of <code>n</code> balloons is painted with the numbers <code>nums</code>. You pop
    them one at a time, in any order, until none are left. Popping balloon <code>i</code> earns
    <code>left * nums[i] * right</code> coins, where <code>left</code> and <code>right</code> are
    the numbers on the balloons currently next to it. After a pop, its two neighbors become
    adjacent.</p>
    <p>Treat the row as if it had a balloon painted 1 beyond each end; those two are never popped.
    Return the most coins you can collect.</p>
  `,
  constraints: [
    '1 <= nums.length <= 300',
    '0 <= nums[i] <= 100',
    'The answer fits in a 32-bit signed integer (it is at most 300 * 100^3)',
    'Target complexity: O(n^3) time, O(n^2) space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Pick the first balloon to pop. Why are the two sides left over not independent problems?',
    'Now pick the balloon popped last in a range instead. Who are its neighbors at that moment?',
    'With the last balloon fixed, what are the two smaller problems on either side of it?',
    'Describe a subproblem by its two border balloons. In what order must the subproblems be solved?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Pad the row with a <code>1</code> at each end. For two borders <code>i &lt; j</code>, let
    <code>f[i][j]</code> be the most coins from popping every balloon strictly between them. Choose the
    balloon <code>k</code> popped <strong>last</strong> in that range: it earns
    <code>arr[i] * arr[k] * arr[j]</code>, plus <code>f[i][k] + f[k][j]</code>.</p>
    <h4>Why it works</h4>
    <p>While <code>k</code> is still standing, it separates the two sides, so pops on the left never
    see a balloon on the right. When <code>k</code> is finally popped, its neighbors are exactly the
    borders <code>i</code> and <code>j</code>. The two sides are independent subproblems, and trying
    every <code>k</code> covers every order. Fill intervals so that shorter ones are done first.</p>
    <h4>Complexity</h4>
    <p>O(n^3) time: O(n^2) intervals, O(n) choices of <code>k</code> each. O(n^2) space. Trying every
    pop order is O(n!).</p>
    <h4>Pitfall</h4>
    <p>Choosing the balloon popped <em>first</em> does not split the problem, because its neighbors
    change afterwards. Greedy rules such as popping the smallest first also fail.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxCoins',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [3,1,5,8].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 300 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_V)) return { ok: false, error: 'Values must be integers from 0 to 100.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Interval DP over every (i, j) pair with every split point: about n^3 / 6 steps. Values stay in 0..100; the length passes the statement limit of 300 because 300 balloons take only a few milliseconds.
  growth: {
    target: 'n^3',
    n: 'nums.length',
    sizes: [64, 100, 160, 256, 410, 656],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 0, max: 100 })],
  },
};

export default problem;
