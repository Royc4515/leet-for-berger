import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/square-counter/problem.js';

// Brute force: keep every added copy in a list; for a query, try every ordered triple of copies
// as the other three corners (each unordered choice appears once per corner assignment, so the
// corners are assigned by role: same column, same row, diagonal).
function brute(ops, args) {
  const pts = [];
  return ops.map((op, i) => {
    if (op === 'add') {
      pts.push(args[i][0]);
      return null;
    }
    if (op !== 'count') return null;
    const [x, y] = args[i][0];
    let total = 0;
    for (const a of pts) {
      if (a[0] !== x || a[1] === y) continue; // a: same column, different row
      const d = a[1] - y;
      for (const b of pts) {
        if (b[1] !== y || Math.abs(b[0] - x) !== Math.abs(d) || b[0] === x) continue; // b: same row
        for (const c of pts) if (c[0] === b[0] && c[1] === a[1]) total++; // c: the diagonal corner
      }
    }
    return total;
  });
}

function randomSession(rnd) {
  const ops = ['SquareCounter'];
  const args = [[]];
  const side = 1 + Math.floor(rnd() * 5);
  for (let k = 0; k < 1 + Math.floor(rnd() * 25); k++) {
    ops.push(rnd() < 0.35 ? 'count' : 'add');
    args.push([[Math.floor(rnd() * side), Math.floor(rnd() * side)]]);
  }
  return [ops, args];
}

test('reference matches brute force on 2000 random sessions', () => {
  const rnd = mulberry32(190);
  for (let k = 0; k < 2000; k++) {
    const [ops, args] = randomSession(rnd);
    assert.deepEqual(reference(ops, args), brute(ops, args), JSON.stringify([ops, args]));
  }
  // Squares that would leave the grid are not counted.
  assert.deepEqual(reference(['SquareCounter', 'add', 'add', 'add', 'count'], [[], [[1000, 0]], [[1000, 3]], [[997, 0]], [[997, 3]]]), [null, null, null, null, 1]);
});

test('visible expectations agree; 64-bit counts and max sizes; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.filter((h) => h.args[0].length < 3000)) assert.deepEqual(t.expected, brute(...t.args));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 50001).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected.some((v) => v > 2 ** 32)));
});

test('custom input parser', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['SquareCounter', 'add', 'count'], [[], [[1, 2]], [[3, 4]]]), true);
  assert.equal(ok(['SquareCounter', 'add'], [[], [[1001, 2]]]), false);
  assert.equal(ok(['SquareCounter', 'add'], [[], [[-1, 2]]]), false);
  assert.equal(ok(['SquareCounter', 'add'], [[], [[1, 2, 3]]]), false);
  assert.equal(ok(['SquareCounter', 'add'], [[], [1, 2]]), false);
  assert.equal(ok(['SquareCounter', 'remove'], [[], [[1, 2]]]), false);
  assert.equal(ok(['DetectSquares'], [[]]), false);
  assert.equal(ok(['SquareCounter', 'add'], [[]]), false);
  assert.equal(problem.parseCustomInput('["SquareCounter"]').ok, false);
});
