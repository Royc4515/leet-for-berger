/**
 * Problem: Range Groups
 *
 * Equivalent to LeetCode 2580 (Count Ways to Group Overlapping Ranges); statement and tests are
 * written for this project. Ranges that overlap, directly or through a chain, must share a group,
 * so the ranges fall into connected blocks (the merged intervals). Each block independently goes to
 * group 1 or group 2: the answer is 2^blocks modulo 10^9 + 7. Sorting by start and keeping the
 * furthest end seen finds the blocks in O(n log n).
 *
 * Classic wrong answers: letting ranges that only touch (end + 1 = next start) share a block,
 * resetting the end to the latest range instead of the furthest one (a nested range hides the
 * reach of the one around it), computing 2^blocks without the modulus (a double or a 32-bit int
 * overflows at 10^5 blocks), and trying all 2^n assignments.
 */

import { mulberry32 } from '../../engine/rng.js';
import { intervals, shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_V = 1000000000;
const MOD = 1000000007;

/**
 * Reference: count the merged blocks, then 2^blocks by repeated doubling.
 * @param {number[][]} ranges
 * @returns {number}
 */
export function reference(ranges) {
  const sorted = ranges.map((r) => [r[0], r[1]]).sort((a, b) => a[0] - b[0]);
  let blocks = 0;
  let reach = -1;
  for (const [start, end] of sorted) {
    // `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares that integer.
    if (start > reach) blocks++;
    if (end > reach) reach = end;
  }
  let ways = 1;
  for (let i = 0; i < blocks; i++) ways = (ways * 2) % MOD;
  return ways;
}

const visible = [
  { args: [[[6, 10], [5, 15]]], expected: 2, note: 'The two ranges overlap, so they form one block: 2 ways (both in group 1, or both in group 2).' },
  { args: [[[1, 3], [10, 20], [2, 5], [4, 8]]], expected: 4, note: 'Blocks: [1, 3], [2, 5] and [4, 8] chain into one, and [10, 20] stands alone: 2 * 2 ways.' },
  { args: [[[1, 2], [3, 4]]], expected: 4, note: '[1, 2] and [3, 4] share no integer, so they may be split: 4 ways.' },
  { args: [[[2, 2]]], expected: 2, note: 'A single range can go in either group.' },
  { args: [[[1, 5], [5, 9], [9, 13]]], expected: 2, note: 'Ranges that meet at an endpoint overlap, so the whole chain is one block.' },
];

// Hidden tests: the smallest range, the whole value range, identical ranges, a nested range that
// must not shorten the reach of the one around it, small and mid random inputs, 10^5 singleton
// ranges (2^100000 needs the modulus), 10^5 ranges that touch without overlapping, a chain of 10^5
// overlapping ranges (one block), and 10^5 random short ranges over [0, 10^9].
const hiddenArgs = (() => {
  const rnd = mulberry32(2580);
  const singles = shuffle(Array.from({ length: MAX_N }, (_, i) => [2 * i, 2 * i]), rnd);
  const touching = shuffle(Array.from({ length: MAX_N }, (_, i) => [2 * i, 2 * i + 1]), rnd);
  const chain = shuffle(Array.from({ length: MAX_N }, (_, i) => [i, i + 1]), rnd);
  return [
    [[[0, 0]]],
    [[[0, MAX_V], [MAX_V, MAX_V]]],
    [[[4, 9], [4, 9], [4, 9], [4, 9], [4, 9]]],
    [[[1, 10], [2, 3], [5, 6], [11, 12], [14, 15], [13, 13]]],
    [intervals(12, mulberry32(7), { min: 0, max: 60, maxLength: 6 })],
    [intervals(2000, mulberry32(11), { min: 0, max: 100000, maxLength: 100 })],
    [singles],
    [touching],
    [chain],
    [intervals(MAX_N, mulberry32(13), { min: 0, max: MAX_V, maxLength: 20000 })],
  ];
})();

export const problem = {
  id: 'range-groups',
  title: 'Range Groups',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Intervals', 'Sorting', 'Modular Arithmetic'],
  timeLimitMs: 3000,
  argNames: ['ranges'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a 2D integer array <code>ranges</code>, where <code>ranges[i] = [start, end]</code>
    is the set of all integers from <code>start</code> to <code>end</code>, both included. Two ranges
    <em>overlap</em> if some integer belongs to both.</p>
    <p>Split the ranges into two groups, numbered 1 and 2. Either group may be empty, but every range
    must be in exactly one, and two ranges that overlap must be in the same group. Two splits are
    different if some range is in group 1 in one and in group 2 in the other.</p>
    <p>Return the number of different splits, modulo <code>10^9 + 7</code>.</p>
  `,
  constraints: [
    '1 <= ranges.length <= 10^5',
    '0 <= start <= end <= 10^9',
    'Ranges can repeat, nest and touch; the order is arbitrary',
    'Target complexity: O(n log n)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `ranges = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If range A overlaps B and B overlaps C, where must A and C go, even if they do not overlap each other?',
    'So which ranges are forced into one group? What would you call each such cluster?',
    'Once the clusters are fixed, how many choices does each cluster have, and do the clusters affect each other?',
    'How do you find the clusters? What order makes the next range comparable to just one running value?',
    'How big can the answer get with 10^5 clusters? What do you do about it as you multiply?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Overlap is transitive here: if A overlaps B and B overlaps C, all three must share a group. So the
    ranges fall into blocks (the same blocks as in merging intervals), and each block picks group 1 or group 2
    on its own. With <code>b</code> blocks the answer is <code>2<sup>b</sup></code>.</p>
    <h4>Why it works</h4>
    <p>Sort by start and keep the furthest end seen so far. A range whose start is at most that end shares an
    integer with the block being built; one that starts after it cannot touch anything earlier, because every
    earlier range ends at or before the furthest end. That makes the blocks exactly the maximal chains of overlap.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for the sort and O(n) for the scan; the power of two is a short loop or fast exponentiation
    modulo 10<sup>9</sup> + 7.</p>
    <h4>Pitfall</h4>
    <p>The ranges are closed: <code>[1, 5]</code> and <code>[5, 9]</code> overlap, but <code>[1, 2]</code> and
    <code>[3, 4]</code> do not. Keep the maximum end, not the latest end, or a nested range shortens the block. And
    apply the modulus while doubling: 2<sup>100000</sup> does not fit in any number type.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countSplits',
    params: [{ name: 'ranges', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one JSON array of [start, end] pairs.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let ranges;
    try {
      ranges = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of [start, end] pairs, e.g. [[1,3],[2,5]].' };
    }
    if (!Array.isArray(ranges) || ranges.length < 1 || ranges.length > MAX_N) return { ok: false, error: 'ranges must have 1 to 10^5 pairs.' };
    for (const r of ranges) {
      if (!Array.isArray(r) || r.length !== 2 || !r.every(Number.isInteger)) return { ok: false, error: 'Each range must be two integers [start, end].' };
      if (r[0] < 0 || r[1] > MAX_V || r[0] > r[1]) return { ok: false, error: 'Each range needs 0 <= start <= end <= 10^9.' };
    }
    return { ok: true, args: [ranges] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Short ranges spread over the whole value range: most are disjoint, so the sort and the scan both
  // see about n blocks. The shipped JavaScript sorts packed (start, index) numbers instead of the
  // pair objects: a comparator sort over n pairs read steeper than linear from 32000 on, once the
  // pairs outgrew the young generation and the cache (docs/PROBLEM_FORMAT.md).
  growth: {
    target: 'n log n',
    n: 'ranges.length',
    sizes: [4000, 8000, 16000, 32000, 64000, 128000, 256000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      return [shuffle(intervals(n, rnd, { min: 0, max: MAX_V, maxLength: 500, disjoint: true }), rnd)];
    },
  },
};

export default problem;
