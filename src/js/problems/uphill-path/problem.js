/**
 * Problem: Uphill Path
 *
 * The longest path through a grid that moves up, down, left or right and strictly increases at
 * every step. "Strictly increasing" makes the moves a DAG, so the longest path from a cell is
 * 1 + the longest from its larger neighbors: memoized, O(m * n).
 *
 * The trap is depth. The usual memoized DFS recurses along the path, and a snake-shaped path
 * through a 200 x 200 grid is 40,000 cells long, which overflows Python's stack (and the browser's
 * JavaScript stack). The reference and solutions visit cells from the largest value down instead,
 * so every larger neighbor is finished first; a topological peel (Kahn's algorithm) also works.
 * Classic wrong answers besides depth: treating equal neighbors as increasing, and plain DFS
 * without memoization, which is exponential.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 200;
const MAX_VAL = 2147483647;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Reference: cells in decreasing value order, each one's best path from its larger neighbors.
 * @param {number[][]} matrix
 * @returns {number}
 */
export function reference(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;
  const cells = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) cells.push([i, j]);
  cells.sort((p, q) => matrix[q[0]][q[1]] - matrix[p[0]][p[1]]);
  const best = Array.from({ length: m }, () => new Array(n).fill(0));
  let answer = 0;
  for (const [i, j] of cells) {
    let len = 1;
    for (const [di, dj] of DIRS) {
      const x = i + di;
      const y = j + dj;
      if (x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > matrix[i][j]) len = Math.max(len, best[x][y] + 1);
    }
    best[i][j] = len;
    answer = Math.max(answer, len);
  }
  return answer;
}

function randomGrid(seed, m, n, hi) {
  const rnd = mulberry32(seed);
  return Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(rnd() * (hi + 1))));
}

/** Values increase along a boustrophedon snake, so the whole grid is one increasing path. */
function snake(m, n, start, step) {
  const g = Array.from({ length: m }, () => new Array(n).fill(0));
  let v = start;
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      g[i][i % 2 ? n - 1 - k : k] = v;
      v += step;
    }
  }
  return g;
}

/** Values increase along an inward spiral. */
function spiral(m, n) {
  const g = Array.from({ length: m }, () => new Array(n).fill(0));
  let top = 0;
  let bottom = m - 1;
  let left = 0;
  let right = n - 1;
  let v = 0;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) g[top][j] = v++;
    for (let i = top + 1; i <= bottom; i++) g[i][right] = v++;
    if (top < bottom) for (let j = right - 1; j >= left; j--) g[bottom][j] = v++;
    if (left < right) for (let i = bottom - 1; i > top; i--) g[i][left] = v++;
    top++;
    bottom--;
    left++;
    right--;
  }
  return g;
}

const visible = [
  { args: [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], expected: 4, note: 'The path 1 -> 2 -> 6 -> 9.' },
  { args: [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], expected: 4, note: 'The path 3 -> 4 -> 5 -> 6. Diagonal moves are not allowed.' },
  { args: [[[1]]], expected: 1, note: 'A single cell is a path of length 1.' },
  { args: [[[7, 7], [7, 7]]], expected: 1, note: 'Equal neighbors do not count: each step must strictly increase.' },
  { args: [[[1, 2, 3], [6, 5, 4], [7, 8, 9]]], expected: 9, note: 'The path snakes through every cell.' },
];

// Hidden tests: a single row and a single column, many ties, values near 2^31 - 1, an inward
// spiral, then full 200 x 200 grids: a snake whose increasing path covers all 40,000 cells (a
// recursive search goes 40,000 calls deep), a reversed snake, and random grids.
const hiddenArgs = [
  [[[5, 4, 3, 2, 1, 2, 3]]],
  [Array.from({ length: MAX_SIDE }, (_, i) => [MAX_SIDE - i])],
  [randomGrid(179, 30, 30, 2)],
  [[[MAX_VAL, MAX_VAL - 1], [0, MAX_VAL - 2]]],
  [spiral(57, 43)],
  [snake(MAX_SIDE, MAX_SIDE, 0, 1)],
  [snake(MAX_SIDE, MAX_SIDE, MAX_VAL - 40000 * 53600, 53600).reverse()],
  [randomGrid(181, MAX_SIDE, MAX_SIDE, MAX_VAL)],
  [randomGrid(191, MAX_SIDE, MAX_SIDE, 9)],
  [randomGrid(193, 137, MAX_SIDE, 1000)],
];

export const problem = {
  id: 'uphill-path',
  title: 'Uphill Path',
  difficulty: 'Hard',
  topics: ['dp', 'graphs'],
  patterns: ['Memoization', 'Topological Order', 'Grid'],
  timeLimitMs: 2000,
  argNames: ['matrix'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given an <code>m x n</code> grid of integers <code>matrix</code>. A path moves
    from a cell to a neighboring cell up, down, left or right (not diagonally, and not off the
    grid), and every step must go to a <strong>strictly larger</strong> value.</p>
    <p>Return the number of cells on the longest such path.</p>
    <p>Note: a single path can wind through all 40,000 cells of a 200 x 200 grid, so a recursive
    search can go 40,000 calls deep. That overflows the stack in Python and in the browser.</p>
  `,
  constraints: [
    '1 <= m, n <= 200',
    '0 <= matrix[i][j] <= 2^31 - 1',
    'A path can be 40,000 cells long, deeper than a recursive search can go (Python, browsers)',
    'Target complexity: O(m * n) time with memoization, O(m * n log(m * n)) if you sort the cells',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `matrix = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you knew the longest path starting at each neighbor, what would be the longest path starting at this cell?',
    'Can a path ever come back to a cell it already visited? What does that mean for reusing answers?',
    'What happens to a recursive search when one path is 40,000 cells long?',
    'Which cells can have their answer settled first, without looking at any other cell?',
    'If you process cells from the largest value to the smallest, is every neighbor you need already done?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>The longest uphill path starting at a cell is 1 plus the longest path from its strictly larger
    neighbors. Settle cells from the largest value down, so those neighbors always have their answer
    already.</p>
    <h4>Why it works</h4>
    <p>Each step goes to a strictly larger value, so a path can never return to a cell: the moves form
    a DAG and the answers can be reused. Processing in decreasing value is a topological order of that
    DAG. When a cell is reached, every neighbor it could step to is larger and so is final. Equal
    neighbors are not moves and are simply ignored.</p>
    <h4>Complexity</h4>
    <p>O(mn log mn) time, dominated by sorting the cells; the sweep itself is O(mn) with four neighbor
    checks per cell. O(mn) space. A DFS without reuse is exponential.</p>
    <h4>Pitfall</h4>
    <p>The usual memoized DFS recurses along the path, and a snake-shaped path can cover all 40,000 cells
    of a 200 x 200 grid, which overflows the stack. Also, a step to an equal value is not uphill.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'longestIncreasingPath',
    params: [{ name: 'matrix', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: the grid as a JSON array of rows.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let matrix;
    try {
      matrix = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the grid as a JSON array of rows, for example [[9,9,4],[6,6,8],[2,1,1]].' };
    }
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > MAX_SIDE) return { ok: false, error: 'The grid needs 1 to 200 rows.' };
    const n = Array.isArray(matrix[0]) ? matrix[0].length : 0;
    if (n < 1 || n > MAX_SIDE) return { ok: false, error: 'Each row needs 1 to 200 values.' };
    if (!matrix.every((row) => Array.isArray(row) && row.length === n)) return { ok: false, error: 'All rows must have the same length.' };
    if (!matrix.every((row) => row.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_VAL))) return { ok: false, error: 'Values must be integers from 0 to 2^31 - 1.' };
    return { ok: true, args: [matrix] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // A square grid of n cells with random 31-bit values: the shipped solution sorts all cells (the
  // n log n term) and then settles each once. A search from every cell without memoization is
  // n^2 on grids with long climbs.
  growth: {
    target: 'n log n',
    n: 'matrix.length * matrix[0].length',
    sizes: [8192, 16384, 32768, 65536, 131072],
    input: (n, seed) => {
      const side = Math.round(Math.sqrt(n));
      return [randomGrid(seed, side, side, MAX_VAL)];
    },
  },
};

export default problem;
