/**
 * Problem: Frequent Cache (design)
 *
 * A fixed-capacity cache that evicts the least frequently used entry, breaking ties by least
 * recent use. The O(1) design keeps, for every use count, a recency-ordered list of the keys
 * with that count, plus the smallest count currently present: a use moves a key from list f to
 * list f + 1, and an eviction pops the oldest key of the smallest list. The classic bugs are
 * forgetting that put on an existing key is a use, not resetting the smallest count to 1 when a
 * new key arrives, keeping an evicted key's old count when it comes back, and O(capacity) scans
 * for the victim: 10^5 evictions on a full cache of 10^5 is about 10^10 steps.
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
 * Reference simulation: for every use count, a circular doubly linked list of the entries with
 * that count, newest first, threaded through `prev` / `next` on the entry objects. A JS Map in
 * insertion order would be shorter, but V8 leaves deleted entries in place until it rehashes, so
 * repeatedly reading the first key after deleting from the front is quadratic on 10^5 evictions.
 * @param {string[]} ops operation names, ops[0] === 'LfuCache'
 * @param {number[][]} args argument list per operation; args[0] is [capacity]
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const capacity = args[0][0];
  const entries = new Map(); // key -> entry
  const lists = new Map(); // count -> placeholder entry of that count's list
  let minCount = 0;
  const listFor = (count) => {
    let head = lists.get(count);
    if (!head) {
      head = {};
      head.prev = head.next = head;
      lists.set(count, head);
    }
    return head;
  };
  const unlink = (e) => {
    e.prev.next = e.next;
    e.next.prev = e.prev;
  };
  const pushFront = (e) => {
    const head = listFor(e.count);
    e.next = head.next;
    e.prev = head;
    head.next.prev = e;
    head.next = e;
  };
  const isEmpty = (count) => {
    const head = lists.get(count);
    return !head || head.next === head;
  };
  const touch = (e) => {
    unlink(e);
    if (minCount === e.count && isEmpty(e.count)) minCount++;
    e.count++;
    pushFront(e);
  };
  return ops.map((op, i) => {
    if (op === 'get') {
      const e = entries.get(args[i][0]);
      if (!e) return -1;
      touch(e);
      return e.value;
    }
    if (op === 'put') {
      const [key, value] = args[i];
      const e = entries.get(key);
      if (e) {
        e.value = value;
        touch(e);
        return null;
      }
      if (entries.size === capacity) {
        // The oldest entry among those with the smallest count is the last one in its list.
        const victim = lists.get(minCount).prev;
        unlink(victim);
        entries.delete(victim.key);
      }
      const fresh = { key, value, count: 1 };
      entries.set(key, fresh);
      pushFront(fresh);
      minCount = 1;
      return null;
    }
    return null; // constructor
  });
}

/**
 * Seeded session: `calls` operations after the constructor. Each is a get with probability
 * `getRate`, otherwise a put; keys come from keyOf(k, rnd).
 */
function session(seed, capacity, calls, getRate, keyOf) {
  const rnd = mulberry32(seed);
  const ops = ['LfuCache'];
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

const visible = [
  {
    args: [
      ['LfuCache', 'put', 'put', 'get', 'put', 'get', 'get', 'put', 'get', 'get', 'get'],
      [[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]],
    ],
    expected: [null, null, null, 1, null, -1, 3, null, -1, 3, 4],
    note: 'put(3, 3) evicts key 2 (used once; key 1 was used twice). Before put(4, 4), keys 1 and 3 are both used twice, and key 1 was used longer ago, so it goes.',
  },
  {
    args: [['LfuCache', 'get'], [[1], [9]]],
    expected: [null, -1],
    note: 'A missing key returns -1.',
  },
  {
    args: [['LfuCache', 'put', 'put', 'put', 'put', 'get', 'get', 'get'], [[2], [1, 1], [1, 5], [2, 2], [3, 3], [1], [2], [3]]],
    expected: [null, null, null, null, null, 5, -1, 3],
    note: 'put on an existing key counts as a use: key 1 has been used twice, so key 2 is evicted.',
  },
  {
    args: [['LfuCache', 'put', 'put', 'put', 'get', 'get'], [[2], [1, 1], [2, 2], [3, 3], [1], [2]]],
    expected: [null, null, null, null, -1, 2],
    note: 'Keys 1 and 2 are tied at one use each; key 1 was used least recently, so it is evicted.',
  },
  {
    args: [['LfuCache', 'put', 'get', 'get', 'put', 'get', 'put', 'get', 'get', 'get'], [[2], [1, 1], [1], [1], [2, 2], [2], [3, 3], [2], [1], [3]]],
    expected: [null, null, 1, 1, null, 2, null, -1, 1, 3],
    note: 'Key 1 has 3 uses and key 2 has 2, so key 2 is the least frequently used when key 3 arrives.',
  },
];

// Hidden tests: capacity 1, an evicted key that comes back must start over at one use, a get
// miss must change nothing, then random sessions and sessions on a full large cache where most
// puts evict (an O(capacity) victim search is about 10^10 steps), and a few very hot keys with
// use counts in the thousands next to many cold ones.
const hiddenArgs = [
  [['LfuCache', 'put', 'get', 'get', 'put', 'get', 'get'], [[1], [1, 1], [1], [1], [2, 2], [1], [2]]],
  [
    ['LfuCache', 'put', 'put', 'get', 'get', 'put', 'put', 'get', 'put', 'get', 'get'],
    [[2], [1, 1], [2, 2], [1], [1], [3, 3], [2, 20], [2], [4, 4], [1], [2]],
  ],
  [['LfuCache', 'put', 'get', 'get', 'put', 'put', 'get', 'get'], [[2], [1, 1], [5], [5], [2, 2], [3, 3], [1], [3]]],
  [['LfuCache', 'put', 'put', 'get', 'put', 'put', 'get', 'get', 'get'], [[3], [0, 0], [1, 1], [0], [2, 2], [3, 3], [1], [2], [3]]],
  session(3, 3, 400, 0.5, (_, rnd) => Math.floor(rnd() * 7)),
  session(5, 100, 10000, 0.5, (_, rnd) => Math.floor(rnd() * 300)),
  session(7, 50000, MAX_CALLS, 0.2, (_, rnd) => Math.floor(rnd() * (MAX_KEY + 1))),
  session(11, MAX_CAPACITY, MAX_CALLS, 0, (k) => k % (MAX_KEY + 1)),
  session(13, 5000, 20000, 0.2, (_, rnd) => (rnd() < 0.3 ? Math.floor(rnd() * 5) : Math.floor(rnd() * (MAX_KEY + 1)))),
  session(17, 1000, 20000, 0.4, (_, rnd) => (rnd() < 0.5 ? Math.floor(rnd() * 800) : 1000 + Math.floor(rnd() * 99000))),
];

const isIntIn = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'frequent-cache',
  title: 'Frequent Cache',
  difficulty: 'Hard',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Doubly Linked List'],
  timeLimitMs: 4000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a key-value cache with a fixed capacity that, when it is full, throws out the entry
    that has been used the <strong>fewest</strong> times. Implement <code>LfuCache</code>:</p>
    <ul>
      <li><code>LfuCache(capacity)</code> creates an empty cache that holds at most
      <code>capacity</code> entries.</li>
      <li><code>get(key)</code> returns the value stored for <code>key</code>, or <code>-1</code>
      if the key is not in the cache.</li>
      <li><code>put(key, value)</code> stores <code>value</code> for <code>key</code>, replacing
      any previous value. If <code>key</code> is new and the cache is already full, first remove
      the entry with the smallest use count. If several entries share that count, remove the one
      whose last use is the oldest.</li>
    </ul>
    <p>Each entry has a <em>use count</em>. It is 1 when the key is added, and every successful
    <code>get</code> and every <code>put</code> on a key already in the cache adds 1. A key that
    is removed and later added again starts over at 1. Both operations must run in O(1) average
    time.</p>
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
    'Among the entries with the smallest use count, you need the least recently used one. What structure answers "least recently used" in O(1)?',
    'What if you kept one such recency list per use count? What happens to a key when it is used once more?',
    'To evict quickly you need the smallest use count that still has entries. When can that number go up, and when does it drop back?',
    'Which operations count as a use? Read the statement again for put on a key that is already stored.',
    'A key was evicted and then added again. What should its use count be?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Group keys by use count. For each count keep its keys in recency order, and track
    <code>minCount</code>, the smallest count that has any keys. Eviction removes the oldest key of
    the <code>minCount</code> group.</p>
    <h4>Why it works</h4>
    <p>A use moves a key from group <code>c</code> to the newest end of group <code>c + 1</code>, so
    inside a group arrival order is last-use order and the oldest is the least recently used of the
    least used. <code>minCount</code> changes in only two ways: it rises by one when the moved key
    was the last in the <code>minCount</code> group, and it resets to 1 when a new key arrives,
    since a new key always has the smallest count.</p>
    <h4>Complexity</h4>
    <p>O(1) average per call, O(capacity) space. Python keeps an ordered dict per count; JavaScript
    uses a doubly linked list per count, because reading the first key of a <code>Map</code> after
    many deletions is not constant time there. Scanning for the minimum on every eviction would be
    O(capacity).</p>
    <h4>Pitfall</h4>
    <p><code>put</code> on a key that is already stored is a use: update the value and raise its
    count. Forgetting that bump, or letting an evicted key keep its old count when it is added
    again, evicts the wrong entry.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'LfuCache',
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
    if (ops[0] !== 'LfuCache' || !Array.isArray(args[0]) || args[0].length !== 1 || !isIntIn(args[0][0], 1, MAX_CAPACITY)) {
      return { ok: false, error: 'The first call must be "LfuCache" with one capacity from 1 to 10^5.' };
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
