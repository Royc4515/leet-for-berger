/**
 * Problem: Daily Load Limit
 *
 * Equivalent to LeetCode 1011 (Capacity To Ship Packages Within D Days) with larger limits
 * (n up to 10^5, weights up to 10^4); statement and tests are written for this project. Packages
 * ship in the given order, each day carries consecutive packages up to a weight limit, and the task
 * is the smallest limit that gets everything out in at most `days` days. The check "can limit L do
 * it" is one greedy pass, and it only gets easier as L grows, so the smallest working L is found by
 * binary search between the heaviest package (every package must fit alone) and the total weight
 * (one day is enough).
 *
 * Number ranges: the total is at most 10^5 * 10^4 = 10^9 < 2^31, and a day's load never passes the
 * limit plus one package, so 32-bit integers suffice in every language.
 *
 * Classic wrong answers: the average, ceil(total / days), as the answer (ignores the order and the
 * fact that a day cannot be split), searching upward from the heaviest package one limit at a time
 * (up to 10^9 limits, each an O(n) pass), reordering the packages, and a strict "load < limit"
 * comparison, which wastes capacity exactly equal to the limit.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_W = 10000;

/**
 * Days needed when each day carries at most `limit`, packages in order.
 * @param {number[]} weights
 * @param {number} limit at least the heaviest package
 * @returns {number}
 */
function daysNeeded(weights, limit) {
  let days = 1;
  let load = 0;
  for (const w of weights) {
    if (load + w > limit) {
      days++;
      load = 0;
    }
    load += w;
  }
  return days;
}

/**
 * Reference: binary search on the limit with a greedy feasibility pass.
 * @param {number[]} weights positive package weights, in shipping order
 * @param {number} days
 * @returns {number} the smallest daily limit that ships everything within `days` days
 */
export function reference(weights, days) {
  // don't touch / the lower end is the heaviest package, not 1: a smaller limit cannot carry it at
  // all, and the greedy pass would then count days for a package it can never place.
  let lo = weights.reduce((m, w) => (w > m ? w : m), 0);
  let hi = weights.reduce((s, w) => s + w, 0);
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (daysNeeded(weights, mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** n seeded weights in [lo, hi]. */
function randomWeights(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

const visible = [
  { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], expected: 15, note: 'Days: 1 2 3 4 5 | 6 7 | 8 | 9 | 10, each at most 15.' },
  { args: [[3, 2, 2, 4, 1, 4], 3], expected: 6, note: 'With limit 6 the days are 3 2 (5), 2 4 (6) and 1 4 (5). Limit 5 would need four days.' },
  { args: [[1, 2, 3, 1, 1], 4], expected: 3, note: 'The heaviest package, 3, is the floor: 1 2 | 3 | 1 1 is only three days.' },
  { args: [[5], 1], expected: 5, note: 'One package: the limit is its weight.' },
  { args: [[8, 1, 1, 8], 2], expected: 9, note: 'Limit 9 gives 8 1 | 1 8. Limit 8 needs three days: 8 | 1 1 | 8.' },
];

const wideRandom = randomWeights(53, MAX_N, 1, MAX_W);
const ascending = Array.from({ length: MAX_N }, (_, i) => 1 + (i % MAX_W));

// Hidden tests: one package, two small LeetCode-style cases, ten packages of the maximum weight, a
// seeded mid-size array, and five arrays of 10^5 packages: all of weight 10^4 on one day (the
// total, 10^9, is the largest possible answer), random weights over 1000 days, random weights with
// days = n - 1 (the answer is the heaviest package or the lightest neighbouring pair), an ascending
// pattern over 37 days, and random weights over 2 days.
const hiddenArgs = [
  [[7], 1],
  [[3, 2, 2, 4, 1, 4], 2],
  [[2, 7, 5, 1, 6, 4, 3, 9, 8], 4],
  [Array(10).fill(MAX_W), 4],
  [randomWeights(51, 200, 1, 50), 17],
  [Array(MAX_N).fill(MAX_W), 1],
  [wideRandom, 1000],
  [wideRandom, MAX_N - 1],
  [ascending, 37],
  [randomWeights(55, MAX_N, 1, MAX_W), 2],
];

export const problem = {
  id: 'daily-load-limit',
  title: 'Daily Load Limit',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search', 'Search on Answer', 'Greedy'],
  timeLimitMs: 3000,
  argNames: ['weights', 'days'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A warehouse must ship a line of packages. <code>weights[i]</code> is the weight of the
    <code>i</code>-th package, and the packages are shipped in the given order, so a day carries a run
    of consecutive packages. Every day, the packages loaded must weigh at most a fixed limit, the same
    limit every day. Nothing may be left for after the last day.</p>
    <p>Return the smallest daily limit for which all the packages ship in at most <code>days</code>
    days.</p>
  `,
  constraints: [
    '1 <= days <= weights.length <= 10^5',
    '1 <= weights[i] <= 10^4, so the total is at most 10^9 and fits in a 32-bit integer',
    'Packages are shipped in the given order and a package is never split',
    'Target complexity: O(n log(sum of weights)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `weights = ${JSON.stringify(t.args[0])}, days = ${t.args[1]}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What is the smallest limit that could possibly work at all, and what limit surely works with a single day?',
    'Suppose someone hands you a limit. How would you decide, in one pass, how many days it takes?',
    'If a limit works, does a larger one work too? If a limit fails, what about a smaller one?',
    'Given that, how can you home in on the smallest working limit without trying every one between the two ends?',
    'When you test the middle of your range and it works, which half do you keep, and does the middle itself stay a candidate?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Search on the answer. For a given limit <code>L</code>, a greedy pass counts the days: keep adding
    packages to the day while the load stays within <code>L</code>, and start a new day when the next
    package would overflow it. Starting a new day as late as possible never hurts, so that count is the
    minimum for <code>L</code>. The limit is feasible when the count is at most <code>days</code>.</p>
    <h4>Why it works</h4>
    <p>Feasibility is monotone: if <code>L</code> works, every larger limit works too, because each day
    can carry at least what it did before. So the feasible limits form a suffix of the range, and binary
    search finds its first element. The range starts at the heaviest package (a smaller limit cannot
    carry it) and ends at the total weight (one day is enough).</p>
    <h4>Complexity</h4>
    <p>O(n) per check and about 30 checks for a range up to 10^9, so O(n log(sum)). The total is at most
    10^9, which fits in 32 bits.</p>
    <h4>Pitfall</h4>
    <p>The average, <code>ceil(total / days)</code>, is only a lower bound: packages cannot be split or
    reordered, so for <code>[1, 2, ..., 10]</code> in 5 days it says 11 but the answer is 15. Trying
    every limit from the heaviest package upward is correct but may take up to 10^9 passes. Check the
    boundary too: a load exactly equal to the limit is allowed, so the test for starting a new day is
    "load plus the package is greater than the limit", not "at least".</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'minDailyLimit',
    params: [
      { name: 'weights', type: 'int[]' },
      { name: 'days', type: 'int' },
    ],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, weights as a JSON array and then days.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: weights (a JSON array), then days.' };
    let weights;
    let days;
    try {
      weights = JSON.parse(lines[0]);
      days = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Line 1 must be a JSON array and line 2 an integer.' };
    }
    if (!Array.isArray(weights) || weights.length < 1 || weights.length > MAX_N) return { ok: false, error: 'weights must have 1 to 10^5 values.' };
    if (!weights.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_W)) return { ok: false, error: 'weights values must be integers from 1 to 10^4.' };
    if (!Number.isInteger(days) || days < 1 || days > weights.length) return { ok: false, error: `days must be an integer from 1 to ${weights.length} (the number of packages).` };
    return { ok: true, args: [weights, days] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). Weights 1..1000 (the 30 or so
  // binary-search rounds always run, since the range is the total weight) with one day per 100
  // packages, so every check walks the whole array and about half the days are tight.
  growth: {
    target: 'n',
    n: 'weights.length',
    sizes: [31250, 62500, 125000, 250000, 500000, 1000000, 2000000],
    input: (n, seed) => [intArray(n, mulberry32(seed), { min: 1, max: 1000 }), Math.max(1, Math.floor(n / 100))],
  },
};

export default problem;
