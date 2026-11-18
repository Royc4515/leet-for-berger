/**
 * Problem: Recent Cache (design)
 *
 * A fixed-capacity key-value cache that evicts the least recently used entry when full. The
 * canonical design pairs a hash map (key -> node) with a doubly linked list ordered by recency:
 * both get and put are O(1). The classic bugs are a get that does not refresh recency, an update
 * of an existing key that counts as a new entry (and evicts too early) or does not refresh it,
 * and O(capacity) scans: with capacity 10^5 and 2 * 10^5 calls that is about 10^10 steps.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_CAPACITY = 100000;
const MAX_KEY = 100000;
const MAX_VALUE = 1000000000;
const MAX_CALLS = 200000;

/**
 * Reference simulation: a circular doubly linked list in recency order (newest right after the
 * placeholder slot), threaded through arrays indexed by key. A JS Map in insertion order would be
 * shorter, but V8 leaves deleted entries in place until it rehashes, so repeatedly reading the
 * first key after deleting from the front is quadratic on 10^5 evictions.
 * @param {string[]} ops operation names, ops[0] === 'LruCache'
 * @param {number[][]} args argument list per operation; args[0] is [capacity]
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const capacity = args[0][0];
  const HEAD = MAX_KEY + 1;
  const prev = new Int32Array(HEAD + 1);
  const next = new Int32Array(HEAD + 1);
  const value = new Array(HEAD).fill(-1);
  const present = new Uint8Array(HEAD);
  prev[HEAD] = next[HEAD] = HEAD;
  let size = 0;
  const unlink = (k) => {
    next[prev[k]] = next[k];
    prev[next[k]] = prev[k];
  };
  const pushFront = (k) => {
    next[k] = next[HEAD];
    prev[k] = HEAD;
    prev[next[HEAD]] = k;
    next[HEAD] = k;
  };
  return ops.map((op, i) => {
    const key = args[i][0];
    if (op === 'get') {
      if (!present[key]) return -1;
      unlink(key);
      pushFront(key);
      return value[key];
    }
    if (op === 'put') {
      if (present[key]) unlink(key);
      else {
        present[key] = 1;
        size++;
      }
      value[key] = args[i][1];
      pushFront(key);
      if (size > capacity) {
        const lru = prev[HEAD];
        unlink(lru);
        present[lru] = 0;
        size--;
      }
    }
    return null;
  });
}

/**
 * Seeded session: `calls` operations after the constructor. Each is a get with probability
 * `getRate`, otherwise a put; keys come from keyOf(k, rnd).
 */
function session(seed, capacity, calls, getRate, keyOf) {
  const rnd = mulberry32(seed);
  const ops = ['LruCache'];
  const args = [[capacity]];
  for (let k = 0; k < calls; k++) {
    const key = keyOf(k, rnd);
    if (rnd() < getRate) {
      ops.push('get');
      args.push([key]);
    } else {
      ops.push('put');
      args.push([key, Math.floor(rnd() * (MAX_VALUE + 1))]);
    }
  }
  return [ops, args];
}

/** Fills the cache with `capacity` distinct keys, then `rest` random calls over all keys. */
function fullSession(seed, capacity, rest, getRate) {
  const [ops, args] = session(seed, capacity, capacity, 0, (k) => (k * 7919) % (MAX_KEY + 1));
  const [moreOps, moreArgs] = session(seed + 1, capacity, rest, getRate, (_, rnd) => Math.floor(rnd() * (MAX_KEY + 1)));
  return [ops.concat(moreOps.slice(1)), args.concat(moreArgs.slice(1))];
}

const visible = [
  {
    args: [
      ['LruCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'],
      [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
    ],
    expected: [null, null, null, 1, null, -1, null, -1, 3, 4],
    note: 'get(1) makes key 1 recent, so put(3, 3) evicts key 2. Then put(4, 4) evicts key 1.',
  },
  {
    args: [['LruCache', 'get'], [[1], [7]]],
    expected: [null, -1],
    note: 'A missing key returns -1.',
  },
  {
    args: [['LruCache', 'put', 'put', 'get', 'get'], [[1], [5, 50], [6, 60], [5], [6]]],
    expected: [null, null, null, -1, 60],
    note: 'With capacity 1, every new key evicts the previous one.',
  },
  {
    args: [['LruCache', 'put', 'put', 'put', 'put', 'get', 'get'], [[2], [1, 1], [2, 2], [1, 10], [3, 3], [1], [2]]],
    expected: [null, null, null, null, null, 10, -1],
    note: 'put on an existing key updates its value and makes it the most recent, so key 2 is evicted.',
  },
  {
    args: [['LruCache', 'put', 'get', 'put', 'get'], [[2], [0, 0], [0], [0, 1000000000], [0]]],
    expected: [null, null, 0, null, 1000000000],
    note: 'Key 0 and value 0 are ordinary entries, not "missing".',
  },
];

// Hidden tests: a put on an existing key must not count as a new entry, a get must refresh
// recency, eviction order after mixed gets, then sessions where the cache stays full: 10^5
// entries and 10^5 more calls, and 2 * 10^5 calls at capacity 5 * 10^4, where any
// O(capacity) scan per call is billions of steps. Also keys cycling over a range wider than the
// capacity, the pattern where LRU misses on every get.
const hiddenArgs = [
  [['LruCache', 'put', 'put', 'put', 'put', 'get', 'get'], [[2], [1, 1], [1, 2], [1, 3], [2, 4], [1], [2]]],
  [['LruCache', 'put', 'put', 'get', 'put', 'get', 'get'], [[2], [2, 1], [1, 1], [2], [4, 1], [1], [2]]],
  [['LruCache', 'put', 'put', 'put', 'get', 'get', 'put', 'get', 'get', 'get'], [[3], [1, 1], [2, 2], [3, 3], [2], [1], [4, 4], [3], [2], [1]]],
  [['LruCache', 'get', 'put', 'get', 'put', 'put', 'get', 'get'], [[1], [3], [3, 9], [3], [3, 8], [4, 7], [3], [4]]],
  session(3, 3, 300, 0.5, (_, rnd) => Math.floor(rnd() * 6)),
  session(5, 50, 5000, 0.5, (_, rnd) => Math.floor(rnd() * 120)),
  fullSession(7, MAX_CAPACITY, MAX_CALLS - MAX_CAPACITY, 0.5),
  session(11, 50000, MAX_CALLS, 0.5, (_, rnd) => Math.floor(rnd() * (MAX_KEY + 1))),
  session(13, 8000, 20000, 0.5, (k) => k % 10000),
  session(17, 1000, 20000, 0.6, (_, rnd) => Math.floor(rnd() * 1500)),
];

const isIntIn = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'recent-cache',
  title: 'Recent Cache',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Doubly Linked List'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a key-value cache with a fixed capacity that, when it is full, throws out the entry
    that was used least recently. Implement <code>LruCache</code>:</p>
    <ul>
      <li><code>LruCache(capacity)</code> creates an empty cache that holds at most
      <code>capacity</code> entries.</li>
      <li><code>get(key)</code> returns the value stored for <code>key</code>, or <code>-1</code>
      if the key is not in the cache.</li>
      <li><code>put(key, value)</code> stores <code>value</code> for <code>key</code>, replacing
      any previous value. If this adds a new key and the cache now holds more than
      <code>capacity</code> entries, remove the least recently used entry.</li>
    </ul>
    <p>An entry is <em>used</em> when it is stored by <code>put</code> or read by a successful
    <code>get</code>. Both <code>get</code> and <code>put</code> must run in O(1) average time.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '1 <= capacity <= 10^5',
    '0 <= key <= 10^5',
    '0 <= value <= 10^9',
    'At most 2 * 10^5 calls to get and put in total',
    'Target complexity: O(1) average per call',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which structure finds the value for a key in O(1)? Does it also remember which key was used least recently?',
    'You need an order of entries by last use, where any entry can jump to the front. Which list structure lets you unlink a node in O(1) if you already hold it?',
    'How can the hash map help you find that node without walking the list?',
    'When put updates a key that is already stored, does the cache grow? Does that key become recent?',
    'Placeholder head and tail nodes remove most of the edge cases. Which ones?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'LruCache',
    constructor: { params: [{ name: 'capacity', type: 'int' }] },
    methods: [
      { name: 'get', params: [{ name: 'key', type: 'int' }], returns: 'int' },
      {
        name: 'put',
        params: [
          { name: 'key', type: 'int' },
          { name: 'value', type: 'int' },
        ],
        returns: 'void',
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
    if (ops[0] !== 'LruCache' || !Array.isArray(args[0]) || args[0].length !== 1 || !isIntIn(args[0][0], 1, MAX_CAPACITY)) {
      return { ok: false, error: 'The first call must be "LruCache" with one capacity from 1 to 10^5.' };
    }
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 2 * 10^5 calls to get and put.' };
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'get') {
        if (!Array.isArray(a) || a.length !== 1 || !isIntIn(a[0], 0, MAX_KEY)) return { ok: false, error: `get takes one key from 0 to 10^5 (call ${i}).` };
      } else if (ops[i] === 'put') {
        if (!Array.isArray(a) || a.length !== 2 || !isIntIn(a[0], 0, MAX_KEY) || !isIntIn(a[1], 0, MAX_VALUE)) {
          return { ok: false, error: `put takes a key from 0 to 10^5 and a value from 0 to 10^9 (call ${i}).` };
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
