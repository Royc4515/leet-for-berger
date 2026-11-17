import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/board-words/problem.js';

// Brute force, one word at a time: plain backtracking with a visited grid, no trie, no pruning.
// Independent of the reference's shared trie search.
function spellable(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const used = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const go = (r, c, k) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || used[r][c] || board[r][c] !== word[k]) return false;
    if (k === word.length - 1) return true;
    used[r][c] = true;
    const ok = go(r + 1, c, k + 1) || go(r - 1, c, k + 1) || go(r, c + 1, k + 1) || go(r, c - 1, k + 1);
    used[r][c] = false;
    return ok;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (go(r, c, 0)) return true;
  return false;
}

const brute = (board, words) => words.filter((w) => spellable(board, w)).sort();

test('reference matches brute force on 1000 random boards', () => {
  const rnd = mulberry32(107);
  for (let t = 0; t < 1000; t++) {
    const rows = 1 + Math.floor(rnd() * 4);
    const cols = 1 + Math.floor(rnd() * 4);
    const letters = 'abc'.slice(0, 1 + Math.floor(rnd() * 3));
    const pick = () => letters[Math.floor(rnd() * letters.length)];
    const board = Array.from({ length: rows }, () => Array.from({ length: cols }, pick).join(''));
    const words = new Set();
    const count = 1 + Math.floor(rnd() * 12);
    for (let i = 0; i < count; i++) words.add(Array.from({ length: 1 + Math.floor(rnd() * 6) }, pick).join(''));
    assert.deepEqual(reference(board, [...words]), brute(board, [...words]), `${JSON.stringify(board)} ${[...words]}`);
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // Full 12 x 12 boards with 3 * 10^4 words, where some words are found and some are not.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 12 && t.args[0][0].length === 12 && t.args[1].length === 30000);
  assert.ok(big.length >= 3);
  for (const t of big) assert.ok(t.expected.length > 0 && t.expected.length < t.args[1].length);
  // Spot-check the big cases against the brute force on a sample of their words.
  for (const t of big) {
    const sample = t.args[1].filter((_, i) => i % 30 === 0);
    const found = new Set(t.expected);
    for (const w of sample) assert.equal(found.has(w), spellable(t.args[0], w), w);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  const parse = (board, words) => problem.parseCustomInput(`${JSON.stringify(board)}\n${JSON.stringify(words)}`);
  assert.deepEqual(parse(['ab'], ['ab']).args, [['ab'], ['ab']]);
  assert.equal(parse(['ab', 'c'], ['a']).ok, false);
  assert.equal(parse(['aB'], ['a']).ok, false);
  assert.equal(parse([], ['a']).ok, false);
  assert.equal(parse(['a'.repeat(13)], ['a']).ok, false);
  assert.equal(parse(Array(13).fill('a'), ['a']).ok, false);
  assert.equal(parse(['ab'], []).ok, false);
  assert.equal(parse(['ab'], ['a', 'a']).ok, false);
  assert.equal(parse(['ab'], ['a'.repeat(11)]).ok, false);
  assert.equal(parse(['ab'], ['']).ok, false);
  assert.equal(problem.parseCustomInput('["ab"]').ok, false);
});
