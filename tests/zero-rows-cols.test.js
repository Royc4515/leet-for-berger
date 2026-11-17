import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/zero-rows-cols/problem.js';

// Brute force: collect zero rows and columns from the untouched input, then build a new grid.
function brute(matrix) {
  const rows = new Set();
  const cols = new Set();
  matrix.forEach((row, i) => row.forEach((v, j) => {
    if (v === 0) {
      rows.add(i);
      cols.add(j);
    }
  }));
  return matrix.map((row, i) => row.map((v, j) => (rows.has(i) || cols.has(j) ? 0 : v)));
}

test('reference matches brute force on 3000 random grids and leaves its input alone', () => {
  const rnd = mulberry32(23);
  for (let k = 0; k < 3000; k++) {
    const m = 1 + Math.floor(rnd() * 6);
    const n = 1 + Math.floor(rnd() * 6);
    // Values 0..4 make zeros common, including in the first row and column.
    const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(rnd() * 5)));
    const before = JSON.stringify(matrix);
    assert.deepEqual(reference(matrix), brute(matrix));
    assert.equal(JSON.stringify(matrix), before);
  }
});

test('visible expectations agree; tests are valid input; size limit is exercised', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 200).length >= 2);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[2147483648]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0.5]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-2147483648, 0]]').ok, true);
});
