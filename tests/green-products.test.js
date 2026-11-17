import { test } from 'node:test';
import assert from 'node:assert/strict';
import problem, { reference } from '../src/js/problems/green-products/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';

function random(rnd) {
  const n = Math.floor(rnd() * 12);
  const yn = () => (rnd() < 0.5 ? 'Y' : 'N');
  return [Array.from({ length: n }, (_, i) => [i * 2 + Math.floor(rnd() * 2), yn(), yn()])];
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    'OR instead of AND': "SELECT product_id FROM Products WHERE low_fats = 'Y' OR recyclable = 'Y'",
    'one condition only': "SELECT product_id FROM Products WHERE low_fats = 'Y'",
    'extra column': "SELECT product_id, low_fats FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y'",
  },
});

test('parser accepts a table and rejects bad flags, duplicate ids and unknown tables', () => {
  assert.deepEqual(problem.parseCustomInput('{"Products": [[1, "Y", "N"]]}'), { ok: true, args: [[[1, 'Y', 'N']]] });
  assert.equal(problem.parseCustomInput('{"Products": [[1, "y", "N"]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Products": [[1, "Y", "N"], [1, "N", "N"]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Product": []}').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});

test('reference keeps only products with both flags set', () => {
  assert.deepEqual(reference([[1, 'Y', 'Y'], [2, 'Y', 'N'], [3, 'N', 'Y']]).rows, [[1]]);
  assert.deepEqual(reference([]).rows, []);
});
