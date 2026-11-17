// Shared checks for SQL problem tests (tests/<id>.test.js). Not a test file itself: the
// `tests/**/*.test.js` glob skips it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mulberry32 } from '../../src/js/engine/rng.js';
import { resultSetEqual, validateSqlProblem } from '../../src/js/engine/sql.js';
import { sqlEngineAvailable, runSqlCases } from '../../scripts/verify/sql.mjs';

const skip = !sqlEngineAvailable() && 'sql.js devDependency not installed';

/**
 * Registers the standard tests for a SQL problem:
 * - 5 visible + 10 hidden, schema and every case valid, visible expectations from the reference;
 * - the reference agrees with the shipped solution.sql on `rounds` seeded random tables
 *   (two independent implementations: JS over arrays, SQL in SQLite);
 * - each classic wrong query in `wrong` fails at least one of the 15 cases.
 * @param {{ problem: object, reference: Function, random: (rnd: () => number) => unknown[], rounds?: number, wrong?: Record<string, string> }} opts
 */
export function sqlProblemTests({ problem, reference, random, rounds = 300, wrong = {} }) {
  const ordered = problem.signature.result.ordered;

  test(`${problem.id}: exactly 5 visible and 10 hidden tests, all valid`, () => {
    assert.equal(problem.visibleTests.length, 5);
    assert.equal(problem.hiddenTests.length, 10);
    assert.deepEqual(validateSqlProblem(problem), []);
  });

  test(`${problem.id}: authored visible expectations agree with the reference`, () => {
    for (const t of problem.visibleTests) assert.ok(resultSetEqual(reference(...t.args), t.expected, ordered));
  });

  test(`${problem.id}: hidden tests include an empty table and at least 2 larger tables`, () => {
    const sizes = problem.hiddenTests.map((t) => t.args.reduce((n, rows) => n + rows.length, 0));
    assert.ok(problem.hiddenTests.some((t) => t.args.some((rows) => rows.length === 0)), 'no empty table');
    assert.ok(sizes.filter((n) => n >= 2000).length >= 2, `sizes ${sizes}`);
  });

  test(`${problem.id}: reference matches solution.sql on ${rounds} seeded random tables`, { skip }, async () => {
    const rnd = mulberry32(2026);
    const cases = Array.from({ length: rounds }, () => random(rnd));
    const query = readFileSync(new URL(`../../src/js/problems/${problem.id}/solutions/solution.sql`, import.meta.url), 'utf8');
    const actuals = await runSqlCases(problem.signature, query, cases);
    cases.forEach((args, i) => assert.ok(resultSetEqual(actuals[i], reference(...args), ordered), JSON.stringify({ args, got: actuals[i] })));
  });

  for (const [why, query] of Object.entries(wrong)) {
    test(`${problem.id}: rejects a wrong query (${why})`, { skip }, async () => {
      const suite = [...problem.visibleTests, ...problem.hiddenTests];
      const actuals = await runSqlCases(problem.signature, query, suite.map((t) => t.args));
      assert.ok(suite.some((t, i) => !resultSetEqual(actuals[i], t.expected, ordered)), 'the wrong query passed all 15 cases');
    });
  }
}
