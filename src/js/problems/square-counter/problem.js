/**
 * Problem: Square Counter (design)
 *
 * Points arrive one at a time (duplicates allowed); a query asks how many axis-aligned squares
 * of positive area have the query point as one corner and three stored points as the others.
 * With the query point fixed, a corner on the same vertical line fixes the side length, and the
 * square then lies to the left or to the right. Walking only the distinct points in the query's
 * column (trying both sides) is O(column) per query; scanning every stored point, or every
 * triple, is far slower at 5 * 10^4 calls.
 *
 * Limits are raised from the usual 3000 calls to 5 * 10^4, so counts can pass 2^31 (the product
 * of three multiplicities): count returns a 64-bit integer.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor and void calls).
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_COORD = 1000;
const MAX_CALLS = 50000;
const SIDE = MAX_COORD + 1;

/**
 * Reference simulation: multiplicity per point plus the distinct y values of each column.
 * @param {string[]} ops operation names, ops[0] === 'SquareCounter'
 * @param {number[][][]} args argument list per operation (each a single [x, y] point)
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const cnt = new Map();
  const columns = new Map();
  const at = (x, y) => cnt.get(x * SIDE + y) ?? 0;
  return ops.map((op, i) => {
    if (op === 'add') {
      const [x, y] = args[i][0];
      const key = x * SIDE + y;
      if (!cnt.has(key)) {
        if (!columns.has(x)) columns.set(x, []);
        columns.get(x).push(y);
      }
      cnt.set(key, at(x, y) + 1);
      return null;
    }
    if (op === 'count') {
      const [x, y] = args[i][0];
      let total = 0;
      for (const y2 of columns.get(x) ?? []) {
        if (y2 === y) continue;
        const d = y2 - y;
        for (const x2 of [x - d, x + d]) {
          if (x2 < 0 || x2 > MAX_COORD) continue;
          total += at(x, y2) * at(x2, y) * at(x2, y2);
        }
      }
      return total;
    }
    return null; // constructor
  });
}

/** A session of `calls` calls; each is a count with probability countRate, else an add. */
function session(seed, calls, countRate, point) {
  const rnd = mulberry32(seed);
  const ops = ['SquareCounter'];
  const args = [[]];
  for (let k = 0; k < calls; k++) {
    ops.push(rnd() < countRate ? 'count' : 'add');
    args.push([point(rnd, k)]);
  }
  return [ops, args];
}

/** `adds` adds followed by `counts` counts, all at points from `point`. */
function addsThenCounts(seed, adds, counts, point) {
  const rnd = mulberry32(seed);
  const ops = ['SquareCounter'];
  const args = [[]];
  for (let k = 0; k < adds + counts; k++) {
    ops.push(k < adds ? 'add' : 'count');
    args.push([point(rnd, k)]);
  }
  return [ops, args];
}

/** A seeded point with both coordinates in [lo, hi]. */
const box = (lo, hi) => (rnd) => [lo + Math.floor(rnd() * (hi - lo + 1)), lo + Math.floor(rnd() * (hi - lo + 1))];

/** Three corners of a big square, each added `times` times, then count at the fourth. */
function heavyCorners(times) {
  const ops = ['SquareCounter'];
  const args = [[]];
  for (const p of [[0, 0], [0, MAX_COORD], [MAX_COORD, 0]]) {
    for (let k = 0; k < times; k++) {
      ops.push('add');
      args.push([p]);
    }
  }
  ops.push('count', 'count', 'count');
  args.push([[MAX_COORD, MAX_COORD]], [[0, 0]], [[MAX_COORD, MAX_COORD]]);
  return [ops, args];
}

const visible = [
  {
    args: [['SquareCounter', 'add', 'add', 'add', 'count', 'count', 'add', 'count'], [[], [[3, 10]], [[11, 2]], [[3, 2]], [[11, 10]], [[14, 8]], [[11, 2]], [[11, 10]]]],
    expected: [null, null, null, null, 1, 0, null, 2],
    note: '(3, 10), (11, 2) and (3, 2) complete a square with (11, 10). After (11, 2) is added again, there are two ways to pick that corner.',
  },
  {
    args: [['SquareCounter', 'add', 'add', 'add', 'count'], [[], [[1, 1]], [[1, 1]], [[1, 1]], [[1, 1]]]],
    expected: [null, null, null, null, 0],
    note: 'A square must have positive area, so a point cannot form one with copies of itself.',
  },
  {
    args: [['SquareCounter', 'add', 'add', 'add', 'add', 'add', 'count'], [[], [[5, 5]], [[5, 7]], [[3, 5]], [[3, 7]], [[7, 7]], [[5, 5]]]],
    expected: [null, null, null, null, null, null, 1],
    note: 'The square to the left, with (5, 7), (3, 5) and (3, 7), is complete. The one to the right lacks (7, 5). The stored copy of (5, 5) has zero distance to the query, so it never counts.',
  },
  {
    args: [['SquareCounter', 'add', 'add', 'add', 'count', 'count'], [[], [[2, 2]], [[2, 4]], [[4, 2]], [[4, 4]], [[0, 0]]]],
    expected: [null, null, null, null, 1, 0],
    note: 'The square with corners (2, 2), (2, 4), (4, 2) and (4, 4). No square has a corner at (0, 0) yet.',
  },
  {
    args: [['SquareCounter', 'add', 'add', 'add', 'add', 'add', 'count'], [[], [[2, 0]], [[2, 2]], [[0, 0]], [[4, 0]], [[4, 2]], [[2, 0]]]],
    expected: [null, null, null, null, null, null, 1],
    note: 'The square to the right, with (2, 2), (4, 0) and (4, 2), is complete. The one to the left lacks (0, 2).',
  },
];

// Hidden tests: squares on both sides of the query, squares that would leave the grid, rectangles
// that are not squares, counts past 2^32 (1700 copies of each corner), and 5 * 10^4-call sessions
// on a sparse full grid, a dense small grid and an interleaved medium grid.
const hiddenArgs = [
  [['SquareCounter', 'add', 'add', 'add', 'add', 'add', 'add', 'count'], [[], [[5, 0]], [[5, 3]], [[2, 0]], [[2, 3]], [[8, 0]], [[8, 3]], [[5, 0]]]],
  [['SquareCounter', 'add', 'add', 'add', 'count', 'count'], [[], [[0, 1000]], [[1000, 0]], [[0, 0]], [[1000, 1000]], [[500, 500]]]],
  [['SquareCounter', 'add', 'add', 'add', 'add', 'count', 'count'], [[], [[0, 0]], [[0, 2]], [[3, 0]], [[3, 2]], [[0, 0]], [[3, 2]]]],
  [['SquareCounter', 'add', 'add', 'add', 'add', 'add', 'add', 'count'], [[], [[1, 1]], [[1, 1]], [[1, 2]], [[2, 1]], [[2, 1]], [[2, 1]], [[2, 2]]]],
  session(191, 2000, 0.3, box(0, 6)),
  heavyCorners(1700),
  addsThenCounts(193, 25000, 25000, box(0, MAX_COORD)),
  addsThenCounts(197, 25000, 25000, box(0, 20)),
  session(199, 20000, 0.5, box(0, 25)),
  session(211, 20000, 0.4, (rnd) => [Math.floor(rnd() * 4) * 7, Math.floor(rnd() * 25)]),
];

const isPoint = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_COORD);

export const problem = {
  id: 'square-counter',
  title: 'Square Counter',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Hash Map', 'Counting'],
  timeLimitMs: 4000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Points on a grid arrive one at a time; the same point can arrive several times, and each
    copy counts separately. Design a class that answers: how many squares can be completed from a
    query point? Implement <code>SquareCounter</code>:</p>
    <ul>
      <li><code>SquareCounter()</code> starts with no points.</li>
      <li><code>add(point)</code> stores <code>point = [x, y]</code>.</li>
      <li><code>count(point)</code> returns the number of ways to choose three stored points
      that, together with the query <code>point</code>, are the four corners of a square with
      positive area and sides parallel to the axes. The query point itself is not stored.</li>
    </ul>
    <p>Copies are distinct choices: if a needed corner was added twice, each square through it
    counts twice. Counts can exceed 2<sup>31</sup> - 1, so <code>count</code> returns a 64-bit
    integer.</p>
    <p>A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor and for calls that return nothing).</p>
  `,
  constraints: [
    'point = [x, y] with 0 <= x, y <= 1000',
    'At most 5 * 10^4 calls to add and count in total',
    'count can exceed 32 bits: return a 64-bit integer',
    'Target complexity: O(1) per add; per count, proportional to the distinct points sharing the query\'s x',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'Fix the query corner. If you also knew one more corner, how many squares would be possible?',
    'Which corner is easiest to enumerate: one in the same row, the same column, or on the diagonal?',
    'Once you pick a corner on the query\'s vertical line, where can the other two corners be? Is there more than one square?',
    'How do duplicate points change the count, and what structure gives you a point\'s multiplicity in O(1)?',
    'If each of the three corners was added 2000 times, how large is the answer?',
  ],

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'SquareCounter',
    constructor: { params: [] },
    methods: [
      { name: 'add', params: [{ name: 'point', type: 'int[]' }], returns: 'void' },
      { name: 'count', params: [{ name: 'point', type: 'int[]' }], returns: 'long' },
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
    if (ops[0] !== 'SquareCounter' || !Array.isArray(args[0]) || args[0].length !== 0) return { ok: false, error: 'The first call must be "SquareCounter" with no arguments.' };
    if (ops.length - 1 > MAX_CALLS) return { ok: false, error: 'At most 5 * 10^4 calls after the constructor.' };
    for (let i = 1; i < ops.length; i++) {
      if (ops[i] !== 'add' && ops[i] !== 'count') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 1 || !isPoint(a[0])) return { ok: false, error: `Call ${i}: ${ops[i]} takes one point [x, y] with coordinates from 0 to 1000.` };
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
