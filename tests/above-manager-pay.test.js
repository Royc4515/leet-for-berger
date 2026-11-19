import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/above-manager-pay/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';

const NAMES = ['Noa', 'Omer', 'Yael'];

/** Small tables: tied salaries, NULL and unknown managers, repeated names, self-management. */
function random(rnd) {
  const n = Math.floor(rnd() * 8);
  return [Array.from({ length: n }, (_, i) => {
    const roll = rnd();
    const managerId = roll < 0.2 ? null : 1 + Math.floor(rnd() * (n + 2));
    return [i + 1, NAMES[Math.floor(rnd() * NAMES.length)], Math.floor(rnd() * 4) * 100, managerId];
  })];
}

// Independent brute force: for each employee, scan every row for the manager.
function brute(employees) {
  return employees
    .filter(([, , salary, managerId]) => employees.some(([id, , s]) => id === managerId && salary > s))
    .map(([, name]) => [name]);
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    '>= counts ties': 'SELECT e.name AS employee FROM Employee e JOIN Employee m ON m.id = e.managerId WHERE e.salary >= m.salary',
    'join the other way round': 'SELECT e.name AS employee FROM Employee e JOIN Employee m ON e.id = m.managerId WHERE e.salary > m.salary',
    'keeps employees with no known manager': 'SELECT e.name AS employee FROM Employee e LEFT JOIN Employee m ON m.id = e.managerId WHERE m.id IS NULL OR e.salary > m.salary',
    'DISTINCT merges people who share a name': 'SELECT DISTINCT e.name AS employee FROM Employee e JOIN Employee m ON m.id = e.managerId WHERE e.salary > m.salary',
  },
});

test('reference matches brute force on 2000 random tables', () => {
  const rnd = mulberry32(181);
  for (let i = 0; i < 2000; i++) {
    const [employees] = random(rnd);
    assert.deepEqual(reference(employees).rows, brute(employees), JSON.stringify(employees));
  }
});

test('parser accepts NULL managers and rejects bad salaries and missing columns', () => {
  const ok = problem.parseCustomInput('{"Employee": [[1, "Noa", 100, null], [2, "Omer", 200, 1]]}');
  assert.deepEqual(ok, { ok: true, args: [[[1, 'Noa', 100, null], [2, 'Omer', 200, 1]]] });
  assert.equal(problem.parseCustomInput('{"Employee": [[1, "Noa", -1, null]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Employee": [[1, "Noa", 1000001, null]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Employee": [[1, "Noa", 100]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Employee": [[1, null, 100, null]]}').ok, false);
  assert.equal(problem.parseCustomInput('{"Employee": [[1, "Noa", 100, null], [1, "Omer", 100, null]]}').ok, false);
});
