/**
 * Problem: Ring Queue (design)
 *
 * Equivalent to LeetCode 622; statement and tests are written for this project. A queue with a
 * fixed capacity, built on one array of that size. The head index and the number of stored items
 * are enough: the next free slot is (head + size) mod capacity, and both ends wrap around, so a
 * push or pop never moves any other item.
 *
 * Classic wrong answers: the head == tail trick without an item count (it cannot tell empty from
 * full, and the usual fix wastes one slot, so a queue of capacity k holds only k - 1), indexes
 * that do not wrap (the queue reports full after capacity pushes even when pops freed room),
 * back() reading the slot after the last item, front() and back() that keep returning stale items
 * after the queue drains, and popping by shifting the array, which is O(capacity) per pop (still
 * correct and, with memmove-style shifts, fast enough to pass at these sizes: the statement asks for
 * a ring).
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_CAP = 100000;
const MAX_CALLS = 100000;
const MAX_VAL = 1000000000;

/**
 * Reference simulation: a fixed array, the head index and the item count.
 * @param {string[]} ops operation names, ops[0] === 'RingQueue'
 * @param {number[][]} args argument list per operation
 * @returns {(number|boolean|null)[]}
 */
export function reference(ops, args) {
  let data = [];
  let cap = 0;
  let head = 0;
  let size = 0;
  return ops.map((op, i) => {
    switch (op) {
      case 'RingQueue':
        cap = args[i][0];
        data = new Array(cap).fill(0);
        return null;
      case 'push':
        if (size === cap) return false;
        data[(head + size) % cap] = args[i][0];
        size++;
        return true;
      case 'pop':
        if (size === 0) return false;
        head = (head + 1) % cap;
        size--;
        return true;
      case 'front':
        return size === 0 ? -1 : data[head];
      case 'back':
        return size === 0 ? -1 : data[(head + size - 1) % cap];
      case 'isEmpty':
        return size === 0;
      default:
        return size === cap;
    }
  });
}

/** Builds a test from the capacity and a list of calls, each ['push', v] or just a name. */
function build(capacity, calls) {
  return [
    ['RingQueue', ...calls.map((c) => c[0])],
    [[capacity], ...calls.map((c) => c.slice(1))],
  ];
}

/** Seeded session of `n` calls; `pPush` is the chance of a push, the rest are pops and reads. */
function randomSession(seed, capacity, n, pPush, pPop) {
  const rnd = mulberry32(seed);
  const reads = ['front', 'back', 'isEmpty', 'isFull'];
  const calls = [];
  for (let k = 0; k < n; k++) {
    const r = rnd();
    if (r < pPush) calls.push(['push', Math.floor(rnd() * (MAX_VAL + 1))]);
    else if (r < pPush + pPop) calls.push(['pop']);
    else calls.push([reads[Math.floor(rnd() * 4)]]);
  }
  return build(capacity, calls);
}

/** Fills the queue to `fill` items, then runs `rounds` of (pop, push, back) so the head laps it. */
function churn(capacity, fill, rounds) {
  const calls = [];
  for (let k = 0; k < fill; k++) calls.push(['push', k + 1]);
  for (let k = 0; k < rounds; k++) calls.push(['pop'], ['push', fill + k + 1], ['back']);
  return build(capacity, calls);
}

const visible = [
  {
    args: build(3, [['push', 1], ['push', 2], ['push', 3], ['push', 4], ['back'], ['isFull'], ['pop'], ['push', 4], ['front'], ['back']]),
    expected: [null, true, true, true, false, 3, true, true, true, 2, 4],
    note: 'The fourth push is refused. After one pop there is room again, and the new item goes to the back.',
  },
  {
    args: build(2, [['front'], ['back'], ['isEmpty'], ['isFull'], ['pop']]),
    expected: [null, -1, -1, true, false, false],
    note: 'An empty queue: front and back give -1, and pop fails.',
  },
  {
    args: build(2, [['push', 1], ['push', 2], ['pop'], ['push', 3], ['front'], ['back']]),
    expected: [null, true, true, true, true, 2, 3],
    note: 'The third item reuses the slot freed by the pop.',
  },
  {
    args: build(1, [['push', 8], ['isFull'], ['push', 9], ['pop'], ['isEmpty'], ['push', 9], ['front']]),
    expected: [null, true, true, false, true, true, true, 9],
    note: 'A queue of capacity 1 is full after one push and empty after one pop.',
  },
  {
    args: build(3, [['push', 5], ['pop'], ['pop'], ['push', 6], ['push', 7], ['front'], ['back'], ['isFull']]),
    expected: [null, true, true, false, true, true, 6, 7, false],
    note: 'A failed pop changes nothing.',
  },
];

// Hidden tests: capacity 1 cycled many times, the value 0 and the largest value, a head that laps
// a small ring many times, random sessions at several capacities, and at max size (10^5 calls):
// a ring of 49,990 slots filled and drained, one of 10^5 slots filled to half and then churned (the
// head laps a big array; shifting on every pop would move about 8 * 10^8 items, which engines do
// fast enough to pass, so the design is taught by the statement and hints, not enforced by time),
// and long random sessions on small and large rings.
const hiddenArgs = [
  build(1, [['push', 1], ['push', 2], ['pop'], ['push', 3], ['back'], ['front'], ['pop'], ['pop'], ['isEmpty']]),
  build(2, [['push', 0], ['push', MAX_VAL], ['front'], ['back'], ['isFull'], ['pop'], ['front'], ['back']]),
  build(3, [['push', 1], ['push', 2], ['push', 3], ['pop'], ['push', 4], ['pop'], ['push', 5], ['pop'], ['push', 6], ['front'], ['back'], ['isFull']]),
  build(4, [['pop'], ['isEmpty'], ['isFull'], ['push', 7], ['pop'], ['pop'], ['front'], ['back'], ['push', 8], ['back']]),
  randomSession(3, 1, 500, 0.4, 0.3),
  randomSession(5, 5, 3000, 0.45, 0.35),
  build(49990, [...Array.from({ length: 49990 }, (_, k) => ['push', k]), ['push', 7], ['isFull'], ['back'], ...Array.from({ length: 49991 }, () => ['pop']), ['isEmpty']]),
  churn(MAX_CAP, 50000, 16666),
  randomSession(11, 7, MAX_CALLS - 1, 0.45, 0.35),
  randomSession(13, MAX_CAP, MAX_CALLS - 1, 0.5, 0.3),
];

export const problem = {
  id: 'ring-queue',
  title: 'Ring Queue',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Queue', 'Circular Buffer'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Implement <code>RingQueue</code>, a first-in first-out queue that can hold at most
    <code>capacity</code> items and reuses the space freed by removed items:</p>
    <ul>
      <li><code>RingQueue(capacity)</code> creates an empty queue.</li>
      <li><code>push(value)</code> adds <code>value</code> at the back and returns
      <code>true</code>. If the queue is full it changes nothing and returns <code>false</code>.</li>
      <li><code>pop()</code> removes the item at the front and returns <code>true</code>. If the
      queue is empty it returns <code>false</code>.</li>
      <li><code>front()</code> returns the item at the front without removing it, or
      <code>-1</code> if the queue is empty.</li>
      <li><code>back()</code> returns the item at the back, or <code>-1</code> if the queue is
      empty.</li>
      <li><code>isEmpty()</code> and <code>isFull()</code> say whether the queue holds no items and
      whether it holds <code>capacity</code> items.</li>
    </ul>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor). Use one array of <code>capacity</code> slots; do not shift items when popping.</p>
  `,
  constraints: [
    '1 <= capacity <= 10^5',
    '0 <= value <= 10^9',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(1) per call, O(capacity) memory',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If pop removed the first element of the array by shifting the rest, what would 50,000 pops cost on a full queue?',
    'Instead of moving items, what could you move? Which single index tells you where the front is?',
    'Given the front index and the number of items, where does the next pushed item go, and where is the last item?',
    'What happens when that index passes the end of the array? How can the arithmetic wrap it around?',
    'If you track only a head and a tail index, how do you tell an empty queue from a full one? What extra number removes the ambiguity?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Allocate one array of <code>capacity</code> slots and keep two numbers: <code>head</code>,
    the index of the front item, and <code>size</code>, how many items are stored. The back item is
    at <code>(head + size - 1) mod capacity</code> and the next free slot is at
    <code>(head + size) mod capacity</code>. <code>push</code> writes there and grows
    <code>size</code>. <code>pop</code> moves <code>head</code> one step forward (mod capacity) and
    shrinks <code>size</code>.</p>
    <h4>Why it works</h4>
    <p>The stored items always occupy <code>size</code> consecutive slots starting at
    <code>head</code>, counting around the end of the array. Taking indexes modulo the capacity
    makes the array behave like a ring, so freed slots at the start are reused and nothing is ever
    moved. Empty is <code>size == 0</code> and full is <code>size == capacity</code>, with no
    ambiguity.</p>
    <h4>Complexity</h4>
    <p>O(1) time per call and O(capacity) memory.</p>
    <h4>Pitfall</h4>
    <p>With only <code>head</code> and <code>tail</code> indexes, the empty and the full queue look
    the same (<code>head == tail</code>). The common fix is to leave one slot unused, so allocate
    <code>capacity + 1</code> slots, and forgetting that makes the queue hold one item too few.
    Not wrapping the index makes a queue report full after <code>capacity</code> pushes in total,
    even if most items were popped.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'RingQueue',
    constructor: { params: [{ name: 'capacity', type: 'int' }] },
    methods: [
      { name: 'push', params: [{ name: 'value', type: 'int' }], returns: 'bool' },
      { name: 'pop', params: [], returns: 'bool' },
      { name: 'front', params: [], returns: 'int' },
      { name: 'back', params: [], returns: 'int' },
      { name: 'isEmpty', params: [], returns: 'bool' },
      { name: 'isFull', params: [], returns: 'bool' },
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
    if (ops[0] !== 'RingQueue' || !Array.isArray(args[0]) || args[0].length !== 1 || !inRange(args[0][0], 1, MAX_CAP)) {
      return { ok: false, error: 'The first call must be "RingQueue" with [capacity]: capacity 1 to 10^5.' };
    }
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'push') {
        if (!Array.isArray(a) || a.length !== 1 || !inRange(a[0], 0, MAX_VAL)) return { ok: false, error: `push needs one value from 0 to 10^9 (call ${i}).` };
      } else if (['pop', 'front', 'back', 'isEmpty', 'isFull'].includes(ops[i])) {
        if (!Array.isArray(a) || a.length !== 0) return { ok: false, error: `${ops[i]} takes no arguments (call ${i}).` };
      } else return { ok: false, error: `Unknown operation "${ops[i]}".` };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
