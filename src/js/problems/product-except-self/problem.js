/**
 * Problem: Product Except Self
 *
 * For every position, the product of all the other values, without division. The canonical
 * prefix/suffix problem: the answer at i is (product of everything left of i) times (product of
 * everything right of i), and both sides can be accumulated in one sweep each.
 *
 * Division is ruled out because zeros break it: one zero makes every other answer 0, two zeros
 * make every answer 0, and dividing by the zero itself is undefined.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 30;
const INT_MAX = 2147483647;

/**
 * Reference: left products in a first pass, multiplied by right products in a second.
 * @param {number[]} nums
 * @returns {number[]}
 */
export function reference(nums) {
  const n = nums.length;
  const out = new Array(n);
  let left = 1;
  for (let i = 0; i < n; i++) {
    out[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    // `|| 0` folds -0 (a zero times a negative) into 0 so outputs print the same in every language.
    out[i] = out[i] * right || 0;
    right *= nums[i];
  }
  return out;
}

/** Product of the absolute values of the non-zero entries; the guarantee that keeps answers in 32 bits. */
function nonZeroMagnitude(nums) {
  let p = 1;
  for (const v of nums) {
    if (v === 0) continue;
    p *= Math.abs(v);
    if (p > INT_MAX) return Infinity;
  }
  return p;
}

/**
 * Mostly +1 / -1 with as many larger factors as the 32-bit budget allows, plus `zeros` zeros.
 * Large arrays of random values in [-30, 30] would overflow immediately, so the big factors are rationed.
 */
function boundedArray(seed, n, zeros, bigTries = 60) {
  const rnd = mulberry32(seed);
  const pick = (k) => Math.floor(rnd() * k);
  const a = Array.from({ length: n }, () => (rnd() < 0.5 ? -1 : 1));
  let prod = 1;
  for (let t = 0; t < bigTries; t++) {
    const v = 2 + pick(MAX_ABS - 1);
    if (prod * v > INT_MAX) continue;
    const i = pick(n);
    if (Math.abs(a[i]) !== 1) continue;
    prod *= v;
    a[i] = rnd() < 0.5 ? -v : v;
  }
  for (let z = 0; z < zeros; z++) a[pick(n)] = 0;
  return a;
}

/** 30 factors of 2 (2^30) scattered in a sea of +1 / -1: answers sit right at the 32-bit edge. */
function powerOfTwoEdge(seed, n) {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: n }, () => (rnd() < 0.5 ? -1 : 1));
  for (let k = 0; k < 30; k++) a[Math.floor((k * n) / 30)] = 2;
  return a;
}

const visible = [
  { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6], note: 'Position 0 gets 2 * 3 * 4, position 3 gets 1 * 2 * 3.' },
  { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0], note: 'Only the zero itself sees a non-zero product.' },
  { args: [[2, 3]], expected: [3, 2], note: 'With two values, each answer is the other value.' },
  { args: [[0, 4, 0]], expected: [0, 0, 0], note: 'Two zeros make every answer zero.' },
  { args: [[-2, -2, -2]], expected: [4, 4, 4], note: 'Two negatives multiply to a positive.' },
];

// Hidden tests: two zeros, a single zero at either end, n = 2, alternating signs, answers at the
// edge of 32 bits, and 10^5 values where recomputing each product from scratch is O(n^2).
const hiddenArgs = [
  [[0, 0]],
  [[5, -3]],
  [[1, 0, 3, 0, 5]],
  [[-1, -1, -1, -1, 0]],
  [[0, 2, -3, 4, -5, 6, -7]],
  [boundedArray(7, 1000, 1)],
  [boundedArray(11, MAX_N, 0)],
  [boundedArray(13, MAX_N, 1)],
  [boundedArray(17, MAX_N, 2)],
  [powerOfTwoEdge(19, MAX_N)],
];

export const problem = {
  id: 'product-except-self',
  title: 'Product Except Self',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Prefix Product', 'Prefix Sum'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer array <code>nums</code>. Build an array <code>answer</code> of the
    same length where <code>answer[i]</code> is the product of every element of <code>nums</code>
    except <code>nums[i]</code>.</p>
    <p>Do not use division, and aim for a single linear-time pass (or a constant number of them).
    The inputs are chosen so that every product fits in a 32-bit signed integer.</p>
  `,
  constraints: [
    '2 <= nums.length <= 10^5',
    '-30 <= nums[i] <= 30',
    'The product of all non-zero values of nums fits in a 32-bit signed integer',
    'No division operator',
    'Target complexity: O(n) time',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Why would dividing the total product by nums[i] fail? Try an input with a zero, then one with two.',
    'The product of everything except nums[i] splits into two parts. What are they, relative to i?',
    'Can you compute "the product of everything to the left of i" for every i in one sweep?',
    'Could the output array itself hold the left products, so the right side needs only one running variable?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p><code>answer[i]</code> is the product of everything left of <code>i</code> times the product of
    everything right of <code>i</code>. A left-to-right sweep writes the left products into
    <code>answer</code>, and a right-to-left sweep multiplies in a running right product.</p>
    <h4>Why it works</h4>
    <p>After the first sweep, <code>answer[i]</code> holds <code>nums[0] * ... * nums[i - 1]</code>, or
    <code>1</code> for <code>i = 0</code>. During the second sweep the running variable equals
    <code>nums[i + 1] * ... * nums[n - 1]</code> when it reaches position <code>i</code>. Their product
    leaves out exactly <code>nums[i]</code>, with no division.</p>
    <h4>Complexity</h4>
    <p>O(n) time: two passes. O(1) extra space besides the output array, since the right side needs only
    one variable. Recomputing each product from scratch is O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Dividing the total product by <code>nums[i]</code>. With one zero in the array that gives a
    division by zero at its own position, and with two zeros the total tells you nothing. In JavaScript
    a product of zero and a negative number is <code>-0</code>; the shipped solution normalizes it to
    <code>0</code>.</p>
  `,

  signature: {
    name: 'productExceptSelf',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: nums as a JSON array on one line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [1,2,3,4].' };
    }
    if (!Array.isArray(nums) || nums.length < 2 || nums.length > MAX_N) return { ok: false, error: 'nums must have 2 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers from -30 to 30.' };
    if (nonZeroMagnitude(nums) > INT_MAX) return { ok: false, error: 'The product of the non-zero values must fit in a 32-bit signed integer.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). The problem's own
  // generator keeps every product in 32 bits (mostly +1 / -1); multiplying out every other element
  // for each index is n^2 on any input.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => [boundedArray(seed, n, 0)],
  },
};

export default problem;
