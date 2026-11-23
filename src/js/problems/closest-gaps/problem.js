/**
 * Problem: Closest Gaps
 *
 * Equivalent to LeetCode 1200 (Minimum Absolute Difference); statement and tests are written for
 * this project. Among distinct integers, the smallest gap between any two of them is always
 * between neighbours in sorted order, so sort, find the smallest neighbour gap, and list every
 * neighbour pair with that gap. The pairs come out in ascending order for free.
 *
 * Classic wrong answers: comparing neighbours in the original order (the closest values need not
 * be next to each other), returning only the first closest pair, starting the running minimum at a
 * sentinel smaller than the largest possible gap (2 * 10^6 here), and returning pairs in the order
 * they were found in an unsorted scan. The O(n^2) scan over every pair times out at 10^5 values.
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt, intArray, shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 1000000;

/**
 * Reference: sort, then two passes over neighbouring values.
 * @param {number[]} arr distinct integers
 * @returns {number[][]} every [a, b] with a < b and b - a minimal, in ascending order
 */
export function reference(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  let best = Infinity;
  for (let i = 1; i < sorted.length; i++) best = Math.min(best, sorted[i] - sorted[i - 1]);
  const out = [];
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] === best) out.push([sorted[i - 1], sorted[i]]);
  return out;
}

/**
 * n distinct values walking up from `start` in steps of `gapLo` to `gapHi`, with one step of
 * `closest` at a random place, then shuffled: the closest pair is unique and hidden in the middle.
 */
function walk(seed, n, { start = -MAX_V, gapLo = 2, gapHi = 3, closest = 1 } = {}) {
  const rnd = mulberry32(seed);
  const special = randInt(rnd, 1, n - 1);
  const out = new Array(n);
  out[0] = start;
  for (let i = 1; i < n; i++) out[i] = out[i - 1] + (i === special ? closest : randInt(rnd, gapLo, gapHi));
  return shuffle(out, rnd);
}

const visible = [
  { args: [[4, 2, 1, 3]], expected: [[1, 2], [2, 3], [3, 4]], note: 'Sorted, the values are 1 2 3 4: every neighbour gap is 1.' },
  { args: [[1, 3, 6, 10, 15]], expected: [[1, 3]], note: 'The smallest gap is 2, between 1 and 3 only.' },
  { args: [[3, 8, -10, 23, 19, -4, -14, 27]], expected: [[-14, -10], [19, 23], [23, 27]], note: 'Three pairs share the smallest gap, 4; list them from the smallest values up.' },
  { args: [[40, 11, 25, 12]], expected: [[11, 12]], note: '11 and 12 are far apart in the input but next to each other once sorted.' },
  { args: [[-1000000, 1000000]], expected: [[-1000000, 1000000]], note: 'With two values the only pair is the answer, even with a gap of 2 * 10^6.' },
];

// Hidden tests: two adjacent values, a descending run (every gap 1), two values almost 2 * 10^6
// apart (larger than a 10^6 sentinel), 10^5 values spread evenly (99999 pairs in the answer), 10^5 shuffled values
// with exactly one gap of 1 hidden in the middle, the same with wider gaps (5 to 9) and a single
// closest gap of 4, 10^5 random distinct values, a small random case, negatives only, and
// values where the closest pair is in the first and last position of the input.
const hiddenArgs = [
  [[5, 6]],
  [Array.from({ length: 50 }, (_, i) => 100 - i)],
  [[999999, -1000000]],
  [Array.from({ length: MAX_N }, (_, i) => -MAX_V + 20 * i)],
  [walk(1200, MAX_N)],
  [walk(1201, MAX_N, { gapLo: 5, gapHi: 9, closest: 4 })],
  [intArray(MAX_N, mulberry32(1202), { min: -MAX_V, max: MAX_V, distinct: true })],
  [intArray(12, mulberry32(1203), { min: -30, max: 30, distinct: true })],
  [intArray(5000, mulberry32(1204), { min: -MAX_V, max: -1, distinct: true })],
  [[500, 10, 90, 300, 175, 501]],
];

export const problem = {
  id: 'closest-gaps',
  title: 'Closest Gaps',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Sorting', 'Neighbour Scan'],
  timeLimitMs: 2000,
  argNames: ['arr'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>arr</code> of <strong>distinct</strong> integers. Find the smallest
    difference between any two of its values, and return every pair <code>[a, b]</code> of values from
    <code>arr</code> with <code>a &lt; b</code> and <code>b - a</code> equal to that smallest difference.</p>
    <p>Return the pairs in ascending order of <code>a</code>.</p>
  `,
  constraints: [
    '2 <= arr.length <= 10^5',
    '-10^6 <= arr[i] <= 10^6',
    'All values in arr are distinct',
    'Target complexity: O(n log n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `arr = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Comparing every value with every other value works. How many comparisons is that for 10^5 values?',
    'If the values were in sorted order, which other values could possibly be closest to a given one?',
    'After sorting, can the smallest difference ever be between two values that are not next to each other? Why not?',
    'How many passes over the sorted array do you need: one to find the smallest gap and one to collect the pairs, or can it be one?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort the values. In sorted order, the closest value to any element is one of its two neighbours, so
    the smallest difference in the whole array is the smallest gap between neighbours. One pass finds that
    gap and a second pass collects every neighbour pair that has it.</p>
    <h4>Why it works</h4>
    <p>If <code>a &lt; b &lt; c</code> are sorted neighbours, then <code>c - a = (c - b) + (b - a)</code>,
    which is larger than either gap on its own. So a pair that skips a value is never the closest one.
    Collecting pairs left to right also gives them in ascending order, as the output requires.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort, plus O(n) for the passes. You can do both passes in one by resetting the list
    whenever a strictly smaller gap appears.</p>
    <h4>Pitfall</h4>
    <p>Neighbours in the input are not neighbours in value, so a scan without sorting misses pairs. The gap can
    be as large as <code>2 * 10<sup>6</sup></code>, so a "smallest so far" that starts at
    <code>10<sup>6</sup></code> is wrong for two values at the ends of the range. Comparing every pair takes
    about 5 * 10<sup>9</sup> steps at the full size.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minimumAbsDifference',
    params: [{ name: 'arr', type: 'int[]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one JSON array of distinct integers.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let arr;
    try {
      arr = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of integers, e.g. [4,2,1,3].' };
    }
    if (!Array.isArray(arr) || arr.length < 2 || arr.length > MAX_N) return { ok: false, error: 'arr must have 2 to 10^5 numbers.' };
    if (!arr.every((v) => Number.isInteger(v) && v >= -MAX_V && v <= MAX_V)) return { ok: false, error: 'Every number must be an integer from -10^6 to 10^6.' };
    if (new Set(arr).size !== arr.length) return { ok: false, error: 'The values must be distinct.' };
    return { ok: true, args: [arr] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // The closest pair is unique and lands at a random place once shuffled, so the answer is one pair
  // (no output-bound timing) and nothing can stop early: every gap has to be seen. Values walk up by
  // 2 or 3, which keeps 4 * 10^5 values inside the 10^6 range.
  growth: {
    target: 'n log n',
    n: 'arr.length',
    sizes: [25000, 50000, 100000, 200000, 400000],
    input: (n, seed) => [walk(seed, n)],
  },
};

export default problem;
