/**
 * Problem: Weighted Draw Lookup
 *
 * Related to LeetCode 528 (Random Pick with Weight); statement and tests are written for this
 * project. The original is randomized and cannot be judged exactly, so this is its deterministic
 * core: the weights lay out consecutive intervals on a line, and a draw d picks the index whose
 * interval contains d. With prefix sums, index i owns [prefix[i - 1], prefix[i]), so the answer is
 * the first index whose prefix sum is strictly greater than d, found by binary search.
 *
 * Number ranges: n <= 10^5 and every weight <= 10^4 keep the total at most 10^9, below 2^31, so a
 * 32-bit prefix sum is safe in every language.
 *
 * Classic wrong answers: a lower bound (first prefix >= d) instead of an upper bound, which
 * misplaces every draw that sits exactly on an interval end, scanning the prefix array for every
 * draw (O(n * q), about 10^10 steps on the max tests), and picking by the draw's position in the
 * weights array instead of by prefix sums.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intArray } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_W = 10000;
const MAX_Q = 100000;

/**
 * Reference: prefix sums and a binary search for the first prefix strictly above the draw.
 * @param {number[]} weights positive integers
 * @param {number[]} draws values in [0, sum(weights))
 * @returns {number[]} the picked index for every draw
 */
export function reference(weights, draws) {
  const prefix = new Array(weights.length);
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    total += weights[i];
    prefix[i] = total;
  }
  return draws.map((d) => {
    let lo = 0;
    let hi = prefix.length - 1;
    // don't touch / "> d", not ">= d": index i owns [prefix[i - 1], prefix[i]), so a draw equal to
    // prefix[i] already belongs to the next index.
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prefix[mid] > d) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  });
}

const sum = (a) => a.reduce((s, v) => s + v, 0);

/** n seeded weights in [lo, hi]. */
function randomWeights(seed, n, lo, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
}

/** q seeded draws in [from, total). */
function randomDraws(seed, q, from, total) {
  const rnd = mulberry32(seed);
  return Array.from({ length: q }, () => from + Math.floor(rnd() * (total - from)));
}

/** Every draw that sits on an interval edge: the first and last value of each interval. */
function edgeDraws(weights) {
  const out = [];
  let start = 0;
  for (const w of weights) {
    out.push(start, start + w - 1);
    start += w;
  }
  return out;
}

const visible = [
  { args: [[1, 3], [0, 1, 2, 3]], expected: [0, 1, 1, 1], note: 'Index 0 owns [0, 1) and index 1 owns [1, 4).' },
  { args: [[5], [0, 4]], expected: [0, 0], note: 'A single index owns every draw.' },
  { args: [[2, 2, 2], [5, 0, 2, 3]], expected: [2, 0, 1, 1], note: 'Intervals are [0, 2), [2, 4), [4, 6). A draw of 2 starts the second one.' },
  { args: [[3, 1, 2], [2, 3, 4, 5]], expected: [0, 1, 2, 2], note: 'Draw 3 is the single value owned by index 1; draw 2 is the last one owned by index 0.' },
  { args: [[1, 1, 1, 1], [3, 3, 0, 2, 1]], expected: [3, 3, 0, 2, 1], note: 'Equal weights: the draw is the index. Repeated draws give the same answer.' },
];

const wideWeights = randomWeights(23, MAX_N, 1, MAX_W);
const heavyTail = [...Array(MAX_N - 1).fill(1), MAX_W];
const allMax = Array(MAX_N).fill(MAX_W);
const smallMix = randomWeights(5, 40, 1, 9);
const midMix = randomWeights(11, 1000, 1, 100);
const tinyWeights = randomWeights(39, MAX_N, 1, 3);

// Hidden tests: one index, every interval edge of a small array and of a seeded small mix, a
// seeded mid-size mix, and five max-size tests (n = q = 10^5). In four of them the draws sit near
// the top of the range, so a linear scan per draw walks nearly the whole array: weights 1..10^4,
// all 10^4 (total exactly 10^9, the largest allowed), a heavy last weight, and weights 1..3 probed
// on interval edges. The fifth spreads the draws over the whole line.
const hiddenArgs = [
  [[7], [0, 6, 3]],
  [[4, 1, 6, 2, 3], edgeDraws([4, 1, 6, 2, 3])],
  [smallMix, edgeDraws(smallMix)],
  [midMix, randomDraws(13, 3000, 0, sum(midMix))],
  [Array(MAX_N).fill(1), Array.from({ length: MAX_Q }, (_, i) => MAX_N - 1 - (i % 5000))],
  [wideWeights, randomDraws(31, MAX_Q, Math.floor(sum(wideWeights) * 0.9), sum(wideWeights))],
  [allMax, randomDraws(33, MAX_Q, 900000000, 1000000000)],
  [heavyTail, randomDraws(35, MAX_Q, MAX_N - 2000, MAX_N - 1 + MAX_W)],
  [wideWeights, randomDraws(37, MAX_Q, 0, sum(wideWeights))],
  [tinyWeights, edgeDraws(tinyWeights).slice(-MAX_Q)],
];

export const problem = {
  id: 'weighted-draw-lookup',
  title: 'Weighted Draw Lookup',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search', 'Prefix Sum'],
  timeLimitMs: 3000,
  argNames: ['weights', 'draws'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Picking an item at random in proportion to its weight has a deterministic core, and that core
    is what you implement here. Lay the weights out on a number line, one after another: index
    <code>0</code> owns the integers <code>[0, weights[0])</code>, index <code>1</code> owns the next
    <code>weights[1]</code> integers, and so on. A random pick would draw an integer uniformly from
    the whole line and report whose interval it landed in; here the draws are given.</p>
    <p>Given the positive integers <code>weights</code> and a list of integers <code>draws</code>, return,
    for every draw <code>d</code>, the index <code>i</code> whose interval contains it, that is,
    <code>prefix[i - 1] &lt;= d &lt; prefix[i]</code>, where <code>prefix[i]</code> is the sum of
    <code>weights[0..i]</code> and <code>prefix[-1] = 0</code>. The answer has one entry per draw, in
    the order of <code>draws</code>.</p>
  `,
  constraints: [
    '1 <= weights.length <= 10^5',
    '1 <= weights[i] <= 10^4, so the total is at most 10^9 and fits in a 32-bit integer',
    '1 <= draws.length <= 10^5',
    '0 <= draws[j] < sum(weights)',
    'Target complexity: O(n + q log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `weights = ${JSON.stringify(t.args[0])}, draws = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which values does index 0 own? Which does index 1 own? Can you write the end of each interval as one running number?',
    'If you know, for every index, where its interval ends, what question do you ask about a draw to find its index?',
    'For one draw, is checking the indices one by one fine? How many draws and indices can there be together?',
    'The interval ends only grow as the index grows. What does that let you do to find the first end above a draw?',
    'A draw exactly equal to an interval end: does it belong to that interval or to the next one? Which comparison does that need?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Build the prefix sums once: <code>prefix[i]</code> is where index <code>i</code>'s interval ends
    (and the next one starts). The picked index for a draw <code>d</code> is the first
    <code>i</code> with <code>prefix[i] &gt; d</code>. The prefix sums are strictly increasing because
    every weight is at least 1, so that index is found by binary search.</p>
    <h4>Why it works</h4>
    <p>Index <code>i</code> owns <code>[prefix[i - 1], prefix[i])</code>. Every earlier prefix is at most
    <code>d</code> (their intervals end before or at <code>d</code>), and <code>prefix[i]</code> is the
    first one past it, so <code>d</code> lies inside interval <code>i</code>. The upper end is
    exclusive, which is why the test is "strictly greater than".</p>
    <h4>Complexity</h4>
    <p>O(n) to build the prefix sums and O(log n) per draw, O(n + q log n) in total. The total weight is
    at most 10^9, so 32-bit sums do not overflow.</p>
    <h4>Pitfall</h4>
    <p>Searching for the first prefix that is <em>at least</em> <code>d</code> is off by one on every draw
    that equals an interval end: with weights <code>[1, 3]</code> the draw 1 belongs to index 1, not
    index 0. Scanning the prefix array for each draw is correct but does up to 10^10 steps at the
    maximum sizes.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'weightedDrawLookup',
    params: [
      { name: 'weights', type: 'int[]' },
      { name: 'draws', type: 'int[]' },
    ],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two lines, weights and then draws, both JSON arrays.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: weights, then draws (both JSON arrays).' };
    let weights;
    let draws;
    try {
      weights = JSON.parse(lines[0]);
      draws = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON arrays of integers.' };
    }
    if (!Array.isArray(weights) || weights.length < 1 || weights.length > MAX_N) return { ok: false, error: 'weights must have 1 to 10^5 values.' };
    if (!weights.every((v) => Number.isInteger(v) && v >= 1 && v <= MAX_W)) return { ok: false, error: 'weights values must be integers from 1 to 10^4.' };
    if (!Array.isArray(draws) || draws.length < 1 || draws.length > MAX_Q) return { ok: false, error: 'draws must have 1 to 10^5 values.' };
    const total = sum(weights);
    if (!draws.every((v) => Number.isInteger(v) && v >= 0 && v < total)) return { ok: false, error: `draws values must be integers from 0 to ${total - 1} (the total weight minus one).` };
    return { ok: true, args: [weights, draws] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). One draw per weight, spread
  // over the whole line, so every search takes about log n steps and the prefix array is read at random.
  growth: {
    target: 'n log n',
    n: 'weights.length (and as many draws)',
    sizes: [31250, 62500, 125000, 250000, 500000, 1000000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const weights = intArray(n, rnd, { min: 1, max: 1000 });
      const total = sum(weights);
      return [weights, Array.from({ length: n }, () => Math.floor(rnd() * total))];
    },
  },
};

export default problem;
