/**
 * Problem: Bucket Map (design)
 *
 * Build a hash map from scratch: an array of buckets, a hash function that spreads keys over
 * them, and a short list (chain) per bucket. With keys up to 10^9 a direct-address array is out
 * of the question, and with 2 * 10^5 calls a single list of pairs (O(n) per call) is about 10^10
 * steps. The classic bugs are a put that appends a duplicate instead of updating, a remove that
 * deletes only one of several copies, treating key 0 or value 0 as "missing", and a hash that
 * sends structured keys (all multiples of 1024, say) into the same few buckets.
 *
 * The statement forbids built-in hash tables, but the judge cannot see which data structure a
 * solution uses, so the hints say so honestly instead of pretending to check.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_KEY = 1000000000;
const MAX_VALUE = 1000000000;
const MAX_CALLS = 200000;

/**
 * Reference simulation on a JS Map (the reference is not bound by the exercise's rule).
 * @param {string[]} ops operation names, ops[0] === 'MyHashMap'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const map = new Map();
  return ops.map((op, i) => {
    if (op === 'put') map.set(args[i][0], args[i][1]);
    else if (op === 'remove') map.delete(args[i][0]);
    else if (op === 'get') return map.has(args[i][0]) ? map.get(args[i][0]) : -1;
    return null;
  });
}

/**
 * Seeded session: `calls` operations with probabilities putRate / getRate (the rest remove), and
 * keys from keyOf(k, rnd).
 */
function session(seed, calls, putRate, getRate, keyOf) {
  const rnd = mulberry32(seed);
  const ops = ['MyHashMap'];
  const args = [[]];
  for (let k = 0; k < calls; k++) {
    const key = keyOf(k, rnd);
    const r = rnd();
    if (r < putRate) {
      ops.push('put');
      args.push([key, Math.floor(rnd() * (MAX_VALUE + 1))]);
    } else if (r < putRate + getRate) {
      ops.push('get');
      args.push([key]);
    } else {
      ops.push('remove');
      args.push([key]);
    }
  }
  return [ops, args];
}

/** A pool of `size` seeded keys; calls draw from it, so keys repeat and gets can hit. */
function pooled(seed, size, keyOfIndex) {
  const rnd = mulberry32(seed ^ 0x5bd1e995);
  const pool = Array.from({ length: size }, (_, i) => keyOfIndex(i, rnd));
  return (_, r) => pool[Math.floor(r() * size)];
}

const visible = [
  {
    args: [
      ['MyHashMap', 'put', 'put', 'get', 'get', 'put', 'get', 'remove', 'get'],
      [[], [1, 1], [2, 2], [1], [3], [2, 1], [2], [2], [2]],
    ],
    expected: [null, null, null, 1, -1, null, 1, null, -1],
    note: 'Key 3 was never stored. put(2, 1) replaces the value of key 2; after remove(2) it is gone.',
  },
  {
    args: [['MyHashMap', 'get'], [[], [42]]],
    expected: [null, -1],
    note: 'An empty map has no keys.',
  },
  {
    args: [['MyHashMap', 'remove', 'put', 'get'], [[], [5], [5, 50], [5]]],
    expected: [null, null, null, 50],
    note: 'Removing a key that is not there does nothing.',
  },
  {
    args: [['MyHashMap', 'put', 'get', 'get'], [[], [0, 0], [0], [1]]],
    expected: [null, null, 0, -1],
    note: 'Key 0 with value 0 is a real entry, different from a missing key.',
  },
  {
    args: [['MyHashMap', 'put', 'put', 'get', 'get'], [[], [1000000000, 7], [999934464, 8], [1000000000], [999934464]]],
    expected: [null, null, null, 7, 8],
    note: 'Keys go up to 10^9, so a plain array indexed by key would be far too large.',
  },
];

// Hidden tests: re-adding after remove, updating many times then removing once, keys that share
// a remainder modulo common bucket counts (1000, 1024, 10007), removing twice, then at max size
// 2 * 10^5 calls over 10^5 distinct keys (a list of pairs is about 10^10 steps), keys that are
// all multiples of 1024 (a hash that keeps only the low bits piles them into one bucket), and
// heavy churn of puts and removes.
const hiddenArgs = [
  [['MyHashMap', 'put', 'remove', 'get', 'put', 'get'], [[], [9, 1], [9], [9], [9, 2], [9]]],
  [['MyHashMap', 'put', 'put', 'put', 'remove', 'get'], [[], [4, 1], [4, 2], [4, 3], [4], [4]]],
  [
    ['MyHashMap', 'put', 'put', 'put', 'put', 'remove', 'get', 'get', 'get', 'get'],
    [[], [7, 1], [1007, 2], [1031, 3], [10014, 4], [1007], [7], [1007], [1031], [10014]],
  ],
  [['MyHashMap', 'put', 'remove', 'remove', 'get', 'put', 'get'], [[], [3, 30], [3], [3], [3], [3, 31], [3]]],
  session(3, 400, 0.4, 0.4, (_, rnd) => Math.floor(rnd() * 10)),
  session(5, 10000, 0.4, 0.4, pooled(5, 2000, (_, r) => Math.floor(r() * (MAX_KEY + 1)))),
  session(7, MAX_CALLS, 0.5, 0.4, pooled(7, 100000, (_, r) => Math.floor(r() * (MAX_KEY + 1)))),
  session(11, MAX_CALLS, 0.45, 0.45, pooled(11, 100000, (i) => (i + 1) * 1024)),
  session(13, 20000, 0.35, 0.3, pooled(13, 5000, (_, r) => Math.floor(r() * 1000) * 1000003)),
  session(17, 20000, 0.3, 0.4, pooled(17, 3, (i) => [0, MAX_KEY, 65536][i])),
];

const isIntIn = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'bucket-map',
  title: 'Bucket Map',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hashing', 'Separate Chaining'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a hash map <strong>without using any built-in hash table</strong> (no
    <code>dict</code>, <code>Map</code>, <code>HashMap</code>, <code>unordered_map</code> and the
    like). Implement <code>MyHashMap</code>:</p>
    <ul>
      <li><code>MyHashMap()</code> creates an empty map.</li>
      <li><code>put(key, value)</code> stores <code>value</code> for <code>key</code>, replacing
      the old value if the key is already present.</li>
      <li><code>get(key)</code> returns the value stored for <code>key</code>, or <code>-1</code>
      if the key is not present.</li>
      <li><code>remove(key)</code> deletes <code>key</code> and its value if present.</li>
    </ul>
    <p>Keys go up to 10^9, so an array indexed directly by key is not an option. Aim for O(1)
    average time per call.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '0 <= key <= 10^9',
    '0 <= value <= 10^9',
    'At most 2 * 10^5 calls to put, get and remove in total',
    'Built-in hash tables are not allowed (the judge cannot check this; it is on your honour)',
    'Target complexity: O(1) average per call',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'The tests only see what get returns, so a built-in map would pass them. The point of this exercise is to build one yourself: what does a hash map keep inside?',
    'Turn a key into an index of a fixed-size array. What should happen when two keys land on the same index?',
    'If each array slot holds a short list of (key, value) pairs, what do put, get and remove do with that list?',
    'Your bucket count is a power of two and every key is a multiple of 1024. Which buckets get used? How can the hash mix in the high bits too?',
    'How many buckets do you need so that the lists stay short with 10^5 keys stored?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Separate chaining: a fixed array of 2^17 buckets, a hash that turns a key into a bucket
    index, and in each bucket a short list of (key, value) pairs that <code>put</code>,
    <code>get</code> and <code>remove</code> scan.</p>
    <h4>Why it works</h4>
    <p>A key always hashes to the same bucket, so every operation on it looks at the one list where
    it can live. <code>put</code> overwrites the pair in place when the key is already there, so a
    key never has two entries. <code>remove</code> moves the last pair into the gap, because order
    inside a bucket does not matter.</p>
    <h4>Complexity</h4>
    <p>O(1) average per call and O(n + B) space for n keys and B buckets: with 2^17 buckets and at
    most 2 * 10^5 calls, chains stay around one pair long. One flat list of pairs would cost O(n)
    per call.</p>
    <h4>Pitfall</h4>
    <p>A hash that keeps only the low bits (<code>key % 2^17</code>) piles keys with a regular
    structure, such as multiples of a power of two, into a handful of buckets, and the chains grow
    to thousands. The solution multiplies by <code>2654435761</code> and takes the top 17 bits of
    the 32-bit product, so every bit of the key affects the index.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MyHashMap',
    constructor: { params: [] },
    methods: [
      {
        name: 'put',
        params: [
          { name: 'key', type: 'int' },
          { name: 'value', type: 'int' },
        ],
        returns: 'void',
      },
      { name: 'get', params: [{ name: 'key', type: 'int' }], returns: 'int' },
      { name: 'remove', params: [{ name: 'key', type: 'int' }], returns: 'void' },
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
    if (ops[0] !== 'MyHashMap' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "MyHashMap" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 2 * 10^5 calls to put, get and remove.' };
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'put') {
        if (!Array.isArray(a) || a.length !== 2 || !isIntIn(a[0], 0, MAX_KEY) || !isIntIn(a[1], 0, MAX_VALUE)) {
          return { ok: false, error: `put takes a key and a value, both from 0 to 10^9 (call ${i}).` };
        }
      } else if (ops[i] === 'get' || ops[i] === 'remove') {
        if (!Array.isArray(a) || a.length !== 1 || !isIntIn(a[0], 0, MAX_KEY)) return { ok: false, error: `${ops[i]} takes one key from 0 to 10^9 (call ${i}).` };
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
