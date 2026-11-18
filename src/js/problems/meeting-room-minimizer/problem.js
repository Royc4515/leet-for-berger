/**
 * Problem: Meeting Room Minimizer
 *
 * The fewest rooms that host every meeting is the largest number of meetings running at the same
 * moment. Sort the start times and the end times separately and sweep: each start takes a room,
 * and every meeting that has already ended by then gives one back. A min-heap of end times works
 * too; both are O(n log n), while counting overlaps for every meeting is O(n^2).
 *
 * Meetings are half-open [start, end): one that ends at t frees its room for one that starts at t.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_N = 100000;
const MAX_V = 1000000000;

/**
 * Reference: sorted starts and ends, two pointers.
 * @param {number[][]} intervals each [start, end), start < end
 * @returns {number}
 */
export function reference(intervals) {
  const starts = intervals.map((r) => r[0]).sort((a, b) => a - b);
  const ends = intervals.map((r) => r[1]).sort((a, b) => a - b);
  let rooms = 0;
  let e = 0;
  for (const s of starts) {
    // `<`: a meeting that ends exactly when this one starts has already left its room, so reuse it.
    if (s < ends[e]) rooms++;
    else e++;
  }
  return rooms;
}

function shuffle(rnd, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomMeetings(seed, n, span, maxLen) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const s = Math.floor(rnd() * span);
    return [s, Math.min(span, s + 1 + Math.floor(rnd() * maxLen))];
  });
}

const visible = [
  { args: [[[0, 30], [5, 10], [15, 20]]], expected: 2, note: '[5,10] and [15,20] can share a room; [0,30] overlaps both.' },
  { args: [[[7, 10], [2, 4]]], expected: 1, note: 'The meetings do not overlap.' },
  { args: [[[1, 5], [5, 10]]], expected: 1, note: 'The first meeting ends exactly when the second starts, so one room is enough.' },
  { args: [[[1, 10], [2, 9], [3, 8]]], expected: 3, note: 'All three are running at time 3.' },
  { args: [[[4, 9]]], expected: 1, note: 'One meeting needs one room.' },
];

// Hidden tests: identical meetings, several meetings ending exactly when others start, a long
// meeting listed last, chains of back-to-back meetings out of order, and 10^5 meetings where
// counting overlaps for every meeting is far too slow.
const hiddenArgs = [
  [[[1, 2], [1, 2], [1, 2]]],
  [[[1, 5], [5, 6], [5, 7], [2, 5]]],
  [[[2, 3], [3, 4], [4, 5], [1, 6]]],
  [[[0, MAX_V]]],
  [[[13, 15], [1, 13], [6, 9], [9, 13]]],
  [randomMeetings(7, 1000, 10000, 500)],
  [Array.from({ length: MAX_N }, () => [0, MAX_V])],
  [shuffle(mulberry32(11), Array.from({ length: MAX_N }, (_, i) => [i, i + 1]))],
  [randomMeetings(13, MAX_N, MAX_V, 100000000)],
  [randomMeetings(17, MAX_N, 1000000, 50)],
];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'meeting-room-minimizer',
  title: 'Meeting Room Minimizer',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Sorting', 'Intervals', 'Sweep Line', 'Heap'],
  timeLimitMs: 3000,
  argNames: ['intervals'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Each element of <code>intervals</code> is a meeting <code>[start, end]</code> that occupies
    a room from time <code>start</code> up to, but not including, time <code>end</code>. A room
    can host only one meeting at a time, and a meeting that ends at time <code>t</code> frees its
    room for a meeting that starts at <code>t</code>.</p>
    <p>Return the smallest number of rooms needed to hold every meeting.</p>
  `,
  constraints: [
    '1 <= intervals.length <= 10^5',
    'intervals[i] = [start, end] with 0 <= start < end <= 10^9',
    'Target complexity: O(n log n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `intervals = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you could watch a clock run from the earliest start to the latest end, when would you need the most rooms?',
    'Does it matter which meeting a start or an end belongs to, or only when they happen?',
    'If you process meetings by start time, what do you need to know about the rooms already in use?',
    'Which structure always tells you the earliest time a busy room becomes free?',
    'When one meeting ends at the exact time another starts, which event should you handle first?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The answer is the largest number of meetings running at the same moment. Which meeting a start or
    an end belongs to does not matter, so sort all start times and all end times separately and sweep
    through the starts with a pointer into the ends.</p>
    <h4>Why it works</h4>
    <p><code>ends[e]</code> is always the earliest time a busy room frees up. For each start
    <code>s</code> in order: if <code>s &lt; ends[e]</code>, every room in use is still busy, so open a new
    one. Otherwise a meeting has already left, so reuse its room and advance <code>e</code>. The room count
    only grows when the overlap reaches a new peak, which is exactly the minimum needed.</p>
    <h4>Complexity</h4>
    <p>O(n log n) time for the two sorts; the sweep itself is O(n). O(n) space for the sorted copies.
    Counting overlaps against every other meeting would be O(n^2).</p>
    <h4>Pitfall</h4>
    <p>Meetings are half-open. A meeting ending at <code>t</code> frees its room for one starting at
    <code>t</code>, so the test must be a strict <code>s &lt; ends[e]</code>; using <code>&lt;=</code>
    counts back-to-back meetings as overlapping. In JavaScript, also sort numerically, not as strings.</p>
  `,

  signature: {
    name: 'minMeetingRooms',
    params: [{ name: 'intervals', type: 'int[][]' }],
    returns: 'int',
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
      return { ok: false, error: 'Enter intervals as a JSON array of pairs, for example [[0,30],[5,10]].' };
    }
    if (!Array.isArray(intervals) || intervals.length < 1 || intervals.length > MAX_N) return { ok: false, error: 'intervals must have 1 to 10^5 entries.' };
    for (const r of intervals) {
      if (!Array.isArray(r) || r.length !== 2 || !isInt(r[0], 0, MAX_V - 1) || !isInt(r[1], r[0] + 1, MAX_V)) {
        return { ok: false, error: 'Each meeting must be [start, end] with 0 <= start < end <= 10^9.' };
      }
    }
    return { ok: true, args: [intervals] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
