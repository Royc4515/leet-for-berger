import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/matrix-search/problem.js';

// Brute force: look at every cell.
const brute = (matrix, target) => matrix.some((row) => row.includes(target));

test('reference matches brute force on 3000 random matrices', () => {
  const rnd = mulberry32(68);
  for (let i = 0; i < 3000; i++) {
    const m = 1 + Math.floor(rnd() * 5);
    const n = 1 + Math.floor(rnd() * 5);
    let v = Math.floor(rnd() * 10) - 20;
    const matrix = [];
    for (let r = 0; r < m; r++) {
      // Rows may repeat values inside, but each row starts strictly above the previous one.
      v += 1 + Math.floor(rnd() * 2);
      const row = [];
      for (let c = 0; c < n; c++) {
        row.push(v);
        v += Math.floor(rnd() * 3);
      }
      matrix.push(row);
    }
    const target = matrix[0][0] - 2 + Math.floor(rnd() * (v - matrix[0][0] + 4));
    assert.equal(reference(matrix, target), brute(matrix, target), `${JSON.stringify(matrix)} ${target}`);
  }
});

test('visible expectations agree; two 300 x 300 cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.equal(t.expected, brute(...t.args));
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 300 && t.args[0][0].length === 300).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[[1]]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[]]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2],[3]]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1]]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[1,3],[3,4]]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[[1]]\n1000000001').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,3],[5,7]]\n5').args, [[[1, 3], [5, 7]], 5]);
});
