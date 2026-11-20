/**
 * Problem: Obstacle Clearing
 *
 * Walk from the top-left cell to the bottom-right one, removing as few obstacles as possible.
 * Stepping onto an empty cell costs 0 and onto an obstacle costs 1, so this is a shortest path
 * with 0/1 weights: a 0-1 BFS (deque, 0-cost moves to the front) solves it in O(rows * cols).
 * Dijkstra with a heap also passes, at an extra log factor.
 *
 * Targeted mistakes: moving only right and down (the cheap route winds back up and left), plain
 * BFS by number of steps, counting the start cell, a visited mark set when a cell is first
 * pushed (a later 0-cost route is then ignored), and recursion over a 10^5-cell corridor.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_CELLS = 100000;

/**
 * Reference: 0-1 BFS over a double-ended queue held in a ring buffer.
 * @param {number[][]} grid
 * @returns {number}
 */
export function reference(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const total = rows * cols;
  const dist = new Int32Array(total).fill(-1);
  const best = new Int32Array(total).fill(0x7fffffff);
  // Each cell enters the deque at most 4 times (once per neighbour that improves it), so a
  // ring of 4 * cells + 1 never overflows.
  const cap = 4 * total + 1;
  const ring = new Int32Array(cap);
  let head = 0;
  let size = 0;
  ring[0] = 0;
  size = 1;
  best[0] = 0;
  while (size) {
    const cell = ring[head];
    head = (head + 1) % cap;
    size--;
    if (dist[cell] !== -1) continue;
    dist[cell] = best[cell];
    const r = Math.floor(cell / cols);
    const c = cell % cols;
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const next = nr * cols + nc;
      const w = grid[nr][nc];
      if (dist[next] !== -1 || best[cell] + w >= best[next]) continue;
      best[next] = best[cell] + w;
      if (w === 0) {
        head = (head - 1 + cap) % cap;
        ring[head] = next;
      } else {
        ring[(head + size) % cap] = next;
      }
      size++;
    }
  }
  return dist[total - 1];
}

/** Random grid with obstacle probability `density`; the two corners are always empty. */
function randomGrid(seed, rows, cols, density) {
  const rnd = mulberry32(seed);
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < density ? 1 : 0)));
  grid[0][0] = 0;
  grid[rows - 1][cols - 1] = 0;
  return [grid];
}

/**
 * Walls on every other row, each with one gap at alternating ends, plus a few random holes: the
 * free route snakes through every row, but punching straight down through walls is shorter in
 * steps. The holes make some walls cheaper to break than to walk around.
 */
function serpentine(seed, rows, cols, holes) {
  const rnd = mulberry32(seed);
  const grid = Array.from({ length: rows }, (_, r) => {
    if (r % 2 === 0) return new Array(cols).fill(0);
    const row = new Array(cols).fill(1);
    row[r % 4 === 1 ? cols - 1 : 0] = 0;
    return row;
  });
  for (let i = 0; i < holes; i++) {
    const r = 1 + 2 * Math.floor(rnd() * Math.floor(rows / 2));
    if (r < rows) grid[r][Math.floor(rnd() * cols)] = 0;
  }
  grid[rows - 1][cols - 1] = 0;
  return [grid];
}

const visible = [
  { args: [[[0, 1, 1, 0], [1, 1, 0, 1], [0, 1, 1, 0]]], expected: 3, note: 'Every route crosses at least three obstacles, for example right three times, then down twice.' },
  { args: [[[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 0, 0]]], expected: 0, note: 'A free route exists if you walk back left along the middle row: it snakes right, down, left, down, right.' },
  { args: [[[0, 1], [1, 0]]], expected: 1, note: 'Remove either obstacle.' },
  { args: [[[0, 0]]], expected: 0, note: 'Start and finish are next to each other and empty.' },
  { args: [[[0], [1], [1], [0]]], expected: 2, note: 'A single column: both obstacles are in the way.' },
];

// Hidden tests: a full wall between the corners, a route that must go up and left, the
// push-time visited trap, a one-row grid, a mid-size random grid, and five inputs of about
// 10^5 cells: square (316 x 316), one row, one column, a serpentine maze, and a dense random field.
const hiddenArgs = [
  [[[0, 1, 0], [1, 1, 1], [0, 1, 0]]],
  [[[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0]]],
  [[[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 1], [1, 1, 0, 0]]],
  [[[0, 1, 1, 0, 1, 0, 1, 1, 0]]],
  randomGrid(7, 30, 40, 0.5),
  randomGrid(11, 316, 316, 0.45),
  randomGrid(13, 1, MAX_CELLS, 0.3),
  randomGrid(17, MAX_CELLS, 1, 0.3),
  serpentine(19, 400, 250, 40),
  randomGrid(23, 250, 400, 0.7),
];

export const problem = {
  id: 'obstacle-clearing',
  title: 'Obstacle Clearing',
  difficulty: 'Hard',
  topics: ['graphs'],
  patterns: ['0-1 BFS', 'Shortest Path', 'Grid'],
  timeLimitMs: 3000,
  argNames: ['grid'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>You are given a grid of <code>rows x cols</code> cells, where <code>0</code> is an empty
    cell and <code>1</code> is an obstacle you can remove. You may move up, down, left or right
    between empty cells.</p>
    <p>Starting at the top-left cell <code>(0, 0)</code>, return the minimum number of obstacles
    you must remove to reach the bottom-right cell <code>(rows - 1, cols - 1)</code>. Both of
    those cells are empty.</p>
  `,
  constraints: [
    '1 <= rows, cols <= 10^5; 2 <= rows * cols <= 10^5',
    'grid[i][j] is 0 or 1',
    'grid[0][0] == grid[rows - 1][cols - 1] == 0',
    'Target complexity: O(rows * cols) time',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `grid = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If each move had a cost, what would moving onto an empty cell cost, and onto an obstacle?',
    'With costs, why does a plain BFS by number of moves give the wrong answer?',
    'Dijkstra works; with only costs 0 and 1, can a double-ended queue replace the heap?',
    'Where in that queue should a cell reached at no extra cost go?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Treat moving onto an empty cell as cost 0 and onto an obstacle as cost 1. The answer is a shortest
    path with only 0 and 1 weights, which a 0-1 BFS solves with a double-ended queue instead of a
    heap.</p>
    <h4>Why it works</h4>
    <p>Pushing 0-cost moves to the front and 1-cost moves to the back keeps the deque sorted by distance,
    with at most two distinct values in it at a time. So cells come out in nondecreasing distance, just
    as in Dijkstra. A cell is queued again only on a strict improvement, so outdated entries do no harm.</p>
    <h4>Complexity</h4>
    <p>O(rows * cols) time: each cell is popped a constant number of times and has four neighbors. O(rows * cols)
    space for distances and the deque. Dijkstra with a heap also passes, with an extra log factor.</p>
    <h4>Pitfall</h4>
    <p>Do not mark a cell final when it is first pushed: a 0-cost route found later must still win.
    Moving only right and down misses routes that wind back, and plain BFS counts steps rather than
    obstacles. The start cell is empty and costs nothing.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'minimumObstacles',
    params: [{ name: 'grid', type: 'int[][]' }],
    returns: 'int',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: grid as a JSON array of rows of 0 and 1.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let grid;
    try {
      grid = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter grid as a JSON array of rows, for example [[0,1],[1,0]].' };
    }
    if (!Array.isArray(grid) || grid.length < 1 || !grid.every(Array.isArray)) return { ok: false, error: 'grid must be a non-empty array of rows.' };
    const cols = grid[0].length;
    if (cols < 1 || !grid.every((row) => row.length === cols)) return { ok: false, error: 'All rows must have the same, non-zero length.' };
    if (grid.length * cols < 2 || grid.length * cols > MAX_CELLS) return { ok: false, error: 'The grid must have 2 to 10^5 cells.' };
    if (!grid.every((row) => row.every((v) => v === 0 || v === 1))) return { ok: false, error: 'Cells must be 0 or 1.' };
    if (grid[0][0] !== 0 || grid[grid.length - 1][cols - 1] !== 0) return { ok: false, error: 'The top-left and bottom-right cells must be 0.' };
    return { ok: true, args: [grid] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // A square grid of n cells with 40% obstacles and open corners: the 0-1 search reaches most of
  // the grid before it settles the far corner. Cells beyond the statement's 10^5 are fine, only
  // the shape counts.
  growth: {
    target: 'n',
    n: 'rows * cols',
    sizes: [32768, 65536, 131072, 262144, 524288],
    input: (n, seed) => {
      const side = Math.round(Math.sqrt(n));
      return randomGrid(seed, side, side, 0.4);
    },
  },
};

export default problem;
