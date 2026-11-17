/**
 * Problem: Product Sign
 *
 * The sign of the product of an array, without the product. Multiplying out overflows every
 * fixed-width integer: 32 copies of 2 wrap a 32-bit int to 0 and 64 copies wrap a 64-bit one,
 * and in a double the product saturates to Infinity, where Infinity * 0 is NaN. Only two facts
 * matter: is there a zero, and how many negatives are there.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: 0 on any zero, otherwise the parity of the negative count.
 * @param {number[]} nums
 * @returns {number} 1, -1 or 0
 */
export function reference(nums) {
  let sign = 1;
  for (const v of nums) {
    if (v === 0) return 0;
    if (v < 0) sign = -sign;
  }
  return sign;
}

const MAX_N = 1000;
const MAX_ABS = 100;

/** n seeded non-zero values in [-100, 100]. */
function randomNonZero(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const v = 1 + Math.floor(rnd() * MAX_ABS);
    return rnd() < 0.5 ? -v : v;
  });
}

const visible = [
  { args: [[-1, -2, -3, -4, 3, 2, 1]], expected: 1, note: 'Four negative factors: the product, 144, is positive.' },
  { args: [[1, 5, 0, 2, -3]], expected: 0, note: 'A zero makes the whole product zero.' },
  { args: [[-1, 1, -1, 1, -1]], expected: -1, note: 'Three negative factors: the product is -1.' },
  { args: [[7]], expected: 1, note: 'A single positive value.' },
  { args: [new Array(40).fill(2)], expected: 1, note: 'The product is 2^40. A 32-bit product wraps around to 0 long before the end.' },
];

// Hidden tests: a lone zero and a lone negative, 64 twos (a 64-bit product wraps to 0), 63
// negative twos and a two (wraps with the wrong sign), a zero after the product has overflowed a
// double to Infinity (Infinity * 0 is NaN), and 1000-element arrays at the value bounds.
const hiddenArgs = [
  [[0]],
  [[-100]],
  [new Array(64).fill(2)],
  [[...new Array(63).fill(-2), 2]],
  [[...new Array(999).fill(MAX_ABS), 0]],
  [[...new Array(999).fill(-MAX_ABS), -1]],
  [new Array(MAX_N).fill(-MAX_ABS)],
  [randomNonZero(223, MAX_N)],
  [randomNonZero(227, MAX_N - 1)],
  [[...randomNonZero(229, 500), 0, ...randomNonZero(233, 499)]],
];

export const problem = {
  id: 'product-sign',
  title: 'Product Sign',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Math', 'Counting'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, let <code>product</code> be the product of all
    its values. Return <code>1</code> if <code>product</code> is positive, <code>-1</code> if it
    is negative, and <code>0</code> if it is zero.</p>
    <p>The product of 1000 values of size up to 100 does not fit in any built-in number type, so
    work out its sign without computing it.</p>
  `,
  constraints: [
    '1 <= nums.length <= 1000',
    '-100 <= nums[i] <= 100',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What is the largest product 1000 values of 100 can make? Which type could hold it?',
    'Does the size of a factor ever change the sign of the product?',
    'Which single value decides the answer on its own, wherever it appears?',
    'If there is no such value, what do you need to count?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'productSign',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [-1,-2,3].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 1000 values.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers within +-100.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
