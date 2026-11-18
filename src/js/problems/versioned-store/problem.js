/**
 * Problem: Versioned Store (design)
 *
 * A key-value store that keeps every version of a value, stamped with the time it was set, and
 * answers "what was the value of this key at time t?". Because set timestamps only increase,
 * each key's versions are appended in sorted order, and a query is a binary search for the last
 * version at or before t: O(1) per set, O(log n) per get. The classic bugs are returning the
 * first version after t instead of the last one at or before it, failing on a key that was never
 * set, scanning a key's versions linearly (10^5 versions times 10^5 queries), and walking time
 * backwards one tick at a time (timestamps go up to 10^7).
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_CALLS = 200000;
const MAX_TIME = 10000000;
const MAX_LEN = 100;

/**
 * Reference simulation: per key, parallel arrays of timestamps and values in set order (which is
 * time order), and a binary search per get.
 * @param {string[]} ops operation names, ops[0] === 'TimeMap'
 * @param {unknown[][]} args argument list per operation
 * @returns {(string|null)[]}
 */
export function reference(ops, args) {
  const store = new Map();
  return ops.map((op, i) => {
    if (op === 'set') {
      const [key, value, time] = args[i];
      if (!store.has(key)) store.set(key, { times: [], values: [] });
      const s = store.get(key);
      s.times.push(time);
      s.values.push(value);
      return null;
    }
    if (op === 'get') {
      const [key, time] = args[i];
      const s = store.get(key);
      if (!s) return '';
      // Index of the first version stamped after `time`; the answer is the one before it.
      let lo = 0;
      let hi = s.times.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (s.times[mid] <= time) lo = mid + 1;
        else hi = mid;
      }
      return lo === 0 ? '' : s.values[lo - 1];
    }
    return null; // constructor
  });
}

const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString(rnd, len) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALNUM[Math.floor(rnd() * ALNUM.length)];
  return s;
}

/**
 * Seeded session of `calls` operations over `keyCount` keys. Sets get strictly increasing
 * timestamps with gaps up to `maxGap`; gets ask about a time drawn by timeOf(now, rnd), where
 * `now` is the latest set timestamp so far.
 */
function session(seed, calls, keyCount, setRate, maxGap, timeOf) {
  const rnd = mulberry32(seed);
  const keys = Array.from({ length: keyCount }, (_, i) => `k${i}${randomString(rnd, 2)}`);
  const ops = ['TimeMap'];
  const args = [[]];
  let now = 0;
  for (let k = 0; k < calls; k++) {
    const key = keys[Math.floor(rnd() * keyCount)];
    if (rnd() < setRate) {
      now += 1 + Math.floor(rnd() * maxGap);
      ops.push('set');
      args.push([key, randomString(rnd, 1 + Math.floor(rnd() * 6)), now]);
    } else {
      ops.push('get');
      args.push([key, Math.min(MAX_TIME, Math.max(1, timeOf(now, rnd)))]);
    }
  }
  return [ops, args];
}

/** One key with `sets` versions spread over the whole time range, then `gets` random queries. */
function deepKey(seed, sets, gets) {
  const rnd = mulberry32(seed);
  const ops = ['TimeMap'];
  const args = [[]];
  const step = Math.floor(MAX_TIME / sets);
  for (let k = 0; k < sets; k++) {
    ops.push('set');
    args.push(['hot', `v${k}`, 1 + k * step]);
  }
  for (let k = 0; k < gets; k++) {
    ops.push('get');
    args.push(['hot', 1 + Math.floor(rnd() * MAX_TIME)]);
  }
  return [ops, args];
}

const visible = [
  {
    args: [
      ['TimeMap', 'set', 'get', 'get', 'set', 'get', 'get'],
      [[], ['foo', 'bar', 1], ['foo', 1], ['foo', 3], ['foo', 'bar2', 4], ['foo', 4], ['foo', 5]],
    ],
    expected: [null, null, 'bar', 'bar', null, 'bar2', 'bar2'],
    note: 'At time 3 the latest version of foo is still the one set at time 1. From time 4 on it is bar2.',
  },
  {
    args: [['TimeMap', 'get'], [[], ['ghost', 10]]],
    expected: [null, ''],
    note: 'A key that was never set has no value at any time.',
  },
  {
    args: [['TimeMap', 'set', 'get', 'get'], [[], ['a', 'x', 5], ['a', 4], ['a', 5]]],
    expected: [null, null, '', 'x'],
    note: 'Before its first version the key has no value; at exactly time 5 it does.',
  },
  {
    args: [
      ['TimeMap', 'set', 'set', 'get', 'get'],
      [[], ['love', 'high', 10], ['love', 'low', 20], ['love', 15], ['love', 25]],
    ],
    expected: [null, null, null, 'high', 'low'],
    note: 'Time 15 falls between the two versions, so the earlier one applies.',
  },
  {
    args: [
      ['TimeMap', 'set', 'set', 'get', 'get'],
      [[], ['a', 'one', 1], ['b', 'two', 2], ['a', 2], ['b', 1]],
    ],
    expected: [null, null, null, 'one', ''],
    note: 'Keys are independent: b did not exist yet at time 1.',
  },
];

// Hidden tests: a get between versions must not return the next version, queries before the
// first version and far after the last, several keys interleaved, and at max size one key with
// 10^5 versions queried 10^5 times (a linear scan per get is 10^10 steps), 2 * 10^5 mixed calls
// over 1000 keys, and versions spread up to time 10^7 (stepping back one tick at a time is slow).
const hiddenArgs = [
  [['TimeMap', 'set', 'set', 'set', 'get', 'get', 'get'], [[], ['k', 'a', 2], ['k', 'b', 4], ['k', 'c', 6], ['k', 3], ['k', 5], ['k', 1]]],
  [['TimeMap', 'set', 'get', 'get'], [[], ['x', 'only', 7], ['x', 10000000], ['y', 10000000]]],
  [
    ['TimeMap', 'set', 'set', 'set', 'get', 'get', 'get', 'get'],
    [[], ['a', 'a1', 1], ['b', 'b1', 2], ['a', 'a2', 3], ['b', 2], ['a', 2], ['a', 3], ['b', 1]],
  ],
  [['TimeMap', 'set', 'set', 'get'], [[], ['same', 'v', 1], ['same', 'v', 2], ['same', 2]]],
  session(3, 300, 4, 0.5, 3, (now, rnd) => Math.floor(rnd() * (now + 3))),
  session(5, 5000, 50, 0.5, 20, (now, rnd) => Math.floor(rnd() * (now + 30))),
  deepKey(7, 100000, 100000),
  session(11, MAX_CALLS, 1000, 0.5, 40, (now, rnd) => Math.floor(rnd() * (now + 100))),
  session(13, 20000, 10, 0.5, 90, (now, rnd) => (rnd() < 0.5 ? MAX_TIME : Math.floor(rnd() * now))),
  session(17, 20000, 1, 0.3, 500, (now, rnd) => now - Math.floor(rnd() * 2000)),
];

const isToken = (s) => typeof s === 'string' && s.length >= 1 && s.length <= MAX_LEN && /^[a-z0-9]+$/.test(s);
const isTime = (t) => Number.isInteger(t) && t >= 1 && t <= MAX_TIME;

export const problem = {
  id: 'versioned-store',
  title: 'Versioned Store',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Binary Search'],
  timeLimitMs: 4000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a key-value store that remembers every value a key has had and when it was set.
    Implement <code>TimeMap</code>:</p>
    <ul>
      <li><code>TimeMap()</code> creates an empty store.</li>
      <li><code>set(key, value, timestamp)</code> records that <code>key</code> has
      <code>value</code> from time <code>timestamp</code> on.</li>
      <li><code>get(key, timestamp)</code> returns the value of <code>key</code> at time
      <code>timestamp</code>: the value from the latest <code>set</code> for that key whose
      timestamp is at most <code>timestamp</code>. If there is none, return the empty string
      <code>""</code>.</li>
    </ul>
    <p>The timestamps of <code>set</code> calls are strictly increasing across the whole sequence.
    <code>get</code> may ask about any time, earlier or later than the sets so far.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '1 <= key.length, value.length <= 100; key and value consist of lowercase letters and digits',
    '1 <= timestamp <= 10^7',
    'The timestamps of set calls are strictly increasing',
    'At most 2 * 10^5 calls to set and get in total',
    'Target complexity: O(1) per set, O(log n) per get',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'For one key, in what order do its versions arrive? What does that give you for free?',
    'A get asks for the last version at or before a time. In a sorted list, how fast can you find it?',
    'What should the search return when every version of the key is later than the time asked?',
    'Could you instead step backwards one time unit at a time until you hit a version? How far apart can versions be?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>For each key keep two parallel lists, timestamps and values. Set timestamps strictly
    increase, so appending keeps every key's versions sorted, and a <code>get</code> is one binary
    search for the last version at or before the time asked.</p>
    <h4>Why it works</h4>
    <p>An upper-bound search counts the versions with timestamp <code>&lt;= t</code>. The last of
    them is exactly the latest <code>set</code> that had happened by time <code>t</code>. If the
    count is zero, every version is later than <code>t</code> and the answer is <code>""</code>.</p>
    <h4>Complexity</h4>
    <p>O(1) per <code>set</code> and O(log n) per <code>get</code>, n being that key's number of
    versions; O(total sets) space. Stepping back one time unit at a time could cost up to 10^7 steps
    per <code>get</code>.</p>
    <h4>Pitfall</h4>
    <p>Searching for the first timestamp <code>&gt;= t</code> and stepping back one skips a version
    set exactly at <code>t</code>. Search for the first timestamp <code>&gt; t</code> instead, and
    remember the two empty cases: a key never set, and a time before its first version.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'TimeMap',
    constructor: { params: [] },
    methods: [
      {
        name: 'set',
        params: [
          { name: 'key', type: 'string' },
          { name: 'value', type: 'string' },
          { name: 'timestamp', type: 'int' },
        ],
        returns: 'void',
      },
      {
        name: 'get',
        params: [
          { name: 'key', type: 'string' },
          { name: 'timestamp', type: 'int' },
        ],
        returns: 'string',
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
    if (ops[0] !== 'TimeMap' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "TimeMap" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 2 * 10^5 calls to set and get.' };
    let last = 0;
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'set') {
        if (!Array.isArray(a) || a.length !== 3 || !isToken(a[0]) || !isToken(a[1]) || !isTime(a[2])) {
          return { ok: false, error: `set takes a key, a value (1 to 100 lowercase letters or digits) and a timestamp from 1 to 10^7 (call ${i}).` };
        }
        if (a[2] <= last) return { ok: false, error: `Call ${i}: set timestamps must be strictly increasing.` };
        last = a[2];
      } else if (ops[i] === 'get') {
        if (!Array.isArray(a) || a.length !== 2 || !isToken(a[0]) || !isTime(a[1])) {
          return { ok: false, error: `get takes a key (1 to 100 lowercase letters or digits) and a timestamp from 1 to 10^7 (call ${i}).` };
        }
      } else {
        return { ok: false, error: `Unknown operation "${ops[i]}".` };
      }
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
