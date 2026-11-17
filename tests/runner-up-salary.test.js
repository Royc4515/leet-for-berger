import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/runner-up-salary/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';

function random(rnd) {
  const n = Math.floor(rnd() * 8);
  return [Array.from({ length: n }, (_, i) => [i + 1, Math.floor(rnd() * 5) * 100])];
}

// Independent brute force: the largest salary strictly below the maximum.
function brute(employees) {
  const s = employees.map(([, x]) => x);
  const max = Math.max(...s);
  const below = s.filter((x) => x < max);
  return below.length ? Math.max(...below) : null;
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    'no DISTINCT': 'SELECT (SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1) AS SecondHighestSalary',
    'zero rows instead of NULL': 'SELECT DISTINCT salary AS SecondHighestSalary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1',
    'MIN instead of second': 'SELECT MIN(salary) AS SecondHighestSalary FROM Employee',
  },
});

test('reference matches brute force on 2000 random tables', () => {
  const rnd = mulberry32(11);
  for (let i = 0; i < 2000; i++) {
    const [employees] = random(rnd);
    assert.deepEqual(reference(employees).rows, [[brute(employees)]]);
  }
});

test('parser enforces the salary range', () => {
  assert.equal(problem.parseCustomInput('{"Employee": [[1, 100], [2, 200]]}').ok, true);
  assert.match(problem.parseCustomInput('{"Employee": [[1, -5]]}').error, /between 0 and 10\^6/);
  assert.equal(problem.parseCustomInput('{"Employee": [[1, 1.5]]}').ok, false);
});
