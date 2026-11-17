/**
 * Problem: Merge Ranges
 *
 * Collapse overlapping closed intervals. The canonical "sort, then sweep" problem: once ranges are
 * ordered by start, each one either extends the range being built or starts a new one, so a
 * single pass finishes the job. Two classic slips: keeping the later end instead of the larger one
 * (a range can swallow the next), and treating touching ranges like [1,4] and [4,5] as separate.
 *
 * Output order is fixed so judging is exact: merged ranges sorted by start.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: sort by start, then extend or emit.
 * @param {number[][]} intervals each [start, end], start <= end
 * @returns {number[][]}
 */
export function reference(intervals) {
  const sorted = intervals.map(([s, e]) => [s, e]).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function shuffle(rnd, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomIntervals(seed, n, span, maxLen) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const s = Math.floor(rnd() * (span + 1));
    return [s, Math.min(span, s + Math.floor(rnd() * (maxLen + 1)))];
  });
}

/** n disjoint ranges with gaps, shuffled: nothing merges, so the output is as long as the input. */
function disjointShuffled(seed, n) {
  return shuffle(mulberry32(seed), Array.from({ length: n }, (_, i) => [3 * i, 3 * i + 1]));
}

/** Nested ranges, each inside the previous one, shuffled: everything merges into the outermost. */
function nestedShuffled(seed, n) {
  return shuffle(mulberry32(seed), Array.from({ length: n }, (_, i) => [i, 2 * n - i]));
}

const visible = [
  { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]], note: '[1,3] and [2,6] overlap; the others stand alone.' },
  { args: [[[1, 4], [4, 5]]], expected: [[1, 5]], note: 'Ranges that share an endpoint merge.' },
  { args: [[[4, 7], [1, 2]]], expected: [[1, 2], [4, 7]], note: 'The input is not sorted; the output is, by start.' },
  { args: [[[1, 10], [2, 3], [4, 5]]], expected: [[1, 10]], note: 'A long range swallows the ones inside it.' },
  { args: [[[5, 5]]], expected: [[5, 5]], note: 'A range can be a single point.' },
];

// Hidden tests: a point range before the others, a range contained in the previous one (keep the
// larger end), one range covering everything that comes last, zero-length ranges on a boundary,
// duplicates, and 10^5 ranges where merging pair by pair until nothing changes is far too slow.
const hiddenArgs = [
  [[[1, 4], [0, 0]]],
  [[[1, 4], [2, 3]]],
  [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]],
  [[[1, 3], [3, 3], [3, 5], [7, 7]]],
  [[[0, 0], [0, 0], [MAX_V, MAX_V]]],
  [randomIntervals(7, 1000, 5000, 20)],
  [disjointShuffled(11, MAX_N)],
  [randomIntervals(13, MAX_N, MAX_V, 20000)],
  [nestedShuffled(17, MAX_N)],
  [randomIntervals(19, MAX_N, 1000000, 8)],
];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'merge-ranges',
  title: 'Merge Ranges',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Sorting', 'Intervals', 'Sweep'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['intervals'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Each element of <code>intervals</code> is a closed range <code>[start, end]</code> of
    integers, with both ends included. Merge every group of ranges that overlap into a single range
    covering all of them. Two ranges overlap when they share at least one point, so
    <code>[1, 4]</code> and <code>[4, 5]</code> merge into <code>[1, 5]</code>.</p>
    <p>Return the merged ranges, none of which overlap, sorted by their start.</p>
  `,
  constraints: [
    '1 <= intervals.length <= 10^5',
    'intervals[i] = [start, end] with 0 <= start <= end <= 10^9',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `intervals = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If the ranges were already in some order, would it be easier to see which ones overlap? Which order?',
    'After sorting by start, can a range overlap something other than the range you are currently building?',
    'When the next range overlaps the current one, what should the merged end be? Try [1,10] followed by [2,3].',
    'Do [1,4] and [4,5] overlap under the rules here? Does your comparison agree?',
  ],

  signature: {
    name: 'merge',
    params: [{ name: 'intervals', type: 'int[][]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: intervals as a JSON array of [start, end] pairs on one line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let intervals;
    try {
      intervals = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter intervals as a JSON array of pairs, for example [[1,3],[2,6]].' };
    }
    if (!Array.isArray(intervals) || intervals.length < 1 || intervals.length > MAX_N) return { ok: false, error: 'intervals must have 1 to 10^5 entries.' };
    for (const r of intervals) {
      if (!Array.isArray(r) || r.length !== 2 || !isInt(r[0], 0, MAX_V) || !isInt(r[1], r[0], MAX_V)) {
        return { ok: false, error: 'Each interval must be [start, end] with 0 <= start <= end <= 10^9.' };
      }
    }
    return { ok: true, args: [intervals] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
