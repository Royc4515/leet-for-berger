/**
 * Problem: Lone Number
 *
 * Every value appears twice except one. A hash set solves it in linear time but linear space;
 * the point here is XOR: x ^ x = 0 and x ^ 0 = x, and XOR does not care about order, so folding
 * the whole array cancels every pair and leaves the lone value in O(1) space.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: XOR of everything.
 * @param {number[]} nums
 * @returns {number} the value that appears once
 */
export function reference(nums) {
  let x = 0;
  for (const v of nums) x ^= v;
  return x;
}

const MAX_N = 29999; // largest odd length within 3 * 10^4
const MAX_ABS = 30000;

/**
 * A seeded shuffled array of `pairs` distinct values each appearing twice plus one lone value.
 * `lone` pins the lone value; `at` pins its final position ('first', 'last' or shuffled).
 */
function pairsWithLone(seed, pairs, { lone, at } = {}) {
  const rnd = mulberry32(seed);
  const used = new Set();
  const draw = () => {
    for (;;) {
      const v = Math.floor(rnd() * (2 * MAX_ABS + 1)) - MAX_ABS;
      if (!used.has(v)) {
        used.add(v);
        return v;
      }
    }
  };
  const single = lone ?? draw();
  used.add(single);
  const nums = [];
  for (let i = 0; i < pairs; i++) {
    const v = draw();
    nums.push(v, v);
  }
  if (!at) nums.push(single);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  if (at === 'first') nums.unshift(single);
  if (at === 'last') nums.push(single);
  return nums;
}

const visible = [
  { args: [[2, 2, 1]], expected: 1, note: 'The 2s pair up; 1 is alone.' },
  { args: [[4, 1, 2, 1, 2]], expected: 4, note: 'Pairs do not have to be next to each other.' },
  { args: [[1]], expected: 1, note: 'A single value is the lone one.' },
  { args: [[-3, 5, -3]], expected: 5, note: 'Negative values pair up the same way.' },
  { args: [[0, 7, 7]], expected: 0, note: 'The lone value can be 0.' },
];

// Hidden tests: a negative lone value, the lone value first or last, extreme values, adjacent
// pairs, and 29999 elements where comparing each value with all others is O(n^2).
const hiddenArgs = [
  [[-30000]],
  [[30000, -30000, -30000]],
  [[9, 9, 8, 8, -1]],
  [[-7, 3, 3, -7, -8]],
  [pairsWithLone(5, 50, { lone: 0, at: 'first' })],
  [pairsWithLone(7, 500, { lone: -29999 })],
  [pairsWithLone(11, (MAX_N - 1) / 2)],
  [pairsWithLone(13, (MAX_N - 1) / 2, { at: 'last' })],
  [pairsWithLone(17, (MAX_N - 1) / 2, { lone: MAX_ABS, at: 'first' })],
  [pairsWithLone(19, 10000, { lone: -1 })],
];

export const problem = {
  id: 'lone-number',
  title: 'Lone Number',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Bit Manipulation', 'XOR'],
  timeLimitMs: 2000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a non-empty array of integers <code>nums</code>. Every value in it occurs
    exactly twice, except for one value that occurs exactly once.</p>
    <p>Return that lone value. Aim for linear time while using only a constant amount of extra
    memory.</p>
  `,
  constraints: [
    '1 <= nums.length <= 3 * 10^4 (the length is odd)',
    '-3 * 10^4 <= nums[i] <= 3 * 10^4',
    'Exactly one value occurs once; every other value occurs exactly twice',
    'Target complexity: O(n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'A set or a counter works. How much extra memory does it use for 3 * 10^4 values?',
    'Is there an operation that turns two equal values into nothing?',
    'What is x XOR x, and what is x XOR 0?',
    'Does the order in which you combine values with XOR change the result?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>XOR every value together. Each value that appears twice cancels itself out, and the lone value is
    all that remains.</p>
    <h4>Why it works</h4>
    <p>XOR has three properties that matter here: <code>x ^ x = 0</code>, <code>x ^ 0 = x</code>, and it is
    commutative and associative. So the order of the array is irrelevant: you can imagine regrouping the
    fold so each pair sits next to the other, every pair becomes <code>0</code>, and the result is
    <code>0 ^ lone = lone</code>. Negative values work too, since XOR acts on their bit patterns the same way.</p>
    <h4>Complexity</h4>
    <p>O(n) time, one pass. O(1) extra space, a single accumulator. A set or a counter is also O(n) time
    but needs O(n) memory, which the statement asks you to avoid.</p>
    <h4>Pitfall</h4>
    <p>Starting the accumulator at the first element and then also folding the whole array from index 0
    counts that element twice and cancels it. Start from <code>0</code>, or skip the first element.</p>
  `,

  signature: {
    name: 'singleNumber',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the array as JSON, for example [4,1,2,1,2].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter nums as a JSON array, for example [4,1,2,1,2].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > 30000) return { ok: false, error: 'nums must have 1 to 3 * 10^4 values.' };
    if (!nums.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS)) return { ok: false, error: 'Values must be integers within +-3 * 10^4.' };
    const freq = new Map();
    for (const v of nums) freq.set(v, (freq.get(v) ?? 0) + 1);
    const counts = [...freq.values()];
    if (counts.filter((c) => c === 1).length !== 1 || !counts.every((c) => c === 1 || c === 2)) {
      return { ok: false, error: 'Exactly one value must occur once and every other value exactly twice.' };
    }
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
