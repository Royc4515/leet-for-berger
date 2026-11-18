/**
 * Problem: Island Count
 *
 * Count the groups of land cells connected horizontally or vertically. Every land cell starts a
 * flood fill at most once, so the whole grid is O(rows * cols).
 *
 * The trap is recursion depth: a snake-shaped island in a 300 x 300 grid is a single path of
 * about 45,000 cells, which overflows a recursive flood fill in Python (limit 1000) and in a
 * browser worker. The statement says so, and the hidden tests include that snake, so an explicit
 * stack, a queue or union-find is required.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 300;

/**
 * Reference: iterative flood fill with an explicit stack.
 * @param {string[]} grid
 * @returns {number}
 */
export function reference(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Uint8Array(rows * cols);
  const stack = [];
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '1' || seen[r * cols + c]) continue;
      count++;
      seen[r * cols + c] = 1;
      stack.push(r * cols + c);
      while (stack.length) {
        const cell = stack.pop();
        const cr = Math.floor(cell / cols);
        const cc = cell % cols;
        for (const [nr, nc] of [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]]) {
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc] !== '1' || seen[nr * cols + nc]) continue;
          seen[nr * cols + nc] = 1;
          stack.push(nr * cols + nc);
        }
      }
    }
  }
  return count;
}

/** Seeded random grid where each cell is land with probability `density`. */
function randomGrid(seed, rows, cols, density) {
  const rnd = mulberry32(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < density ? '1' : '0')).join(''));
}

/** One island shaped as a snake: full even rows joined by a single cell at alternating ends. */
function snakeGrid(side) {
  return Array.from({ length: side }, (_, r) => {
    if (r % 2 === 0) return '1'.repeat(side);
    const bridgeRight = r % 4 === 1;
    return bridgeRight ? '0'.repeat(side - 1) + '1' : '1' + '0'.repeat(side - 1);
  });
}

function checkerGrid(side) {
  return Array.from({ length: side }, (_, r) => Array.from({ length: side }, (_, c) => ((r + c) % 2 === 0 ? '1' : '0')).join(''));
}

const visible = [
  { args: [['11110', '11010', '11000', '00000']], expected: 1, note: 'All land cells touch through edges.' },
  { args: [['11000', '11000', '00100', '00011']], expected: 3, note: 'Three separate groups.' },
  { args: [['000', '000']], expected: 0, note: 'No land at all.' },
  { args: [['1', '0', '1']], expected: 2, note: 'A single column: the water cell splits the land.' },
  { args: [['111', '101', '111']], expected: 1, note: 'A ring around a lake is still one island.' },
];

// Hidden tests: one cell, diagonal-only contact (must not connect), an island inside a lagoon,
// a non-square grid (row/column mix-ups), a full grid, a checkerboard with 45,000 islands, and
// the snake whose 45,000-cell path breaks a recursive flood fill.
const hiddenArgs = [
  [['0']],
  [['1']],
  [['101', '010', '101']],
  [['11111', '10001', '10101', '10001', '11111']],
  [['110111011110111110']],
  [randomGrid(7, 100, 250, 0.45)],
  [Array(MAX_SIDE).fill('1'.repeat(MAX_SIDE))],
  [checkerGrid(MAX_SIDE)],
  [snakeGrid(MAX_SIDE)],
  [randomGrid(11, MAX_SIDE, MAX_SIDE, 0.55)],
];

export const problem = {
  id: 'island-count',
  title: 'Island Count',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Flood Fill', 'BFS / DFS', 'Grid'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['grid'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A map is given as an array of strings <code>grid</code>, one string per row, where
    <code>'1'</code> is land and <code>'0'</code> is water. Two land cells belong to the same
    island when you can walk from one to the other stepping only up, down, left or right through
    land. Diagonal contact does not connect cells.</p>
    <p>Return the number of islands. Everything outside the grid is water.</p>
    <p>Note: a single island can wind through tens of thousands of cells, so a recursive flood
    fill can run out of call stack. Use an explicit stack, a queue or union-find.</p>
  `,
  constraints: [
    '1 <= grid.length, grid[i].length <= 300',
    'All rows have the same length',
    "grid[i][j] is '0' or '1'",
    'One island can span about 45,000 cells, deeper than a recursive flood fill can go (Python, browsers)',
    'Target complexity: O(rows * cols) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `grid = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'When you find a land cell, how could you visit every land cell of the same island exactly once?',
    'How do you make sure that island is not counted again when the scan reaches its other cells?',
    'What happens to a recursive version when one island is a 45,000-cell snake?',
    'Can a stack or queue you manage yourself replace the call stack?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'countIslands',
    params: [{ name: 'grid', type: 'string[]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: grid as a JSON array of strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let grid;
    try {
      grid = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter grid as a JSON array of strings, for example ["110","011"].' };
    }
    if (!Array.isArray(grid) || grid.length < 1 || grid.length > MAX_SIDE) return { ok: false, error: 'grid must have 1 to 300 rows.' };
    if (!grid.every((row) => typeof row === 'string')) return { ok: false, error: 'Every row must be a string.' };
    const cols = grid[0].length;
    if (cols < 1 || cols > MAX_SIDE || !grid.every((row) => row.length === cols)) return { ok: false, error: 'Rows must all have the same length, 1 to 300.' };
    if (!grid.every((row) => /^[01]+$/.test(row))) return { ok: false, error: "Rows may contain only '0' and '1'." };
    return { ok: true, args: [grid] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). n counts cells of a
  // square grid. Density 0.45 is below the percolation threshold, so there are many small
  // islands: rescanning the grid per island is quadratic, and no island is deep enough to break a
  // recursive flood fill (the hidden tests already check that).
  growth: {
    target: 'n',
    n: 'rows * cols',
    sizes: [16384, 32768, 65536, 131072, 262144, 524288, 1048576],
    input: (n, seed) => {
      const side = Math.round(Math.sqrt(n));
      return [randomGrid(seed, side, side, 0.45)];
    },
  },
};

export default problem;
