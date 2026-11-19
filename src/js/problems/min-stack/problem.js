/**
 * Problem: Min Stack (design)
 *
 * A stack that also reports its current minimum, every operation in O(1). The canonical
 * "augment a structure with extra state" design problem; the per-entry snapshot it teaches
 * reappears in max stack, sliding-window maximum and undo histories.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const MAX_OPS = 100000;
const OPS = new Set(['push', 'pop', 'top', 'getMin']);

/**
 * Reference simulation.
 * @param {string[]} ops operation names, ops[0] === 'MinStack'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const vals = [];
  const mins = [];
  return ops.map((op, i) => {
    if (op === 'push') {
      const v = args[i][0];
      vals.push(v);
      mins.push(mins.length ? Math.min(v, mins[mins.length - 1]) : v);
      return null;
    }
    if (op === 'pop') {
      vals.pop();
      mins.pop();
      return null;
    }
    if (op === 'top') return vals[vals.length - 1];
    if (op === 'getMin') return mins[mins.length - 1];
    return null; // constructor
  });
}

/** Builds a valid operation sequence: pop, top and getMin only ever run on a non-empty stack. */
function randomOps(seed, n, valueOf) {
  const rnd = mulberry32(seed);
  const ops = ['MinStack'];
  const args = [[]];
  let size = 0;
  while (ops.length < n) {
    const r = rnd();
    if (size === 0 || r < 0.4) {
      ops.push('push');
      args.push([valueOf(rnd)]);
      size++;
    } else if (r < 0.6) {
      ops.push('pop');
      args.push([]);
      size--;
    } else {
      ops.push(r < 0.8 ? 'top' : 'getMin');
      args.push([]);
    }
  }
  return [ops, args];
}

const smallValue = (rnd) => Math.floor(rnd() * 201) - 100;
const anyInt = (rnd) => Math.floor(rnd() * 2 ** 32) + INT_MIN;

/** Half pushes, then half getMin calls: a minimum found by scanning the stack is O(n^2) here. */
function pushThenQuery(n) {
  const half = Math.floor((n - 1) / 2);
  const ops = ['MinStack', ...Array(half).fill('push'), ...Array(n - 1 - half).fill('getMin')];
  const args = [[], ...Array.from({ length: half }, (_, i) => [i]), ...Array(n - 1 - half).fill([])];
  return [ops, args];
}

/** Alternating push / getMin with random values. */
function alternating(seed, n) {
  const rnd = mulberry32(seed);
  const ops = ['MinStack'];
  const args = [[]];
  while (ops.length < n) {
    ops.push('push', 'getMin');
    args.push([anyInt(rnd)], []);
  }
  return [ops.slice(0, n), args.slice(0, n)];
}

/** Decreasing pushes, then pop + getMin pairs: the minimum must be restored after every pop. */
function decreasingThenUnwind(n) {
  const pushes = Math.floor((n - 1) / 3);
  const ops = ['MinStack'];
  const args = [[]];
  for (let i = 0; i < pushes; i++) {
    ops.push('push');
    args.push([pushes - i]);
  }
  while (ops.length + 2 <= n && pushes > 0) {
    ops.push('pop', 'getMin');
    args.push([], []);
    if (ops.filter((o) => o === 'pop').length >= pushes - 1) break;
  }
  return [ops, args];
}

const visible = [
  {
    args: [['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'], [[], [-2], [0], [-3], [], [], [], []]],
    expected: [null, null, null, null, -3, null, 0, -2],
    note: 'Popping -3 brings the minimum back to -2.',
  },
  {
    args: [['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'getMin'], [[], [0], [1], [0], [], [], []]],
    expected: [null, null, null, null, 0, null, 0],
    note: 'The minimum appears twice; removing one copy keeps it.',
  },
  {
    args: [['MinStack', 'push', 'top', 'getMin'], [[], [5], [], []]],
    expected: [null, null, 5, 5],
    note: 'One element is both the top and the minimum.',
  },
  {
    args: [['MinStack', 'push', 'push', 'getMin', 'top'], [[], [INT_MAX], [INT_MIN], [], []]],
    expected: [null, null, null, INT_MIN, INT_MIN],
    note: 'Values span the full 32-bit range.',
  },
  {
    args: [['MinStack', 'push', 'push', 'push', 'pop', 'pop', 'getMin'], [[], [3], [2], [1], [], [], []]],
    expected: [null, null, null, null, null, null, 3],
    note: 'Each pop restores the minimum from before that push.',
  },
];

// Hidden tests: duplicate minimums, 32-bit extremes (storing differences overflows), restoring the
// minimum after pops, random sequences, and 10^5 operations where scanning for the minimum is too slow.
const hiddenArgs = [
  [['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'getMin', 'pop', 'getMin'], [[], [0], [1], [0], [], [], [], [], []]],
  [['MinStack', 'push', 'push', 'getMin', 'pop', 'getMin', 'top'], [[], [INT_MAX], [INT_MIN], [], [], [], []]],
  decreasingThenUnwind(151),
  [['MinStack', 'push', 'push', 'pop', 'push', 'getMin', 'top'], [[], [1], [-1], [], [2], [], []]],
  randomOps(7, 1000, smallValue),
  randomOps(11, 10000, anyInt),
  pushThenQuery(MAX_OPS),
  alternating(13, MAX_OPS),
  decreasingThenUnwind(MAX_OPS),
  randomOps(17, 5000, anyInt),
];

export const problem = {
  id: 'min-stack',
  title: 'Min Stack',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Stack', 'Auxiliary State'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a stack of integers that can also report its smallest element. Implement the class
    <code>MinStack</code>:</p>
    <ul>
      <li><code>MinStack()</code> creates an empty stack.</li>
      <li><code>push(val)</code> puts <code>val</code> on top.</li>
      <li><code>pop()</code> removes the top element.</li>
      <li><code>top()</code> returns the top element.</li>
      <li><code>getMin()</code> returns the smallest element currently in the stack.</li>
    </ul>
    <p>Every operation must run in constant time. A test is a sequence of calls: the first list names
    the operations, the second gives each call's arguments, and the output lists each call's result
    (<code>null</code> for the constructor and for calls that return nothing).</p>
  `,
  constraints: [
    '-2^31 <= val <= 2^31 - 1',
    'pop, top and getMin are only called on a non-empty stack',
    'At most 10^5 calls in total',
    'Target complexity: O(1) per operation',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you only store one "current minimum", what goes wrong when that element is popped?',
    'When an element is pushed, what was the minimum of the stack below it? Does that ever change while it sits there?',
    'Could each entry remember something extra, so that popping it restores the right answer immediately?',
    'If you store minimums as differences from the value, what happens at the edges of the 32-bit range?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Store every entry as a pair: its value and the minimum of the stack from the bottom up to and
    including that entry. <code>getMin</code> reads the minimum stored in the top pair.</p>
    <h4>Why it works</h4>
    <p>Only the top of a stack changes, so while an entry sits on the stack the elements below it stay
    the same, and so does their minimum. The snapshot taken at <code>push</code> therefore stays
    correct. Popping an entry exposes the pair below, whose snapshot is exactly the minimum of what
    remains.</p>
    <h4>Complexity</h4>
    <p>O(1) time for <code>push</code>, <code>pop</code>, <code>top</code> and <code>getMin</code>: each
    is a single stack operation plus one comparison. O(n) space for n entries, two numbers each.</p>
    <h4>Pitfall</h4>
    <p>Keeping one variable for the current minimum. When that element is popped, the next smallest
    value is lost and finding it again takes a full scan. The trick of storing differences from the
    minimum instead of pairs can overflow near the ends of the 32-bit range.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'MinStack',
    constructor: { params: [] },
    methods: [
      { name: 'push', params: [{ name: 'val', type: 'int' }], returns: 'void' },
      { name: 'pop', params: [], returns: 'void' },
      { name: 'top', params: [], returns: 'int' },
      { name: 'getMin', params: [], returns: 'int' },
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
    if (ops.length > MAX_OPS) return { ok: false, error: 'At most 10^5 calls.' };
    if (ops[0] !== 'MinStack' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "MinStack" with no arguments.' };
    let size = 0;
    for (let i = 1; i < ops.length; i++) {
      if (!OPS.has(ops[i])) return { ok: false, error: `Unknown operation "${ops[i]}".` };
      if (!Array.isArray(args[i])) return { ok: false, error: `Arguments for call ${i} must be an array.` };
      if (ops[i] === 'push') {
        const v = args[i][0];
        if (args[i].length !== 1 || !Number.isInteger(v) || v < INT_MIN || v > INT_MAX) return { ok: false, error: `push needs one 32-bit integer (call ${i}).` };
        size++;
      } else {
        if (args[i].length !== 0) return { ok: false, error: `${ops[i]} takes no arguments (call ${i}).` };
        if (size === 0) return { ok: false, error: `${ops[i]} on an empty stack (call ${i}).` };
        if (ops[i] === 'pop') size--;
      }
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
