/**
 * Problem: Gap in Range
 *
 * The array holds n distinct integers taken from 0..n, so exactly one number of that range is
 * absent. Find it. The range has a known sum, and a known xor: subtract what is present (or xor it
 * away) and the absent number is what remains, in O(n) time and O(1) space with no sorting.
 *
 * Limits are raised to 10^5 values so checking every candidate against the whole array (about
 * 10^10 steps) times out. Hidden tests cover the two ends of the range, where off-by-one versions
 * of the sum and the xor go wrong.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;

/**
 * Reference: the expected sum of 0..n minus the actual sum.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const n = nums.length;
  let total = (n * (n + 1)) / 2;
  for (const v of nums) total -= v;
  return total;
}

/** The numbers 0..n in a seeded shuffled order, without `missing`. */
function without(seed, n, missing, order = 'shuffled') {
  const nums = [];
  for (let v = 0; v <= n; v++) if (v !== missing) nums.push(v);
  if (order === 'ascending') return nums;
  if (order === 'descending') return nums.reverse();
  const rnd = mulberry32(seed);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

const visible = [
  { args: [[3, 0, 1]], expected: 2, note: 'With 3 values the range is 0..3. 2 is the one that is absent.' },
  { args: [[0, 1]], expected: 2, note: 'The absent number can be the top of the range, n itself.' },
  { args: [[1]], expected: 0, note: 'With one value the range is 0..1. 0 is absent.' },
  { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8, note: 'Order does not matter: the range is 0..9 and only 8 is absent.' },
  { args: [[0]], expected: 1, note: 'The smallest array: 0 is there, so 1 is absent.' },
];

// Hidden: both ends of the range at several sizes (a sum or xor over 0..n-1 misses n), the middle,
// and five arrays at 10^5 values: absent at the start, at the end, in the middle (shuffled),
// ascending and descending, where a scan per candidate times out.
const hiddenInputs = [
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  without(5, 20, 7),
  without(7, 50, 50),
  without(9, 50, 0),
  without(11, MAX_N, 0),
  without(13, MAX_N, MAX_N),
  without(17, MAX_N, 54321),
  without(19, MAX_N, 99999, 'ascending'),
  without(23, MAX_N, 2, 'descending'),
];

/** @param {unknown[]} nums */
function isValid(nums) {
  const n = nums.length;
  if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= n)) return false;
  return new Set(nums).size === n;
}

export const problem = {
  id: 'gap-in-range',
  title: 'Gap in Range',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Bit Manipulation (XOR)'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>The array <code>nums</code> has <code>n</code> distinct integers, each in the range
    <code>0</code> to <code>n</code> inclusive. That range holds <code>n + 1</code> numbers, so exactly
    one of them is absent from <code>nums</code>. Return it.</p>
    <p>The array is in no particular order. Do it with a single pass and a constant amount of extra
    memory if you can.</p>
  `,
  constraints: [
    'n == nums.length, 1 <= n <= 10^5',
    '0 <= nums[i] <= n',
    'All values of nums are distinct',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'How many numbers are in the full range 0..n, and how many are in the array?',
    'What could you compute over the whole range, without looking at the array, that you could compare with the array?',
    'If you add up everything the array holds, how does that differ from the sum of the full range?',
    'Can you pair every value with its own number so that all matched pairs cancel? What cancels pairs, and what is left?',
    'Does your approach still work when the absent number is 0, or n itself?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The full range 0 to <code>n</code> has a known sum, <code>n * (n + 1) / 2</code>. The array holds
    the whole range except one number, so subtracting the array's sum from the range's sum leaves exactly
    the absent number. A xor version does the same without any risk of overflow: xor every index
    <code>0..n</code> and every value together, and each present number cancels with itself.</p>
    <h4>Why it works</h4>
    <p>Sum: range sum = array sum + absent number, so the difference is the absent number. Xor: a
    number xored with itself is 0 and xor is order-free, so everything present cancels in pairs and only
    the number that appears once (in the range, but not in the array) survives.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space. Checking each candidate with a scan of the array is O(n^2), about
    10^10 steps at the largest size. Sorting works too, at O(n log n).</p>
    <h4>Pitfall</h4>
    <p>The range has <code>n + 1</code> numbers while the array has <code>n</code>. A sum or xor over
    <code>0..n-1</code> gives the wrong answer when the absent number is <code>n</code>, and a scan that
    looks for the first index where <code>nums[i] != i</code> only makes sense after sorting.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'missingNumber',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((nums) => ({ args: [nums], expected: reference(nums) })),

  /**
   * Custom input: the array as JSON; its values must be distinct and inside 0..n.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the array as JSON, for example [3,0,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'Enter between 1 and 10^5 integers as a JSON array.' };
    }
    if (!isValid(nums)) return { ok: false, error: 'Values must be distinct integers between 0 and the array length.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
