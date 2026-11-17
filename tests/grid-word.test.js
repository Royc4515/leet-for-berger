import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/grid-word/problem.js';

// Brute force without recursion: after k letters, the set of reachable states is every
// (cells used, last cell) pair spelling word[0..k). Extend each state by one neighbour per step.
function brute(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  let states = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (board[r][c] === word[0]) states.push([1 << (r * cols + c), r, c]);
  for (let k = 1; k < word.length && states.length; k++) {
    const next = new Map();
    for (const [mask, r, c] of states) {
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const bit = 1 << (nr * cols + nc);
        if (mask & bit || board[nr][nc] !== word[k]) continue;
        next.set(`${mask | bit},${nr},${nc}`, [mask | bit, nr, nc]);
      }
    }
    states = [...next.values()];
  }
  return states.length > 0;
}

test('reference matches brute force on 3000 random boards', () => {
  const rnd = mulberry32(53);
  for (let t = 0; t < 3000; t++) {
    const rows = 1 + Math.floor(rnd() * 3);
    const cols = 1 + Math.floor(rnd() * 3);
    const letters = 'abc'.slice(0, 1 + Math.floor(rnd() * 3));
    const board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => letters[Math.floor(rnd() * letters.length)]).join(''));
    let word = '';
    const len = 1 + Math.floor(rnd() * 7);
    for (let i = 0; i < len; i++) word += letters[Math.floor(rnd() * letters.length)];
    assert.equal(reference(board, word), brute(board, word), `${JSON.stringify(board)} ${word}`);
  }
});

test('visible expectations agree; max-size cases; both outcomes; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 6 && t.args[0][0].length === 6 && t.args[1].length === 15);
  assert.ok(big.length >= 2);
  assert.ok(big.some((t) => t.expected === true) && big.some((t) => t.expected === false));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  const ok = (board, word) => problem.parseCustomInput(`${JSON.stringify(board)}\n${JSON.stringify(word)}`).ok;
  assert.equal(ok(['ab', 'cd'], 'abd'), true);
  assert.equal(ok([], 'a'), false);
  assert.equal(ok(['ab', 'c'], 'a'), false);
  assert.equal(ok(['a1'], 'a'), false);
  assert.equal(ok(['abcdefg'], 'a'), false);
  assert.equal(ok(['ab'], ''), false);
  assert.equal(ok(['ab'], 'a'.repeat(16)), false);
  assert.equal(problem.parseCustomInput('["ab"]').ok, false);
});
