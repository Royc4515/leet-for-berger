/**
 * Problem: Rotate Grid
 *
 * Turn a square matrix a quarter turn clockwise without a second matrix. The standard trick is
 * two easy in-place moves that compose into the hard one: transpose (swap across the main
 * diagonal), then reverse each row. The harness judges the returned matrix, so solutions rotate
 * the input in place and return it.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: transpose, then mirror each row, all in place on a copy.
 * @param {number[][]} matrix
 * @returns {number[][]} the matrix rotated 90 degrees clockwise
 */
export function reference(matrix) {
  // The reference also computes hidden expectations, so it must not mutate its argument.
  const g = matrix.map((row) => [...row]);
  const n = g.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) [g[i][j], g[j][i]] = [g[j][i], g[i][j]];
  }
  for (const row of g) row.reverse();
  return g;
}

const MAX_N = 20;
const MAX_ABS = 1000;

/** An n x n matrix of seeded values in [-1000, 1000]. */
function randomSquare(seed, n) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(rnd() * (2 * MAX_ABS + 1)) - MAX_ABS));
}

/** An n x n matrix holding 1..n*n row by row, so a misplaced cell is easy to spot. */
const counting = (n) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));

const visible = [
  { args: [counting(3)], expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]], note: 'The first column, read bottom to top, becomes the first row.' },
  { args: [counting(4)], expected: [[13, 9, 5, 1], [14, 10, 6, 2], [15, 11, 7, 3], [16, 12, 8, 4]], note: 'An even size has no center cell.' },
  { args: [[[42]]], expected: [[42]], note: 'A 1 x 1 matrix does not change.' },
  { args: [[[1, 2], [3, 4]]], expected: [[3, 1], [4, 2]], note: 'Each corner moves one corner clockwise.' },
  { args: [[[-5, 0, 5], [0, 0, 0], [5, 0, -5]]], expected: [[5, 0, -5], [0, 0, 0], [-5, 0, 5]], note: 'Negative values move like any other.' },
];

// Hidden tests: odd and even sizes (the center cell and the ring count are where in-place loops
// go wrong), repeated values, a rotation done counterclockwise by mistake, and full 20 x 20 grids.
const hiddenArgs = [
  [[[-1000]]],
  [[[0, -1], [1000, 7]]],
  [counting(5)],
  [counting(6)],
  [[[1, 1, 2, 2], [1, 1, 2, 2], [3, 3, 4, 4], [3, 3, 4, 4]]],
  [randomSquare(7, 7)],
  [randomSquare(11, 8)],
  [randomSquare(13, MAX_N - 1)],
  [randomSquare(17, MAX_N)],
  [counting(MAX_N)],
];

export const problem = {
  id: 'rotate-grid',
  title: 'Rotate Grid',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Matrix', 'Transpose and Reflect', 'In-Place'],
  milestone: 1,
  timeLimitMs: 2000,
  argNames: ['matrix'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an <code>n x n</code> grid of integers <code>matrix</code>. Rotate it a
    quarter turn (90 degrees) clockwise: the left column, read from bottom to top, becomes the
    top row, and so on.</p>
    <p>Aim to do it <strong>in place</strong>: rearrange the values inside <code>matrix</code>
    itself instead of filling a second <code>n x n</code> grid. When you are done, return
    <code>matrix</code> so it can be checked.</p>
  `,
  constraints: [
    '1 <= n <= 20',
    'matrix has n rows of n values each',
    '-1000 <= matrix[i][j] <= 1000',
    'Target complexity: O(n^2) time, O(1) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `matrix = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'With a second grid this is easy. For the cell at row i, column j, where does its value end up?',
    'Without a second grid, writing one value overwrites another. Which group of cells trade places with each other?',
    'Can you build the rotation from simpler in-place moves, like a mirror across a diagonal or a line?',
    'Which pairs does a mirror across the main diagonal swap, and how do you avoid swapping each pair twice?',
  ],

  signature: {
    name: 'rotateGrid',
    params: [{ name: 'matrix', type: 'int[][]' }],
    returns: 'int[][]',
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
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_N) return { ok: false, error: 'The matrix must have 1 to 20 rows.' };
    const n = matrix.length;
    if (!matrix.every((row) => Array.isArray(row) && row.length === n)) return { ok: false, error: 'The matrix must be square: n rows of n values.' };
    if (!matrix.every((row) => row.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_ABS))) return { ok: false, error: 'Values must be integers from -1000 to 1000.' };
    return { ok: true, args: [matrix] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
