/**
 * Problem: Nested Flattener (design)
 *
 * An iterator that hands out the integers of an arbitrarily nested list in order. The canonical
 * "turn a recursion into an explicit stack" design problem: the same lazy stack powers tree
 * iterators, file walkers and pagination over nested data.
 *
 * The constructor takes NestedInteger[], LeetCode's interface (isInteger, getInteger, getList),
 * written in tests as nested arrays. A test is a sequence of calls like any design problem, so it
 * can call hasNext several times in a row, which a plain "drain the iterator" loop never does.
 */

import { mulberry32 } from '../../engine/rng.js';
import { checkNestedList } from '../../engine/structures.js';

const MAX_INTS = 50000;
const MAX_V = 1000000;
const MAX_DEPTH = 50;
const MAX_CALLS = 2 * MAX_INTS + 2;

/** All integers of a nested list, left to right. Iterative, so depth never matters here. */
export function flatten(list) {
  const out = [];
  const stack = [[list, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (top[1] === top[0].length) {
      stack.pop();
      continue;
    }
    const x = top[0][top[1]++];
    if (Array.isArray(x)) stack.push([x, 0]);
    else out.push(x);
  }
  return out;
}

/**
 * Reference simulation.
 * @param {string[]} ops operation names, ops[0] === 'NestedIterator'
 * @param {unknown[][]} args argument list per operation (args[0] = [nestedList])
 * @returns {(number|boolean|null)[]}
 */
export function reference(ops, args) {
  const values = flatten(args[0][0]);
  let i = 0;
  return ops.map((op, k) => {
    if (k === 0) return null;
    if (op === 'hasNext') return i < values.length;
    return values[i++];
  });
}

/** LeetCode's own test: while hasNext, call next. `repeat` adds extra hasNext calls before a next. */
export function drainOps(list, { seed = 0, repeat = 0 } = {}) {
  const n = flatten(list).length;
  const rnd = mulberry32(seed);
  const ops = ['NestedIterator'];
  for (let k = 0; k < n; k++) {
    const checks = 1 + (rnd() < repeat ? 1 + Math.floor(rnd() * 2) : 0);
    for (let c = 0; c < checks; c++) ops.push('hasNext');
    ops.push('next');
  }
  ops.push('hasNext');
  return [ops, [[list], ...ops.slice(1).map(() => [])]];
}

/** A random nested list with `ints` integers, empty lists sprinkled in, at most `depth` deep. */
function randomNested(seed, ints, depth) {
  const rnd = mulberry32(seed);
  const value = () => Math.floor(rnd() * (2 * MAX_V + 1)) - MAX_V;
  const root = [];
  const stack = [root];
  let placed = 0;
  while (placed < ints) {
    const r = rnd();
    const top = stack[stack.length - 1];
    if (r < 0.15 && stack.length < depth) {
      const child = [];
      top.push(child);
      stack.push(child);
    } else if (r < 0.25 && stack.length > 1) {
      stack.pop();
    } else if (r < 0.28 && stack.length < depth) {
      top.push([]);
    } else {
      top.push(value());
      placed++;
    }
  }
  return root;
}

/** One integer at the bottom of `depth` nested lists, with siblings on the way back up. */
function deepList(depth) {
  let cur = [5];
  for (let d = 1; d < depth; d++) cur = d % 3 ? [cur, d] : [[], cur];
  return cur;
}

const visibleLists = [
  { list: [[1, 1], 2, [1, 1]], note: 'Integers come out left to right, whatever list holds them.' },
  { list: [1, [4, [6]]], note: 'Nesting can go several levels deep.' },
  { list: [[], [3]], note: 'An empty list contributes nothing.' },
  { list: [[[]]], note: 'Nothing but empty lists: hasNext is false right away.' },
];
const visible = [
  ...visibleLists.map(({ list, note }) => {
    const args = drainOps(list);
    return { args, expected: reference(...args), note };
  }),
  {
    args: [['NestedIterator', 'hasNext', 'hasNext', 'next', 'hasNext', 'hasNext', 'next', 'hasNext'], [[[1, [], [2]]], [], [], [], [], [], [], []]],
    expected: [null, true, true, 1, true, true, 2, false],
    note: 'Asking hasNext twice must not skip a value.',
  },
];

// Hidden tests: empty lists everywhere (hasNext must look past them), repeated hasNext calls, deep
// nesting, and 5 * 10^4 integers, where flattening again or removing from the front of an array on
// every call is too slow.
const hiddenArgs = [
  drainOps([[]]),
  drainOps([[[]], [], [[[]]], 7, [[]]], { seed: 1, repeat: 1 }),
  drainOps([-1000000, [1000000]]),
  drainOps([[], 1, [], 2, [[]], [[3]], []], { seed: 2, repeat: 1 }),
  // The outer list is one level itself, so this reaches exactly MAX_DEPTH.
  drainOps([deepList(MAX_DEPTH - 1), 9, deepList(10)], { seed: 3, repeat: 0.5 }),
  drainOps(randomNested(5, 300, 8), { seed: 5, repeat: 0.5 }),
  drainOps(Array.from({ length: MAX_INTS }, (_, i) => i - 25000)),
  drainOps(randomNested(7, MAX_INTS, 20), { seed: 7, repeat: 0.3 }),
  drainOps([Array.from({ length: MAX_INTS - 1 }, (_, i) => (i * 7919) % 2000001 - MAX_V)]),
  drainOps(randomNested(11, 5000, MAX_DEPTH), { seed: 11, repeat: 0.2 }),
];

export const problem = {
  id: 'nested-flatten',
  title: 'Nested Flattener',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Iterator', 'Stack'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A nested list holds items that are either an integer or another nested list. You can only
    read it through the <code>NestedInteger</code> interface: <code>isInteger()</code>,
    <code>getInteger()</code> and <code>getList()</code>.</p>
    <p>Implement the class <code>NestedIterator</code>:</p>
    <ul>
      <li><code>NestedIterator(nestedList)</code> receives the list.</li>
      <li><code>next()</code> returns the next integer, in left to right order.</li>
      <li><code>hasNext()</code> returns whether any integer is left. Calling it never consumes one.</li>
    </ul>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments (the constructor's is the nested list, written as nested arrays), and the output
    lists each call's result (<code>null</code> for the constructor).</p>
  `,
  constraints: [
    'At most 5 * 10^4 integers in total, each from -10^6 to 10^6',
    `Lists are nested at most ${MAX_DEPTH} deep and may be empty`,
    'next is only called when hasNext would return true',
    'Target complexity: O(1) amortized per call',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Flattening everything up front works. What does it cost before the first next() returns?',
    'A recursive walk keeps its position on the call stack. Could you keep that position yourself?',
    'What should hasNext do when the next items are empty lists?',
    'If hasNext moves your position forward, what must stay true when it is called twice in a row?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'NestedIterator',
    constructor: { params: [{ name: 'nestedList', type: 'NestedInteger[]' }] },
    methods: [
      { name: 'next', params: [], returns: 'int' },
      { name: 'hasNext', params: [], returns: 'bool' },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: one nested list as JSON. The test drains it as LeetCode does: while hasNext, next.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let list;
    try {
      list = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the nested list as JSON, for example [[1,1],2,[1,1]].' };
    }
    const err = checkNestedList(list, MAX_DEPTH);
    if (err) return { ok: false, error: `The nested list ${err}.` };
    const values = flatten(list);
    if (values.length > MAX_INTS) return { ok: false, error: 'At most 5 * 10^4 integers.' };
    if (!values.every((v) => v >= -MAX_V && v <= MAX_V)) return { ok: false, error: 'Integers must be from -10^6 to 10^6.' };
    const args = drainOps(list);
    if (args[0].length > MAX_CALLS) return { ok: false, error: 'Too many calls.' };
    return { ok: true, args };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
