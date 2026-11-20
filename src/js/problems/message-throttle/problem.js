/**
 * Problem: Message Throttle (design)
 *
 * Equivalent to LeetCode 359 with the cooldown as a constructor argument instead of a fixed 10
 * seconds; statement and tests are written for this project. A stream of timestamped messages,
 * each shown at most once per cooldown. Remember for every distinct message the first time it may
 * be shown again (last shown + cooldown). Only a message that is shown moves that time: a refused
 * one must not extend its own ban.
 *
 * Classic wrong answers: refreshing the time on every call, even refused ones (a message sent
 * every few seconds is then never shown again), a strict comparison that bans the message for one
 * second too long (it may be shown again at exactly last + cooldown), one shared cooldown for all
 * messages instead of one per message, fixed time windows that forget everything at once instead
 * of tracking each message, and keeping a log of recent messages and scanning it per call (10^5
 * distinct messages in one second is 5 * 10^9 comparisons).
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_CALLS = 100000;
const MAX_TIME = 1000000000;
const MAX_COOLDOWN = 1000000000;
const MAX_LEN = 30;

/**
 * Reference simulation: the earliest time each message may be shown again.
 * @param {string[]} ops operation names, ops[0] === 'MessageThrottle'
 * @param {(number|string)[][]} args argument list per operation
 * @returns {(boolean|null)[]}
 */
export function reference(ops, args) {
  let cooldown = 0;
  const nextAllowed = new Map();
  return ops.map((op, i) => {
    if (op === 'allow') {
      const [time, message] = args[i];
      if (time < (nextAllowed.get(message) ?? 0)) return false;
      nextAllowed.set(message, time + cooldown);
      return true;
    }
    cooldown = args[i][0];
    return null;
  });
}

/** Builds a test from the cooldown and a list of [timestamp, message] calls. */
function build(cooldown, calls) {
  return [['MessageThrottle', ...calls.map(() => 'allow')], [[cooldown], ...calls]];
}

/** A distinct lowercase message for each i, padded with 'a' to `len` letters (1 to 30). */
function msg(i, len = 1) {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26);
  } while (n > 0);
  return s.padStart(len, 'a');
}

/**
 * Seeded session of `n` calls: message ids from a pool of `pool`, time moving forward by
 * stepOf(rnd) before each call, starting at 0.
 */
function session(seed, cooldown, n, pool, stepOf, len = 3) {
  const rnd = mulberry32(seed);
  let now = 0;
  const calls = [];
  for (let k = 0; k < n; k++) {
    now = Math.min(MAX_TIME, now + stepOf(rnd));
    calls.push([now, msg(Math.floor(rnd() * pool), len)]);
  }
  return build(cooldown, calls);
}

const visible = [
  {
    args: build(10, [[1, 'disk'], [2, 'cpu'], [3, 'disk'], [8, 'cpu'], [10, 'disk'], [11, 'disk']]),
    expected: [null, true, true, false, false, false, true],
    note: '"disk" is shown at 1, so it is blocked until 11. "cpu" at 8 is still inside its own cooldown.',
  },
  {
    args: build(5, [[0, 'a'], [5, 'a'], [9, 'a'], [10, 'a']]),
    expected: [null, true, true, false, true],
    note: 'A message may be shown again exactly cooldown seconds after it was last shown.',
  },
  {
    args: build(10, [[1, 'a'], [6, 'a'], [11, 'a']]),
    expected: [null, true, false, true],
    note: 'The refused call at 6 does not restart the cooldown: the message is shown again at 11.',
  },
  {
    args: build(3, [[0, 'a'], [0, 'b'], [0, 'a'], [0, 'b']]),
    expected: [null, true, true, false, false],
    note: 'Different messages have separate cooldowns, even at the same timestamp.',
  },
  {
    args: build(2, [[4, 'x'], [5, 'y'], [6, 'x'], [7, 'y'], [100, 'x']]),
    expected: [null, true, true, true, true, true],
    note: 'Each message was last shown at least 2 seconds ago when it comes back.',
  },
];

// Hidden tests: cooldown 1 and a single timestamp, the largest cooldown and time, 30-letter
// messages, a message spammed every second, random sessions, and at max size (10^5 calls): 10^5
// distinct messages in the same second (a scan of a recent-messages log is quadratic), a pool of
// 20 messages hammered with tiny time steps (almost every call is refused), a large pool with
// big steps, and one message sent at each of 10^5 consecutive seconds.
const hiddenArgs = [
  build(1, [[0, 'a'], [0, 'a'], [1, 'a'], [1, 'a'], [2, 'a'], [3, 'b']]),
  build(MAX_COOLDOWN, [[0, 'x'], [MAX_TIME - 1, 'x'], [MAX_TIME, 'x'], [MAX_TIME, 'y'], [MAX_TIME, 'y']]),
  build(7, [[1, msg(0, MAX_LEN)], [2, msg(1, MAX_LEN)], [7, msg(0, MAX_LEN)], [8, msg(0, MAX_LEN)], [8, msg(1, MAX_LEN)], [9, msg(1, MAX_LEN)]]),
  build(10, Array.from({ length: 20 }, (_, k) => [k, 'a'])),
  session(3, 5, 400, 8, (rnd) => Math.floor(rnd() * 3)),
  session(5, 30, 5000, 100, (rnd) => Math.floor(rnd() * 4)),
  build(MAX_COOLDOWN, Array.from({ length: MAX_CALLS - 1 }, (_, k) => [0, msg(k, 5)])),
  session(11, 60, MAX_CALLS - 1, 20, (rnd) => (rnd() < 0.6 ? 0 : 1)),
  session(13, 1000, MAX_CALLS - 1, 5000, (rnd) => Math.floor(rnd() * 50), 8),
  build(10, Array.from({ length: MAX_CALLS - 1 }, (_, k) => [k, 'z'])),
];

export const problem = {
  id: 'message-throttle',
  title: 'Message Throttle',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Data Stream'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A service receives a stream of messages, each with a timestamp in seconds, and shows a
    message only if it was not shown during the last <code>cooldown</code> seconds. Implement the
    class <code>MessageThrottle</code>:</p>
    <ul>
      <li><code>MessageThrottle(cooldown)</code> creates the throttle.</li>
      <li><code>allow(timestamp, message)</code> returns <code>true</code> if
      <code>message</code> should be shown at <code>timestamp</code>, and <code>false</code> if it
      should be dropped. A message that was shown at time <code>t</code> may be shown again from
      time <code>t + cooldown</code> on. Dropped calls do not change anything.</li>
    </ul>
    <p>Calls arrive in non-decreasing order of <code>timestamp</code>; several calls can share a
    timestamp. A test is a sequence of calls: the first list names the operations, the second
    gives each call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor).</p>
  `,
  constraints: [
    '1 <= cooldown <= 10^9',
    '0 <= timestamp <= 10^9, non-decreasing across calls',
    'message has 1 to 30 lowercase English letters',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(1) per call on average',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For one message, what is the only thing you need to remember about its past to answer the next call?',
    'How do you look that up by message text in constant time?',
    'When a message is shown at time t, from what time on may it be shown again? Is that time inclusive?',
    'If a call is dropped, should it change what you remember about that message?',
    'Do you ever need to delete entries, or does a message simply compare its new timestamp with a stored time?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep a hash map from message to the earliest time it may be shown again. On
    <code>allow(t, m)</code>: if the map has <code>m</code> with a value greater than
    <code>t</code>, return <code>false</code>. Otherwise store <code>t + cooldown</code> for
    <code>m</code> and return <code>true</code>.</p>
    <h4>Why it works</h4>
    <p>Whether a message may be shown depends only on when it was last shown, so one number per
    message is the whole state. Timestamps never go back, which means a stored time that is already
    in the past stays in the past: an old entry is simply overwritten the next time the message is
    shown, and no cleanup is needed for correctness.</p>
    <h4>Complexity</h4>
    <p>O(1) per call on average, O(distinct messages) memory.</p>
    <h4>Pitfall</h4>
    <p>Updating the stored time on a refused call makes a message that is sent more often than the
    cooldown never appear again. Comparing with <code>&lt;=</code> instead of <code>&lt;</code>
    blocks a message one second too long, because the rule allows it again at exactly
    <code>last + cooldown</code>. A single "last shown" time for all messages, or a table that is
    cleared in fixed windows, merges separate cooldowns.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MessageThrottle',
    constructor: { params: [{ name: 'cooldown', type: 'int' }] },
    methods: [
      {
        name: 'allow',
        params: [
          { name: 'timestamp', type: 'int' },
          { name: 'message', type: 'string' },
        ],
        returns: 'bool',
      },
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
    if (ops.length > MAX_CALLS) return { ok: false, error: 'At most 10^5 calls.' };
    const inRange = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    if (ops[0] !== 'MessageThrottle' || !Array.isArray(args[0]) || args[0].length !== 1 || !inRange(args[0][0], 1, MAX_COOLDOWN)) {
      return { ok: false, error: 'The first call must be "MessageThrottle" with [cooldown]: cooldown 1 to 10^9.' };
    }
    let last = 0;
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] !== 'allow') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      if (!Array.isArray(a) || a.length !== 2 || !inRange(a[0], 0, MAX_TIME) || typeof a[1] !== 'string' || !new RegExp(`^[a-z]{1,${MAX_LEN}}$`).test(a[1])) {
        return { ok: false, error: `allow needs [timestamp, message]: timestamp 0 to 10^9, message 1 to 30 lowercase letters (call ${i}).` };
      }
      if (a[0] < last) return { ok: false, error: `Timestamps must not decrease (call ${i}).` };
      last = a[0];
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  growth: {
    target: 'n',
    n: 'number of calls (1000 distinct messages, cooldown 50, time moves forward by 0 to 3 per call)',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const names = Array.from({ length: 1000 }, (_, i) => 'm' + String.fromCharCode(97 + (i % 26), 97 + (Math.floor(i / 26) % 26), 97 + Math.floor(i / 676)));
      const ops = ['MessageThrottle'];
      const args = [[50]];
      let time = 0;
      while (ops.length < n) {
        time += randInt(rnd, 0, 3);
        ops.push('allow');
        args.push([time, names[randInt(rnd, 0, names.length - 1)]]);
      }
      return [ops, args];
    },
  },
};

export default problem;
