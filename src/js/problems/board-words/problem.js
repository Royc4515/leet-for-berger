/**
 * Problem: Board Words
 *
 * Find every word of a list that can be traced on a letter grid (moves up, down, left, right,
 * each cell at most once per word). Running a separate backtracking search per word repeats the
 * same walks for every word that shares a beginning; putting the words in a trie lets one
 * depth-first search from each cell follow all of them at once, and stops as soon as the path
 * spells no prefix of any word. Pruning trie branches whose words were all found keeps the
 * search from re-walking them. The classic bugs are reporting a word twice (two paths spell
 * it), reusing a cell, losing a word that is a prefix of another ("app" and "apple"), and
 * returning the words in discovery order: the answer here is sorted.
 */

import { mulberry32 } from '../../engine/rng.js';

const MAX_SIDE = 12;
const MAX_WORDS = 30000;
const MAX_WORD = 10;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Reference: trie of the words, one DFS per starting cell, found words removed from the trie,
 * emptied branches pruned, result sorted.
 * @param {string[]} board rows of equal length
 * @param {string[]} words distinct words
 * @returns {string[]}
 */
export function reference(board, words) {
  const root = new Map();
  for (const w of words) {
    let node = root;
    for (const c of w) {
      if (!node.has(c)) node.set(c, new Map());
      node = node.get(c);
    }
    // '$' is never a letter, so it can mark the end of a word inside the same Map.
    node.set('$', w);
  }
  const rows = board.length;
  const cols = board[0].length;
  const grid = board.map((r) => [...r]);
  const found = [];
  const dfs = (parent, r, c) => {
    const ch = grid[r][c];
    const node = parent.get(ch);
    if (node.has('$')) {
      found.push(node.get('$'));
      node.delete('$');
    }
    grid[r][c] = '#';
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && node.has(grid[nr][nc])) dfs(node, nr, nc);
    }
    grid[r][c] = ch;
    if (node.size === 0) parent.delete(ch);
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (root.has(grid[r][c])) dfs(root, r, c);
  return found.sort();
}

function randomBoard(rnd, rows, cols, letters) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => letters[Math.floor(rnd() * letters.length)]).join(''));
}

/** A word read along a seeded self-avoiding walk of up to `len` cells, so it is on the board. */
function walkWord(rnd, board, len) {
  const rows = board.length;
  const cols = board[0].length;
  let r = Math.floor(rnd() * rows);
  let c = Math.floor(rnd() * cols);
  const seen = new Set([r * cols + c]);
  let w = board[r][c];
  while (w.length < len) {
    const options = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && a < rows && b >= 0 && b < cols && !seen.has(a * cols + b));
    if (!options.length) break;
    [r, c] = options[Math.floor(rnd() * options.length)];
    seen.add(r * cols + c);
    w += board[r][c];
  }
  return w;
}

/**
 * A board and `count` distinct words: a share `walkShare` traced on the board, the rest random
 * over `wordLetters`, lengths from 1 to `maxLen`.
 */
function boardCase(seed, rows, cols, letters, count, walkShare, wordLetters, maxLen) {
  const rnd = mulberry32(seed);
  const board = randomBoard(rnd, rows, cols, letters);
  const words = new Set();
  while (words.size < count) {
    const len = 1 + Math.floor(rnd() * maxLen);
    if (rnd() < walkShare) words.add(walkWord(rnd, board, len));
    else {
      let w = '';
      for (let i = 0; i < len; i++) w += wordLetters[Math.floor(rnd() * wordLetters.length)];
      words.add(w);
    }
  }
  return [board, [...words]];
}

/**
 * Max board with words that share long traced prefixes: each of `stems` walks of 9 cells gets
 * every possible last letter, so most words fail only at their final letter. A per-word search
 * re-walks the 9-cell stem for each of the 26 endings; a trie walks it once.
 */
function sharedStems(seed, stems) {
  const rnd = mulberry32(seed);
  const board = randomBoard(rnd, MAX_SIDE, MAX_SIDE, 'abcdefghijklmnopqrstuvwxyz');
  const words = new Set();
  while (words.size < stems * 26) {
    const stem = walkWord(rnd, board, MAX_WORD - 1);
    if (stem.length < MAX_WORD - 1) continue;
    for (let k = 0; k < 26; k++) words.add(stem + String.fromCharCode(97 + k));
  }
  return [board, [...words].slice(0, MAX_WORDS)];
}

const OATH = ['oaan', 'etae', 'ihkr', 'iflv'];

const visible = [
  { args: [OATH, ['oath', 'pea', 'eat', 'rain']], expected: ['eat', 'oath'], note: '"oath" and "eat" can be traced; "pea" and "rain" cannot. The answer is in sorted order.' },
  { args: [['ab', 'cd'], ['abcb']], expected: [], note: 'Spelling "abcb" would need the cell b twice.' },
  { args: [['a'], ['a', 'b', 'aa']], expected: ['a'], note: 'A one-cell board can spell only one-letter words, each cell once.' },
  { args: [['aa', 'aa'], ['aa', 'aaa', 'aaaaa']], expected: ['aa', 'aaa'], note: 'Many paths spell "aa", but it is listed once. Five letters do not fit in four cells.' },
  { args: [['ba'], ['b', 'a', 'ab', 'ba']], expected: ['a', 'ab', 'b', 'ba'], note: 'Words may be read in any direction along the path, and the output is sorted.' },
];

// Hidden tests: a word that is a prefix of another, diagonal moves (not allowed), a word that
// needs the cell it started from, then max-size 12 x 12 boards: 3 * 10^4 words with a third
// traced on the board, 3 * 10^4 words over five letters, 3 * 10^4 words sharing 9-letter traced
// stems that fail on their last letter (a separate search per word repeats every stem 26 times),
// and a board of one letter with words of every length.
const hiddenArgs = [
  [['apple', 'xxxxy'], ['app', 'apple', 'apply', 'ply']],
  [['ab', 'cd'], ['ad', 'bc', 'acdb', 'abdc']],
  [['ab', 'ba'], ['aba', 'abab', 'ababa', 'baba']],
  [['z'], ['z']],
  [OATH, ['oath', 'oat', 'oa', 'o', 'eat', 'eta', 'tea', 'hike', 'kite', 'flv', 'vlfi', 'nrv']],
  boardCase(3, 6, 6, 'abc', 500, 0.5, 'abc', 6),
  boardCase(5, MAX_SIDE, MAX_SIDE, 'abcdefghijklmnopqrstuvwxyz', MAX_WORDS, 0.33, 'abcdefghijklmnopqrstuvwxyz', MAX_WORD),
  boardCase(7, MAX_SIDE, MAX_SIDE, 'abcde', MAX_WORDS, 0, 'abcde', MAX_WORD),
  sharedStems(11, Math.ceil(MAX_WORDS / 26)),
  [Array(MAX_SIDE).fill('a'.repeat(MAX_SIDE)), [...Array.from({ length: MAX_WORD }, (_, k) => 'a'.repeat(k + 1)), 'b', 'ab', 'ba']],
];

const isWord = (s) => typeof s === 'string' && s.length >= 1 && s.length <= MAX_WORD && /^[a-z]+$/.test(s);

export const problem = {
  id: 'board-words',
  title: 'Board Words',
  difficulty: 'Hard',
  topics: ['trees', 'arrays-strings'],
  patterns: ['Trie', 'Backtracking', 'DFS', 'Matrix'],
  timeLimitMs: 3000,
  argNames: ['board', 'words'],

  // Statement is trusted, author-written HTML. Never interpolate user input into it.
  statementHtml: `
    <p>Given a grid of letters <code>board</code> (each string is one row) and a list of distinct
    words <code>words</code>, return every word from the list that can be spelled by a path of
    cells in the grid.</p>
    <p>A path starts at any cell, and each next letter must be in a cell directly above, below,
    left or right of the previous one (no diagonals). A cell may be used at most once within the
    same word.</p>
    <p>Return the words found in <strong>lexicographic (dictionary) order</strong>, each word
    once, however many paths spell it.</p>
  `,
  constraints: [
    '1 <= rows, cols <= 12 (every row has the same length)',
    '1 <= words.length <= 3 * 10^4',
    '1 <= words[i].length <= 10',
    'board and words consist of lowercase English letters; all words are distinct',
    'Target: one trie-guided backtracking search from each cell, not one search per word',
  ],
  examples: visible.slice(0, 3).map((t) => ({
    input: `board = ${JSON.stringify(t.args[0])}, words = ${JSON.stringify(t.args[1])}`,
    output: JSON.stringify(t.expected),
    explanation: t.note,
  })),

  // Socratic hint ladder, consumed by the AI Mentor (scripted provider today).
  hints: [
    'You can already search the grid for one word. With 30,000 words, how much of that work is repeated?',
    'Many words share their first letters. Which structure lets one walk on the board follow all words with the same beginning at once?',
    'While walking the board, when can you stop extending the current path?',
    'Two different paths can spell the same word. How do you make sure it is reported once?',
    'Once every word below a trie node has been found, is there any reason to walk into that node again?',
  ],

  // Neutral signature: starter code and harnesses for all 8 languages are generated from it.
  signature: {
    name: 'findWords',
    params: [
      { name: 'board', type: 'string[]' },
      { name: 'words', type: 'string[]' },
    ],
    returns: 'string[]',
  },

  /** Exactly 5 visible tests (detailed feedback). */
  visibleTests: visible.map(({ args, expected }) => ({ args, expected })),

  /** Exactly 10 hidden tests (pass/fail only). Expected values come from the reference. */
  hiddenTests: hiddenArgs.map((args) => ({ args, expected: reference(...args) })),

  /**
   * Custom input: board as a JSON array of row strings on the first line, words on the second.
   * @param {string} raw
   * @returns {{ ok: true, args: unknown[] } | { ok: false, error: string }}
   */
  parseCustomInput(raw) {
    const lines = raw.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length !== 2) return { ok: false, error: 'Enter two lines: board and words, each a JSON array of strings.' };
    let board;
    let words;
    try {
      board = JSON.parse(lines[0]);
      words = JSON.parse(lines[1]);
    } catch {
      return { ok: false, error: 'Both lines must be JSON arrays of strings.' };
    }
    if (!Array.isArray(board) || board.length < 1 || board.length > MAX_SIDE) return { ok: false, error: 'The board needs 1 to 12 rows.' };
    const cols = typeof board[0] === 'string' ? board[0].length : 0;
    if (cols < 1 || cols > MAX_SIDE || !board.every((r) => typeof r === 'string' && r.length === cols && /^[a-z]+$/.test(r))) {
      return { ok: false, error: 'Rows must be strings of 1 to 12 lowercase letters, all the same length.' };
    }
    if (!Array.isArray(words) || words.length < 1 || words.length > MAX_WORDS) return { ok: false, error: 'Enter 1 to 3 * 10^4 words.' };
    if (!words.every(isWord)) return { ok: false, error: 'Words must be 1 to 10 lowercase letters.' };
    if (new Set(words).size !== words.length) return { ok: false, error: 'Words must be distinct.' };
    return { ok: true, args: [board, words] };
  },

  /** Custom inputs have no author-provided answer, so the reference supplies it. */
  solveReference: (args) => reference(args[0], args[1]),
};

export default problem;
