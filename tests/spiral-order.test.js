import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/spiral-order/problem.js';

// Brute force: walk cell by cell, turning clockwise whenever the next cell is outside or visited.
function brute(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;
  const seen = matrix.map((row) => row.map(() => false));
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const out = [];
  let r = 0;
  let c = 0;
  let d = 0;
  for (let step = 0; step < m * n; step++) {
    out.push(matrix[r][c]);
    seen[r][c] = true;
    const nr = r + dirs[d][0];
    const nc = c + dirs[d][1];
    if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) d = (d + 1) % 4;
    r += dirs[d][0];
    c += dirs[d][1];
  }
  return out;
}

test('reference matches brute force on 2000 random matrices', () => {
  const rnd = mulberry32(21);
  for (let i = 0; i < 2000; i++) {
    const m = 1 + Math.floor(rnd() * 10);
    const n = 1 + Math.floor(rnd() * 10);
    const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(rnd() * 201) - 100));
    assert.deepEqual(reference(matrix), brute(matrix));
  }
});

test('visible expectations agree; tests are valid input; size limit is exercised', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  const atLimit = problem.hiddenTests.filter((t) => t.args[0].length === 10 || t.args[0][0].length === 10);
  assert.ok(atLimit.length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,101]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1.5]]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify([Array(11).fill(0)])).ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3,4]]').ok, true);
});
