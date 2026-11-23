/**
 * Problem: Largest Ones Square
 *
 * Equivalent to LeetCode 221 (Maximal Square); statement and tests are written for this project
 * (cells are 0/1 integers rather than '0'/'1' characters). Find the area of the largest square
 * submatrix containing only 1s. Let dp[r][c] be the side length of the largest all-1s square whose
 * bottom-right corner sits at (r, c): when grid[r][c] == 1, dp[r][c] = 1 + min(up, left, diag).
 * Rolling a single row reduces space to O(cols) while keeping O(rows * cols) time.
 *
 * Classic wrong answers: returning the side length instead of area (side * side), taking max
 * instead of min of the three neighbors, ignoring the top-left diagonal neighbor (miscounts an
 * L-shape [[0, 1], [1, 1]] as a 2x2 square), returning a rectangle's area on a single row of 1s,
 * and clobbering the previous diagonal value when compressing DP to one row.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 300;

/**
 * Reference: 2D prefix sums + side expansion (independent of the bottom-right DP recurrence).
 * @param {number[][]} grid
 * @returns {number}
 */
export function reference(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const pref = Array.from({ length: rows + 1 }, () => new Int32Array(cols + 1));
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const cur = pref[r + 1];
    const above = pref[r];
    for (let c = 0; c < cols; c++) {
      cur[c + 1] = row[c] + above[c + 1] + cur[c] - above[c];
    }
  }
  const rectSum = (r1, c1, r2, c2) =>
    pref[r2][c2] - pref[r1][c2] - pref[r2][c1] + pref[r1][c1];

  let best = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) continue;
      // Only test side lengths strictly larger than `best`, so total increments are <= min(rows, cols).
      while (r + best < rows && c + best < cols) {
        const s = best + 1;
        if (rectSum(r, c, r + s, c + s) === s * s) best = s;
        else break;
      }
    }
  }
  return best * best;
}

/** Deterministic binary matrix of size rows x cols where each cell is 1 with probability `probOne`. */
function randomGrid(seed, rows, cols, probOne) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols).fill(0);
    for (let c = 0; c < cols; c++) row[c] = rnd() < probOne ? 1 : 0;
    out.push(row);
  }
  return out;
}

/** Grid of all 1s with a single 0 hole at (holeR, holeC). */
function gridWithHole(rows, cols, holeR, holeC) {
  const out = Array.from({ length: rows }, () => new Array(cols).fill(1));
  out[holeR][holeC] = 0;
  return out;
}

/** Rectangular grid with a solid block of 1s embedded inside sparse random noise. */
function gridWithBlock(seed, rows, cols, top, left, blockSide) {
  const g = randomGrid(seed, rows, cols, 0.35);
  for (let r = top; r < top + blockSide; r++) {
    for (let c = left; c < left + blockSide; c++) g[r][c] = 1;
  }
  return g;
}

const visible = [
  {
    args: [[[1, 0, 1, 0, 0], [1, 0, 1, 1, 1], [1, 1, 1, 1, 1], [1, 0, 0, 1, 0]]],
    expected: 4,
    note: 'The largest all-1s square is 2x2, giving area 4.',
  },
  {
    args: [[[0, 1], [1, 0]]],
    expected: 1,
    note: 'Only single 1x1 squares exist, giving area 1.',
  },
  {
    args: [[[0]]],
    expected: 0,
    note: 'No 1s exist, so the maximum square area is 0.',
  },
  {
    args: [[[0, 1], [1, 1]]],
    expected: 1,
    note: 'An L-shape has 1s above and to the left of (1, 1), but the top-left diagonal is 0, so the max square is still 1x1.',
  },
  {
    args: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]],
    expected: 9,
    note: 'The entire 3x3 grid is all 1s, giving area 9.',
  },
];

// Hidden tests: single 1, all zeros, single row of 1s (catches rectangle-area bug), single column
// of 1s, 3x3 missing only top-left corner (catches missing top-left diagonal check in DP), plus
// max-size 300x300 grids (all 1s = 90000, center hole = 22500, checkerboard = 1, dense 90% 1s),
// and 120x300 rectangular grid with an embedded 55x55 square.
const hiddenArgs = [
  [[[1]]],
  [[[0, 0, 0], [0, 0, 0]]],
  [[[1, 1, 1, 1, 1]]],
  [[[1], [1], [1], [1]]],
  [[[0, 1, 1], [1, 1, 1], [1, 1, 1]]],
  [Array.from({ length: MAX_SIDE }, () => new Array(MAX_SIDE).fill(1))],
  [gridWithHole(MAX_SIDE, MAX_SIDE, 150, 150)],
  [Array.from({ length: MAX_SIDE }, (_, r) => Array.from({ length: MAX_SIDE }, (_, c) => (r + c) & 1))],
  [randomGrid(2211, MAX_SIDE, MAX_SIDE, 0.9)],
  [gridWithBlock(2212, 120, MAX_SIDE, 30, 110, 55)],
];

export const problem = {
  id: 'largest-ones-square',
  title: 'Largest Ones Square',
  difficulty: 'Medium',
  topics: ['dp'],
  patterns: ['2D Dynamic Programming', 'Matrix'],
  timeLimitMs: 2000,
  argNames: ['grid'],

  statementHtml: `
    <p>Given an <code>m x n</code> binary matrix <code>grid</code> filled with <code>0</code>s and
    <code>1</code>s, find the largest <strong>square</strong> submatrix containing only
    <code>1</code>s and return its <strong>area</strong> (<code>side * side</code>).</p>
    <p>If the matrix contains no <code>1</code>s, return <code>0</code>.</p>
  `,
  constraints: [
    '1 <= grid.length, grid[0].length <= 300',
    'All rows have the same length',
    'grid[r][c] is either 0 or 1',
    'Target complexity: O(m * n) time, O(n) extra space',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `grid = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  hints: [
    'Instead of searching for the top-left corner, define dp[r][c] as the side length of the largest all-1s square whose bottom-right corner is (r, c).',
    'If grid[r][c] == 1, which three neighboring cells constrain how large a square can end at (r, c)?',
    'Why do you need the MINIMUM of those three neighbors rather than their maximum?',
    'Look at [[0, 1], [1, 1]]: what goes wrong if you check only above and left without the top-left diagonal?',
    'Each row of dp depends only on the current row and the previous row. Can you keep just one 1D array plus one saved diagonal variable?',
  ],

  explanationHtml: `
    <h4>Idea</h4>
    <p>Let <code>dp[r][c]</code> be the side length of the largest all-1s square whose bottom-right
    corner is cell <code>(r, c)</code>. If <code>grid[r][c] == 0</code>, then
    <code>dp[r][c] = 0</code>; otherwise
    <code>dp[r][c] = 1 + min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1])</code>. Track the largest
    side length seen and return <code>best * best</code>.</p>
    <h4>Why it works</h4>
    <p>A square of side <code>s</code> ending at <code>(r, c)</code> exists if and only if
    <code>(r, c)</code> is <code>1</code> and three overlapping squares of side <code>s - 1</code>
    end at <code>(r - 1, c)</code>, <code>(r, c - 1)</code>, and <code>(r - 1, c - 1)</code>. The
    smallest of those three squares limits how far the square can grow.</p>
    <h4>Complexity</h4>
    <p>O(m * n) time and O(n) extra space when keeping a single rolling row plus one variable for
    the overwritten top-left diagonal.</p>
    <h4>Pitfall</h4>
    <p>The question asks for the <strong>area</strong> (<code>best * best</code>), not the side
    length. Also, when optimizing to a 1D array <code>dp[c]</code>, save the old <code>dp[c]</code>
    before overwriting it so the next column receives the true top-left diagonal
    <code>dp[r - 1][c - 1]</code>, and reset <code>dp[c] = 0</code> whenever
    <code>grid[r][c] == 0</code>.</p>
  `,

  signature: {
    name: 'largestSquareArea',
    params: [{ name: 'grid', type: 'int[][]' }],
    returns: 'int',
  },

  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  growth: {
    target: 'n',
    n: 'grid.length * grid[0].length',
    sizes: [196608, 393216, 786432, 1572864],
    // Dense 85% 1s square grids force non-trivial min(up, left, diag) work at nearly every cell.
    input: (n, seed) => {
      const side = Math.round(Math.sqrt(n));
      return [randomGrid(seed, side, side, 0.85)];
    },
  },

  /**
   * Custom input: rectangular 2D JSON array of 0s and 1s.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let grid;
    try {
      grid = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter grid as a 2D JSON array of 0s and 1s, for example [[1,1],[1,1]].' };
    }
    if (!Array.isArray(grid) || grid.length < 1 || grid.length > MAX_SIDE) {
      return { ok: false, error: 'grid must have 1 to 300 rows.' };
    }
    const cols = Array.isArray(grid[0]) ? grid[0].length : 0;
    if (cols < 1 || cols > MAX_SIDE) {
      return { ok: false, error: 'Each row must have 1 to 300 columns.' };
    }
    for (const row of grid) {
      if (!Array.isArray(row) || row.length !== cols || !row.every((v) => v === 0 || v === 1)) {
        return { ok: false, error: 'All rows must have the same length and contain only 0 or 1.' };
      }
    }
    return { ok: true, args: [grid] };
  },

  solveReference: (args) => reference(args[0]),
};

export default problem;
