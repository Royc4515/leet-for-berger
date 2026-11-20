/**
 * Problem: King Path
 *
 * Equivalent to LeetCode 1091; statement and tests are written for this project. On a square grid
 * of open (0) and blocked (1) cells, a piece moves like a chess king, to any of the eight
 * neighbors. Find the number of cells on the shortest route from the top-left to the bottom-right
 * corner, counting both ends, or -1 when there is none. Breadth-first search by waves gives the
 * shortest route in a graph where every move costs the same.
 *
 * Limits are raised past the original (300 x 300), so trying routes one after another with
 * backtracking cannot finish.
 *
 * Classic wrong answers: moving only up, down, left and right, forgetting that the corners
 * themselves can be blocked, counting moves instead of cells, and taking the first route a
 * depth-first search finds, which is rarely the shortest.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 300;

/**
 * Reference: BFS in waves, marking a cell the moment it is queued.
 * @param {number[][]} grid square grid, 0 open and 1 blocked
 * @returns {number}
 */
export function reference(grid) {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  const seen = new Uint8Array(n * n);
  seen[0] = 1;
  let frontier = [0];
  let cells = 1;
  while (frontier.length) {
    const next = [];
    for (const cell of frontier) {
      const r = Math.floor(cell / n);
      const c = cell % n;
      if (r === n - 1 && c === n - 1) return cells;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= n || nc >= n || grid[nr][nc] === 1 || seen[nr * n + nc]) continue;
          seen[nr * n + nc] = 1;
          next.push(nr * n + nc);
        }
      }
    }
    frontier = next;
    cells++;
  }
  return -1;
}

/** Seeded n x n grid, each cell blocked with probability `blocked`. */
function randomGrid(seed, n, blocked) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, () => Array.from({ length: n }, () => (rnd() < blocked ? 1 : 0)));
}

/**
 * A winding corridor: open rows separated by blocked rows that each leave one gap, alternating
 * between the right and the left end. Diagonal steps cannot skip a blocked row, so the shortest
 * route walks every open row end to end. `n` must be odd so the last row is open.
 */
function serpentine(n) {
  const grid = Array.from({ length: n }, (_, r) => Array(n).fill(r % 2 === 1 ? 1 : 0));
  for (let r = 1; r < n; r += 2) grid[r][(r - 1) % 4 === 0 ? n - 1 : 0] = 0;
  return grid;
}

/** All open, except one full blocked row whose only gap is in the last column. */
function wallWithFarGap(n) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  const wall = Math.floor(n / 2);
  for (let c = 0; c < n - 1; c++) grid[wall][c] = 1;
  return grid;
}

const visible = [
  { args: [[[0, 1], [1, 0]]], expected: 2, note: 'A diagonal step joins the two open corners, so the route has two cells.' },
  { args: [[[0, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: 4, note: 'Along the top, then down the right side: four cells.' },
  { args: [[[1, 0, 0], [1, 1, 0], [1, 1, 0]]], expected: -1, note: 'The top-left corner is blocked, so no route can start.' },
  { args: [[[0]]], expected: 1, note: 'A single open cell is both the start and the end.' },
  { args: [[[0, 0, 0], [0, 1, 1], [1, 1, 0]]], expected: -1, note: 'Every neighbor of the bottom-right corner is blocked, so it cannot be reached.' },
];

// Hidden tests: both single-cell kinds, a blocked start and a blocked end on a 2 x 2 grid, a
// diagonal-only route, a random 6 x 6 grid with a long detour, and four grids at the limits: a
// random grid with a route, a random grid dense enough to cut every route, the open grid (a pure
// diagonal), the serpentine corridor (about 45,000 cells long) and a wall with one far gap.
const hiddenArgs = [
  [[[1]]],
  [[[1, 0], [0, 0]]],
  [[[0, 0], [0, 1]]],
  [[[0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0]]],
  [[[0, 1, 0, 0, 0, 0], [0, 1, 0, 1, 1, 0], [0, 1, 0, 1, 0, 0], [0, 1, 0, 1, 0, 1], [0, 1, 0, 1, 0, 0], [0, 0, 0, 1, 1, 0]]],
  [randomGrid(17, MAX_SIDE, 0.25)],
  [randomGrid(19, MAX_SIDE, 0.6)],
  [Array.from({ length: MAX_SIDE }, () => Array(MAX_SIDE).fill(0))],
  [serpentine(MAX_SIDE - 1)],
  [wallWithFarGap(MAX_SIDE)],
];

export const problem = {
  id: 'king-path',
  title: 'King Path',
  difficulty: 'Medium',
  topics: ['graphs'],
  patterns: ['Breadth-First Search', 'Grid', 'Shortest Path'],
  timeLimitMs: 2000,
  argNames: ['grid'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a square grid <code>grid</code> of size <code>n x n</code>. Each cell is
    <code>0</code> (open) or <code>1</code> (blocked).</p>
    <p>A route starts at the top-left cell and ends at the bottom-right cell. Every cell on the
    route, including both ends, must be open, and each step goes to one of the eight neighboring
    cells: up, down, left, right or any diagonal.</p>
    <p>Return the number of cells on the shortest route, counting both ends. If no route exists,
    return <code>-1</code>.</p>
  `,
  constraints: [
    '1 <= n <= 300',
    'grid[i][j] is 0 or 1',
    'The shortest route can pass through about 45,000 cells, so trying routes one by one is too slow',
    'Target complexity: O(n^2) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `grid = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What if the start or the end cell is blocked? Can any route exist at all?',
    'Every step costs the same. Which search reaches cells in order of how many steps they are from the start?',
    'Which cells can you reach in one step, in two steps? How would you process one "step count" after another?',
    'How do you avoid putting the same cell in the queue many times, and when exactly should you mark it?',
    'Is the answer the number of moves or the number of cells on the route? Check it against a grid with a single cell.',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>If either corner is blocked, the answer is -1. Otherwise run a breadth-first search from the
    top-left cell. The first wave is that cell, the next wave is every unvisited open neighbor of
    it, and so on. Count the waves; the wave that contains the bottom-right cell tells you how
    many cells the route has.</p>
    <h4>Why it works</h4>
    <p>Each move costs one, so breadth-first search reaches every cell by a route with the fewest
    possible moves, and a cell is first reached in the wave equal to its route length. Marking a
    cell when it is queued, not when it is taken out, keeps it from entering the queue twice.</p>
    <h4>Complexity</h4>
    <p>O(n^2) time and space: each cell is queued at most once and looks at 8 neighbors.</p>
    <h4>Pitfall</h4>
    <p>Using four directions misses every diagonal shortcut. Starting the search without checking
    the corners returns 1 or a real length for a blocked start. The count is cells, so a single
    open cell gives 1, not 0. A depth-first search finds some route, not the shortest, and on a
    300 x 300 grid it can wander through a very large number of them.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'shortestClearPath',
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
      return { ok: false, error: 'Enter the grid as JSON, for example [[0,1],[1,0]].' };
    }
    if (!Array.isArray(grid) || grid.length < 1 || grid.length > MAX_SIDE) return { ok: false, error: 'The grid needs 1 to 300 rows.' };
    if (!grid.every((row) => Array.isArray(row) && row.length === grid.length)) return { ok: false, error: 'The grid must be square: every row as long as the grid is tall.' };
    if (!grid.every((row) => row.every((v) => v === 0 || v === 1))) return { ok: false, error: 'Cells must be 0 or 1.' };
    return { ok: true, args: [grid] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // A winding route: open corridors 7 rows wide, each closed from the next by a wall row with one
  // gap, alternately at the right and left end (n x n, n = 8k + 1). The route is about n^2 / 8
  // cells of corridor long, so the wave search visits every open cell and time is quadratic in the
  // side. Fixed shape: the seed is not needed. Trying routes one by one is far worse. Rows are
  // built with Array.from: packed arrays copy about 4 times faster than holey ones, and every
  // timed call pays for a copy of the grid outside the clock.
  growth: {
    target: 'n^2',
    n: 'grid.length',
    sizes: [129, 257, 513, 1025, 2049],
    input: (n) => [
      Array.from({ length: n }, (_, r) => {
        const gap = (r - 7) % 16 === 0 ? n - 1 : 0;
        return Array.from({ length: n }, (_, c) => (r % 8 === 7 && c !== gap ? 1 : 0));
      }),
    ],
  },
};

export default problem;
