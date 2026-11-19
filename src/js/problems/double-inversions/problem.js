/**
 * Problem: Double Inversions
 *
 * Count pairs i < j with nums[i] > 2 * nums[j]. Checking every pair is O(n^2), too slow at
 * 10^5. Merge sort counts them in O(n log n): before merging two sorted halves, one forward
 * sweep with two pointers counts, for each right-half value, the left-half values above twice
 * it. (A Fenwick tree over compressed values works too.)
 *
 * Traps: 2 * nums[j] overflows a 32-bit int (values reach +-(2^31 - 1)), the count overflows a
 * 32-bit int (up to about 5 * 10^9), negative values (2 * -3 = -6 is smaller than -3), and
 * counting during the merge itself with the merge's own comparison instead of a separate pass.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 2147483647;
const MIN_V = -2147483648;

/**
 * Reference: merge sort with a separate counting sweep before each merge.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let a = Float64Array.from(nums);
  let buf = new Float64Array(a.length);
  let count = 0;
  // Bottom-up, so there is no recursion and the halves are always runs of `width`.
  for (let width = 1; width < a.length; width *= 2) {
    for (let lo = 0; lo < a.length; lo += 2 * width) {
      const mid = Math.min(lo + width, a.length);
      const hi = Math.min(lo + 2 * width, a.length);
      let i = lo;
      for (let j = mid; j < hi; j++) {
        while (i < mid && a[i] <= 2 * a[j]) i++;
        count += mid - i;
      }
      let p = lo;
      let q = mid;
      for (let k = lo; k < hi; k++) buf[k] = q >= hi || (p < mid && a[p] <= a[q]) ? a[p++] : a[q++];
    }
    [a, buf] = [buf, a];
  }
  return count;
}

/** Seeded integers in [lo, hi]. */
function randomValues(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[5, 1, 4, 2]], expected: 2, note: 'Pairs (5, 1) and (5, 2) count. (4, 2) does not: 4 is not greater than 2 * 2.' },
  { args: [[1, 2, 3, 4]], expected: 0, note: 'Increasing values never qualify.' },
  { args: [[-5, -3]], expected: 1, note: '-5 > 2 * (-3) = -6, so the pair counts.' },
  { args: [[7]], expected: 0, note: 'One value, no pairs.' },
  { args: [[9, 9, 4, 4, 4]], expected: 6, note: 'Each 9 pairs with each 4: 2 * 3 = 6. Equal values never pair with each other.' },
];

// Hidden tests: values at both 32-bit limits (2 * x overflows), negatives against positives,
// all equal, exact doubles (strict comparison), a small random case, and five inputs of 10^5
// values: full range, a half of huge values before a half of small ones (count above 2^31),
// strictly decreasing, small values with many ties, and negatives only.
const hiddenArgs = [
  [[MAX_V, MAX_V, MAX_V, MIN_V, MIN_V, 1073741823, 1073741824, -1073741824]],
  [[-1, 1, -2, 2, 0, -4, 3, -1]],
  [new Array(50).fill(-7)],
  [[8, 4, 2, 1, 16, 8, 4, 2, 0]],
  [randomValues(7, 200, -50, 50)],
  [randomValues(11, MAX_N, MIN_V, MAX_V)],
  [[...randomValues(13, MAX_N / 2, 1000000000, MAX_V), ...randomValues(14, MAX_N / 2, MIN_V, 499999999)]],
  [Array.from({ length: MAX_N }, (_, i) => MAX_V - i * 42949)],
  [randomValues(17, MAX_N / 2, -20, 20)],
  [randomValues(19, MAX_N / 2, MIN_V, -1)],
];

export const problem = {
  id: 'double-inversions',
  title: 'Double Inversions',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Merge Sort', 'Divide and Conquer', 'Counting Pairs'],
  timeLimitMs: 4000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, a <em>double inversion</em> is a pair of indices
    <code>(i, j)</code> with <code>i &lt; j</code> and <code>nums[i] &gt; 2 * nums[j]</code>.</p>
    <p>Return the number of double inversions.</p>
    <p>Note: <code>2 * nums[j]</code> can exceed the 32-bit range, and so can the count. Return
    it as a 64-bit integer.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-2^31 <= nums[i] <= 2^31 - 1',
    'The answer can exceed 2^31 - 1 (64-bit return)',
    'Target complexity: O(n log n) (O(n^2) times out)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If the left half and the right half were each sorted, how fast could you count the pairs that cross between them?',
    'Which algorithm hands you two sorted halves for free, at every level?',
    'As the right-half value grows, which way does the boundary in the left half move?',
    'What is the largest value 2 * nums[j] can take, and does it fit your integer type?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Merge sort the array and count the pairs that cross the middle at each merge. With both halves
    sorted, the left values above <code>2 * x</code> for a right value <code>x</code> form a suffix of the
    left half, easy to count.</p>
    <h4>Why it works</h4>
    <p>Every pair <code>i &lt; j</code> is split by exactly one merge, where <code>i</code> is in the left
    half and <code>j</code> in the right. Sorting a half does not change which side an index is on, so
    counting cross pairs on the sorted halves is exact. As <code>x</code> grows in the right half, the
    boundary in the left half only moves right, so one two-pointer sweep counts all cross pairs before
    the merge. The Python version finds each boundary with binary search instead.</p>
    <h4>Complexity</h4>
    <p>O(n log n) time with the two-pointer sweep (O(n log^2 n) with binary search), O(n) space. Checking
    every pair is O(n^2), about 5 * 10^9 pairs at n = 10^5.</p>
    <h4>Pitfall</h4>
    <p><code>2 * nums[j]</code> overflows 32 bits for values near 2^31, and the count itself can reach about
    5 * 10^9: use 64-bit arithmetic for both. Negative values need no special case once the doubling is
    exact.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'reversePairs',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'long',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [5,1,4,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= MIN_V && v <= MAX_V)) return { ok: false, error: 'Values must be 32-bit integers, from -2^31 to 2^31 - 1.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
