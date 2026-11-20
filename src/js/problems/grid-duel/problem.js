/**
 * Problem: Grid Duel (design)
 *
 * Equivalent to LeetCode 348 (Design Tic-Tac-Toe) with much larger boards; statement and tests are
 * written for this project. Two players mark cells of an n x n board and the first to fill a whole
 * row, column or diagonal wins. Storing the board and scanning a line after every move costs O(n)
 * per move; instead keep one signed counter per row, per column and per diagonal (+1 for player 1,
 * -1 for player 2). A line belongs to a player exactly when its counter reaches +-n, so a move
 * touches at most four counters and the board itself is never stored (an n x n board would not
 * fit in memory at n = 10^5).
 *
 * Classic wrong answers: scanning the row, column and diagonals after every move (O(n) per move,
 * about 10^10 steps at the max sizes), counting marks without the player (a full line of mixed
 * marks is not a win), forgetting the anti-diagonal, and counting every move toward the diagonals
 * instead of only the cells that are on them.
 *
 * A design problem is tested as a sequence of calls: args are [operations, argumentLists] and the
 * expected value lists every call's result (null for the constructor).
 */

import { mulberry32 } from '../../engine/rng.js';
import { shuffle } from '../../engine/growth-inputs.js';

const MAX_N = 100000;
const MAX_CALLS = 100000;

/**
 * Reference simulation with signed line counters.
 * @param {string[]} ops operation names, ops[0] === 'GridDuel'
 * @param {number[][]} args argument list per operation
 * @returns {(number|null)[]} 0, 1 or 2 per play; null for the constructor
 */
export function reference(ops, args) {
  let n = 0;
  let rows = null;
  let cols = null;
  let diag = 0;
  let anti = 0;
  return ops.map((op, i) => {
    if (op !== 'play') {
      n = args[i][0];
      rows = new Int32Array(n);
      cols = new Int32Array(n);
      return null;
    }
    const [row, col, player] = args[i];
    const d = player === 1 ? 1 : -1;
    rows[row] += d;
    cols[col] += d;
    if (row === col) diag += d;
    if (row + col === n - 1) anti += d;
    // A counter of +-n means one player holds the whole line.
    if (Math.abs(rows[row]) === n || Math.abs(cols[col]) === n || Math.abs(diag) === n || Math.abs(anti) === n) return player;
    return 0;
  });
}

/** Builds a test from the board size and a list of [row, col, player] moves. */
function duel(n, moves) {
  return [['GridDuel', ...Array(moves.length).fill('play')], [[n], ...moves]];
}

/**
 * A seeded game on an n x n board: every move takes a fresh cell for a random player, and the game
 * stops at the first win (it ends when no more moves are allowed). For tiny boards the cells are a
 * shuffle of the whole board; for big ones they are drawn with rejection.
 */
function randomGame(seed, n, maxMoves) {
  const rnd = mulberry32(seed);
  const cells = [];
  if (n * n <= 10000) {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
    shuffle(cells, rnd);
  } else {
    const seen = new Set();
    while (cells.length < maxMoves) {
      const r = Math.floor(rnd() * n);
      const c = Math.floor(rnd() * n);
      if (!seen.has(r * n + c)) {
        seen.add(r * n + c);
        cells.push([r, c]);
      }
    }
  }
  // Same counters as the reference, so the generator stops at the first win without replaying the game.
  const rows = new Int32Array(n);
  const cols = new Int32Array(n);
  let diag = 0;
  let anti = 0;
  const moves = [];
  for (const [r, c] of cells.slice(0, maxMoves)) {
    const player = 1 + Math.floor(rnd() * 2);
    const d = player === 1 ? 1 : -1;
    moves.push([r, c, player]);
    rows[r] += d;
    cols[c] += d;
    if (r === c) diag += d;
    if (r + c === n - 1) anti += d;
    if (Math.abs(rows[r]) === n || Math.abs(cols[c]) === n || Math.abs(diag) === n || Math.abs(anti) === n) break;
  }
  return duel(n, moves);
}

/** Player 1 takes a whole row while player 2 scatters marks elsewhere; the win is the last call. */
function lateRowWin(seed, n, row) {
  const rnd = mulberry32(seed);
  const p1 = shuffle(Array.from({ length: n }, (_, c) => [row, c, 1]), rnd);
  const seen = new Set();
  const p2 = [];
  while (p2.length < n - 1) {
    const r = Math.floor(rnd() * n);
    const c = Math.floor(rnd() * n);
    if (r !== row && !seen.has(r * n + c)) {
      seen.add(r * n + c);
      p2.push([r, c, 2]);
    }
  }
  const moves = [];
  for (let i = 0; i < n - 1; i++) moves.push(p2[i], p1[i]);
  moves.push(p1[n - 1]);
  return duel(n, moves);
}

/** The main diagonal filled with alternating players, then the rest of row 0 the same way. */
function mixedFullLines(n) {
  const moves = [];
  for (let i = 0; i < n; i++) moves.push([i, i, (i % 2) + 1]);
  for (let j = 1; j < n; j++) moves.push([0, j, (j % 2) + 1]);
  return duel(n, moves);
}

const visible = [
  { args: duel(2, [[0, 0, 1], [0, 1, 2], [1, 1, 1]]), expected: [null, 0, 0, 1], note: 'Player 1 holds both cells of the main diagonal after the third move.' },
  { args: duel(3, [[0, 0, 1], [0, 1, 2], [1, 0, 1], [1, 1, 2], [2, 2, 1], [2, 1, 2]]), expected: [null, 0, 0, 0, 0, 0, 2], note: 'Player 2 completes column 1 with the last move.' },
  { args: duel(3, [[0, 2, 1], [0, 0, 2], [1, 1, 1], [0, 1, 2], [2, 0, 1]]), expected: [null, 0, 0, 0, 0, 1], note: 'The anti-diagonal runs from the top right to the bottom left: (0,2), (1,1), (2,0).' },
  { args: duel(3, [[1, 0, 1], [1, 1, 2], [1, 2, 1]]), expected: [null, 0, 0, 0], note: 'A full row of mixed marks is not a win for anyone.' },
  { args: duel(1, [[0, 0, 2]]), expected: [null, 2], note: 'On a 1 x 1 board the first mark fills every line.' },
];

// Hidden tests: a 1 x 1 board, a 2 x 2 row win by player 2, a full 3 x 3 board with no winner, an
// anti-diagonal win on a 4 x 4 board, a seeded random 3 x 3 game that ends in a win, and five
// large games: 99,999 random marks on a 1000 board and on a 50,000 board (nobody wins), player 1
// taking a whole row of the 50,000 board with the win on the last call, player 1 taking the whole
// anti-diagonal of a 99,999 board (a win on the last call of 10^5), and a 40,000 board whose
// diagonal and top row are full of mixed marks (nobody wins).
const hiddenArgs = [
  duel(1, [[0, 0, 1]]),
  duel(2, [[0, 0, 1], [1, 0, 2], [1, 1, 2]]),
  duel(3, [[0, 0, 1], [0, 1, 2], [0, 2, 1], [1, 0, 1], [1, 1, 2], [1, 2, 2], [2, 0, 2], [2, 1, 1], [2, 2, 1]]),
  duel(4, [[0, 3, 1], [0, 0, 2], [1, 2, 1], [3, 3, 2], [2, 1, 1], [1, 1, 2], [3, 0, 1]]),
  randomGame(60, 3, 9),
  randomGame(62, 1000, MAX_CALLS - 1),
  randomGame(63, 50000, MAX_CALLS - 1),
  lateRowWin(64, 50000, 12345),
  duel(MAX_CALLS - 1, Array.from({ length: MAX_CALLS - 1 }, (_, i) => [i, MAX_CALLS - 2 - i, 1])),
  mixedFullLines(40000),
];

export const problem = {
  id: 'grid-duel',
  title: 'Grid Duel',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Design', 'Counting', 'Simulation'],
  timeLimitMs: 3000,
  argNames: ['operations', 'arguments'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Two players, <code>1</code> and <code>2</code>, mark cells on an
    <code>n x n</code> board. A player wins by holding every cell of one row, one column, or one of the
    two main diagonals (the main diagonal runs from the top left to the bottom right, the anti-diagonal
    from the top right to the bottom left). Implement the class <code>GridDuel</code>:</p>
    <ul>
      <li><code>GridDuel(n)</code> starts a game on an empty <code>n x n</code> board.</li>
      <li><code>play(row, col, player)</code> makes <code>player</code> mark the cell
      <code>(row, col)</code> and returns <code>1</code> or <code>2</code> if this move completes a line
      for that player, and <code>0</code> otherwise.</li>
    </ul>
    <p>Moves are always legal: a cell is marked at most once, and nobody moves after a win. The players
    do not have to alternate, so one player may make many moves in a row. A test is a sequence of calls: the first list names the operations, the
    second gives each call's arguments, and the output lists each call's result
    (<code>null</code> for the constructor).</p>
  `,
  constraints: [
    '1 <= n <= 10^5',
    '0 <= row, col < n, and player is 1 or 2',
    'Each cell is marked at most once, and no call comes after a win',
    'At most 10^5 calls in total, including the constructor',
    'Target complexity: O(1) per call, O(n) memory',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `operations = ${JSON.stringify(t.args[0])}\narguments = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'After each move you could look at the whole row, column and diagonals of the new mark. What does that cost when n is 50,000 and there are 10^5 moves?',
    'Could you even store the board at n = 10^5? What do you actually need to know about each line to decide a win?',
    'What single number could describe "how far along" a row is for each player, so that two opponents cancel each other out?',
    'Which counters does one move at (row, col) change, and when does it touch a diagonal at all?',
    'A full row where both players have marks: what should the counter read, and why is that not a win?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Do not store the board. Keep one counter per row, one per column, and one each for the main
    diagonal and the anti-diagonal. A move by player 1 adds 1 to the counters of the lines through the
    cell; a move by player 2 subtracts 1. A move touches its row and column always, the main diagonal
    only when <code>row == col</code>, and the anti-diagonal only when <code>row + col == n - 1</code>.
    After updating, a counter at <code>n</code> or <code>-n</code> means one player holds the whole
    line, and that player wins.</p>
    <h4>Why it works</h4>
    <p>A line has exactly n cells. Its counter is the number of player 1 cells minus the number of
    player 2 cells, so it reaches +n only if all n cells are player 1's, and -n only if all are
    player 2's. A full line of mixed marks sums to something strictly between, so it correctly is not a
    win. Only the lines through the new mark can have just been completed, so checking those is enough.</p>
    <h4>Complexity</h4>
    <p>O(1) per call, O(n) memory.</p>
    <h4>Pitfall</h4>
    <p>Scanning the lines after every move is correct but O(n) per move: with n = 50,000 and 10^5
    moves that is about 10^10 steps, and an n x n array does not fit in memory at all. Counting
    marks without the player calls a full mixed line a win. The anti-diagonal is easy to forget: its
    cells have <code>row + col == n - 1</code>.</p>
  `,

  // Neutral class signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    kind: 'class',
    name: 'GridDuel',
    constructor: { params: [{ name: 'n', type: 'int' }] },
    methods: [
      {
        name: 'play',
        params: [
          { name: 'row', type: 'int' },
          { name: 'col', type: 'int' },
          { name: 'player', type: 'int' },
        ],
        returns: 'int',
      },
    ],
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: two JSON lines, the operations and then the argument lists.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: the operations, then the argument lists (both JSON arrays).' };
    let ops;
    let args;
    try {
      ops = JSON.parse(lines[0]);
      args = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be valid JSON arrays.' };
    }
    if (!Array.isArray(ops) || !Array.isArray(args) || ops.length !== args.length) return { ok: false, error: 'Operations and arguments must be arrays of the same length.' };
    if (ops.length < 1 || ops.length > MAX_CALLS) return { ok: false, error: 'Between 1 and 10^5 calls.' };
    if (ops[0] !== 'GridDuel' || !Array.isArray(args[0]) || args[0].length !== 1 || !Number.isInteger(args[0][0]) || args[0][0] < 1 || args[0][0] > MAX_N) {
      return { ok: false, error: 'The first call must be "GridDuel" with [n], n from 1 to 10^5.' };
    }
    const n = args[0][0];
    const taken = new Set();
    for (let i = 1; i < ops.length; i++) {
      if (ops[i] !== 'play') return { ok: false, error: `Unknown operation "${ops[i]}".` };
      const a = args[i];
      if (!Array.isArray(a) || a.length !== 3 || !a.every(Number.isInteger)) return { ok: false, error: `play needs [row, col, player] (call ${i}).` };
      if (a[0] < 0 || a[0] >= n || a[1] < 0 || a[1] >= n) return { ok: false, error: `Cell out of the board (call ${i}).` };
      if (a[2] !== 1 && a[2] !== 2) return { ok: false, error: `player must be 1 or 2 (call ${i}).` };
      if (taken.has(a[0] * n + a[1])) return { ok: false, error: `Cell (${a[0]}, ${a[1]}) is marked twice (call ${i}).` };
      taken.add(a[0] * n + a[1]);
    }
    const results = reference(ops, args);
    const won = results.findIndex((r) => r === 1 || r === 2);
    if (won !== -1 && won < ops.length - 1) return { ok: false, error: `The game is already won at call ${won}; no calls may follow.` };
    return { ok: true, args: [ops, args] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),

  // Growth estimate after Accepted (docs/adr/0004-complexity-feedback.md). A 10^5 board and fresh cells
  // filled column by column with random players: nobody ever wins, and a per-move line scan would cost
  // O(n) each. The cell of move k is (k mod side, k div side), distinct by construction.
  growth: {
    target: 'n',
    n: 'number of calls (board side 10^5, marks with random players, never a win)',
    sizes: [16000, 32000, 64000, 128000, 256000, 512000, 1024000, 2048000],
    input: (n, seed) => {
      const rnd = mulberry32(seed);
      const side = MAX_N;
      const ops = ['GridDuel'];
      const args = [[side]];
      for (let k = 0; ops.length < n; k++) {
        ops.push('play');
        args.push([k % side, Math.floor(k / side), 1 + Math.floor(rnd() * 2)]);
      }
      return [ops, args];
    },
  },
};

export default problem;
