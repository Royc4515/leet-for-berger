import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SQL_LANGUAGE,
  isSql,
  validateSqlSignature,
  validateTables,
  validateResultSet,
  validateSqlProblem,
  sqlSetup,
  sqlStarter,
  resultSetEqual,
  comparatorFor,
  parseTablesInput,
} from '../src/js/engine/sql.js';
import { buildSuite, judge } from '../src/js/engine/harness.js';
import { loadAllProblems } from '../src/js/problems/index.js';

const problems = await loadAllProblems();
import { sqlEngineAvailable, runSqlCases } from '../scripts/verify/sql.mjs';

const sig = {
  kind: 'sql',
  tables: [
    {
      name: 'Person',
      columns: [
        { name: 'id', type: 'int', primaryKey: true },
        { name: 'email', type: 'string' },
        { name: 'score', type: 'double', nullable: true },
      ],
    },
  ],
  result: { columns: ['email'], ordered: false },
};

const rs = (rows, columns = ['email']) => ({ columns, rows });
const noEngine = !sqlEngineAvailable() && 'sql.js devDependency not installed';

test('isSql recognises only kind "sql"', () => {
  assert.equal(isSql(sig), true);
  assert.equal(isSql({ name: 'f', params: [], returns: 'int' }), false);
  assert.equal(isSql(undefined), false);
});

test('validateSqlSignature accepts a valid schema', () => {
  assert.deepEqual(validateSqlSignature(sig), []);
});

test('validateSqlSignature rejects bad types, duplicates, missing ordering and nullable keys', () => {
  const bad = {
    kind: 'sql',
    tables: [
      { name: 'T', columns: [{ name: 'a', type: 'blob' }, { name: 'A', type: 'int' }, { name: 'k', type: 'int', primaryKey: true, nullable: true }] },
      { name: 't', columns: [] },
    ],
    result: { columns: ['x'] },
  };
  const errors = validateSqlSignature(bad).join('\n');
  assert.match(errors, /unknown type "blob"/);
  assert.match(errors, /column A: duplicate/);
  assert.match(errors, /primary key cannot be nullable/);
  assert.match(errors, /table t: duplicate/);
  assert.match(errors, /needs at least one column/);
  assert.match(errors, /result.ordered/);
});

test('validateTables checks arity, types, NOT NULL and primary key uniqueness', () => {
  assert.deepEqual(validateTables(sig, [[[1, 'a@x', null], [2, 'b@x', 1.5]]]), []);
  assert.deepEqual(validateTables(sig, [[]]), []);
  assert.match(validateTables(sig, [[[1, 'a@x']]]).join(), /expected 3 values/);
  assert.match(validateTables(sig, [[[1.5, 'a@x', null]]]).join(), /id must be an integer/);
  assert.match(validateTables(sig, [[[1, null, null]]]).join(), /email is null but the column is not nullable/);
  assert.match(validateTables(sig, [[[1, 'a', null], [1, 'b', null]]]).join(), /duplicate id 1/);
  assert.match(validateTables(sig, []).join(), /expected 1 table/);
});

test('a string column with values behaves like an ENUM', () => {
  const e = { kind: 'sql', tables: [{ name: 'P', columns: [{ name: 'f', type: 'string', values: ['Y', 'N'] }] }], result: { columns: ['f'], ordered: false } };
  assert.deepEqual(validateSqlSignature(e), []);
  assert.deepEqual(validateTables(e, [[['Y'], ['N']]]), []);
  assert.match(validateTables(e, [[['y']]]).join(), /must be one of 'Y', 'N'/);
  assert.match(sqlStarter(e), /P\(f ENUM\('Y', 'N'\)\)/);
  assert.match(validateSqlSignature({ ...e, tables: [{ name: 'P', columns: [{ name: 'f', type: 'int', values: [1] }] }] }).join(), /values must be/);
});

test('validateResultSet requires the declared columns and row width', () => {
  assert.deepEqual(validateResultSet(sig, rs([['a'], [null]])), []);
  assert.match(validateResultSet(sig, rs([['a']], ['Email2'])).join(), /do not match/);
  assert.match(validateResultSet(sig, rs([['a', 'b']])).join(), /expected 1 values/);
  assert.match(validateResultSet(sig, [['a']]).join(), /columns, rows/);
});

test('validateSqlProblem reports the failing case', () => {
  const tc = (args, expected) => ({ args, expected });
  const good = tc([[[1, 'a', null]]], rs([]));
  const problem = { signature: sig, visibleTests: [good, good, good, good, tc([[[1, 2, null]]], rs([]))], hiddenTests: Array(10).fill(good) };
  assert.deepEqual(validateSqlProblem(problem), ['case 5: Person row 1: email must be a string']);
});

test('resultSetEqual: unordered compares as a multiset, duplicates count', () => {
  assert.ok(resultSetEqual(rs([['a'], ['b']]), rs([['b'], ['a']]), false));
  assert.ok(!resultSetEqual(rs([['a'], ['a']]), rs([['a']]), false), 'a missing DISTINCT must fail');
  assert.ok(!resultSetEqual(rs([['a'], ['a']]), rs([['a'], ['b']]), false));
  assert.ok(resultSetEqual(rs([]), rs([]), false));
});

test('resultSetEqual: ordered compares row by row', () => {
  assert.ok(resultSetEqual(rs([['a'], ['b']]), rs([['a'], ['b']]), true));
  assert.ok(!resultSetEqual(rs([['b'], ['a']]), rs([['a'], ['b']]), true));
});

test('resultSetEqual: column names match case-insensitively and in order', () => {
  assert.ok(resultSetEqual(rs([['a']], ['EMAIL']), rs([['a']], ['email']), false));
  assert.ok(!resultSetEqual(rs([['a']], ['mail']), rs([['a']], ['email']), false));
  assert.ok(!resultSetEqual(rs([[1, 2]], ['x', 'y']), rs([[2, 1]], ['y', 'x']), false));
});

test('resultSetEqual: NULL, types and float noise', () => {
  assert.ok(resultSetEqual(rs([[null]]), rs([[null]]), false));
  assert.ok(!resultSetEqual(rs([[null]]), rs([[0]]), false));
  assert.ok(!resultSetEqual(rs([['1']]), rs([[1]]), false), 'a number and its text are different values');
  assert.ok(resultSetEqual(rs([[0.1 + 0.2]]), rs([[0.3]]), false));
  assert.ok(!resultSetEqual(rs([[0.31]]), rs([[0.3]]), false));
  assert.ok(!resultSetEqual(null, rs([]), false));
  assert.ok(!resultSetEqual({ columns: ['email'] }, rs([]), false));
});

test('judge() with comparatorFor redacts hidden SQL cases like any other', () => {
  const problem = {
    id: 'x',
    visibleTests: Array(5).fill({ args: [[[1, 'a', null]]], expected: rs([['a']]) }),
    hiddenTests: Array(10).fill({ args: [[[1, 'a', null]]], expected: rs([['a']]) }),
  };
  const suite = buildSuite(problem);
  const raw = suite.map((c) => ({ id: c.id, state: 'ok', actual: rs([['A'.toLowerCase()]], ['Email']) }));
  const result = judge(suite, raw, comparatorFor(sig));
  assert.equal(result.verdict, 'Accepted');
  const hidden = result.cases.find((c) => !c.visible);
  assert.equal(hidden.args, undefined);
  assert.equal(hidden.expected, undefined);
});

test('sqlSetup builds typed CREATE TABLE statements and insert order', () => {
  const setup = sqlSetup(sig);
  assert.deepEqual(setup.ddl, ['CREATE TABLE "Person" ("id" INTEGER PRIMARY KEY, "email" TEXT NOT NULL, "score" REAL)']);
  assert.deepEqual(setup.tables, [{ name: 'Person', columns: ['id', 'email', 'score'] }]);
});

test('sqlStarter shows the schema and result columns as comments only', () => {
  const s = sqlStarter(sig);
  assert.match(s, /Person\(id INT PRIMARY KEY, email VARCHAR, score DECIMAL NULL\)/);
  assert.match(s, /Result columns: email \(any row order\)/);
  assert.match(s, /-- Write your query here/);
  assert.ok(s.split('\n').every((l) => l === '' || l.startsWith('--')), 'starter must not contain SQL');
});

test('parseTablesInput accepts a JSON object of rows and rejects bad input', () => {
  assert.deepEqual(parseTablesInput(sig, '{"Person": [[1, "a@x", null]]}'), { ok: true, args: [[[1, 'a@x', null]]] });
  assert.deepEqual(parseTablesInput(sig, '{}'), { ok: true, args: [[]] });
  assert.equal(parseTablesInput(sig, 'not json').ok, false);
  assert.equal(parseTablesInput(sig, '[[1]]').ok, false);
  assert.match(parseTablesInput(sig, '{"People": []}').error, /Unknown table "People"/);
  assert.match(parseTablesInput(sig, '{"Person": [[1, 2, null]]}').error, /email must be a string/);
});

test('SQL_LANGUAGE is executable and ships solution.sql', () => {
  assert.equal(SQL_LANGUAGE.id, 'sql');
  assert.equal(SQL_LANGUAGE.file, 'solution.sql');
  assert.equal(SQL_LANGUAGE.executable, true);
});

test('browser worker and CI verifier pin the same sql.js version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const pinned = pkg.devDependencies['sql.js'];
  assert.match(pinned, /^\d+\.\d+\.\d+$/, 'sql.js must be pinned to an exact version');
  const worker = readFileSync(new URL('../src/js/engine/workers/sql-worker.js', import.meta.url), 'utf8');
  assert.ok(worker.includes(`sql.js@${pinned}/`), `sql-worker.js must load sql.js@${pinned}`);
});

test('every SQL problem has only the SQL language, a schema starter and a result-set comparator', () => {
  const sqlProblems = problems.filter((p) => isSql(p.signature));
  assert.ok(sqlProblems.length >= 5);
  for (const p of sqlProblems) {
    assert.deepEqual(p.languages.map((l) => l.id), ['sql'], p.id);
    assert.deepEqual(Object.keys(p.starterCode), ['sql'], p.id);
    assert.deepEqual(p.argNames, p.signature.tables.map((t) => t.name), p.id);
    assert.equal(typeof p.compare, 'function', p.id);
    assert.deepEqual(validateSqlProblem(p), [], p.id);
  }
});

const query = (q, args = [[[1, 'a@x', null], [2, 'a@x', 2.5], [3, 'b@x', null]]]) => runSqlCases(sig, q, [args]).then((r) => r[0]);

test('runner: returns column names and rows, NULL as null', { skip: noEngine }, async () => {
  assert.deepEqual(await query('SELECT email, score FROM Person ORDER BY id'), { columns: ['email', 'score'], rows: [['a@x', null], ['a@x', 2.5], ['b@x', null]] });
});

test('runner: a trailing semicolon and comments are fine, a second statement is rejected', { skip: noEngine }, async () => {
  assert.deepEqual((await query('-- lead\nSELECT id FROM Person WHERE id = 1; -- done\n/* end */')).rows, [[1]]);
  assert.match((await query('SELECT 1; SELECT 2')).error, /exactly one SQL statement/);
  assert.match((await query('-- Write your query here\n')).error, /No SQL statement/);
});

test('runner: writes fail, so DML cannot pass as an answer', { skip: noEngine }, async () => {
  assert.match((await query('DELETE FROM Person')).error, /no result set/);
  assert.match((await query('CREATE TABLE x (a int)')).error, /no result set/);
  // RETURNING gives DML a result set, so only the read-only connection stops these.
  assert.match((await query('DELETE FROM Person RETURNING email')).error, /readonly/i);
  assert.match((await query("INSERT INTO Person VALUES (9, 'z', null) RETURNING email")).error, /readonly/i);
});

test('runner: every case gets a fresh database', { skip: noEngine }, async () => {
  const [a, b] = await runSqlCases(sig, 'SELECT COUNT(*) AS n FROM Person', [[[[1, 'a', null]]], [[]]]);
  assert.deepEqual(a.rows, [[1]]);
  assert.deepEqual(b.rows, [[0]]);
});

test('runner: SQL errors come back as messages', { skip: noEngine }, async () => {
  assert.match((await query('SELEC 1')).error, /syntax error/);
  assert.match((await query('SELECT nope FROM Person')).error, /no such column/);
  assert.match((await query('PRAGMA query_only = 0')).error, /no result set/);
});

test('runner: window functions are available (SQLite >= 3.25)', { skip: noEngine }, async () => {
  const r = await query('SELECT id, LAG(id) OVER (ORDER BY id) AS prev FROM Person');
  assert.deepEqual(r.rows, [[1, null], [2, 1], [3, 2]]);
});
