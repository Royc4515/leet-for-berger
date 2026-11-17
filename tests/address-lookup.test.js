import { test } from 'node:test';
import assert from 'node:assert/strict';
import problem, { reference } from '../src/js/problems/address-lookup/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';

const NAMES = ['Ada', 'Ben', 'Chen'];
const CITIES = [['Haifa', 'North'], ['Austin', 'TX']];

function random(rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const np = Math.floor(rnd() * 6);
  const na = Math.floor(rnd() * 7);
  const persons = Array.from({ length: np }, (_, i) => [i + 1, pick(NAMES), pick(NAMES)]);
  const addresses = Array.from({ length: na }, (_, i) => [i + 1, 1 + Math.floor(rnd() * (np + 2)), ...pick(CITIES)]);
  return [persons, addresses];
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    'INNER JOIN drops people without an address': 'SELECT firstName, lastName, city, state FROM Person p JOIN Address a ON a.personId = p.personId',
    'joins on addressId': 'SELECT firstName, lastName, city, state FROM Person p LEFT JOIN Address a ON a.addressId = p.personId',
    'starts from Address': 'SELECT firstName, lastName, city, state FROM Address a LEFT JOIN Person p ON a.personId = p.personId',
    'DISTINCT merges real duplicates': 'SELECT DISTINCT firstName, lastName, city, state FROM Person p LEFT JOIN Address a ON a.personId = p.personId',
  },
});

test('parser accepts both tables and rejects missing values and bad types', () => {
  const ok = problem.parseCustomInput('{"Person": [[1, "Levi", "Ada"]], "Address": [[1, 1, "Haifa", "North"]]}');
  assert.deepEqual(ok, { ok: true, args: [[[1, 'Levi', 'Ada']], [[1, 1, 'Haifa', 'North']]] });
  assert.deepEqual(problem.parseCustomInput('{"Person": [[1, "Levi", "Ada"]]}'), { ok: true, args: [[[1, 'Levi', 'Ada']], []] });
  assert.equal(problem.parseCustomInput('{"Person": [[1, "Levi"]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Address": [[1, "x", "Haifa", "North"]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Person": [[1, null, "Ada"]]}').ok, false);
});

test('reference: one row per address, NULLs for none, orphans dropped', () => {
  const rows = reference([[1, 'L', 'A'], [2, 'M', 'B']], [[1, 1, 'X', 'S'], [2, 1, 'Y', 'S'], [3, 9, 'Z', 'S']]).rows;
  assert.deepEqual(rows, [['A', 'L', 'X', 'S'], ['A', 'L', 'Y', 'S'], ['B', 'M', null, null]]);
});
