/**
 * Problem: Matrix Search
 *
 * Membership test in a matrix whose rows, read one after another, form a single sorted list.
 * Treating index i as cell (i / n, i % n) turns the matrix into a virtual sorted array, so one
 * binary search answers in O(log(m * n)) without copying anything.
 *
 * The hidden tests target the row boundaries: a target that falls in the gap between the last
 * value of one row and the first value of the next, and single-row or single-column shapes.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_DIM = 300;
const MAX_V = 1000000000;

/**
 * Reference: binary search over the virtual flattened array.
 * @param {number[][]} matrix
 * @param {number} target
 * @returns {boolean}
 */
export function reference(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let lo = 0;
  let hi = m * n - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = matrix[Math.floor(mid / n)][mid % n];
    if (v === target) return true;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

/**
 * Seeded m x n matrix of strictly increasing values (row by row) within +-10^9. Gaps of at least
 * 2 leave room for absent targets between neighbours.
 */
function sortedMatrix(seed, m, n) {
  const rnd = mulberry32(seed);
  const maxGap = Math.max(3, Math.floor((2 * MAX_V) / (m * n)));
  let v = -MAX_V + Math.floor(rnd() * 10);
  return Array.from({ length: m }, () =>
    Array.from({ length: n }, () => {
      const cur = v;
      v += 2 + Math.floor(rnd() * (maxGap - 2));
      return cur;
    }),
  );
}

const big1 = sortedMatrix(7, MAX_DIM, MAX_DIM);
const big2 = sortedMatrix(11, MAX_DIM, MAX_DIM);
const tall = sortedMatrix(13, MAX_DIM, 1);

const visible = [
  { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true, note: '3 is in the first row.' },
  { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false, note: '13 would sit between 11 and 16, but it is not there.' },
  { args: [[[5]], 5], expected: true, note: 'A 1 x 1 matrix holding the target.' },
  { args: [[[1, 3, 5, 7], [10, 11, 16, 20]], 8], expected: false, note: '8 falls between the end of row 0 (7) and the start of row 1 (10).' },
  { args: [[[-4, -4, -2], [0, 2, 2]], -4], expected: true, note: 'Values may repeat within a row.' },
];

// Hidden tests: targets below the first and above the last value, the very last cell, single row
// and single column, a gap between rows, and two 300 x 300 matrices with the target present or
// absent.
const hiddenArgs = [
  [[[1]], 2],
  [[[1, 3]], 3],
  [[[1], [3], [5]], 4],
  [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 0],
  [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 61],
  [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 60],
  [tall, tall[MAX_DIM - 1][0] - 1],
  [big1, big1[123][299]],
  [big1, big1[150][0] - 1],
  [big2, big2[299][299]],
];

export const problem = {
  id: 'matrix-search',
  title: 'Matrix Search',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Binary Search', 'Matrix'],
  timeLimitMs: 3000,
  argNames: ['matrix', 'target'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an <code>m x n</code> integer matrix with two properties:</p>
    <ul>
      <li>each row is sorted in non-decreasing order;</li>
      <li>the first value of each row is greater than the last value of the row above it.</li>
    </ul>
    <p>Return <code>true</code> if <code>target</code> appears in the matrix and
    <code>false</code> otherwise. Aim for <code>O(log(m * n))</code> time.</p>
  `,
  constraints: [
    '1 <= m, n <= 300 (raised from LeetCode\'s 100)',
    '-10^9 <= matrix[i][j], target <= 10^9',
    'Rows non-decreasing; each row starts above the previous row\'s last value',
    'Target complexity: O(log(m * n)) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `matrix = ${JSON.stringify(t.args[0])}, target = ${t.args[1]}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you read the rows one after another, what kind of list do you get?',
    'Could you binary search that list without building it?',
    'Given a position i in the virtual list, which row and column hold it?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Read row after row and the matrix is one sorted list of <code>m * n</code> values. Binary search
    that virtual list directly, mapping position <code>i</code> to cell <code>(i / n, i % n)</code> with
    integer division, without copying anything.</p>
    <h4>Why it works</h4>
    <p>Each row is sorted and each row starts above the previous row's last value, so the row-by-row order
    is non-decreasing. The search finds the first position whose value is <code>&gt;= target</code>; if
    the target is anywhere in the matrix, that position holds it, so one final comparison answers the
    question. A target that falls in the gap between two rows lands on the next row's first value and
    correctly fails.</p>
    <h4>Complexity</h4>
    <p>O(log(m * n)) time, about 17 steps for a 300 x 300 matrix. O(1) space. Scanning every cell is
    O(m * n).</p>
    <h4>Pitfall</h4>
    <p>Convert positions with the column count <code>n</code>, not the row count <code>m</code>: on a
    square matrix both work, so the bug only shows up on single-row, single-column or other non-square
    shapes. In JavaScript, use <code>Math.floor(i / n)</code>, since <code>/</code> alone gives a
    fraction.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'searchMatrix',
    params: [
      { name: 'matrix', type: 'int[][]' },
      { name: 'target', type: 'int' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: matrix as a JSON array of rows, then target, one per line.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter matrix on line 1 and target on line 2.' };
    let matrix;
    let target;
    try {
      matrix = JSON.parse(lines[0]);
      target = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter matrix as a JSON array of rows and target as an integer, for example [[1,3],[5,7]] then 5.' };
    }
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_DIM) return { ok: false, error: 'matrix must have 1 to 300 rows.' };
    const n = Array.isArray(matrix[0]) ? matrix[0].length : 0;
    if (n < 1 || n > MAX_DIM) return { ok: false, error: 'Each row must have 1 to 300 values.' };
    if (!matrix.every((row) => Array.isArray(row) && row.length === n)) return { ok: false, error: 'All rows must have the same length.' };
    if (!matrix.every((row) => row.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_V))) return { ok: false, error: 'Values must be integers within +-10^9.' };
    if (!Number.isInteger(target) || Math.abs(target) > MAX_V) return { ok: false, error: 'target must be an integer within +-10^9.' };
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 1; j < n; j++) if (matrix[i][j] < matrix[i][j - 1]) return { ok: false, error: 'Each row must be sorted in non-decreasing order.' };
      if (i > 0 && matrix[i][0] <= matrix[i - 1][n - 1]) return { ok: false, error: 'Each row must start above the previous row\'s last value.' };
    }
    return { ok: true, args: [matrix, target] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
