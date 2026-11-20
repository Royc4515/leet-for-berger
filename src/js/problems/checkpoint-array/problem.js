/**
 * Problem: Checkpoint Array (design)
 *
 * Equivalent to LeetCode 1146; statement and tests are written for this project. An integer array
 * supports point writes and checkpoints, and any past checkpoint can be read back. Copying the
 * array on every checkpoint costs O(length) each time. Instead, keep per index only the writes
 * that happened, tagged with the checkpoint id they belong to; ids only grow, so each index's
 * history is sorted and a read is a binary search for the last write at or before the id asked.
 *
 * Classic wrong answers: copying the whole array on every checkpoint (3 * 10^9 element copies and
 * gigabytes of memory at max size), reading the current value instead of the checkpointed one,
 * binary search that wants an exact id match (an index not written in that checkpoint reads 0),
 * and returning the checkpoint count instead of the id.
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';
import { randInt } from '../../engine/growth-inputs.js';

const MAX_LEN = 100000;
const MAX_CALLS = 100000;
const MAX_VAL = 1000000000;

/**
 * Reference simulation: per index, parallel lists of checkpoint ids and values.
 * @param {string[]} ops operation names, ops[0] === 'CheckpointArray'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const ids = new Map();
  const vals = new Map();
  let taken = 0;
  return ops.map((op, i) => {
    if (op === 'set') {
      const [index, val] = args[i];
      if (!ids.has(index)) {
        ids.set(index, []);
        vals.set(index, []);
      }
      const h = ids.get(index);
      const v = vals.get(index);
      // A second write in the same checkpoint replaces the first one.
      if (h.length && h[h.length - 1] === taken) v[v.length - 1] = val;
      else {
        h.push(taken);
        v.push(val);
      }
      return null;
    }
    if (op === 'snap') return taken++;
    if (op === 'get') {
      const [index, id] = args[i];
      const h = ids.get(index);
      if (!h) return 0;
      // Last entry whose id is <= the id asked; none means the index was untouched by then.
      let lo = 0;
      let hi = h.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (h[mid] <= id) lo = mid + 1;
        else hi = mid;
      }
      return lo === 0 ? 0 : vals.get(index)[lo - 1];
    }
    return null;
  });
}

/** Builds a test from the length and a list of calls: ['set', i, v], ['snap'], ['get', i, id]. */
function build(length, calls) {
  return [
    ['CheckpointArray', ...calls.map((c) => c[0])],
    [[length], ...calls.map((c) => c.slice(1))],
  ];
}

/** Seeded mixed session of `n` calls over `length` indexes; the first call is a snap so gets are legal. */
function randomSession(seed, length, n, pSet, pSnap, maxIndex = length) {
  const rnd = mulberry32(seed);
  const calls = [['snap']];
  let taken = 1;
  while (calls.length < n) {
    const r = rnd();
    if (r < pSet) calls.push(['set', Math.floor(rnd() * maxIndex), 1 + Math.floor(rnd() * MAX_VAL)]);
    else if (r < pSet + pSnap) {
      calls.push(['snap']);
      taken++;
    } else calls.push(['get', Math.floor(rnd() * maxIndex), Math.floor(rnd() * taken)]);
  }
  return build(length, calls);
}

/** One hot index: `rounds` times (write, checkpoint), then `reads` reads of random old checkpoints. */
function hotIndex(seed, rounds, reads) {
  const rnd = mulberry32(seed);
  const calls = [];
  for (let k = 0; k < rounds; k++) calls.push(['set', 0, k + 1], ['snap']);
  for (let k = 0; k < reads; k++) calls.push(['get', 0, Math.floor(rnd() * rounds)]);
  return build(MAX_LEN, calls);
}

/** A few writes, then many checkpoints that change nothing, then reads of random ones. */
function quietCheckpoints(seed, writes, snaps, reads) {
  const rnd = mulberry32(seed);
  const calls = [];
  for (let k = 0; k < writes; k++) calls.push(['set', Math.floor(rnd() * MAX_LEN), 1 + Math.floor(rnd() * MAX_VAL)]);
  for (let k = 0; k < snaps; k++) calls.push(['snap']);
  for (let k = 0; k < reads; k++) calls.push(['get', Math.floor(rnd() * MAX_LEN), Math.floor(rnd() * snaps)]);
  return build(MAX_LEN, calls);
}

const visible = [
  {
    args: build(3, [['set', 0, 5], ['snap'], ['set', 0, 6], ['get', 0, 0]]),
    expected: [null, null, 0, null, 5],
    note: 'The write of 6 came after checkpoint 0, so reading checkpoint 0 still gives 5.',
  },
  {
    args: build(2, [['snap'], ['get', 1, 0]]),
    expected: [null, 0, 0],
    note: 'Every slot starts at 0. The first checkpoint has id 0.',
  },
  {
    args: build(2, [['set', 0, 1], ['set', 0, 2], ['snap'], ['get', 0, 0]]),
    expected: [null, null, null, 0, 2],
    note: 'Two writes before one checkpoint: the later one wins.',
  },
  {
    args: build(2, [['set', 1, 10], ['snap'], ['set', 1, 20], ['snap'], ['set', 1, 30], ['snap'], ['get', 1, 0], ['get', 1, 1], ['get', 1, 2]]),
    expected: [null, null, 0, null, 1, null, 2, 10, 20, 30],
    note: 'Each checkpoint keeps the value the slot had when it was taken.',
  },
  {
    args: build(1, [['set', 0, 7], ['snap'], ['snap'], ['snap'], ['get', 0, 2]]),
    expected: [null, null, 0, 1, 2, 7],
    note: 'The slot was not written in checkpoint 2, so it keeps the value from the last write before it.',
  },
];

// Hidden tests: the smallest array, the largest value in the last slot, reads of untouched slots
// after several checkpoints, random small and mid-size sessions, and at max size (10^5 calls on
// 10^5 slots): one hot slot rewritten at every one of 33,333 checkpoints (copying the array per
// checkpoint is 3 * 10^9 element copies), random sessions over the whole array and over a few
// slots, 49,000 checkpoints that change nothing before the reads, and 60,000 rewrites of one slot
// inside a single checkpoint.
const hiddenArgs = [
  build(1, [['set', 0, 3], ['snap'], ['get', 0, 0]]),
  build(5, [['set', 4, MAX_VAL], ['snap'], ['set', 4, 1], ['snap'], ['get', 4, 0], ['get', 4, 1]]),
  build(4, [['set', 1, 9], ['snap'], ['snap'], ['snap'], ['snap'], ['get', 2, 3], ['get', 1, 0], ['get', 1, 3], ['get', 0, 2]]),
  randomSession(3, 5, 300, 0.4, 0.2),
  randomSession(5, 1000, 5000, 0.4, 0.15),
  hotIndex(7, 33333, 33333),
  randomSession(11, MAX_LEN, MAX_CALLS - 1, 0.4, 0.2),
  randomSession(13, 50, MAX_CALLS - 1, 0.35, 0.3, 50),
  quietCheckpoints(17, 1000, 49000, 49999),
  build(MAX_LEN, [...Array.from({ length: 60000 }, (_, k) => ['set', 5, k + 1]), ['snap'], ...Array.from({ length: 39998 }, (_, k) => ['get', k % 7, 0])]),
];

export const problem = {
  id: 'checkpoint-array',
  title: 'Checkpoint Array',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Binary Search', 'Persistent Array'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Implement <code>CheckpointArray</code>, an array of integers that can save its state and be
    read back as it was at any earlier save:</p>
    <ul>
      <li><code>CheckpointArray(length)</code> creates an array of <code>length</code> slots, all
      <code>0</code>.</li>
      <li><code>set(index, val)</code> writes <code>val</code> into slot <code>index</code>.</li>
      <li><code>snap()</code> saves the current state of the whole array and returns the
      checkpoint id. The first checkpoint has id <code>0</code>, the next <code>1</code>, and so
      on.</li>
      <li><code>get(index, snapId)</code> returns the value slot <code>index</code> had at the
      moment checkpoint <code>snapId</code> was taken.</li>
    </ul>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for <code>set</code>).</p>
  `,
  constraints: [
    '1 <= length <= 10^5',
    '0 <= index < length, 0 <= val <= 10^9',
    '0 <= snapId < the number of snap calls made so far',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(1) per set and snap, O(log n) per get, memory proportional to the writes',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If every snap copied the whole array, how much work and memory would 30,000 snaps of a 100,000-slot array take?',
    'Between two checkpoints, how many slots change? Is it worth remembering the slots that did not change?',
    'For a single slot, what is the smallest record you could keep so that you can answer "what was it at checkpoint s"?',
    'Checkpoint ids only grow. What does that tell you about the order of a slot\'s records, and which search fits?',
    'A slot was last written at checkpoint 3 and you are asked about checkpoint 8. Does your search find it, and what if it was never written?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Do not copy anything at <code>snap</code>: just bump a counter and return the old value. For
    every slot keep a list of changes, each one a pair (checkpoint id it was written under, value).
    <code>set</code> appends a pair, or overwrites the last pair if it already carries the current
    id. <code>get</code> binary searches that slot's list for the last pair whose id is at most
    <code>snapId</code>.</p>
    <h4>Why it works</h4>
    <p>A slot has the value of its latest write before the checkpoint was taken. Writes are recorded
    in time order and ids never decrease, so each list is sorted by id and "the last pair at or
    before the id" is a standard upper-bound search. If no pair qualifies, the slot was untouched
    and still holds its initial 0.</p>
    <h4>Complexity</h4>
    <p><code>set</code> and <code>snap</code> are O(1), <code>get</code> is O(log w) where w is the
    number of writes to that slot. Memory is proportional to the number of writes, not to
    <code>length * snaps</code>.</p>
    <h4>Pitfall</h4>
    <p>Searching for an exact id match fails whenever a slot was not written in the checkpoint
    asked about, which is the usual case. Appending a second entry for a repeated write in the same
    checkpoint is harmless for the search but wastes memory. And copying the array per snap passes
    small tests and then runs out of time and memory.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'CheckpointArray',
    constructor: { params: [{ name: 'length', type: 'int' }] },
    methods: [
      {
        name: 'set',
        params: [
          { name: 'index', type: 'int' },
          { name: 'val', type: 'int' },
        ],
        returns: 'void',
      },
      { name: 'snap', params: [], returns: 'int' },
      {
        name: 'get',
        params: [
          { name: 'index', type: 'int' },
          { name: 'snapId', type: 'int' },
        ],
        returns: 'int',
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
    const inRange = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    if (ops[0] !== 'CheckpointArray' || !Array.isArray(args[0]) || args[0].length !== 1 || !inRange(args[0][0], MAX_LEN) || args[0][0] < 1) {
      return { ok: false, error: 'The first call must be "CheckpointArray" with [length]: length 1 to 10^5.' };
    }
    const length = args[0][0];
    let taken = 0;
    for (let i = 1; i < ops.length; i++) {
      const a = args[i];
      if (ops[i] === 'set') {
        if (!Array.isArray(a) || a.length !== 2 || !inRange(a[0], length - 1) || !inRange(a[1], MAX_VAL)) return { ok: false, error: `set needs [index, val] with 0 <= index < length and 0 <= val <= 10^9 (call ${i}).` };
      } else if (ops[i] === 'snap') {
        if (!Array.isArray(a) || a.length !== 0) return { ok: false, error: `snap takes no arguments (call ${i}).` };
        taken++;
      } else if (ops[i] === 'get') {
        if (!Array.isArray(a) || a.length !== 2 || !inRange(a[0], length - 1) || !inRange(a[1], taken - 1)) return { ok: false, error: `get needs [index, snapId] with a valid index and a checkpoint already taken (call ${i}).` };
      } else return { ok: false, error: `Unknown operation "${ops[i]}".` };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  growth: {
    target: 'n log n',
    n: 'number of calls (length 10000; 50% set, 5% snap, 45% get)',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const ops = ['CheckpointArray', 'snap'];
      const args = [[10000], []];
      let snaps = 1;
      while (ops.length < n) {
        const r = rnd();
        if (r < 0.5) {
          ops.push('set');
          args.push([randInt(rnd, 0, 9999), randInt(rnd, 0, MAX_VAL)]);
        } else if (r < 0.55) {
          ops.push('snap');
          args.push([]);
          snaps++;
        } else {
          ops.push('get');
          args.push([randInt(rnd, 0, 9999), randInt(rnd, 0, snaps - 1)]);
        }
      }
      return [ops, args];
    },
  },
};

export default problem;
