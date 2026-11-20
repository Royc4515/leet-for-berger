/**
 * Problem: Value Harvest
 *
 * Equivalent to LeetCode 740 (Delete and Earn); statement and tests are written for this project.
 * Taking a value takes every copy of it (a second pick of the same value is always allowed and
 * always worth it), and removes the copies of the two neighbouring values. So only the total per
 * value matters, and "take v or skip it" is the house robber walk along the value line: with
 * total[v] = v * count[v], best[v] = max(best[v - 1], best[v - 2] + total[v]).
 *
 * Classic wrong answers: house robber over the sorted distinct values (treats 1 and 3 as
 * neighbours although nothing is removed between them), house robber over the array positions
 * instead of the totals, the greedy that always harvests the value with the biggest total, and the
 * exponential search that tries every order of picks. Limits are raised from 2 * 10^4 numbers to
 * 10^5 so that search cannot finish; the answer still fits in 32 bits (10^5 * 10^4 = 10^9).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 10000;

/**
 * Reference: house robber along the value line.
 * @param {number[]} nums
 * @returns {number}
 */
export function reference(nums) {
  const total = new Array(MAX_V + 1).fill(0);
  for (const v of nums) total[v] += v;
  let skip = 0; // best over values <= v - 2
  let best = 0; // best over values <= v - 1
  for (let v = 1; v <= MAX_V; v++) {
    const take = skip + total[v];
    skip = best;
    best = Math.max(best, take);
  }
  return best;
}

/** `n` values drawn from the sorted list `pool`, seeded. */
function fromPool(seed, n, pool) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => pool[Math.floor(rnd() * pool.length)]);
}

const visible = [
  { args: [[3, 4, 2]], expected: 6, note: 'Take 2 and 4 (6 points); taking 3 would remove both of them.' },
  { args: [[2, 2, 3, 3, 3, 4]], expected: 9, note: 'All three 3s give 9; taking 2s and 4 gives only 8.' },
  { args: [[2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 3, 3]], expected: 12, note: 'The biggest total (the 2s, 10) is not part of the best answer: 1s plus 3s give 6 + 6.' },
  { args: [[1, 3, 5]], expected: 9, note: 'Values two apart do not remove each other, so all of them can be taken.' },
  { args: [[5, 5, 5, 5]], expected: 20, note: 'Taking a value takes every copy of it.' },
];

// Hidden tests: a single 1, 10^5 copies of 10^4 (the answer 10^9),
// every value from 1 to 10^4 once, small and mid random arrays, uniform random values at full
// size, only odd values (nothing is ever removed), ten copies of each of 10^4 consecutive values,
// three distinct values, and values on a sparse random grid.
const hiddenArgs = (() => {
  const rnd = mulberry32(740);
  const sparse = Array.from({ length: 200 }, () => randInt(rnd, 1, MAX_V)).sort((a, b) => a - b);
  return [
    [[1]],
    [Array(MAX_N).fill(MAX_V)],
    [Array.from({ length: MAX_V }, (_, i) => i + 1)],
    [intArray(15, mulberry32(11), { min: 1, max: 5 })],
    [intArray(2000, mulberry32(13), { min: 1, max: 50 })],
    [intArray(MAX_N, mulberry32(17), { min: 1, max: MAX_V })],
    [fromPool(19, MAX_N, Array.from({ length: MAX_V / 2 }, (_, i) => 2 * i + 1))],
    [Array.from({ length: MAX_N }, (_, i) => (i % MAX_V) + 1)],
    [fromPool(23, MAX_N, [1, 2, 3])],
    [fromPool(29, MAX_N, sparse)],
  ];
})();

export const problem = {
  id: 'value-harvest',
  title: 'Value Harvest',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['Dynamic Programming', 'Take or Skip', 'Counting'],
  timeLimitMs: 3000,
  argNames: ['nums'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an integer array <code>nums</code>. You start with 0 points and may make as many
    moves as you like. In one move you choose a value <code>v</code> that is still in the array and
    <em>take</em> it: you gain <code>v</code> points for every copy of <code>v</code> that is still there,
    and then every copy of <code>v - 1</code> and of <code>v + 1</code> is removed from the array.</p>
    <p>Return the maximum number of points you can gain.</p>
  `,
  constraints: [
    '1 <= nums.length <= 10^5',
    '1 <= nums[i] <= 10^4',
    'The answer fits in a 32-bit signed integer',
    'Target complexity: O(n + max(nums))',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `nums = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you take a value, what happens to the other copies of it? Does it ever pay to leave some behind?',
    'So what single number describes how much a value is worth if you decide to take it?',
    'Which values does taking v block, and which values are unaffected? Where have you seen "take this one or the one next to it, but not both"?',
    'Walk the values in increasing order. What do you need to remember about the two previous values to decide on the current one?',
    'Are values 1 and 3 neighbours if 2 is missing from the array? What should the walk do over a gap?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Taking one copy of a value is never worse than leaving the others: they are removed only by taking a
    neighbouring value, so you may as well take them all. Each value therefore has a fixed worth,
    <code>total[v] = v * count[v]</code>, and a choice conflicts only with the values directly next to it.
    That is the house robber problem along the value line.</p>
    <h4>Why it works</h4>
    <p>Let <code>best[v]</code> be the best score using values up to <code>v</code>. Either skip
    <code>v</code> (<code>best[v - 1]</code>) or take it, which rules out <code>v - 1</code> and leaves
    <code>best[v - 2] + total[v]</code>. Values missing from the array have total 0, so the walk crosses gaps
    for free and never treats 1 and 3 as neighbours.</p>
    <h4>Complexity</h4>
    <p>O(n) to count and O(max value) to walk, with two variables of state. Sorting and walking only the
    distinct values also works, provided a gap of 2 or more resets the conflict.</p>
    <h4>Pitfall</h4>
    <p>Running house robber over the sorted array, or over the distinct values as if they were adjacent,
    ignores gaps and counts. Taking the biggest total first is a greedy that fails: it can cost both
    neighbours that are together worth more. The count can also be large: 10<sup>5</sup> copies of 10<sup>4</sup>
    reach 10<sup>9</sup>.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxPoints',
    params: [{ name: 'nums', type: 'int[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one JSON array of integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let nums;
    try {
      nums = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of integers, e.g. [2,2,3,3,3,4].' };
    }
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > MAX_N) return { ok: false, error: 'nums must have 1 to 10^5 numbers.' };
    if (!nums.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_V)) return { ok: false, error: 'Every number must be an integer from 1 to 10^4.' };
    return { ok: true, args: [nums] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // The value range is capped at 10^4, so the walk over values is a constant and the counting pass
  // over the array is what grows. Sparse totals keep every value in play (no early exit).
  growth: {
    target: 'n',
    n: 'nums.length',
    sizes: [250000, 500000, 1000000, 2000000, 4000000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: MAX_V })],
  },
};

export default problem;
