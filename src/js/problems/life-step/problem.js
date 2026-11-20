/**
 * Problem: Life Step
 *
 * One generation of Conway's Game of Life. Every cell's next state depends on the current states
 * of its eight neighbours, so updates must not leak into the same generation. Writing into a copy
 * is the simple fix; the in-place version encodes both states in one cell (bit 0 the current
 * state, bit 1 the next) and shifts at the end. The classic bug is updating cells in place and
 * then reading already-updated neighbours.
 *
 * The board is returned rather than mutated so the harness can judge it in every language.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: count live neighbours on the unchanged input, write into a fresh board.
 * @param {number[][]} board
 * @returns {number[][]}
 */
export function reference(board) {
  const m = board.length;
  const n = board[0].length;
  return board.map((row, r) =>
    row.map((alive, c) => {
      let live = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < m && cc >= 0 && cc < n) live += board[rr][cc];
        }
      }
      return live === 3 || (alive === 1 && live === 2) ? 1 : 0;
    }),
  );
}

const MAX_SIDE = 100;

/** An m x n board where each cell is alive with probability `density`. */
function randomBoard(seed, m, n, density) {
  const rnd = mulberry32(seed);
  return Array.from({ length: m }, () => Array.from({ length: n }, () => (rnd() < density ? 1 : 0)));
}

/** An m x n board of dead cells with `cells` ([r, c]) alive. */
function withCells(m, n, cells) {
  const b = Array.from({ length: m }, () => new Array(n).fill(0));
  for (const [r, c] of cells) b[r][c] = 1;
  return b;
}

const visible = [
  {
    args: [[[0, 1, 0], [0, 0, 1], [1, 1, 1], [0, 0, 0]]],
    expected: [[0, 0, 0], [1, 0, 1], [0, 1, 1], [0, 1, 0]],
    note: 'A glider: it moves one cell diagonally every four generations.',
  },
  { args: [[[1, 1], [1, 0]]], expected: [[1, 1], [1, 1]], note: 'The dead corner has exactly three live neighbours, so it comes alive.' },
  { args: [[[0, 0, 0], [1, 1, 1], [0, 0, 0]]], expected: [[0, 1, 0], [0, 1, 0], [0, 1, 0]], note: 'A blinker turns from horizontal to vertical.' },
  { args: [[[1]]], expected: [[0]], note: 'A lone cell has no neighbours and dies.' },
  { args: [[[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]]], expected: [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]], note: 'A 2 x 2 block is stable: each live cell has three live neighbours.' },
];

// Hidden tests: a single row, a single column, an all-alive board (overcrowding everywhere except
// corners), a cell with exactly 4 neighbours, a blinker on the border, then random boards up to
// 100 x 100 where an in-place update reads half-updated neighbours.
const hiddenArgs = [
  [[[1, 1, 1, 1, 1]]],
  [[[1], [1], [1], [0], [1]]],
  [Array.from({ length: 4 }, () => new Array(5).fill(1))],
  [withCells(3, 3, [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]])],
  [withCells(5, 5, [[0, 1], [0, 2], [0, 3], [4, 0], [4, 1], [4, 2]])],
  [randomBoard(263, 7, 9, 0.4)],
  [randomBoard(269, 30, 1, 0.6)],
  [randomBoard(271, MAX_SIDE, MAX_SIDE, 0.35)],
  [randomBoard(277, MAX_SIDE, MAX_SIDE, 0.6)],
  [randomBoard(281, MAX_SIDE, 37, 0.25)],
];

export const problem = {
  id: 'life-step',
  title: 'Life Step',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Matrix', 'Simulation', 'In-Place Encoding'],
  timeLimitMs: 2000,
  argNames: ['board'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A board of <code>m x n</code> cells holds a generation of Conway's Game of Life: each
    cell is alive (<code>1</code>) or dead (<code>0</code>). A cell's neighbours are the up to
    eight cells around it (horizontally, vertically and diagonally); cells outside the board are
    dead.</p>
    <p>The next generation follows four rules, applied to every cell at the same time:</p>
    <ul>
      <li>A live cell with fewer than two live neighbours dies.</li>
      <li>A live cell with two or three live neighbours lives on.</li>
      <li>A live cell with more than three live neighbours dies.</li>
      <li>A dead cell with exactly three live neighbours becomes alive.</li>
    </ul>
    <p>Return the board of the next generation. "At the same time" means every cell's fate is
    decided by the current generation only, never by cells already updated.</p>
  `,
  constraints: [
    '1 <= m, n <= 100',
    'board[i][j] is 0 or 1',
    'Target complexity: O(m * n) time; O(1) extra space is possible',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `board = ${JSON.stringify(t.args[0])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'If you update the board as you go, what does the next cell see when it counts its neighbours?',
    'What is the simplest way to keep the current generation readable while you write the next one?',
    'Each cell only needs two values: now and next. Could one integer hold both?',
    'How do you handle neighbours that would fall outside the board without special cases everywhere?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Update the board in place, using two transitional values that still remember the current
    generation: <code>2</code> means alive now and dead next, <code>-1</code> means dead now and alive
    next. A final pass turns <code>2</code> into <code>0</code> and <code>-1</code> into
    <code>1</code>.</p>
    <h4>Why it works</h4>
    <p>Every rule must read only the current generation. With this encoding a cell is alive now exactly
    when its value is greater than <code>0</code>, whether or not it has already been rewritten, so
    cells counted later still see the old states. The 3 x 3 scan is clipped to the board, which treats
    cells outside it as dead, and the count starts at minus the cell's own state because the scan
    includes the cell itself.</p>
    <h4>Complexity</h4>
    <p>O(m * n) time: at most 9 reads per cell. O(1) extra space. Copying the board first is equally
    fast and simpler, at O(m * n) extra space.</p>
    <h4>Pitfall</h4>
    <p>Writing the new <code>0</code> or <code>1</code> straight into the board. Cells scanned
    afterwards then count neighbours that already belong to the next generation, which breaks the rule
    that every cell changes at the same time.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'nextGeneration',
    params: [{ name: 'board', type: 'int[][]' }],
    returns: 'int[][]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: board as a JSON array of rows.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let board;
    try {
      board = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the board as a JSON array of rows, for example [[0,1,0],[0,0,1]].' };
    }
    if (!Array.isArray(board) || board.length < 1 || board.length > MAX_SIDE) return { ok: false, error: 'The board must have 1 to 100 rows.' };
    const n = Array.isArray(board[0]) ? board[0].length : 0;
    if (n < 1 || n > MAX_SIDE) return { ok: false, error: 'Rows must have 1 to 100 cells.' };
    if (!board.every((row) => Array.isArray(row) && row.length === n && row.every((v) => v === 0 || v === 1))) {
      return { ok: false, error: 'Every row must have the same length, and every cell must be 0 or 1.' };
    }
    return { ok: true, args: [board] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),

  // A square board of n cells at 50% density: every cell counts its 8 neighbours.
  growth: {
    target: 'n',
    n: 'board.length * board[0].length',
    sizes: [32768, 65536, 131072, 262144, 524288],
    input: (n, seed) => {
      const side = Math.round(Math.sqrt(n));
      return [randomBoard(seed, side, side, 0.5)];
    },
  },
};

export default problem;
