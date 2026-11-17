/**
 * Problem: Grid Word
 *
 * Can a word be traced through a letter grid moving up, down, left or right, using each cell at
 * most once? Classic backtracking: mark a cell while it is on the current path and unmark it on
 * the way back. The classic bugs are reusing a cell, forgetting to unmark (so a later start
 * finds the cell blocked), and allowing diagonal steps.
 *
 * The search is exponential in the worst case: on a 6 x 6 grid of 'A' and the word
 * "AAAAAAAAAAAAAAB", plain backtracking walks about 7.5 million paths before giving up. Two
 * cheap prunes remove that: give up when the grid does not hold enough of some letter, and
 * search from whichever end of the word has the rarer letter.
 */

import { mulberry32 } from '../../engine/rng.js';

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Reference: letter-count prune, then depth-first search with an on-path mark per cell.
 * @param {string[]} board rows of equal length
 * @param {string} word
 * @returns {boolean}
 */
export function reference(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  if (word.length > rows * cols) return false;
  const have = new Map();
  for (const row of board) for (const c of row) have.set(c, (have.get(c) ?? 0) + 1);
  const need = new Map();
  for (const c of word) need.set(c, (need.get(c) ?? 0) + 1);
  for (const [c, k] of need) if ((have.get(c) ?? 0) < k) return false;
  const onPath = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const dfs = (r, c, k) => {
    if (board[r][c] !== word[k]) return false;
    if (k === word.length - 1) return true;
    onPath[r][c] = true;
    let found = false;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !onPath[nr][nc] && dfs(nr, nc, k + 1)) {
        found = true;
        break;
      }
    }
    onPath[r][c] = false;
    return found;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  return false;
}

const MAX_SIDE = 6;
const MAX_WORD = 15;

/** Seeded rows x cols board over the given letters. */
function randomBoard(rnd, rows, cols, letters) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => letters[Math.floor(rnd() * letters.length)]).join(''));
}

/** Reads a word along a seeded self-avoiding walk, so the word is known to be present. */
function walkWord(rnd, board, len) {
  const rows = board.length;
  const cols = board[0].length;
  for (;;) {
    let r = Math.floor(rnd() * rows);
    let c = Math.floor(rnd() * cols);
    const seen = new Set([`${r},${c}`]);
    let w = board[r][c];
    while (w.length < len) {
      const options = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && a < rows && b >= 0 && b < cols && !seen.has(`${a},${b}`));
      if (!options.length) break;
      [r, c] = options[Math.floor(rnd() * options.length)];
      seen.add(`${r},${c}`);
      w += board[r][c];
    }
    if (w.length === len) return w;
  }
}

/** A max-size board with a 15-letter word traced along a walk (present). */
function presentCase(seed, letters) {
  const rnd = mulberry32(seed);
  const board = randomBoard(rnd, MAX_SIDE, MAX_SIDE, letters);
  return [board, walkWord(rnd, board, MAX_WORD)];
}

/** A max-size board and a 15-letter word over the same letters, usually absent. */
function randomCase(seed, letters) {
  const rnd = mulberry32(seed);
  const board = randomBoard(rnd, MAX_SIDE, MAX_SIDE, letters);
  let word = '';
  for (let i = 0; i < MAX_WORD; i++) word += letters[Math.floor(rnd() * letters.length)];
  return [board, word];
}

const ABCE = ['ABCE', 'SFCS', 'ADEE'];

const visible = [
  { args: [ABCE, 'ABCCED'], expected: true, note: 'A B C right, C down, E D left along the bottom row.' },
  { args: [ABCE, 'SEE'], expected: true, note: 'S on the right edge, then E below it, then E to its left.' },
  { args: [ABCE, 'ABCB'], expected: false, note: 'The only B is already used by the path, and a cell cannot be reused.' },
  { args: [['a'], 'a'], expected: true, note: 'A one-cell board.' },
  { args: [['ab', 'cd'], 'abd'], expected: true, note: 'a, right to b, down to d. Letters are case-sensitive.' },
];

// Hidden tests: a cell reused (false), a diagonal step (false), a path that only works if cells
// are unmarked after a failed start, case sensitivity, a word longer than the board, and max-size
// boards: 15-letter words traced along a walk, random absent words, and the all-'A' board where
// backtracking without pruning explores millions of paths.
const hiddenArgs = [
  [['ab'], 'aba'],
  [['ab', 'cd'], 'ad'],
  [['CAA', 'AAA', 'BCD'], 'AAB'],
  [['aA'], 'AA'],
  [['ab', 'cd'], 'abdca'],
  [['ABCE', 'SFES', 'ADEE'], 'ABCESEEEFS'],
  presentCase(3, 'AB'),
  presentCase(5, 'ABCD'),
  randomCase(7, 'ABC'),
  [Array(MAX_SIDE).fill('A'.repeat(MAX_SIDE)), `${'A'.repeat(MAX_WORD - 1)}B`],
];

const isLetters = (s) => typeof s === 'string' && /^[A-Za-z]+$/.test(s);

export const problem = {
  id: 'grid-word',
  title: 'Grid Word',
  difficulty: 'Medium',
  topics: ['arrays-strings'],
  patterns: ['Backtracking', 'DFS', 'Matrix'],
  milestone: 2,
  timeLimitMs: 3000,
  argNames: ['board', 'word'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a grid of letters <code>board</code> (each string is one row) and a string
    <code>word</code>, return <code>true</code> if <code>word</code> can be spelled by a path of
    cells in the grid.</p>
    <p>The path starts at any cell, and each next letter must be in a cell directly above, below,
    left or right of the previous one (no diagonals). A cell may be used at most once in the
    path. Letters are case-sensitive.</p>
    <p>Follow-up: a board full of one letter can make plain backtracking explore millions of paths.
    Can you prune the search so it stays fast?</p>
  `,
  constraints: [
    '1 <= rows, cols <= 6 (every row has the same length)',
    '1 <= word.length <= 15',
    'board and word consist of English letters (upper and lower case)',
    'Target: backtracking with pruning (unpruned search can visit about 7.5 * 10^6 paths)',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `board = ${JSON.stringify(t.args[0])}, word = ${JSON.stringify(t.args[1])}`,
    output: String(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'From a cell that matches the current letter, which cells may hold the next letter?',
    'How do you stop the path from stepping back onto a cell it already uses?',
    'If one starting cell fails, will the cells it marked be usable by the next attempt?',
    'Before searching at all, what quick count would tell you the word cannot fit?',
    'Does it matter whether you search for the word forwards or backwards?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'exist',
    params: [
      { name: 'board', type: 'string[]' },
      { name: 'word', type: 'string' },
    ],
    returns: 'bool',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: board as a JSON array of row strings on the first line, word on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: board as a JSON array of strings, then word as a JSON string.' };
    let board;
    let word;
    try {
      board = JSON.parse(lines[0]);
      word = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Enter board like ["ABCE","SFCS"] and word like "ABC".' };
    }
    if (!Array.isArray(board) || board.length < 1 || board.length > MAX_SIDE) return { ok: false, error: 'board must have 1 to 6 rows.' };
    const cols = typeof board[0] === 'string' ? board[0].length : 0;
    if (cols < 1 || cols > MAX_SIDE) return { ok: false, error: 'Each row must have 1 to 6 letters.' };
    if (!board.every((row) => isLetters(row) && row.length === cols)) return { ok: false, error: 'Rows must be letter strings of equal length.' };
    if (!isLetters(word) || word.length > MAX_WORD) return { ok: false, error: 'word must have 1 to 15 English letters.' };
    return { ok: true, args: [board, word] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
