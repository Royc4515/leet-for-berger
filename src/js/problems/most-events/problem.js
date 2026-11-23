/**
 * Problem: Most Events
 *
 * Equivalent to LeetCode 1353 (Maximum Number of Events That Can Be Attended); statement and
 * tests are written for this project. Walk the days in order. Each day, every event that starts
 * that day becomes available; among the available events that have not ended, attend the one that
 * ends soonest (a min-heap of end days), because it has the fewest days left to be attended on.
 *
 * Classic wrong answers: classic interval scheduling (sort by end and take an event only if it
 * starts after the last attended one; that treats each event as occupying its whole range, while
 * here it occupies one day), attending each event on its start day if that day is free (a later
 * day may be free), and sorting by start and always attending the earliest-starting event. Trying
 * every free day for every event is O(n * days), too slow at 10^5 events over 10^5 days.
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_DAY = 100000;

/**
 * Reference: union-find over days, events in order of their end day, each on its earliest free
 * day (an exchange argument shows this is optimal, and it is independent of the heap walk).
 * @param {number[][]} events
 * @returns {number}
 */
export function reference(events) {
  const sorted = [...events].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  // nextFree[d] points to the earliest day >= d that is still free (MAX_DAY + 1 = none).
  const nextFree = Int32Array.from({ length: MAX_DAY + 2 }, (_, d) => d);
  const find = (d) => {
    let root = d;
    while (nextFree[root] !== root) root = nextFree[root];
    while (nextFree[d] !== root) {
      const up = nextFree[d];
      nextFree[d] = root;
      d = up;
    }
    return root;
  };
  let attended = 0;
  for (const [start, end] of sorted) {
    const day = find(start);
    if (day <= end) {
      attended++;
      nextFree[day] = day + 1;
    }
  }
  return attended;
}

/** n events with random ranges inside [1, maxDay], seeded. */
function randomEvents(seed, n, { maxDay = MAX_DAY, maxLength = MAX_DAY } = {}) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const start = randInt(rnd, 1, maxDay);
    return [start, Math.min(maxDay, start + randInt(rnd, 0, maxLength - 1))];
  });
}

const visible = [
  { args: [[[1, 2], [2, 3], [3, 4]]], expected: 3, note: 'Attend one event on each of days 1, 2 and 3.' },
  { args: [[[1, 2], [2, 3], [3, 4], [1, 2]]], expected: 4, note: 'The two [1, 2] events take days 1 and 2, then [2, 3] takes day 3 and [3, 4] day 4.' },
  { args: [[[1, 4], [4, 4], [2, 2], [3, 4], [1, 1]]], expected: 4, note: 'Five events but only days 1 to 4: at most four can be attended.' },
  { args: [[[1, 5], [1, 5], [1, 5], [2, 3], [2, 3]]], expected: 5, note: 'Long events overlap the short ones but can wait for the free days 1, 4 and 5.' },
  { args: [[[1, 1], [1, 1], [1, 1]]], expected: 1, note: 'All three events are on day 1 only, and one day fits one event.' },
];

// Hidden tests: one event, 10^5 events covering every day (all of them fit), 10^5 one-day events
// on the same day, a staircase where each event starts the day the previous one ends, events
// nested inside each other, 10^5 random events over 10^5 days, 10^5 short random events, 10^5
// events crowded into the first 1000 days, a case where interval scheduling gets one, and a case
// where the longer of two events starting the same day must wait ([1, 2] next to [1, 1]).
const hiddenArgs = [
  [[[7, 7]]],
  [Array.from({ length: MAX_N }, () => [1, MAX_DAY])],
  [Array.from({ length: MAX_N }, () => [50000, 50000])],
  [Array.from({ length: 1000 }, (_, i) => [i + 1, i + 2])],
  [Array.from({ length: 500 }, (_, i) => [i + 1, 1000 - i])],
  [randomEvents(1353, MAX_N)],
  [randomEvents(1354, MAX_N, { maxLength: 10 })],
  [randomEvents(1355, MAX_N, { maxDay: 1000 })],
  [[[1, 10], [1, 10], [1, 10], [1, 10]]],
  [[[1, 2], [1, 1], [4, 6], [4, 4], [5, 5], [3, 9]]],
];

export const problem = {
  id: 'most-events',
  title: 'Most Events',
  difficulty: 'Medium',
  topics: ['greedy'],
  patterns: ['Greedy', 'Heap', 'Sorting'],
  timeLimitMs: 2000,
  argNames: ['events'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an array <code>events</code>, where <code>events[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>
    means event <code>i</code> runs every day from day <code>start<sub>i</sub></code> to day
    <code>end<sub>i</sub></code>, both included.</p>
    <p>To attend an event you go to it on any <strong>one</strong> day <code>d</code> with
    <code>start<sub>i</sub> &lt;= d &lt;= end<sub>i</sub></code>. You can attend at most one event per day.</p>
    <p>Return the maximum number of events you can attend.</p>
  `,
  constraints: [
    '1 <= events.length <= 10^5',
    'events[i].length == 2',
    '1 <= start_i <= end_i <= 10^5',
    'Target complexity: O(n log n + D), D = the last day',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `events = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'An event needs only one of its days. How is that different from booking a meeting room for the whole range?',
    'Walk the calendar one day at a time. On a given day, which events are you allowed to attend?',
    'If several events are available today, which one is the most urgent to attend now, and why?',
    'What structure gives you the available event that ends soonest, and lets you drop the ones that already ended?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Sort the events by start day and walk the days. On each day, add the end day of every event that starts
    today to a min-heap, drop the ends that are already in the past, and if anything is left, attend the event
    that ends soonest (pop the smallest end).</p>
    <h4>Why it works</h4>
    <p>Among the events you could attend today, the one ending soonest has the fewest chances left. If an optimal
    plan attends a later-ending event today, swapping the two keeps the plan valid: the later-ending event can
    take the day the other one had. So the greedy choice never loses an event.</p>
    <h4>Complexity</h4>
    <p>O(n log n) for sorting and the heap, plus O(D) for the days, where D is the last day. You can skip empty
    stretches by jumping to the next start day when the heap is empty. Another valid approach sorts by end day and
    gives each event its earliest free day, found with union-find.</p>
    <h4>Pitfall</h4>
    <p>This is not interval scheduling: an event takes one day, not its whole range, so taking only
    non-overlapping events undercounts. Attending each event on its start day fails when that day is taken but a
    later one is free.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'maxEvents',
    params: [{ name: 'events', type: 'int[][]' }],
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
    let events;
    try {
      events = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter a JSON array of [start, end] pairs, e.g. [[1,2],[2,3],[3,4]].' };
    }
    if (!Array.isArray(events) || events.length < 1 || events.length > MAX_N) return { ok: false, error: 'events must hold 1 to 10^5 pairs.' };
    const ok = (e) => Array.isArray(e) && e.length === 2 && e.every(Number.isInteger) && e[0] >= 1 && e[0] <= e[1] && e[1] <= MAX_DAY;
    if (!events.every(ok)) return { ok: false, error: 'Each event is [start, end] with 1 <= start <= end <= 10^5.' };
    return { ok: true, args: [events] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Short random events over the whole calendar: the heap stays busy every day and only part of
  // the events fit, so neither the sort nor the heap can stop early. The ladder stops at 64000:
  // sorting pair objects bends upward past it (the same allocation bend as Merge Ranges).
  growth: {
    target: 'n log n',
    n: 'events.length',
    sizes: [2000, 4000, 8000, 16000, 32000, 64000],
    input: (n, seed) => [randomEvents(seed, n, { maxLength: 20 })],
  },
};

export default problem;
