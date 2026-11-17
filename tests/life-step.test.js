import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/life-step/problem.js';

// Brute force: pad the board with a ring of dead cells, then apply the rules with plain sums.
function brute(board) {
  const n = board[0].length;
  const pad = [new Array(n + 2).fill(0), ...board.map((row) => [0, ...row, 0]), new Array(n + 2).fill(0)];
  return board.map((row, r) =>
    row.map((v, c) => {
      let sum = 0;
      for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) sum += pad[r + 1 + dr][c + 1 + dc];
      if (v === 1) return sum === 2 || sum === 3 ? 1 : 0;
      return sum === 3 ? 1 : 0;
    }),
  );
}

test('reference matches brute force on 2000 random boards and does not mutate its input', () => {
  const rnd = mulberry32(262);
  for (let k = 0; k < 2000; k++) {
    const m = 1 + Math.floor(rnd() * 7);
    const n = 1 + Math.floor(rnd() * 7);
    const density = rnd();
    const board = Array.from({ length: m }, () => Array.from({ length: n }, () => (rnd() < density ? 1 : 0)));
    const copy = JSON.stringify(board);
    assert.deepEqual(reference(board), brute(board));
    assert.equal(JSON.stringify(board), copy);
  }
});

test('visible expectations agree; max sizes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[[0,1],[1,0]]'), { ok: true, args: [[[0, 1], [1, 0]]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2]]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([new Array(101).fill(0)])).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(101).fill([0]))).ok, false);
  assert.equal(problem.parseCustomInput('[0,1]').ok, false);
});
