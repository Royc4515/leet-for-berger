/**
 * Problem: Bucket Set (design)
 *
 * Build a set of integers from scratch: an array of buckets, a hash function that spreads keys
 * over them, and a short list (chain) per bucket. Keys go up to 10^9, so a boolean array indexed
 * by key (the usual shortcut when keys stay below 10^6) would need a gigabyte, and with
 * 2 * 10^5 calls one flat list scanned on every call is about 10^10 steps. The classic bugs are an
 * add that stores a key twice (so one remove leaves a copy behind), treating key 0 as "missing",
 * and a hash that sends structured keys (all multiples of 1024, say) into the same few buckets.
 *
 * The statement forbids built-in hash sets, but the judge cannot see which data structure a
 * solution uses, so the hints say so honestly instead of pretending to check.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_KEY = 1000000000;
const MAX_CALLS = 200000;

/**
 * Reference simulation on a JS Set (the reference is not bound by the exercise's rule).
 * @param {string[]} ops operation names, ops[0] === 'MyHashSet'
 * @param {number[][]} args argument list per operation
 * @returns {(boolean|null)[]}
 */
export function reference(ops, args) {
  const set = new Set();
  return ops.map((op, i) => {
    if (op === 'add') set.add(args[i][0]);
    else if (op === 'remove') set.delete(args[i][0]);
    else if (op === 'contains') return set.has(args[i][0]);
    return null;
  });
}

/**
 * Seeded session: `calls` operations with probabilities addRate / containsRate (the rest remove),
 * and keys from keyOf(rnd).
 */
function session(seed, calls, addRate, containsRate, keyOf) {
  const rnd = mulberry32(seed);
  const ops = ['MyHashSet'];
  const args = [[]];
  for (let k = 0; k < calls; k++) {
    const key = keyOf(rnd);
    const r = rnd();
    if (r < addRate) ops.push('add');
    else if (r < addRate + containsRate) ops.push('contains');
    else ops.push('remove');
    args.push([key]);
  }
  return [ops, args];
}

/** A pool of `size` seeded keys; calls draw from it, so keys repeat and contains can hit. */
function pooled(seed, size, keyOfIndex) {
  const rnd = mulberry32(seed ^ 0x2c1b3c6d);
  const pool = Array.from({ length: size }, (_, i) => keyOfIndex(i, rnd));
  return (r) => pool[Math.floor(r() * size)];
}

/** Adds n distinct keys, then asks for each of them and for n absent ones: no early exits. */
function fillThenProbe(n, keyOfIndex) {
  const ops = ['MyHashSet'];
  const args = [[]];
  for (let i = 0; i < n; i++) {
    ops.push('add');
    args.push([keyOfIndex(i)]);
  }
  for (let i = 0; i < n; i++) {
    ops.push('contains', 'contains');
    args.push([keyOfIndex(i)], [keyOfIndex(i) + 1]);
  }
  return [ops.slice(0, MAX_CALLS + 1), args.slice(0, MAX_CALLS + 1)];
}

const visible = [
  {
    args: [
      ['MyHashSet', 'add', 'add', 'contains', 'contains', 'add', 'contains', 'remove', 'contains'],
      [[], [1], [2], [1], [3], [2], [2], [2], [2]],
    ],
    expected: [null, null, null, true, false, null, true, null, false],
    note: 'Key 3 was never added. Adding 2 again changes nothing; after remove(2) it is gone.',
  },
  {
    args: [['MyHashSet', 'contains'], [[], [42]]],
    expected: [null, false],
    note: 'An empty set holds nothing.',
  },
  {
    args: [['MyHashSet', 'remove', 'add', 'contains'], [[], [5], [5], [5]]],
    expected: [null, null, null, true],
    note: 'Removing a key that is not there does nothing.',
  },
  {
    args: [['MyHashSet', 'add', 'contains', 'contains'], [[], [0], [0], [1]]],
    expected: [null, null, true, false],
    note: 'Key 0 is a real key.',
  },
  {
    args: [['MyHashSet', 'add', 'add', 'contains', 'contains'], [[], [1000000000], [999934464], [1000000000], [999999999]]],
    expected: [null, null, null, true, false],
    note: 'Keys go up to 10^9, so an array of flags indexed by key would be far too large.',
  },
];

// Hidden tests: add twice then remove once (a chain holding duplicates keeps a copy), re-adding
// after remove, keys sharing a remainder modulo common bucket counts (1000, 1024, 10007), removing
// twice, then 2 * 10^5 calls over 10^5 distinct keys (one flat list is about 10^10 steps), keys
// that are all multiples of 1024 (a hash that keeps only the low bits piles them into one
// bucket), and heavy churn of adds and removes.
const hiddenArgs = [
  [['MyHashSet', 'add', 'add', 'remove', 'contains'], [[], [4], [4], [4], [4]]],
  [['MyHashSet', 'add', 'remove', 'contains', 'add', 'contains'], [[], [9], [9], [9], [9], [9]]],
  [
    ['MyHashSet', 'add', 'add', 'add', 'add', 'remove', 'contains', 'contains', 'contains', 'contains'],
    [[], [7], [1007], [1031], [10014], [1007], [7], [1007], [1031], [10014]],
  ],
  [['MyHashSet', 'add', 'remove', 'remove', 'contains', 'add', 'contains'], [[], [3], [3], [3], [3], [3], [3]]],
  session(3, 400, 0.4, 0.4, (rnd) => Math.floor(rnd() * 10)),
  session(5, 10000, 0.4, 0.4, pooled(5, 2000, (_, r) => Math.floor(r() * (MAX_KEY + 1)))),
  session(7, MAX_CALLS, 0.5, 0.4, pooled(7, 100000, (_, r) => Math.floor(r() * (MAX_KEY + 1)))),
  session(11, MAX_CALLS, 0.45, 0.45, pooled(11, 100000, (i) => (i + 1) * 1024)),
  fillThenProbe(70000, (i) => i * 10007),
  session(17, 20000, 0.3, 0.4, pooled(17, 3, (i) => [0, MAX_KEY, 65536][i])),
];

const isKey = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_KEY;
const OPS = new Set(['add', 'remove', 'contains']);

export const problem = {
  id: 'bucket-set',
  title: 'Bucket Set',
  difficulty: 'Easy',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hashing', 'Separate Chaining'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a set of non-negative integers <strong>without using any built-in hash table or
    set</strong> (no <code>set</code>, <code>Set</code>, <code>HashSet</code>,
    <code>unordered_set</code> and the like). Implement <code>MyHashSet</code>:</p>
    <ul>
      <li><code>MyHashSet()</code> creates an empty set.</li>
      <li><code>add(key)</code> puts <code>key</code> in the set. Adding a key that is already
      there changes nothing.</li>
      <li><code>contains(key)</code> returns <code>true</code> if <code>key</code> is in the set,
      <code>false</code> otherwise.</li>
      <li><code>remove(key)</code> takes <code>key</code> out of the set if it is there.</li>
    </ul>
    <p>Keys go up to 10^9, so an array of flags indexed directly by key is not an option. Aim for
    O(1) average time per call.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '0 <= key <= 10^9',
    'At most 2 * 10^5 calls to add, remove and contains in total',
    'Built-in hash tables and sets are not allowed (the judge cannot check this; it is on your honour)',
    'Target complexity: O(1) average per call',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'The tests only see what contains returns, so a built-in set would pass them. The point is to build one yourself: how big would an array of flags, one per possible key, have to be?',
    'Can you squeeze a key into an index of a much smaller array? What happens when two keys land on the same index?',
    'If each slot keeps a short list of keys, what must add check before it appends, so that one remove is enough?',
    'Your bucket count is a power of two and every key is a multiple of 1024. Which buckets get used? How can the hash mix in the high bits too?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Separate chaining: a fixed array of 2^17 buckets, a hash that turns a key into a bucket
    index, and in each bucket a short list of keys. <code>add</code> appends the key unless the
    list already holds it, <code>contains</code> scans the list, and <code>remove</code> deletes
    the key from it.</p>
    <h4>Why it works</h4>
    <p>A key always hashes to the same bucket, so every call about that key looks at the one list
    where it can live. Because <code>add</code> checks first, a key is stored at most once, so a
    single <code>remove</code> really takes it out of the set.</p>
    <h4>Complexity</h4>
    <p>O(1) average per call and O(n + B) space for n keys and B buckets: with 2^17 buckets and at
    most 2 * 10^5 calls, chains stay around one key long. A single flat list would cost O(n) per
    call, and a flag per possible key needs 10^9 entries.</p>
    <h4>Pitfall</h4>
    <p>A hash that keeps only the low bits (<code>key % 2^17</code>) piles keys with a regular
    structure, such as multiples of 1024, into a few buckets, and the chains grow to thousands.
    Multiplying by <code>2654435761</code> and taking the top 17 bits of the 32-bit product lets
    every bit of the key affect the index.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MyHashSet',
    constructor: { params: [] },
    methods: [
      { name: 'add', params: [{ name: 'key', type: 'int' }], returns: 'void' },
      { name: 'remove', params: [{ name: 'key', type: 'int' }], returns: 'void' },
      { name: 'contains', params: [{ name: 'key', type: 'int' }], returns: 'bool' },
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
    if (ops[0] !== 'MyHashSet' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "MyHashSet" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 2 * 10^5 calls to add, remove and contains.' };
    for (let i = 1; i < ops.length; i++) {
      if (!OPS.has(ops[i])) return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1 || !isKey(a[0])) return { ok: false, error: `${ops[i]} takes one key from 0 to 10^9 (call ${i}).` };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
