/**
 * Problem: Sudoku Check
 *
 * A 9x9 sudoku board is partly filled. Report whether the digits already on it break a rule: no
 * digit may repeat in a row, in a column, or in one of the nine 3x3 boxes. Empty cells are ignored,
 * and the board does not have to be solvable.
 *
 * One pass over the 81 cells with a bitmask per row, per column and per box: each cell asks "have I
 * seen this digit in my row, column or box?" in O(1). The board size is fixed, so every case is
 * already at the maximum size; the traps are in which cells share a box and in not over-checking.
 */

import { mulberry32 } from '../../engine/rng.js';

/**
 * Reference: one bitmask per row, column and box; the box of cell (r, c) is 3 * floor(r / 3) + floor(c / 3).
 * @param {string[]} board 9 strings of 9 characters, '.' for an empty cell
 * @returns {boolean}
 */
export function reference(board) {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = board[r][c];
      if (ch === '.') continue;
      const bit = 1 << (ch.charCodeAt(0) - 49);
      const b = 3 * Math.floor(r / 3) + Math.floor(c / 3);
      if (rows[r] & bit || cols[c] & bit || boxes[b] & bit) return false;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
  }
  return true;
}

const EMPTY = Array.from({ length: 9 }, () => '.........');

/** A complete valid grid: a base pattern with seeded shuffles of digits, bands, and rows and columns inside bands. */
function solvedGrid(seed) {
  const rnd = mulberry32(seed);
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const rowOrder = shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((i) => band * 3 + i));
  const colOrder = shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((i) => band * 3 + i));
  return rowOrder.map((r) => colOrder.map((c) => String(digits[(3 * (r % 3) + Math.floor(r / 3) + c) % 9])).join(''));
}

/** Blanks each cell with probability p, seeded. */
function blanked(board, seed, p) {
  const rnd = mulberry32(seed);
  return board.map((row) => [...row].map((ch) => (rnd() < p ? '.' : ch)).join(''));
}

const setCell = (board, r, c, ch) => board.map((row, i) => (i === r ? row.slice(0, c) + ch + row.slice(c + 1) : row));

/** Which rules would digit `d` at (r, c) break against the board as it stands? */
function breaks(board, r, c, d) {
  const hit = { row: false, col: false, box: false };
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r][i] === d) hit.row = true;
    if (i !== r && board[i][c] === d) hit.col = true;
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let i = br; i < br + 3; i++) {
    for (let j = bc; j < bc + 3; j++) if ((i !== r || j !== c) && board[i][j] === d) hit.box = true;
  }
  return hit;
}

/** A sparse valid board: random digits are placed only while no rule breaks. */
function sparseValid(seed, count) {
  const rnd = mulberry32(seed);
  let board = EMPTY;
  let placed = 0;
  for (let tries = 0; placed < count && tries < 5000; tries++) {
    const r = Math.floor(rnd() * 9);
    const c = Math.floor(rnd() * 9);
    const d = String(1 + Math.floor(rnd() * 9));
    if (board[r][c] !== '.') continue;
    const h = breaks(board, r, c, d);
    if (h.row || h.col || h.box) continue;
    board = setCell(board, r, c, d);
    placed++;
  }
  return board;
}

/** A sparse valid board plus one digit that breaks exactly one kind of rule ('row', 'col' or 'box'). */
function withConflict(seed, kind) {
  const rnd = mulberry32(seed);
  const board = sparseValid(seed + 1000, 24);
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (board[r][c] === '.') for (let d = 1; d <= 9; d++) cells.push([r, c, String(d)]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (const [r, c, d] of cells) {
    const h = breaks(board, r, c, d);
    const only = ['row', 'col', 'box'].filter((k) => h[k]);
    if (only.length === 1 && only[0] === kind) return setCell(board, r, c, d);
  }
  throw new Error('no conflict found');
}

const visible = [
  {
    args: [['1...5...9', '.5.7.9.2.', '7.9.2.4..', '23.....91', '...89.2.4', '8.1.3...7', '.4.6.8.1.', '6...1.3.5', '9.2...6.8']],
    expected: true,
    note: 'No digit repeats in any row, column or box. Empty cells never count.',
  },
  {
    args: [['2...3...2', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........']],
    expected: false,
    note: 'The top row holds two 2s. They sit in different columns and boxes, so only the row rule catches it.',
  },
  {
    args: [['5...3....', '.5.......', '..4......', '....4....', '.......1.', '.........', '.1.......', '.........', '.........']],
    expected: false,
    note: 'Two 5s share the top-left box. No row and no column holds both, so checking rows and columns alone misses it.',
  },
  {
    args: [['5........', '...5.....', '......5..', '.5.......', '....5....', '.......5.', '..5......', '.....5...', '........5']],
    expected: true,
    note: 'Nine 5s, one per row, column and box. Repeating a digit across the board is fine.',
  },
  {
    args: [['....8....', '.........', '.........', '.........', '.........', '.........', '.........', '....8....', '.........']],
    expected: false,
    note: 'The middle column holds two 8s, in different rows and boxes.',
  },
];

// The board is always 9x9, so every case is at maximum size; the full grids are the densest.
// Hidden: empty board, two full grids (one valid, one whose last cell repeats the first of its
// row), sparse and half-filled valid boards, a single conflict of each kind, a box-only conflict in
// the last box, and a valid board no solver could finish (cell (0, 8) has no candidate left).
const hiddenInputs = [
  EMPTY,
  solvedGrid(3),
  (() => {
    const g = solvedGrid(5);
    return setCell(g, 8, 8, g[8][0]);
  })(),
  sparseValid(7, 30),
  withConflict(11, 'box'),
  withConflict(13, 'col'),
  withConflict(17, 'row'),
  blanked(solvedGrid(19), 23, 0.5),
  ['12345678.', '........9', '.........', '.........', '.........', '.........', '.........', '.........', '.........'],
  ['.........', '.........', '.........', '.........', '.........', '.........', '......7..', '.........', '........7'],
];

/** @param {unknown} board */
const isBoard = (board) =>
  Array.isArray(board) && board.length === 9 && board.every((row) => typeof row === 'string' && /^[.1-9]{9}$/.test(row));

export const problem = {
  id: 'sudoku-check',
  title: 'Sudoku Check',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Hash Set', 'Bitmask', 'Grid'],
  timeLimitMs: 2000,
  argNames: ['board'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>A sudoku board is given as <code>board</code>, 9 strings of 9 characters each. A character is
    a digit <code>1</code> to <code>9</code> or <code>.</code> for an empty cell.</p>
    <p>Return <code>true</code> if the digits already placed follow the three sudoku rules, and
    <code>false</code> otherwise:</p>
    <ul>
      <li>no digit appears twice in the same row;</li>
      <li>no digit appears twice in the same column;</li>
      <li>no digit appears twice in the same 3x3 box (the board splits into nine of them).</li>
    </ul>
    <p>Only the filled cells are judged. A board that obeys the rules may still have no solution, and
    that is fine: you are validating what is there, not solving it.</p>
  `,
  constraints: [
    'board.length == 9 and board[i].length == 9',
    "board[i][j] is a digit '1'-'9' or '.'",
    'Target complexity: O(1) work per cell, 81 cells',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `board = ${JSON.stringify(t.args[0])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'What is the cheapest question you can ask about one cell, using only what you have seen so far?',
    'Which three groups does a single cell belong to? How many groups are there of each kind?',
    'How could you remember, for each group, which digits it already holds, so the check is instant?',
    'Which box does the cell in row r, column c belong to? Can you write it as one number from 0 to 8?',
    'Should an empty cell ever make the answer false? Should it matter whether the board can be finished?',
  ],

  // Walkthrough prose, shown after a solve (docs/PROBLEM_FORMAT.md).
  explanationHtml: `
    <h4>Idea</h4>
    <p>Keep 27 small sets: one per row, per column and per box, each remembering the digits placed in
    it. Walk the 81 cells once. For a digit, look up its row, column and box; if any already holds it,
    the board is invalid, otherwise add it to all three. A 9-bit mask per group does the job, and the
    box of cell <code>(r, c)</code> is <code>3 * (r / 3) + c / 3</code> with integer division.</p>
    <h4>Why it works</h4>
    <p>A rule is broken exactly when two filled cells in one group hold the same digit. The first time
    the second of them is visited, its group already contains the digit. Every cell is in exactly one
    row, one column and one box, so all three rules are covered in the same pass.</p>
    <h4>Complexity</h4>
    <p>O(81) time, which is O(1) for a fixed board, and constant extra space for 27 masks.</p>
    <h4>Pitfall</h4>
    <p>Checking only rows and columns passes many boards and misses two equal digits that share a box
    without sharing a line. Computing the box as <code>r / 3 + c / 3</code> merges different boxes.
    The opposite mistake is to reject a board because it cannot be completed: only repeated digits
    count.</p>
  `,

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it
  // (src/js/engine/codegen.js). Solutions live in ./solutions, one file per language.
  signature: {
    name: 'isValidSudoku',
    params: [{ name: 'board', type: 'string[]' }],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenInputs.map((board) => ({ args: [board], expected: reference(board) })),

  /**
   * Custom input: the board as one JSON array of 9 strings.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    let board;
    try {
      board = JSON.parse(raw.trim());
    } catch {
      return { ok: false, error: 'Enter the board as a JSON array of 9 strings, for example ["1...5...9", ...].' };
    }
    if (!isBoard(board)) return { ok: false, error: "The board is 9 strings of 9 characters, each a digit 1-9 or '.'." };
    return { ok: true, args: [board] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0]),
};

export default problem;
