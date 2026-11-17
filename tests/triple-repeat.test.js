import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/triple-repeat/problem.js';
import { sqlProblemTests } from './helpers/sql-problem.js';
import { sqlEngineAvailable, runSqlCases } from '../scripts/verify/sql.mjs';
import { resultSetEqual } from '../src/js/engine/sql.js';

/** Ids 1..n in shuffled order, values from a tiny range so runs happen often. */
function random(rnd) {
  const n = Math.floor(rnd() * 12);
  const rows = Array.from({ length: n }, (_, i) => [i + 1, Math.floor(rnd() * 3) - 1]);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return [rows];
}

// Independent brute force: look up ids i, i+1, i+2 directly instead of sorting.
function brute(logs) {
  const byId = new Map(logs);
  const out = new Set();
  for (const [id, num] of logs) if (byId.get(id + 1) === num && byId.get(id + 2) === num) out.add(num);
  return [...out].sort((a, b) => a - b);
}

sqlProblemTests({
  problem,
  reference,
  random,
  wrong: {
    'counts occurrences, not runs': 'SELECT num AS ConsecutiveNums FROM Logs GROUP BY num HAVING COUNT(*) >= 3',
    'no DISTINCT': 'SELECT l1.num AS ConsecutiveNums FROM Logs l1 JOIN Logs l2 ON l2.id = l1.id + 1 AND l2.num = l1.num JOIN Logs l3 ON l3.id = l1.id + 2 AND l3.num = l1.num',
    'orders by num, not id': 'SELECT DISTINCT num AS ConsecutiveNums FROM (SELECT num, LAG(num) OVER (ORDER BY num) AS p1, LAG(num, 2) OVER (ORDER BY num) AS p2 FROM Logs) WHERE num = p1 AND num = p2',
    'run of two is enough': 'SELECT DISTINCT l1.num AS ConsecutiveNums FROM Logs l1 JOIN Logs l2 ON l2.id = l1.id + 1 AND l2.num = l1.num',
  },
});

test('a window-function solution is accepted too', { skip: !sqlEngineAvailable() && 'sql.js not installed' }, async () => {
  const q = 'SELECT DISTINCT num AS ConsecutiveNums FROM (SELECT num, LAG(num) OVER (ORDER BY id) AS p1, LAG(num, 2) OVER (ORDER BY id) AS p2 FROM Logs) WHERE num = p1 AND num = p2';
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const actuals = await runSqlCases(problem.signature, q, suite.map((t) => t.args));
  suite.forEach((t, i) => assert.ok(resultSetEqual(actuals[i], t.expected, false), `case ${i + 1}`));
});

test('reference matches brute force on 2000 random logs', () => {
  const rnd = mulberry32(5);
  for (let i = 0; i < 2000; i++) {
    const [logs] = random(rnd);
    assert.deepEqual(reference(logs).rows.map(([n]) => n).sort((a, b) => a - b), brute(logs));
  }
});

test('parser requires ids 1..n and the num range', () => {
  assert.equal(problem.parseCustomInput('{"Logs": [[2, 5], [1, 5], [3, 5]]}').ok, true);
  assert.match(problem.parseCustomInput('{"Logs": [[1, 5], [3, 5]]}').error, /1\.\.n/);
  assert.match(problem.parseCustomInput('{"Logs": [[1, 2000000]]}').error, /between/);
  assert.equal(problem.parseCustomInput('{"Logs": [[1, 5], [1, 6]]}').ok, false);
});
