import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/grid-duel/problem.js';

// Brute force: keep the board and scan the lines through the new mark after every move.
function brute(ops, args) {
  let n = 0;
  let board = null;
  return ops.map((op, i) => {
    if (op !== 'play') {
      n = args[i][0];
      board = Array.from({ length: n }, () => Array(n).fill(0));
      return null;
    }
    const [r, c, p] = args[i];
    board[r][c] = p;
    const full = (cells) => cells.every(([a, b]) => board[a][b] === p);
    const range = [...Array(n).keys()];
    if (full(range.map((k) => [r, k])) || full(range.map((k) => [k, c])) || full(range.map((k) => [k, k])) || full(range.map((k) => [k, n - 1 - k]))) return p;
    return 0;
  });
}

// Classic wrong answers, each as a replay of the calls.
function replay(step) {
  return (ops, args) => {
    const state = { n: 0, rows: null, cols: null, diag: 0, anti: 0 };
    return ops.map((op, i) => {
      if (op !== 'play') {
        state.n = args[i][0];
        state.rows = new Map();
        state.cols = new Map();
        return null;
      }
      return step(state, ...args[i]);
    });
  };
}
const bump = (m, k, d) => m.set(k, (m.get(k) ?? 0) + d);

// Counts marks without the player: any full line wins, even a mixed one.
const ignoresPlayer = replay((s, r, c, p) => {
  bump(s.rows, r, 1);
  bump(s.cols, c, 1);
  if (r === c) s.diag++;
  if (r + c === s.n - 1) s.anti++;
  return s.rows.get(r) === s.n || s.cols.get(c) === s.n || s.diag === s.n || s.anti === s.n ? p : 0;
});

// Forgets the anti-diagonal.
const noAntiDiagonal = replay((s, r, c, p) => {
  const d = p === 1 ? 1 : -1;
  bump(s.rows, r, d);
  bump(s.cols, c, d);
  if (r === c) s.diag += d;
  return Math.abs(s.rows.get(r)) === s.n || Math.abs(s.cols.get(c)) === s.n || Math.abs(s.diag) === s.n ? p : 0;
});

// Counts every move toward the diagonals, not only cells on them.
const diagonalsForEveryMove = replay((s, r, c, p) => {
  const d = p === 1 ? 1 : -1;
  bump(s.rows, r, d);
  bump(s.cols, c, d);
  s.diag += d;
  s.anti += d;
  return Math.abs(s.rows.get(r)) === s.n || Math.abs(s.cols.get(c)) === s.n || Math.abs(s.diag) === s.n || Math.abs(s.anti) === s.n ? p : 0;
});

// Checks the diagonal with row === col but treats the anti-diagonal as row + col === n.
const offByOneAnti = replay((s, r, c, p) => {
  const d = p === 1 ? 1 : -1;
  bump(s.rows, r, d);
  bump(s.cols, c, d);
  if (r === c) s.diag += d;
  if (r + c === s.n) s.anti += d;
  return Math.abs(s.rows.get(r)) === s.n || Math.abs(s.cols.get(c)) === s.n || Math.abs(s.diag) === s.n || Math.abs(s.anti) === s.n ? p : 0;
});

/** A seeded legal game: fresh cells, random players, stops at the first win. */
function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 4);
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const moves = [];
  for (const [r, c] of cells) {
    moves.push([r, c, 1 + Math.floor(rnd() * 2)]);
    const res = reference(['GridDuel', ...moves.map(() => 'play')], [[n], ...moves]);
    if (res[res.length - 1] !== 0) break;
  }
  return [['GridDuel', ...moves.map(() => 'play')], [[n], ...moves]];
}

test('reference matches brute force on 3000 seeded games', () => {
  const rnd = mulberry32(348);
  let wins = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    if (expected.some((v) => v > 0)) wins++;
  }
  assert.ok(wins > 1500, `only ${wins} games had a winner`);
});

test('visible expectations agree with the reference and the brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
});

test('brute force agrees with the reference on the small hidden tests', () => {
  for (const t of problem.hiddenTests.filter((h) => h.args[0].length < 100)) assert.deepEqual(brute(...t.args), t.expected);
});

test('every test is a legal game; at least two tests use 10^5 calls; wins and draws both occur', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  assert.ok(problem.hiddenTests.filter((t) => t.expected.some((v) => v > 0)).length >= 4);
  assert.ok(problem.hiddenTests.filter((t) => t.expected.every((v) => !v)).length >= 3);
  // A win by each player.
  const winners = new Set(problem.hiddenTests.flatMap((t) => t.expected.filter((v) => v > 0)));
  assert.deepEqual([...winners].sort(), [1, 2]);
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [ignoresPlayer, noAntiDiagonal, diagonalsForEveryMove, offByOneAnti]) {
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden test`);
  }
  // The anti-diagonal and mixed-line mistakes already show on the visible cases.
  assert.ok(problem.visibleTests.some((t) => JSON.stringify(noAntiDiagonal(...t.args)) !== JSON.stringify(t.expected)));
  assert.ok(problem.visibleTests.some((t) => JSON.stringify(ignoresPlayer(...t.args)) !== JSON.stringify(t.expected)));
});

test('scanning a line per move would cost billions of steps on the large tests', () => {
  // Each move reads its row, its column and both diagonals: 4n cells.
  const cost = (t) => (t.args[0].length - 1) * 4 * t.args[1][0][0];
  assert.ok(problem.hiddenTests.filter((t) => cost(t) > 1e10).length >= 2);
});

test('custom input parser rejects illegal games', () => {
  const ok = '["GridDuel","play","play"]\n[[2],[0,0,1],[0,1,2]]';
  assert.equal(problem.parseCustomInput(ok).ok, true);
  assert.equal(problem.parseCustomInput('["play"]\n[[0,0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play"]\n[[0],[0,0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play"]\n[[2],[2,0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play"]\n[[2],[0,0,3]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play"]\n[[2],[0,0]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","move"]\n[[2],[0,0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play","play"]\n[[2],[0,0,1],[0,0,2]]').ok, false);
  // A call after the game is won.
  assert.equal(problem.parseCustomInput('["GridDuel","play","play"]\n[[1],[0,0,1],[0,0,2]]').ok, false);
  assert.equal(problem.parseCustomInput('["GridDuel","play","play","play"]\n[[2],[0,0,1],[1,1,1],[0,1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
