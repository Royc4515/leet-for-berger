/**
 * Problem: Rot Spread
 *
 * Equivalent to LeetCode 994; statement and tests are written for this project. A grid of fruit
 * where rot spreads to the four neighbors once per minute: the minutes until nothing fresh is
 * left, or -1 when some fruit can never rot. Every rotten cell is a BFS source from minute 0, so
 * one queue seeded with all of them gives each fresh cell its earliest rot time.
 *
 * Classic wrong answers: starting from one rotten cell (a second source rots the far side
 * sooner), forgetting the unreachable fresh cells (-1), and counting the final empty round as a
 * minute. Rescanning the whole grid once per minute is correct but needs about 45,000 minutes on
 * the snake test, so it times out at the maximum size.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 300;

/**
 * Reference: multi-source BFS by levels.
 * @param {number[][]} grid 0 empty, 1 fresh, 2 rotten
 * @returns {number}
 */
export function reference(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = Uint8Array.from(grid.flat(), (v) => (v === 2 ? 1 : 0));
  let frontier = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) frontier.push(r * cols + c);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  while (frontier.length && fresh > 0) {
    const next = [];
    for (const cell of frontier) {
      const r = Math.floor(cell / cols);
      const c = cell % cols;
      for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] !== 1 || seen[nr * cols + nc]) continue;
        seen[nr * cols + nc] = 1;
        fresh--;
        next.push(nr * cols + nc);
      }
    }
    frontier = next;
    minutes++;
  }
  return fresh > 0 ? -1 : minutes;
}

/** Seeded grid: each cell is rotten, fresh or empty with the given probabilities. */
function randomGrid(seed, rows, cols, pRotten, pFresh) {
  const rnd = mulberry32(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => {
      const r = rnd();
      return r < pRotten ? 2 : r < pRotten + pFresh ? 1 : 0;
    }),
  );
}

/** One fresh path winding through the whole grid, rotten at its start: about side^2 / 2 minutes. */
function snakeGrid(side) {
  const grid = Array.from({ length: side }, (_, r) => {
    if (r % 2 === 0) return Array(side).fill(1);
    const row = Array(side).fill(0);
    row[r % 4 === 1 ? side - 1 : 0] = 1;
    return row;
  });
  grid[0][0] = 2;
  return grid;
}

/** All fresh, one rotten cell in a corner. */
function cornerGrid(rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
  grid[0][0] = 2;
  return grid;
}

const visible = [
  { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4, note: 'The rot walks from the top-left corner to the far corner, one step per minute.' },
  { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1, note: 'The bottom-left fruit has an empty cell above it and one to its right, so the rot cannot reach it.' },
  { args: [[[0, 2]]], expected: 0, note: 'There is nothing fresh, so no minutes pass.' },
  { args: [[[2, 1, 1, 1, 2]]], expected: 2, note: 'Both ends rot at once and meet in the middle.' },
  { args: [[[1, 0, 2]]], expected: -1, note: 'An empty cell blocks the spread.' },
];

// Hidden tests: single cells of each kind, a fresh cell touched only diagonally, a fresh crate with
// no rotten fruit anywhere, sparse and dense random grids, a one-row strip, a corner start, and
// the 300 x 300 snake whose answer is about 45,000 minutes.
const hiddenArgs = [
  [[[1]]],
  [[[2]]],
  [[[0]]],
  [[[2, 0], [0, 1]]],
  [[[1, 1], [1, 1]]],
  [randomGrid(7, 30, 30, 0.02, 0.9)],
  [randomGrid(11, 1, MAX_SIDE, 0.1, 0.9)],
  [snakeGrid(MAX_SIDE)],
  [cornerGrid(MAX_SIDE, MAX_SIDE)],
  [randomGrid(13, MAX_SIDE, MAX_SIDE, 0.0005, 0.9995)],
];

export const problem = {
  id: 'rot-spread',
  title: 'Rot Spread',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Multi-source BFS', 'Grid', 'Simulation'],
  timeLimitMs: 2000,
  argNames: ['grid'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A crate of fruit is laid out as a grid <code>grid</code>. Each cell holds
    <code>0</code> (empty), <code>1</code> (fresh fruit) or <code>2</code> (rotten fruit).</p>
    <p>Every minute, each fresh fruit that touches a rotten one above, below, left or right becomes
    rotten. Diagonal contact does nothing, and empty cells never carry the rot.</p>
    <p>Return the number of minutes until no fresh fruit is left. If some fresh fruit can never rot,
    return <code>-1</code>. If there is no fresh fruit to begin with, the answer is <code>0</code>.</p>
  `,
  constraints: [
    '1 <= grid.length, grid[i].length <= 300',
    'All rows have the same length',
    'grid[i][j] is 0, 1 or 2',
    'The answer can reach about 45,000, so simulating minute by minute over the whole grid is too slow',
    'Target complexity: O(rows * cols) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `grid = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you only knew where one rotten fruit was, how would you find the minute each fresh fruit rots?',
    'There may be many rotten fruits at minute 0. Can they all start spreading at the same time?',
    'What structure processes cells in order of the minute they rot, one wave after another?',
    'How do you know, once the waves stop, whether some fresh fruit was never reached?',
    'Does the last wave, which rots nothing new, count as a minute?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Put every rotten cell into a queue at minute 0 and count the fresh cells. Process the queue in
    waves: each wave rots the fresh neighbors of the previous one and counts as one minute. Stop when
    the queue is empty or no fresh cell remains.</p>
    <h4>Why it works</h4>
    <p>Breadth-first search reaches each cell by a shortest path from the nearest source, and with all
    sources in the first wave, that distance is exactly the minute the cell rots. The last wave that
    rots anything gives the total time. If fresh cells are left when the waves run dry, nothing
    could reach them, so the answer is -1.</p>
    <h4>Complexity</h4>
    <p>O(rows * cols) time and space: each cell enters the queue at most once and looks at 4
    neighbors.</p>
    <h4>Pitfall</h4>
    <p>Starting from one rotten cell, or from each source separately and merging, misses that two
    sources rot the middle sooner. Another trap is counting a minute for the final wave that rots
    nothing, which gives an answer one too large. Rescanning the entire grid every minute is correct
    but takes about 45,000 passes over 90,000 cells on a winding path.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'minutesToRot',
    params: [{ name: 'grid', type: 'int[][]' }],
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
    let grid;
    try {
      grid = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the grid as JSON, for example [[2,1,1],[1,1,0]].' };
    }
    if (!Array.isArray(grid) || grid.length < 1 || grid.length > MAX_SIDE) return { ok: false, error: 'The grid needs 1 to 300 rows.' };
    if (!grid.every((row) => Array.isArray(row))) return { ok: false, error: 'Every row must be an array.' };
    const cols = grid[0].length;
    if (cols < 1 || cols > MAX_SIDE || !grid.every((row) => row.length === cols)) return { ok: false, error: 'Rows must all have the same length, 1 to 300.' };
    if (!grid.every((row) => row.every((v) => v === 0 || v === 1 || v === 2))) return { ok: false, error: 'Cells must be 0, 1 or 2.' };
    return { ok: true, args: [grid] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). The snake: one fresh path
  // through about half the cells, rotten at its start, so the answer is about n / 2 minutes and
  // rescanning the grid every minute is n^2 / 2, while the BFS visits each cell once. Fixed shape:
  // the seed is not needed.
  growth: {
    target: 'n',
    n: 'rows * cols',
    sizes: [16384, 32768, 65536, 131072, 262144, 524288, 1048576],
    input: (n) => [snakeGrid(Math.round(Math.sqrt(n)))],
  },
};

export default problem;
