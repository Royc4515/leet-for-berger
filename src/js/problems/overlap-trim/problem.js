/**
 * Problem: Overlap Trim
 *
 * Remove the fewest intervals so the rest never overlap (touching endpoints are fine). Equivalent
 * to keeping the most pairwise-disjoint intervals, and the greedy that does that sorts by END and
 * keeps every interval that starts at or after the last kept end. Sorting by start and keeping
 * the first one is the classic wrong answer: one long interval can block many short ones. An
 * O(n^2) DP over sorted intervals is correct but too slow at n = 10^5.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_ABS = 50000;

/**
 * Reference: sort by end, keep greedily, count the rest.
 * @param {number[][]} intervals
 * @returns {number}
 */
export function reference(intervals) {
  const sorted = intervals.map((r) => r.slice()).sort((a, b) => a[1] - b[1]);
  let kept = 0;
  let lastEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (s >= lastEnd) {
      kept++;
      lastEnd = e;
    }
  }
  return intervals.length - kept;
}

/** n random intervals with start in [-MAX_ABS, MAX_ABS) and length in [1, maxLen]. */
function randomIntervals(seed, n, maxLen) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const s = -MAX_ABS + Math.floor(rnd() * (2 * MAX_ABS));
    const e = Math.min(MAX_ABS, s + 1 + Math.floor(rnd() * maxLen));
    return [s, e];
  });
}

const visible = [
  { args: [[[1, 2], [2, 3], [3, 4], [1, 3]]], expected: 1, note: 'Remove [1, 3]; the rest only touch at endpoints.' },
  { args: [[[1, 2], [1, 2], [1, 2]]], expected: 2, note: 'Identical intervals all overlap; keep one.' },
  { args: [[[1, 2], [2, 3]]], expected: 0, note: 'Sharing the endpoint 2 is not an overlap.' },
  { args: [[[1, 100], [11, 22], [1, 11], [2, 12]]], expected: 2, note: 'Keep [1, 11] and [11, 22]; remove the other two.' },
  { args: [[[0, 5]]], expected: 0, note: 'A single interval never overlaps anything.' },
];

// Hidden tests: one long interval that covers many short ones (defeats "sort by start, keep
// first"), unsorted input, negative coordinates, nested intervals, then 10^5 intervals (random
// short, random long, all identical, and a touching chain) where an O(n^2) DP is too slow.
const hiddenArgs = [
  [[[1, 10], [2, 3], [3, 4], [4, 5]]],
  [[[5, 7], [1, 3], [2, 4], [6, 9], [3, 5]]],
  [[[-50000, 50000], [-3, -1], [-1, 0], [-2, 2]]],
  [[[1, 8], [2, 7], [3, 6], [4, 5]]],
  [randomIntervals(23, 1000, 30)],
  [randomIntervals(29, MAX_N, 5)],
  [randomIntervals(31, MAX_N, 2000)],
  [Array.from({ length: MAX_N }, () => [0, 1])],
  [Array.from({ length: MAX_N }, (_, i) => [i - MAX_ABS, i - MAX_ABS + 1]).reverse()],
  [Array.from({ length: MAX_N }, (_, i) => (i % 2 === 0 ? [-MAX_ABS + (i >> 1), MAX_ABS - (i >> 1)] : [i % 997, i % 997 + 2]))],
];

export const problem = {
  id: 'overlap-trim',
  title: 'Overlap Trim',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Intervals', 'Sorting'],
  timeLimitMs: 3000,
  argNames: ['intervals'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a list of intervals, where <code>intervals[i] = [start, end]</code> and
    <code>start &lt; end</code>. Return the <strong>minimum number</strong> of intervals you must
    delete so that no two of the remaining intervals overlap.</p>
    <p>Two intervals that only share an endpoint, such as <code>[1, 2]</code> and <code>[2, 3]</code>,
    do not overlap. The input is in no particular order.</p>
  `,
  constraints: [
    '1 <= intervals.length <= 10^5',
    'intervals[i].length == 2',
    '-5 * 10^4 <= start < end <= 5 * 10^4',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `intervals = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Deleting the fewest intervals is the same as keeping the most. Which is easier to think about?',
    'If you had to keep exactly one interval first, which one leaves the most room for the others?',
    'Why could sorting by start time and keeping the earliest-starting interval go wrong? Try [[1,10],[2,3],[3,4]].',
    'After sorting by end time, what is the only thing you need to remember about the intervals you kept?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Deleting the fewest intervals is the same as keeping the most that do not overlap. Sort by
    end, then keep every interval that starts at or after the end of the last one kept. The answer
    is the total minus the number kept.</p>
    <h4>Why it works</h4>
    <p>Among intervals that could come first, the one that ends earliest leaves the most room for
    everything after it. Any optimal selection can swap its first interval for that one and stay
    valid, and the same argument repeats on what remains, so the greedy keeps as many as any
    other choice.</p>
    <h4>Complexity</h4>
    <p>O(n log n) time for the sort, then one linear pass. O(n) space for the sorted copy. A DP over
    all earlier compatible intervals is correct but O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Sorting by start and keeping the first interval fails: one long early interval can block many
    short ones. Also compare with <code>&gt;=</code>, since intervals that only touch at an
    endpoint do not overlap.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'eraseOverlapIntervals',
    params: [{ name: 'intervals', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: intervals as a JSON array of [start, end] pairs.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let intervals;
    try {
      intervals = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter intervals as a JSON array, for example [[1,2],[2,3]].' };
    }
    if (!Array.isArray(intervals) || intervals.length < 1 || intervals.length > MAX_N) return { ok: false, error: 'There must be 1 to 10^5 intervals.' };
    const valid = (r) => Array.isArray(r) && r.length === 2 && r.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS) && r[0] < r[1];
    if (!intervals.every(valid)) return { ok: false, error: 'Each interval must be [start, end] with integers in +-5 * 10^4 and start < end.' };
    return { ok: true, args: [intervals] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Random intervals of length 1 to 100 inside the coordinate range, so many overlap and the
  // greedy pass keeps about a fixed share. Trying every subset order or an n x n compatibility
  // table is quadratic or worse.
  growth: {
    target: 'n log n',
    n: 'intervals.length',
    sizes: [4000, 8000, 16000, 32000, 64000],
    input: (n, seed) => [randomIntervals(seed, n, 100)],
  },
};

export default problem;
