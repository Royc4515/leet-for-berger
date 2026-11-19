/**
 * Problem: Random Pool (design)
 *
 * A set of integers with constant-time insert, remove and uniformly random pick. The canonical
 * "pair a hash map with an array" design problem: the swap-with-last removal it teaches reappears
 * in LRU variants, weighted samplers and any structure that needs O(1) delete from a dense array.
 *
 * getRandom has no single right answer, so this problem uses the 'randomized-set' judge mode
 * (engine/harness.js): insert and remove must match the reference exactly, getRandom must return a
 * current member, and long runs of getRandom on an unchanged set must look uniform. The reference
 * writes null at getRandom positions; the judge never compares those.
 */

import { mulberry32 } from '../../engine/rng.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const MAX_CALLS = 200000;
const HALF = MAX_CALLS / 2;
const OPS = new Set(['insert', 'remove', 'getRandom']);

/**
 * Reference simulation. getRandom has no fixed answer, so its slot is null.
 * @param {string[]} ops operation names, ops[0] === 'RandomizedSet'
 * @param {number[][]} args argument list per operation
 * @returns {(boolean|null)[]}
 */
export function reference(ops, args) {
  const set = new Set();
  return ops.map((op, i) => {
    if (op === 'insert') {
      if (set.has(args[i][0])) return false;
      set.add(args[i][0]);
      return true;
    }
    if (op === 'remove') return set.delete(args[i][0]);
    return null; // constructor and getRandom
  });
}

const anyInt = (rnd) => Math.floor(rnd() * 2 ** 32) + INT_MIN;
const small = (rnd) => Math.floor(rnd() * 50);

/** A valid random sequence: getRandom only ever runs on a non-empty set. */
function randomOps(seed, n, valueOf, pRandom = 0.3) {
  const rnd = mulberry32(seed);
  const ops = ['RandomizedSet'];
  const args = [[]];
  const live = new Set();
  while (ops.length < n) {
    const r = rnd();
    if (live.size && r < pRandom) {
      ops.push('getRandom');
      args.push([]);
    } else {
      const v = valueOf(rnd);
      const op = rnd() < 0.55 ? 'insert' : 'remove';
      ops.push(op);
      args.push([v]);
      if (op === 'insert') live.add(v);
      else live.delete(v);
    }
  }
  return [ops, args];
}

/** Inserts `values`, then `picks` getRandom calls: long enough for the fairness check. */
function insertThenPick(values, picks) {
  const ops = ['RandomizedSet', ...values.map(() => 'insert'), ...Array(picks).fill('getRandom')];
  const args = [[], ...values.map((v) => [v]), ...Array(picks).fill([])];
  return [ops, args];
}

/** n inserts, then the same values removed in a shuffled order: O(n) removal is O(n^2) here. */
function insertThenRemove(seed, n) {
  const rnd = mulberry32(seed);
  const values = Array.from({ length: n }, () => anyInt(rnd));
  const order = [...values];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ops = ['RandomizedSet', ...values.map(() => 'insert'), ...order.map(() => 'remove')];
  const args = [[], ...values.map((v) => [v]), ...order.map((v) => [v])];
  return [ops, args];
}

const visible = [
  {
    args: [['RandomizedSet', 'insert', 'remove', 'insert', 'getRandom', 'remove', 'insert', 'getRandom'], [[], [1], [2], [2], [], [1], [2], []]],
    expected: [null, true, false, true, null, true, false, null],
    note: 'The first getRandom may return 1 or 2; the second must return 2, the only member left.',
  },
  {
    args: [['RandomizedSet', 'insert', 'insert', 'remove', 'remove'], [[], [5], [5], [5], [5]]],
    expected: [null, true, false, true, false],
    note: 'Inserting a member again, or removing a missing value, returns false.',
  },
  {
    args: [['RandomizedSet', 'insert', 'getRandom', 'getRandom'], [[], [-7], [], []]],
    expected: [null, true, null, null],
    note: 'With one member, every pick returns it.',
  },
  {
    args: [['RandomizedSet', 'insert', 'insert', 'remove', 'insert', 'getRandom'], [[], [INT_MAX], [INT_MIN], [INT_MAX], [0], []]],
    expected: [null, true, true, true, true, null],
    note: 'Values span the full 32-bit range; the pick is one of -2147483648 and 0.',
  },
  {
    args: [['RandomizedSet', 'remove', 'insert', 'insert', 'insert', 'remove', 'getRandom'], [[], [3], [3], [4], [5], [4], []]],
    expected: [null, false, true, true, true, true, null],
    note: 'Removing from the middle must keep the other members reachable.',
  },
];

// Hidden tests: removing the last member and adding it back, picks on a two-member set (always
// returning one end is caught by the fairness check), 32-bit extremes, and 2 * 10^5 calls where
// removing from an array by search, or copying the set on every pick, is O(n^2).
const hiddenArgs = [
  [['RandomizedSet', 'insert', 'remove', 'insert', 'getRandom', 'remove', 'remove'], [[], [9], [9], [9], [], [9], [9]]],
  insertThenPick([10, 20], 4000),
  insertThenPick([INT_MIN, INT_MAX, 0, -1, 1, 2, 3, 4, 5, 6], 10000),
  randomOps(3, 2000, small),
  randomOps(5, 5000, anyInt),
  insertThenRemove(7, HALF),
  insertThenPick(Array.from({ length: HALF }, (_, i) => i * 3 - 150000), HALF),
  randomOps(11, 10000, small, 0.4),
  randomOps(13, 10000, anyInt, 0.2),
  insertThenPick(Array.from({ length: 50 }, (_, i) => i * i), 10000),
];

export const problem = {
  id: 'random-pool',
  title: 'Random Pool',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Randomized'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],
  // getRandom is judged by membership and fairness, not by equality (engine/harness.js).
  judge: 'randomized-set',

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Implement the class <code>RandomizedSet</code>, a set of integers:</p>
    <ul>
      <li><code>RandomizedSet()</code> creates an empty set.</li>
      <li><code>insert(val)</code> adds <code>val</code> if it is missing. Returns whether it was added.</li>
      <li><code>remove(val)</code> deletes <code>val</code> if it is present. Returns whether it was deleted.</li>
      <li><code>getRandom()</code> returns one current member, each with the same probability.</li>
    </ul>
    <p>Every operation must run in constant average time. A test is a sequence of calls: the first
    list names the operations, the second gives each call's arguments, and the output lists each
    call's result (<code>null</code> for the constructor).</p>
    <p>How <code>getRandom</code> is judged: any current member is accepted, so the expected output
    shows <code>null</code> in its place. Some tests call it thousands of times on the same set, and
    each member must then come up about equally often. A truly uniform pick fails that check by
    bad luck less than once in 10^8 submissions.</p>
  `,
  constraints: [
    '-2^31 <= val <= 2^31 - 1',
    'getRandom is only called on a non-empty set',
    'At most 2 * 10^5 calls in total',
    'Target complexity: O(1) average per operation',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Which structure gives O(1) membership? Which one gives O(1) access to "the k-th element"?',
    'Could you keep both, and make them agree on where every value lives?',
    'Deleting from the middle of an array is slow. Does the order of the array matter here?',
    'What if the last element moved into the hole left by the removed one? What must you update?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep the values in a dense array, so <code>getRandom</code> can pick a uniform random index,
    and a hash map from each value to its array index, so membership and removal are O(1).</p>
    <h4>Why it works</h4>
    <p>The two structures always agree: <code>index[v]</code> is where <code>v</code> sits in the
    array. <code>insert</code> appends and records the position. <code>remove</code> moves the last
    value into the hole and updates that value's index, so the array stays gap-free and every member
    owns exactly one slot. A uniform index is then a uniform member.</p>
    <h4>Complexity</h4>
    <p>O(1) average per operation (hash map work plus changes at the end of the array), O(n) space.
    Removing from the middle by shifting elements would be O(n).</p>
    <h4>Pitfall</h4>
    <p>Removing the value that is already last in the array. Deleting its map entry and then
    recording "the last value now lives at index <code>i</code>" writes the removed value straight
    back into the map. Move the last value only when the hole is not at the end, as the solution
    does.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'RandomizedSet',
    constructor: { params: [] },
    methods: [
      { name: 'insert', params: [{ name: 'val', type: 'int' }], returns: 'bool' },
      { name: 'remove', params: [{ name: 'val', type: 'int' }], returns: 'bool' },
      { name: 'getRandom', params: [], returns: 'int' },
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
    if (ops.length > MAX_CALLS + 1) return { ok: false, error: 'At most 2 * 10^5 calls.' };
    if (ops[0] !== 'RandomizedSet' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "RandomizedSet" with no arguments.' };
    const live = new Set();
    for (let i = 1; i < ops.length; i++) {
      if (!OPS.has(ops[i])) return { ok: false, error: `Unknown operation "${ops[i]}".` };
      if (!Array.isArray(args[i])) return { ok: false, error: `Arguments for call ${i} must be an array.` };
      if (ops[i] === 'getRandom') {
        if (args[i].length !== 0) return { ok: false, error: `getRandom takes no arguments (call ${i}).` };
        if (!live.size) return { ok: false, error: `getRandom on an empty set (call ${i}).` };
        continue;
      }
      const v = args[i][0];
      if (args[i].length !== 1 || !Number.isInteger(v) || v < INT_MIN || v > INT_MAX) return { ok: false, error: `${ops[i]} needs one 32-bit integer (call ${i}).` };
      if (ops[i] === 'insert') live.add(v);
      else live.delete(v);
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
