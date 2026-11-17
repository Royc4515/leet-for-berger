/**
 * Problem: Zero Triplets
 *
 * Every distinct triple of values that sums to zero. Sorting turns it into "fix one value, then
 * solve a two-sum on the sorted rest with two pointers", O(n^2) instead of O(n^3), and sorting
 * is also what makes skipping duplicates a matter of comparing neighbours.
 *
 * Output order is fixed so judging is exact: each triplet ascending, triplets in lexicographic
 * order. The sorted two-pointer scan produces exactly that order.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: sort, fix the smallest value, close in from both ends; skip repeated values.
 * @param {number[]} nums
 * @returns {number[][]}
 */
export function reference(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < a.length - 2; i++) {
    if (a[i] > 0) break;
    if (i > 0 && a[i] === a[i - 1]) continue;
    let lo = i + 1;
    let hi = a.length - 1;
    while (lo < hi) {
      const sum = a[i] + a[lo] + a[hi];
      if (sum < 0) lo++;
      else if (sum > 0) hi--;
      else {
        out.push([a[i], a[lo], a[hi]]);
        while (lo < hi && a[lo] === a[lo + 1]) lo++;
        while (lo < hi && a[hi] === a[hi - 1]) hi--;
        lo++;
        hi--;
      }
    }
  }
  return out;
}

const MAX_N = 3000;
const MAX_V = 100000;

/** Seeded values in [-range, range]. */
function randomValues(seed, n, range) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Math.floor(rnd() * (2 * range + 1)) - range);
}

const visible = [
  { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]], note: 'Each triplet is ascending; triplets are in lexicographic order.' },
  { args: [[0, 1, 1]], expected: [], note: 'No triple sums to zero.' },
  { args: [[0, 0, 0]], expected: [[0, 0, 0]], note: 'Three zeros.' },
  { args: [[0, 0, 0, 0]], expected: [[0, 0, 0]], note: 'Values used at different positions still form one distinct triplet.' },
  { args: [[2, -2, 1, 0, 1]], expected: [[-2, 0, 2], [-2, 1, 1]], note: 'A value may appear twice in a triplet if it appears twice in the input.' },
];

// Hidden tests: no answer, many duplicates (the classic "same triplet twice" bug), extreme
// values, and two random inputs of 3000 values where trying every triple times out.
const hiddenArgs = [
  [[1, 2, -2, -1]],
  [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]],
  [[3, 0, -2, -1, 1, 2]],
  [[-MAX_V, MAX_V / 2, MAX_V / 2, 0, MAX_V, -MAX_V / 2]],
  [[1, 1, -2, -2, 4, 1]],
  [randomValues(7, 300, 30)],
  [new Array(MAX_N).fill(0)],
  [randomValues(11, MAX_N, MAX_V)],
  [randomValues(13, MAX_N, 50)],
  [randomValues(17, MAX_N, MAX_V)],
];

export const problem = {
  id: 'zero-triplets',
  title: 'Zero Triplets',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Two Pointers', 'Sorting'],
  milestone: 1,
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, find every triplet of values
    <code>[a, b, c]</code> taken from three <em>different positions</em> such that
    <code>a + b + c == 0</code>.</p>
    <p>Report each distinct triplet of values once, even if several choices of positions produce
    it. Write every triplet in ascending order (<code>a &lt;= b &lt;= c</code>) and return the
    list sorted lexicographically: by first value, then second, then third. Return an empty list
    when there is none.</p>
  `,
  constraints: [
    '3 <= nums.length <= 3000',
    '-10^5 <= nums[i] <= 10^5',
    'Triplets ascending; the list in lexicographic order; no duplicates',
    'Target complexity: O(n^2) time (O(n^3) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you fix the first value, what problem is left for the other two?',
    'How would you solve that two-value problem on a sorted array without a hash map?',
    'After sorting, where do equal values sit, and how does that help you avoid reporting a triplet twice?',
    'Once the fixed value is positive, can any later triplet still sum to zero?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'threeSum',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[][]',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [-1,0,1,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 3 || nums.length > MAX_N) return { ok: false, error: 'nums must have 3 to 3000 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V)) return { ok: false, error: 'Values must be integers within +-10^5.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
