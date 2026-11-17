import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/region-sum/problem.js';

// Brute force: sum each rectangle cell by cell. Independent of the reference.
function brute(ops, args) {
  const m = args[0][0];
  return ops.map((op, i) => {
    if (op !== 'sumRegion') return null;
    const [r1, c1, r2, c2] = args[i];
    let s = 0;
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) s += m[r][c];
    return s;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(4);
  const pick = (k) => Math.floor(rnd() * k);
  for (let t = 0; t < 1000; t++) {
    const rows = 1 + pick(6);
    const cols = 1 + pick(6);
    const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => pick(21) - 10));
    const ops = ['NumMatrix'];
    const args = [[matrix]];
    for (let q = 0; q < 10; q++) {
      const a = pick(rows);
      const b = pick(rows);
      const c = pick(cols);
      const d = pick(cols);
      ops.push('sumRegion');
      args.push([Math.min(a, b), Math.min(c, d), Math.max(a, b), Math.max(c, d)]);
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100001 && t.args[1][0][0].length === 200 && t.args[1][0][0][0].length === 200);
  assert.ok(big.length >= 2);
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['NumMatrix', 'sumRegion'], [[[[1, 2], [3, 4]]], [0, 0, 1, 1]]), true);
  assert.equal(ok(['NumMatrix', 'sumRegion'], [[[[1, 2], [3, 4]]], [1, 0, 0, 1]]), false);
  assert.equal(ok(['NumMatrix', 'sumRegion'], [[[[1, 2], [3, 4]]], [0, 0, 2, 1]]), false);
  assert.equal(ok(['NumMatrix', 'sumRegion'], [[[[1, 2], [3]]], [0, 0, 0, 0]]), false);
  assert.equal(ok(['NumMatrix', 'update'], [[[[1]]], [0, 0, 5]]), false);
  assert.equal(ok(['Matrix'], [[[[1]]]]), false);
  assert.equal(ok(['NumMatrix'], [[[[10001]]]]), false);
  assert.equal(problem.parseCustomInput('["NumMatrix"]').ok, false);
});
