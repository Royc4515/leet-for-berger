/**
 * Problem: Zero Rows and Columns
 *
 * Every zero wipes out its whole row and column. Two traps: zeroing while you scan creates new
 * zeros that spread further (the cascade bug), and the O(1)-space version reuses the first row
 * and column as markers, which needs separate flags for whether those two lines held a zero.
 * The harness judges the returned matrix, so solutions update the input in place and return it.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: first row and first column as markers, plus two flags. Works on a copy.
 * @param {number[][]} matrix
 * @returns {number[][]} the matrix after clearing every row and column that held a zero
 */
export function reference(matrix) {
  // The reference also computes hidden expectations, so it must not mutate its argument.
  const g = matrix.map((row) => [...row]);
  const m = g.length;
  const n = g[0].length;
  const firstRowZero = g[0].includes(0);
  const firstColZero = g.some((row) => row[0] === 0);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (g[i][j] === 0) {
        g[i][0] = 0;
        g[0][j] = 0;
      }
    }
  }
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) if (g[i][0] === 0 || g[0][j] === 0) g[i][j] = 0;
  }
  // The marker line is cleared last, after every other cell has read it.
  if (firstRowZero) g[0].fill(0);
  if (firstColZero) for (const row of g) row[0] = 0;
  return g;
}

const MAX_DIM = 200;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

/**
 * A seeded m x n matrix of nonzero values spread over the 32-bit range, with zeros at the given
 * cells plus `extra` random ones.
 */
function gridWithZeros(seed, m, n, zeroCells, extra) {
  const rnd = mulberry32(seed);
  const g = Array.from({ length: m }, () =>
    Array.from({ length: n }, () => {
      const v = Math.floor(rnd() * 4294967296) + INT_MIN;
      return v === 0 ? 1 : v;
    }),
  );
  for (const [r, c] of zeroCells) g[r][c] = 0;
  for (let k = 0; k < extra; k++) g[Math.floor(rnd() * m)][Math.floor(rnd() * n)] = 0;
  return g;
}

const visible = [
  { args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: [[1, 0, 1], [0, 0, 0], [1, 0, 1]], note: 'The center zero clears the middle row and the middle column.' },
  { args: [[[3, 0, 8, 6], [2, 7, 1, 0], [4, 9, 5, 3]]], expected: [[0, 0, 0, 0], [0, 0, 0, 0], [4, 0, 5, 0]], note: 'Only zeros from the original matrix count; new zeros do not spread.' },
  { args: [[[7]]], expected: [[7]], note: 'No zeros, nothing changes.' },
  { args: [[[0, 0], [0, 0]]], expected: [[0, 0], [0, 0]], note: 'All zeros stay zeros.' },
  { args: [[[INT_MAX, INT_MIN], [0, 5]]], expected: [[0, INT_MIN], [0, 0]], note: 'Values use the full 32-bit range.' },
];

// Hidden tests: a lone cell, single row and single column, a zero at [0][0] or only in the
// first row or only in the first column (where the marker trick breaks), a scan that would
// cascade, and 200 x 200 grids where an O(m * n * (m + n)) clear is slow.
const hiddenArgs = [
  [[[0]]],
  [[[5, 0, -3]]],
  [[[1], [0], [2]]],
  [[[0, 1, 2], [3, 4, 5], [6, 7, 8]]],
  [[[1, 2, 0], [4, 5, 6], [7, 8, 9]]],
  [[[1, 2, 3], [0, 5, 6], [7, 8, 9]]],
  [gridWithZeros(7, 6, 8, [[2, 3]], 2)],
  [gridWithZeros(11, MAX_DIM, MAX_DIM, [], 6)],
  [gridWithZeros(13, MAX_DIM, MAX_DIM, [[0, 150], [120, 0]], 0)],
  [gridWithZeros(17, MAX_DIM, MAX_DIM - 1, [], 0)],
];

export const problem = {
  id: 'zero-rows-cols',
  title: 'Zero Rows and Columns',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Matrix', 'In-Place Markers'],
  timeLimitMs: 2000,
  argNames: ['matrix'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an <code>m x n</code> grid of integers <code>matrix</code>. Wherever the
    grid holds a <code>0</code>, set every value in that cell's row and every value in that
    cell's column to <code>0</code>. Only zeros present in the original grid trigger this;
    a value that became zero because of another zero does not clear anything further.</p>
    <p>Update <code>matrix</code> in place and return it. Remembering every affected row and
    column takes <code>O(m + n)</code> extra space; try to get it down to <code>O(1)</code> by
    storing those notes inside the grid itself.</p>
  `,
  constraints: [
    '1 <= m, n <= 200',
    '-2^31 <= matrix[i][j] <= 2^31 - 1',
    'Target complexity: O(m * n) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `matrix = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you set a row to zero the moment you find a zero, what happens when your scan reaches that row?',
    'What is the smallest amount you need to remember about each row and each column?',
    'Is there a row and a column inside the grid that could hold those notes for all the others?',
    'If that row and column are now notes, how do you still know whether they themselves contained a zero?',
    'In which order must you clear the cells so no note is erased before it is read?',
  ],

  signature: {
    name: 'setZeroes',
    params: [{ name: 'matrix', type: 'int[][]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the matrix as a JSON array of rows, for example [[1,0],[3,4]].
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let matrix;
    try {
      matrix = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the matrix as a JSON array of rows, for example [[1,0],[3,4]].' };
    }
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_DIM) return { ok: false, error: 'The matrix must have 1 to 200 rows.' };
    if (!matrix.every((row) => Array.isArray(row))) return { ok: false, error: 'Every row must be a JSON array.' };
    const n = matrix[0].length;
    if (n < 1 || n > MAX_DIM) return { ok: false, error: 'Rows must have 1 to 200 values.' };
    if (!matrix.every((row) => row.length === n)) return { ok: false, error: 'Every row must have the same length.' };
    if (!matrix.every((row) => row.every((v) => Number.isInteger(v) && v >= INT_MIN && v <= INT_MAX))) return { ok: false, error: 'Values must be 32-bit integers.' };
    return { ok: true, args: [matrix] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
