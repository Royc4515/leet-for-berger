/**
 * Problem: Region Sum (design)
 *
 * Answer many rectangle-sum queries on a fixed matrix. The canonical 2D prefix sum: precompute
 * P[r][c] = sum of the block above and left of (r, c), then any rectangle is four lookups by
 * inclusion-exclusion. With 10^5 queries on a 200 x 200 matrix, summing each rectangle cell by
 * cell is about 4 * 10^9 additions.
 *
 * Design problems are tested as a sequence of operations: args are [operations, argumentLists]
 * and the expected value lists every operation's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';
import { intGrid, randInt } from '../../engine/growth-inputs.js';

const MAX_DIM = 200;
const MAX_ABS = 10000;
const MAX_QUERIES = 100000;

/**
 * Reference simulation: one 2D prefix table built by the constructor, O(1) per query.
 * @param {string[]} ops operation names, ops[0] === 'NumMatrix'
 * @param {unknown[][]} args argument list per operation; args[0] is [matrix]
 * @returns {(number|null)[]}
 */
export function reference(ops, args) {
  const matrix = args[0][0];
  const rows = matrix.length;
  const cols = matrix[0].length;
  // One extra row and column of zeros, so queries touching row 0 or column 0 need no special case.
  const P = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) P[r + 1][c + 1] = matrix[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c];
  }
  return ops.map((op, i) => {
    if (op !== 'sumRegion') return null;
    const [r1, c1, r2, c2] = args[i];
    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
  });
}

function randomMatrix(rnd, rows, cols, lo, hi) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => lo + Math.floor(rnd() * (hi - lo + 1))));
}

function randomQuery(rnd, rows, cols) {
  const a = Math.floor(rnd() * rows);
  const b = Math.floor(rnd() * rows);
  const c = Math.floor(rnd() * cols);
  const d = Math.floor(rnd() * cols);
  return [Math.min(a, b), Math.min(c, d), Math.max(a, b), Math.max(c, d)];
}

/** A matrix and `queries` calls, each query drawn by `queryOf`. */
function session(matrix, queries, queryOf) {
  const ops = ['NumMatrix', ...Array(queries).fill('sumRegion')];
  const args = [[matrix], ...Array.from({ length: queries }, (_, q) => queryOf(q))];
  return [ops, args];
}

function randomSession(seed, rows, cols, queries) {
  const rnd = mulberry32(seed);
  const matrix = randomMatrix(rnd, rows, cols, -MAX_ABS, MAX_ABS);
  return session(matrix, queries, () => randomQuery(rnd, rows, cols));
}

const grid3 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const visible = [
  {
    args: [['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], [[grid3], [0, 0, 2, 2], [1, 1, 2, 2], [0, 1, 1, 2]]],
    expected: [null, 45, 28, 16],
    note: 'The whole grid, the bottom-right 2 x 2 block (5+6+8+9), and the top-right 2 x 2 block (2+3+5+6).',
  },
  {
    args: [['NumMatrix', 'sumRegion'], [[[[-4]]], [0, 0, 0, 0]]],
    expected: [null, -4],
    note: 'A 1 x 1 matrix: the only rectangle is the single cell.',
  },
  {
    args: [['NumMatrix', 'sumRegion', 'sumRegion'], [[[[1, -2, 3, -4]]], [0, 1, 0, 3], [0, 0, 0, 0]]],
    expected: [null, -3, 1],
    note: 'A single row behaves like a 1D prefix sum.',
  },
  {
    args: [['NumMatrix', 'sumRegion', 'sumRegion'], [[[[-1, -2, -3], [-4, -5, -6]]], [0, 0, 1, 2], [1, 0, 1, 0]]],
    expected: [null, -21, -4],
    note: 'Negative values work the same way.',
  },
  {
    args: [['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], [[grid3], [2, 2, 2, 2], [1, 0, 2, 1], [2, 2, 2, 2]]],
    expected: [null, 9, 24, 9],
    note: 'The matrix never changes, so repeating a query gives the same answer.',
  },
];

// Hidden tests: a single column, rectangles on the last row and column (off-by-one at the far
// edge), rectangles starting at row 0 or column 0, thin matrices, and 10^5 queries on 200 x 200
// where summing each rectangle cell by cell is far too slow.
const col3 = [[1], [2], [3]];
const edges = randomMatrix(mulberry32(5), 6, 7, -9, 9);
const hiddenArgs = [
  [['NumMatrix', 'sumRegion', 'sumRegion', 'sumRegion'], [[col3], [0, 0, 2, 0], [1, 0, 1, 0], [2, 0, 2, 0]]],
  session(edges, 6, (q) => [[5, 0, 5, 6], [0, 6, 5, 6], [5, 6, 5, 6], [3, 4, 5, 6], [0, 0, 5, 6], [4, 5, 5, 6]][q]),
  session(edges, 6, (q) => [[0, 0, 0, 0], [0, 0, 3, 0], [0, 0, 0, 4], [0, 2, 4, 3], [2, 0, 3, 5], [1, 1, 4, 5]][q]),
  randomSession(7, 20, 30, 500),
  randomSession(11, 1, MAX_DIM, 1000),
  randomSession(13, MAX_DIM, 1, 1000),
  randomSession(17, 50, 50, 5000),
  randomSession(19, MAX_DIM, MAX_DIM, MAX_QUERIES),
  session(Array.from({ length: MAX_DIM }, () => Array(MAX_DIM).fill(MAX_ABS)), MAX_QUERIES, () => [0, 0, MAX_DIM - 1, MAX_DIM - 1]),
  (() => {
    const rnd = mulberry32(23);
    const m = randomMatrix(rnd, MAX_DIM, MAX_DIM, -MAX_ABS, MAX_ABS);
    // Mostly large rectangles: these are the ones a cell-by-cell sum pays the most for.
    return session(m, MAX_QUERIES, () => {
      const r1 = Math.floor(rnd() * 10);
      const c1 = Math.floor(rnd() * 10);
      return [r1, c1, MAX_DIM - 1 - Math.floor(rnd() * 10), MAX_DIM - 1 - Math.floor(rnd() * 10)];
    });
  })(),
];

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export const problem = {
  id: 'region-sum',
  title: 'Region Sum',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Prefix Sum', '2D Prefix Sum'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Design a class that answers rectangle-sum questions about a fixed integer matrix. Implement
    <code>NumMatrix</code>:</p>
    <ul>
      <li><code>NumMatrix(matrix)</code> stores the matrix. It never changes afterwards.</li>
      <li><code>sumRegion(row1, col1, row2, col2)</code> returns the sum of every cell
      <code>matrix[r][c]</code> with <code>row1 &lt;= r &lt;= row2</code> and
      <code>col1 &lt;= c &lt;= col2</code>: the rectangle whose top-left corner is
      <code>(row1, col1)</code> and bottom-right corner is <code>(row2, col2)</code>, both included.</li>
    </ul>
    <p>There can be many queries, so each <code>sumRegion</code> call should take constant time.
    A test is a sequence of calls: the first list names the operations, the second gives each
    call's arguments, and the output lists each call's result (<code>null</code> for the
    constructor).</p>
  `,
  constraints: [
    '1 <= rows, cols <= 200 (matrix is rectangular)',
    '-10^4 <= matrix[r][c] <= 10^4',
    '0 <= row1 <= row2 < rows, 0 <= col1 <= col2 < cols',
    'At most 10^5 calls to sumRegion',
    'Target complexity: O(rows * cols) to build, O(1) per query',
  ],
  examples: visible.slice(0, 2).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'In one dimension, how do you get the sum of nums[i..j] in constant time after some preprocessing?',
    'What if you stored, for every cell, the sum of the whole block from the top-left corner to that cell?',
    'Draw a rectangle inside the grid. Which corner blocks would you add and subtract to isolate it?',
    'When you subtract two overlapping blocks, which part did you remove twice?',
    'How can an extra row and column of zeros remove the special cases at row 0 and column 0?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>In the constructor, build a prefix table <code>p</code> with one extra row and column of zeros,
    where <code>p[r + 1][c + 1]</code> is the sum of the block from <code>(0, 0)</code> to <code>(r,
    c)</code>. Every query is then four lookups.</p>
    <h4>Why it works</h4>
    <p>The rectangle is the block up to <code>(row2, col2)</code>, minus the strip above
    <code>row1</code>, minus the strip left of <code>col1</code>. Those two strips overlap in the block
    above and to the left of <code>(row1, col1)</code>, which was subtracted twice, so it is added back
    once. The table is built with the same rule: the cell, plus the block above, plus the block to the
    left, minus their overlap.</p>
    <h4>Complexity</h4>
    <p>O(rows * cols) time and space to build. O(1) per <code>sumRegion</code>. Summing the cells of
    each query costs up to 4 * 10^4 additions per call, about 4 * 10^9 over 10^5 queries.</p>
    <h4>Pitfall</h4>
    <p>Off-by-one with the padded table. The query reads <code>p[row2 + 1][col2 + 1]</code> and
    <code>p[row1][col1]</code>, not <code>p[row2][col2]</code>. Without the padding, rectangles that
    touch row 0 or column 0 need separate cases, and those are easy to get wrong.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'NumMatrix',
    constructor: { params: [{ name: 'matrix', type: 'int[][]' }] },
    methods: [
      {
        name: 'sumRegion',
        params: [
          { name: 'row1', type: 'int' },
          { name: 'col1', type: 'int' },
          { name: 'row2', type: 'int' },
          { name: 'col2', type: 'int' },
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
    if (ops.length - 1 > MAX_QUERIES) return { ok: false, error: 'At most 10^5 calls to sumRegion.' };
    if (ops[0] !== 'NumMatrix' || !Array.isArray(args[0]) || args[0].length !== 1) return { ok: false, error: 'The first call must be "NumMatrix" with the matrix as its one argument.' };
    const matrix = args[0][0];
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_DIM) return { ok: false, error: 'The matrix must have 1 to 200 rows.' };
    const cols = Array.isArray(matrix[0]) ? matrix[0].length : 0;
    if (cols < 1 || cols > MAX_DIM) return { ok: false, error: 'The matrix must have 1 to 200 columns.' };
    for (const row of matrix) {
      if (!Array.isArray(row) || row.length !== cols) return { ok: false, error: 'Every row must have the same length.' };
      if (!row.every((v) => isInt(v, -MAX_ABS, MAX_ABS))) return { ok: false, error: 'Values must be integers from -10^4 to 10^4.' };
    }
    const rows = matrix.length;
    for (let i = 1; i < ops.length; i++) {
      if (ops[i] !== 'sumRegion') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 4) return { ok: false, error: `sumRegion takes four integers (call ${i}).` };
      const [r1, c1, r2, c2] = a;
      if (!isInt(r1, 0, rows - 1) || !isInt(r2, r1, rows - 1) || !isInt(c1, 0, cols - 1) || !isInt(c2, c1, cols - 1)) {
        return { ok: false, error: `Call ${i}: need 0 <= row1 <= row2 < rows and 0 <= col1 <= col2 < cols.` };
      }
    }
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
  growth: {
    target: 'n',
    n: 'number of calls (a fixed 200 x 200 matrix, so building it is a constant)',
    sizes: [8000, 16000, 32000, 64000, 128000, 256000, 512000, 1024000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const matrix = intGrid(MAX_DIM * MAX_DIM, rnd, { rows: MAX_DIM, cols: MAX_DIM, min: -MAX_ABS, max: MAX_ABS });
      const ops = ['NumMatrix'];
      const args = [[matrix]];
      while (ops.length < n) {
        const r1 = randInt(rnd, 0, MAX_DIM - 1);
        const r2 = randInt(rnd, r1, MAX_DIM - 1);
        const c1 = randInt(rnd, 0, MAX_DIM - 1);
        const c2 = randInt(rnd, c1, MAX_DIM - 1);
        ops.push('sumRegion');
        args.push([r1, c1, r2, c2]);
      }
      return [ops, args];
    },
  },
};

export default problem;
