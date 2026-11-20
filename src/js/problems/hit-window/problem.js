/**
 * Problem: Hit Window (design)
 *
 * Count the hits of the last 5 minutes (300 seconds). Timestamps never go down, so hits arrive
 * already sorted: keep them in an array and binary search for the start of the window, or keep
 * a queue and drop hits as they fall out of it. The classic bugs are an off-by-one at the window
 * edge (a hit at t - 300 no longer counts), losing hits that share a timestamp, a 300-slot ring
 * that does not clear slots left over from long ago, and scanning every stored hit per query:
 * 10^5 hits inside one window queried 10^5 times is 10^10 steps.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const WINDOW = 300;
const MAX_TIME = 2000000000;
const MAX_CALLS = 200000;

/**
 * Reference simulation: every hit timestamp in order, and a binary search for the first hit
 * inside the window (timestamp - 300, timestamp].
 * @param {string[]} ops operation names, ops[0] === 'HitCounter'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const hits = [];
  return ops.map((op, i) => {
    if (op === 'hit') hits.push(args[i][0]);
    if (op !== 'getHits') return null;
    const from = args[i][0] - WINDOW + 1;
    let lo = 0;
    let hi = hits.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (hits[mid] < from) lo = mid + 1;
      else hi = mid;
    }
    return hits.length - lo;
  });
}

/**
 * Seeded session: `calls` operations, a hit with probability `hitRate`, starting at `start` and
 * moving time forward by stepOf(rnd) before each call.
 */
function session(seed, calls, hitRate, start, stepOf) {
  const rnd = mulberry32(seed);
  const ops = ['HitCounter'];
  const args = [[]];
  let now = start;
  for (let k = 0; k < calls; k++) {
    now = Math.min(MAX_TIME, now + stepOf(rnd));
    ops.push(rnd() < hitRate ? 'hit' : 'getHits');
    args.push([now]);
  }
  return [ops, args];
}

/** `hits` hits spread over the first window, then `queries` getHits calls at its last second. */
function crowdedWindow(hits, queries) {
  const ops = ['HitCounter'];
  const args = [[]];
  for (let k = 0; k < hits; k++) {
    ops.push('hit');
    args.push([1 + Math.floor((k * WINDOW) / hits)]);
  }
  for (let k = 0; k < queries; k++) {
    ops.push('getHits');
    args.push([WINDOW]);
  }
  return [ops, args];
}

const visible = [
  {
    args: [
      ['HitCounter', 'hit', 'hit', 'hit', 'getHits', 'hit', 'getHits', 'getHits'],
      [[], [1], [2], [3], [4], [300], [300], [301]],
    ],
    expected: [null, null, null, null, 3, null, 4, 3],
    note: 'At time 300 the window is (0, 300], holding all four hits. At 301 it is (1, 301], so the hit at time 1 has expired.',
  },
  {
    args: [['HitCounter', 'getHits'], [[], [10]]],
    expected: [null, 0],
    note: 'No hits yet.',
  },
  {
    args: [['HitCounter', 'hit', 'hit', 'hit', 'getHits'], [[], [7], [7], [7], [7]]],
    expected: [null, null, null, null, 3],
    note: 'Several hits can share a timestamp; each one counts.',
  },
  {
    args: [['HitCounter', 'hit', 'getHits', 'getHits'], [[], [100], [399], [400]]],
    expected: [null, null, 1, 0],
    note: 'A hit at time t counts up to time t + 299, and no longer at t + 300.',
  },
  {
    args: [['HitCounter', 'hit', 'hit', 'getHits'], [[], [1], [5000], [5000]]],
    expected: [null, null, null, 1],
    note: 'After a long quiet gap only the new hit is in the window.',
  },
];

// Hidden tests: the edge second t + 299 / t + 300 again with a crowd, a ring of 300 slots that
// must clear slots left from an earlier lap, timestamps near 2 * 10^9, random sessions, and at
// max size 10^5 hits inside one window queried 10^5 times (scanning stored hits per query is
// 10^10 steps), 2 * 10^5 mixed calls with slowly moving time, and a session with long jumps.
const hiddenArgs = [
  [['HitCounter', 'hit', 'hit', 'hit', 'getHits', 'getHits'], [[], [1], [1], [2], [300], [301]]],
  [['HitCounter', 'hit', 'getHits', 'hit', 'getHits'], [[], [3], [303], [603], [603]]],
  [['HitCounter', 'hit', 'hit', 'getHits', 'getHits'], [[], [1999999700], [2000000000], [2000000000], [2000000000]]],
  [['HitCounter', 'getHits', 'getHits', 'hit', 'getHits'], [[], [1], [2], [2], [301]]],
  session(3, 400, 0.6, 1, (rnd) => Math.floor(rnd() * 40)),
  session(5, 10000, 0.7, 1, (rnd) => Math.floor(rnd() * 3)),
  crowdedWindow(100000, 100000),
  session(7, MAX_CALLS, 0.5, 1, (rnd) => (rnd() < 0.7 ? 0 : 1)),
  session(11, 20000, 0.6, 1, (rnd) => (rnd() < 0.01 ? Math.floor(rnd() * 100000) : Math.floor(rnd() * 5))),
  session(13, 20000, 0.5, 1, (rnd) => Math.floor(rnd() * 600)),
];

export const problem = {
  id: 'hit-window',
  title: 'Hit Window',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Queue', 'Binary Search'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a counter of hits received in the past 5 minutes (300 seconds). Implement
    <code>HitCounter</code>:</p>
    <ul>
      <li><code>HitCounter()</code> starts with no hits.</li>
      <li><code>hit(timestamp)</code> records one hit at <code>timestamp</code> (in seconds).
      Several hits may share a timestamp.</li>
      <li><code>getHits(timestamp)</code> returns the number of hits in the past 300 seconds,
      that is, hits whose timestamp <code>t</code> satisfies
      <code>timestamp - 300 &lt; t &lt;= timestamp</code>.</li>
    </ul>
    <p>Calls arrive in time order: the timestamps of all calls, <code>hit</code> and
    <code>getHits</code> together, never decrease.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '1 <= timestamp <= 2 * 10^9',
    'Timestamps never decrease across all calls',
    'At most 2 * 10^5 calls to hit and getHits in total',
    'Target complexity: O(log n) per call, or O(1) amortized',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Time never goes backwards here. In what order do the hits arrive, and what does that let you do?',
    'A hit at time t still counts at time t + 299. Does it count at t + 300?',
    'Once a hit is too old for one query, can it ever count again for a later query?',
    'If you keep only 300 counters, one per second modulo 300, how do you know a slot holds hits from this lap and not from an earlier one?',
    'How would your design cope with 100,000 hits inside a single window?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Timestamps never decrease, so appending every hit keeps the list sorted.
    <code>getHits(t)</code> binary searches for the first hit at or after <code>t - 299</code> and
    counts everything from there to the end.</p>
    <h4>Why it works</h4>
    <p>The window is <code>t - 300 &lt; x &lt;= t</code>. No stored hit is later than the current
    call, so only the lower bound matters, and in a sorted list the hits that pass it form a suffix.
    Several hits at one timestamp are simply repeated entries.</p>
    <h4>Complexity</h4>
    <p>O(1) per <code>hit</code> and O(log n) per <code>getHits</code>, O(n) space for the hits.
    Scanning every hit on each query could reach about 10^10 steps with 2 * 10^5 calls.</p>
    <h4>Pitfall</h4>
    <p>The boundary is off by one easily: a hit at <code>t - 300</code> no longer counts, a hit at
    <code>t - 299</code> still does. Searching for the first value <code>&gt;= t - 300</code> counts
    one second too many.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'HitCounter',
    constructor: { params: [] },
    methods: [
      { name: 'hit', params: [{ name: 'timestamp', type: 'int' }], returns: 'void' },
      { name: 'getHits', params: [{ name: 'timestamp', type: 'int' }], returns: 'int' },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops[0] !== 'HitCounter' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "HitCounter" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 2 * 10^5 calls to hit and getHits.' };
    let last = 1;
    for (let i = 1; i < ops.length; i++) {
      if (ops[i] !== 'hit' && ops[i] !== 'getHits') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1 || !Number.isInteger(a[0]) || a[0] < 1 || a[0] > MAX_TIME) {
        return { ok: false, error: `${ops[i]} takes one timestamp from 1 to 2 * 10^9 (call ${i}).` };
      }
      if (a[0] < last) return { ok: false, error: `Call ${i}: timestamps must never decrease.` };
      last = a[0];
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  growth: {
    target: 'n log n',
    n: 'number of calls (half hit, half getHits, time moves forward by 0 to 2 per call)',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const ops = ['HitCounter'];
      const args = [[]];
      let time = 1;
      while (ops.length < n) {
        time += randInt(rnd, 0, 2);
        ops.push(rnd() < 0.5 ? 'hit' : 'getHits');
        args.push([time]);
      }
      return [ops, args];
    },
  },
};

export default problem;
