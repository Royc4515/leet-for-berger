import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/rotate-grid/problem.js';

// Brute force: copy into a fresh grid with the index formula; cell (i, j) lands at (j, n-1-i).
function brute(matrix) {
  const n = matrix.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[j][n - 1 - i] = matrix[i][j];
  return out;
}

test('reference matches brute force on 2000 random squares and leaves its input alone', () => {
  const rnd = mulberry32(22);
  for (let k = 0; k < 2000; k++) {
    const n = 1 + Math.floor(rnd() * 9);
    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(rnd() * 2001) - 1000));
    const before = JSON.stringify(matrix);
    assert.deepEqual(reference(matrix), brute(matrix));
    assert.equal(JSON.stringify(matrix), before);
  }
});

test('four rotations give back the original', () => {
  const t = problem.hiddenTests[8].args[0];
  assert.deepEqual(reference(reference(reference(reference(t)))), t);
});

test('visible expectations agree; tests are valid input; size limit is exercised', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 20).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3],[4,5,6]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1001]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array.from({ length: 21 }, () => Array(21).fill(0)))).ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3,4]]').ok, true);
});
