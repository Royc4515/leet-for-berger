/**
 * Problem: Best Run Product
 *
 * Largest product of a non-empty contiguous subarray. A negative factor flips the largest product
 * into the smallest and back, so the scan tracks both the max and the min product of a run ending
 * at each index. Zeros reset both. LeetCode keeps every product within 32 bits; here n is 10^5 so
 * the O(n^2) scan is too slow, and products reach 10^15, so the answer is a 64-bit integer.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 10;
// don't touch / every subarray product stays within +-10^15: exact in a double (below 2^53), so JS
// solutions and JSON transport are exact, while a 32-bit int still overflows.
const MAX_PRODUCT = 1e15;

/**
 * Reference: track the largest and smallest product of a run ending at each index.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  let hi = nums[0];
  let lo = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    const a = hi * x;
    const b = lo * x;
    hi = Math.max(x, a, b);
    lo = Math.min(x, a, b);
    best = Math.max(best, hi);
  }
  return best;
}

/**
 * True when every zero-free stretch multiplies to at most MAX_PRODUCT in absolute value, which
 * bounds every subarray product (each nonzero factor has |v| >= 1).
 * @param {number[]} nums
 */
function productsBounded(nums) {
  let p = 1;
  for (const v of nums) {
    p = v === 0 ? 1 : p * Math.abs(v);
    if (p > MAX_PRODUCT) return false;
  }
  return true;
}

/**
 * n values in zero-separated segments of length <= maxSeg. Mostly +-1, with +-2..+-10 added only
 * while the segment's product stays within MAX_PRODUCT.
 */
function randomSegments(seed, n, maxSeg, bigChance) {
  const rnd = mulberry32(seed);
  const out = [];
  while (out.length < n) {
    const len = 1 + Math.floor(rnd() * maxSeg);
    let p = 1;
    for (let k = 0; k < len && out.length < n; k++) {
      const sign = rnd() < 0.5 ? -1 : 1;
      const mag = 2 + Math.floor(rnd() * (MAX_ABS - 1));
      const big = rnd() < bigChance && p * mag <= MAX_PRODUCT;
      if (big) p *= mag;
      out.push(sign * (big ? mag : 1));
    }
    if (out.length < n) out.push(0);
  }
  return out;
}

/** One zero-free stretch of 10^5 ones with a few large and negative factors placed far apart. */
function longStretch() {
  const nums = Array(MAX_N).fill(1);
  const placed = { 0: -10, 9999: 10, 20000: 10, 33333: -1, 50000: 10, 66666: 10, 77777: -7, 88888: 10, 99999: 10 };
  for (const [i, v] of Object.entries(placed)) nums[Number(i)] = v;
  return nums;
}

const visible = [
  { args: [[2, 3, -2, 4]], expected: 6, note: 'The run [2, 3] gives 6.' },
  { args: [[-2, 0, -1]], expected: 0, note: 'The run [0] beats every negative product.' },
  { args: [[-2]], expected: -2, note: 'The run must be non-empty, so the answer can be negative.' },
  { args: [[-2, 3, -4]], expected: 24, note: 'Two negatives cancel: the whole array gives 24.' },
  { args: [[2, -5, -2, -4, 3]], expected: 24, note: 'The run [-2, -4, 3] gives 24.' },
];

// Hidden tests: a lone negative, a lone zero, three negatives (drop one end), zeros splitting the
// best run, a product of 10^15 (overflows 32 bits), random small arrays, then 10^5 elements
// (random segments, all -1, and one long stretch with an odd count of negatives) where O(n^2) is too slow.
const hiddenArgs = [
  [[-1]],
  [[0]],
  [[-2, -3, -4]],
  [[2, -1, 3, 0, -4, -5]],
  [[-3, 0, -2, 0, -1]],
  [Array(15).fill(MAX_ABS)],
  [randomSegments(151, 1000, 12, 0.5)],
  [randomSegments(157, MAX_N, 60, 0.3)],
  [Array(MAX_N).fill(-1)],
  [longStretch()],
];

export const problem = {
  id: 'best-run-product',
  title: 'Best Run Product',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Kadane'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given an integer array <code>nums</code>, find the <strong>non-empty</strong> run of
    consecutive elements whose product is as large as possible, and return that product.</p>
    <p>Products can exceed 32 bits; return the answer as a 64-bit integer. The input guarantees that
    the product of every run stays within <code>10^15</code> in absolute value.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5 (raised from LeetCode\'s 2 * 10^4)',
    '-10 <= nums[i] <= 10',
    'The absolute product of every contiguous subarray is at most 10^15',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For sums, the best run ending at i extends the best run ending at i - 1. Why does that break for products?',
    'Multiplying by a negative number turns the largest product into the smallest. What should you keep besides the maximum?',
    'Given the largest and smallest products of runs ending at i - 1, what are the candidates for runs ending at i?',
    'What does a 0 do to both of them, and does your update already handle it?',
    'Can the answer overflow a 32-bit integer here? What type should hold it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Scan once, tracking both the largest and the smallest product of a run ending at the current
    element. Multiplying by a negative number turns the smallest into the largest, so the minimum is
    worth keeping.</p>
    <h4>Why it works</h4>
    <p>The best run ending at <code>i</code> is either <code>nums[i]</code> alone or
    <code>nums[i]</code> times the best or worst run ending at <code>i - 1</code>. The largest
    product is one of those three candidates, and so is the smallest. Starting fresh with
    <code>nums[i]</code> alone also handles a zero, which resets both values.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space. Trying every run is O(n^2), about 5 * 10^9 products at
    n = 10^5.</p>
    <h4>Pitfall</h4>
    <p>Compute both new values from the old pair. Updating the maximum first and then using it for the
    minimum mixes two steps. Products reach 10^15, so use a 64-bit integer, and start the answer at
    <code>nums[0]</code> since the run is non-empty.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxProduct',
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
      return { ok: false, error: 'Enter nums as a JSON array, for example [2,3,-2,4].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 elements.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers from -10 to 10.' };
    if (!productsBounded(nums)) return { ok: false, error: 'Some run multiplies to more than 10^15 in absolute value.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Values are mostly +-1 with a +-10 opening each zero-separated stretch of 1000, so every subarray product stays far below the 10^15 bound while signs keep flipping.
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [32000, 64000, 128000, 256000, 512000, 1024000, 2048000, 4096000],
    input: (n, seed) => {
      const rng = mulberry32(seed);
      return [Array.from({ length: n }, (_, i) => (i % 1000 === 999 ? 0 : (rng() < 0.5 ? -1 : 1) * (i % 1000 === 0 ? 10 : 1)))];
    },
  },
};

export default problem;
