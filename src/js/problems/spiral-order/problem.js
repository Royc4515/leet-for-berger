/**
 * Problem: Spiral Order
 *
 * Read a matrix clockwise from the outside in. The classic boundary-shrinking walk: keep four
 * walls (top, bottom, left, right), sweep one side, move that wall inward. The bugs live in the
 * last layer of a non-square matrix, where a single leftover row or column gets read twice.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: four shrinking boundaries.
 * @param {number[][]} matrix
 * @returns {number[]} every value in clockwise spiral order
 */
export function reference(matrix) {
  const out = [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    for (let r = top + 1; r <= bottom; r++) out.push(matrix[r][right]);
    // A single remaining row or column was fully read by the two sweeps above.
    if (top < bottom && left < right) {
      for (let c = right - 1; c >= left; c--) out.push(matrix[bottom][c]);
      for (let r = bottom - 1; r > top; r--) out.push(matrix[r][left]);
    }
    top++;
    bottom--;
    left++;
    right--;
  }
  return out;
}

const MAX_DIM = 10;
const MAX_ABS = 100;

/** An m x n matrix of seeded values in [-100, 100]. */
function randomMatrix(seed, m, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(rnd() * (2 * MAX_ABS + 1)) - MAX_ABS));
}

/** An m x n matrix holding 1..m*n row by row, so the spiral order is easy to eyeball. */
const counting = (m, n) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));

const visible = [
  { args: [counting(3, 3)], expected: [1, 2, 3, 6, 9, 8, 7, 4, 5], note: 'Outer ring clockwise, then the center.' },
  { args: [counting(3, 4)], expected: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7], note: 'The inner layer of a 3 x 4 matrix is a single row.' },
  { args: [[[7]]], expected: [7], note: 'One cell.' },
  { args: [[[4, -2, 9, 0]]], expected: [4, -2, 9, 0], note: 'A single row is read left to right, once.' },
  { args: [[[5], [6], [-1]]], expected: [5, 6, -1], note: 'A single column is read top to bottom, once.' },
];

// Hidden tests: wide and tall shapes whose last layer is one row or one column (the double-read
// bug), 2 x 2, and full 10 x 10 matrices plus near-square ones at the size limit.
const hiddenArgs = [
  [counting(2, 2)],
  [counting(2, 3)],
  [counting(3, 2)],
  [randomMatrix(3, 3, 5)],
  [randomMatrix(5, 5, 3)],
  [randomMatrix(7, 1, MAX_DIM)],
  [randomMatrix(11, MAX_DIM, 1)],
  [randomMatrix(13, MAX_DIM, MAX_DIM)],
  [randomMatrix(17, MAX_DIM, MAX_DIM - 1)],
  [randomMatrix(19, MAX_DIM - 1, MAX_DIM)],
];

export const problem = {
  id: 'spiral-order',
  title: 'Spiral Order',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Matrix', 'Simulation', 'Boundary Shrinking'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['matrix'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a rectangular grid of integers <code>matrix</code> with <code>m</code> rows
    and <code>n</code> columns. Start at the top-left cell and walk clockwise around the outer
    edge: right along the top row, down the right column, left along the bottom row, up the left
    column. Then continue the same way on the next layer inside, until every cell is visited.</p>
    <p>Return the values in the order you visit them. Each cell appears exactly once.</p>
  `,
  constraints: [
    '1 <= m, n <= 10 (the grid does not have to be square)',
    '-100 <= matrix[i][j] <= 100',
    'Target complexity: O(m * n) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `matrix = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'After you finish the top row, which row or column can you never visit again?',
    'Which four numbers are enough to describe the part of the grid that is still unvisited?',
    'Trace a 3 x 4 grid by hand. What does the innermost layer look like, and how many sides does it have?',
    'When only one row or one column is left, which of your four sweeps would read it a second time?',
  ],

  signature: {
    name: 'spiralOrder',
    params: [{ name: 'matrix', type: 'int[][]' }],
    returns: 'int[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the matrix as a JSON array of rows, for example [[1,2],[3,4]].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let matrix;
    try {
      matrix = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the matrix as a JSON array of rows, for example [[1,2],[3,4]].' };
    }
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_DIM) return { ok: false, error: 'The matrix must have 1 to 10 rows.' };
    if (!matrix.every((row) => Array.isArray(row))) return { ok: false, error: 'Every row must be a JSON array.' };
    const n = matrix[0].length;
    if (n < 1 || n > MAX_DIM) return { ok: false, error: 'Rows must have 1 to 10 values.' };
    if (!matrix.every((row) => row.length === n)) return { ok: false, error: 'Every row must have the same length.' };
    if (!matrix.every((row) => row.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS))) return { ok: false, error: 'Values must be integers from -100 to 100.' };
    return { ok: true, args: [matrix] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
