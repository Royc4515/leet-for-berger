/**
 * Problem: Smallest Positive Gap
 *
 * Equivalent to LeetCode 41 (First Missing Positive); statement and tests are written for this
 * project. Find the smallest strictly positive integer (1, 2, 3, ...) that does not appear in an
 * unsorted integer array. Because the answer is always in [1, n + 1], cyclic placement puts every
 * in-range value v into index v - 1 in O(n) time and O(1) extra space, then the first mismatched
 * slot i reveals i + 1.
 *
 * Classic wrong answers: returning 0 when 0 is missing (0 is not positive), returning n instead of
 * n + 1 when all of 1..n are present, infinite swap loops on duplicate values like [1, 1],
 * computing v - 1 before checking v >= 1 (signed 32-bit overflow on INT_MIN), and O(n^2) scans
 * checking each positive candidate across the whole array.
 */

import { mulberry32 } from '../../engine/rng.js';
import { shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MIN_V = -2147483648;
const MAX_V = 2147483647;

/**
 * Reference: hash set of positive values up to n, then scan 1..n+1 (independent of cyclic sort).
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const n = nums.length;
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const v = nums[i];
    if (v >= 1 && v <= n) seen.add(v);
  }
  for (let k = 1; k <= n; k++) {
    if (!seen.has(k)) return k;
  }
  return n + 1;
}

/** Packed array of 1..n with `missing` replaced by 0, shuffled deterministically. */
function shuffledWithGap(seed, n, missing) {
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = i + 1;
  if (missing >= 1 && missing <= n) out[missing - 1] = 0;
  return shuffle(out, mulberry32(seed));
}

/** Seeded mixed array containing negatives, zeros, in-range positives, and large positives. */
function mixedArray(seed, n) {
  const rnd = mulberry32(seed);
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const bucket = rnd();
    if (bucket < 0.15) out[i] = -Math.floor(rnd() * 10000);
    else if (bucket < 0.85) out[i] = 1 + Math.floor(rnd() * Math.floor(n * 0.8));
    else out[i] = n + 1 + Math.floor(rnd() * 100000);
  }
  return out;
}

const visible = [
  { args: [[1, 2, 0]], expected: 3, note: '1 and 2 are present, so the smallest missing positive integer is 3.' },
  { args: [[3, 4, -1, 1]], expected: 2, note: 'Negative numbers do not affect positive integers; 1 is present and 2 is missing.' },
  { args: [[7, 8, 9, 11, 12]], expected: 1, note: '1 is not in the array at all.' },
  { args: [[1]], expected: 2, note: 'When 1..n are all present, the answer is n + 1.' },
  { args: [[2]], expected: 1, note: 'Single element greater than 1 leaves 1 missing.' },
];

// Hidden tests: duplicates (catches infinite swap loop on [1, 1]), INT_MIN and INT_MAX (catches
// v - 1 overflow before bounds check), all non-positive, all > 1, exact 1..n in order and reverse,
// plus max-size 10^5 arrays (reverse 1..n, shuffled with late gap, all ones, mixed seeded).
const hiddenArgs = [
  [[1, 1]],
  [[MIN_V, MAX_V, 1, 2, 3]],
  [[-5, -4, -3, 0]],
  [[2, 3, 4, 5]],
  [[1, 2, 3, 4, 5]],
  [[4, 3, 2, 1]],
  [Array.from({ length: MAX_N }, (_, i) => MAX_N - i)],
  [shuffledWithGap(4101, MAX_N, 65432)],
  [new Array(MAX_N).fill(1)],
  [mixedArray(4102, MAX_N)],
];

export const problem = {
  id: 'smallest-positive-gap',
  title: 'Smallest Positive Gap',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['In-Place Cyclic Sort', 'Array', 'Hash Set'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  statementHtml: `
    <p>Given an unsorted integer array <code>nums</code>, return the smallest <strong>strictly
    positive</strong> integer (<code>1, 2, 3, ...</code>) that does not appear in
    <code>nums</code>.</p>
    <p>Aim for <code>O(n)</code> time and <code>O(1)</code> auxiliary space.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-2^31 <= nums[i] <= 2^31 - 1',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'If the array has n elements, what is the largest possible value the answer can ever be?',
    'Since only values in 1..n matter, where would value v naturally belong if the array were a 1-indexed lookup table?',
    'While nums[i] holds a value v in 1..n that is not yet sitting at index v - 1, what can you swap?',
    'What happens during that while loop if nums contains duplicate values like [1, 1]?',
    'After placing every in-range value in its home slot, how do you read off the answer in one scan?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>An array of length <code>n</code> can hold at most <code>n</code> distinct positive integers,
    so the answer always lies in <code>1..n + 1</code>. Reuse <code>nums</code> itself as an
    in-place index map: place each value <code>v</code> in <code>1..n</code> at index
    <code>v - 1</code> via swaps, then scan from index <code>0</code> and return the first
    <code>i + 1</code> where <code>nums[i] != i + 1</code> (or <code>n + 1</code> if every slot
    matches).</p>
    <h4>Why it works</h4>
    <p>Every swap places at least one value into its final home slot <code>nums[v - 1] = v</code>,
    and a value already in its home slot is never moved again. Therefore the inner while loop
    performs at most <code>n</code> swaps across the entire outer loop.</p>
    <h4>Complexity</h4>
    <p>O(n) time and O(1) extra space. Sorting takes O(n log n) time, and a hash set takes O(n)
    extra space.</p>
    <h4>Pitfall</h4>
    <p>Two subtle bugs: swapping when <code>nums[v - 1] == v</code> causes an infinite loop on
    duplicates like <code>[1, 1]</code>, and computing <code>v - 1</code> before verifying
    <code>1 &lt;= v &lt;= n</code> overflows 32-bit signed integers when <code>v = -2^31</code>.</p>
  `,

  signature: {
    name: 'smallestPositiveGap',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [192000, 384000, 768000, 1536000],
    // Shuffling within 4096-element blocks (16 KB, L1-cache resident) forces full cyclic-placement
    // swaps and a 0.75*n scan (keeping O(n^2) genuinely quadratic) without random DRAM pointer
    // chasing bending linear cyclic sort toward slope 1.5.
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const out = new Array(n).fill(0);
      for (let i = 0; i < n; i++) out[i] = i + 1;
      const missing = Math.floor(n * 0.75);
      out[missing - 1] = 0;
      const block = 4096;
      for (let start = 0; start < n; start += block) {
        const end = Math.min(n, start + block);
        for (let i = end - 1; i > start; i--) {
          const j = start + Math.floor(rnd() * (i - start + 1));
          const tmp = out[i];
          out[i] = out[j];
          out[j] = tmp;
        }
      }
      return [out];
    },
  },

  /**
   * Custom input: nums as a JSON array of 32-bit integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array of integers, for example [3,4,-1,1].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) {
      return { ok: false, error: 'nums must be an array of 1 to 10^5 integers.' };
    }
    if (!nums.every((v) => Number.isInteger(v) && v >= MIN_V && v <= MAX_V)) {
      return { ok: false, error: 'Every value must be a 32-bit signed integer.' };
    }
    return { ok: true, args: [nums] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
