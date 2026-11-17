/**
 * SQL problems: schema validation, starter code, worker setup, custom input and result-set judging.
 * Design and dialect: docs/adr/0003-sql-problems.md.
 *
 * A SQL problem's signature describes tables instead of a function:
 *
 *   { kind: 'sql',
 *     tables: [{ name: 'Person', columns: [{ name: 'personId', type: 'int', primaryKey: true },
 *                                          { name: 'city', type: 'string', nullable: true },
 *                                          { name: 'flag', type: 'string', values: ['Y', 'N'] }] }],
 *     result: { columns: ['firstName', 'city'], ordered: false } }
 *
 * A test's `args` holds one array of rows per table (rows are arrays in column order), and its
 * `expected` is a result set `{ columns, rows }`. Pure module: no DOM, safe under node --test.
 */

/** SQL problems have exactly one language. It is not one of the 8 interview LANGUAGES (codegen.js). */
export const SQL_LANGUAGE = { id: 'sql', label: 'SQL (SQLite)', monaco: 'sql', file: 'solution.sql', executable: true };

/** Neutral column types -> SQLite storage type and the MySQL-style name shown to users. */
export const SQL_COLUMN_TYPES = {
  int: { sqlite: 'INTEGER', shown: 'INT' },
  double: { sqlite: 'REAL', shown: 'DECIMAL' },
  string: { sqlite: 'TEXT', shown: 'VARCHAR' },
  date: { sqlite: 'TEXT', shown: 'DATE' },
};

/** @param {object} sig */
export const isSql = (sig) => sig?.kind === 'sql';

const IDENT = /^[A-Za-z][A-Za-z0-9_]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Structural check for a SQL signature. Returns errors; empty means valid.
 * @param {object} sig
 */
export function validateSqlSignature(sig) {
  const errors = [];
  if (!isSql(sig)) return ['kind must be "sql"'];
  if (!Array.isArray(sig.tables) || !sig.tables.length) errors.push('a SQL problem needs at least one table');
  const tableNames = new Set();
  for (const t of sig.tables ?? []) {
    if (!IDENT.test(t.name ?? '')) errors.push(`table ${t.name}: invalid name`);
    if (tableNames.has(String(t.name).toLowerCase())) errors.push(`table ${t.name}: duplicate`);
    tableNames.add(String(t.name).toLowerCase());
    if (!Array.isArray(t.columns) || !t.columns.length) errors.push(`table ${t.name}: needs at least one column`);
    const cols = new Set();
    for (const c of t.columns ?? []) {
      if (!IDENT.test(c.name ?? '')) errors.push(`table ${t.name} column ${c.name}: invalid name`);
      // SQL identifiers are case-insensitive, so "Id" and "id" would collide.
      if (cols.has(String(c.name).toLowerCase())) errors.push(`table ${t.name} column ${c.name}: duplicate`);
      cols.add(String(c.name).toLowerCase());
      if (!SQL_COLUMN_TYPES[c.type]) errors.push(`table ${t.name} column ${c.name}: unknown type "${c.type}"`);
      if (c.primaryKey && c.nullable) errors.push(`table ${t.name} column ${c.name}: a primary key cannot be nullable`);
      if (c.values !== undefined && (!Array.isArray(c.values) || !c.values.length || c.type !== 'string')) errors.push(`table ${t.name} column ${c.name}: values must be a non-empty list on a string column`);
    }
    if ((t.columns ?? []).filter((c) => c.primaryKey).length > 1) errors.push(`table ${t.name}: at most one primary key column`);
  }
  const res = sig.result;
  if (!res || !Array.isArray(res.columns) || !res.columns.length) errors.push('result.columns must list the output columns');
  else if (res.columns.some((c) => !IDENT.test(c))) errors.push('result.columns: invalid column name');
  if (typeof res?.ordered !== 'boolean') errors.push('result.ordered must be true (ORDER BY is part of the task) or false');
  return errors;
}

function checkValue(col, v) {
  if (v === null) return col.nullable ? null : 'is null but the column is not nullable';
  switch (col.type) {
    case 'int':
      return Number.isSafeInteger(v) ? null : 'must be an integer';
    case 'double':
      return typeof v === 'number' && Number.isFinite(v) ? null : 'must be a number';
    case 'string':
      if (typeof v !== 'string') return 'must be a string';
      return !col.values || col.values.includes(v) ? null : `must be one of ${col.values.map((x) => `'${x}'`).join(', ')}`;
    case 'date':
      return typeof v === 'string' && DATE.test(v) ? null : 'must be a "YYYY-MM-DD" string';
    default:
      return 'has an unknown column type';
  }
}

/**
 * Checks a case's tables against the schema: one array per table, row arity, value types,
 * NOT NULL and primary key uniqueness (SQLite would reject the insert otherwise).
 * @param {object} sig
 * @param {unknown} args
 * @returns {string[]} errors, empty means valid
 */
export function validateTables(sig, args) {
  if (!Array.isArray(args) || args.length !== sig.tables.length) return [`expected ${sig.tables.length} table(s)`];
  const errors = [];
  sig.tables.forEach((t, ti) => {
    const rows = args[ti];
    if (!Array.isArray(rows)) {
      errors.push(`${t.name}: rows must be an array`);
      return;
    }
    const pk = t.columns.findIndex((c) => c.primaryKey);
    const keys = new Set();
    rows.forEach((row, ri) => {
      if (!Array.isArray(row) || row.length !== t.columns.length) {
        errors.push(`${t.name} row ${ri + 1}: expected ${t.columns.length} values`);
        return;
      }
      t.columns.forEach((c, ci) => {
        const err = checkValue(c, row[ci]);
        if (err) errors.push(`${t.name} row ${ri + 1}: ${c.name} ${err}`);
      });
      if (pk >= 0) {
        if (keys.has(row[pk])) errors.push(`${t.name} row ${ri + 1}: duplicate ${t.columns[pk].name} ${row[pk]}`);
        keys.add(row[pk]);
      }
    });
  });
  return errors;
}

/**
 * Checks an expected result set: the declared columns, and rows of the right width.
 * @param {object} sig
 * @param {unknown} rs
 */
export function validateResultSet(sig, rs) {
  if (!rs || !Array.isArray(rs.columns) || !Array.isArray(rs.rows)) return ['expected must be { columns, rows }'];
  const errors = [];
  if (rs.columns.join() !== sig.result.columns.join()) errors.push(`columns ${JSON.stringify(rs.columns)} do not match result.columns`);
  rs.rows.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== sig.result.columns.length) errors.push(`row ${i + 1}: expected ${sig.result.columns.length} values`);
  });
  return errors;
}

/**
 * Everything the verifier and unit tests check about a SQL problem: signature, then all 15 cases.
 * @param {{ signature: object, visibleTests: {args: unknown, expected: unknown}[], hiddenTests: {args: unknown, expected: unknown}[] }} problem
 */
export function validateSqlProblem(problem) {
  const sigErrors = validateSqlSignature(problem.signature);
  if (sigErrors.length) return sigErrors;
  const cases = [...problem.visibleTests, ...problem.hiddenTests];
  return cases.flatMap((tc, i) => [...validateTables(problem.signature, tc.args), ...validateResultSet(problem.signature, tc.expected)].map((e) => `case ${i + 1}: ${e}`));
}

/**
 * What the worker needs to build a case's database: CREATE TABLE statements and insert order.
 * Passed as the runner's `adapter`, like the JS/Python adapters bridge JSON to objects.
 * @param {object} sig
 * @returns {{ ddl: string[], tables: { name: string, columns: string[] }[] }}
 */
export function sqlSetup(sig) {
  const ddl = sig.tables.map((t) => {
    const cols = t.columns.map((c) => `"${c.name}" ${SQL_COLUMN_TYPES[c.type].sqlite}${c.primaryKey ? ' PRIMARY KEY' : ''}${c.primaryKey || c.nullable ? '' : ' NOT NULL'}`);
    return `CREATE TABLE "${t.name}" (${cols.join(', ')})`;
  });
  return { ddl, tables: sig.tables.map((t) => ({ name: t.name, columns: t.columns.map((c) => c.name) })) };
}

/**
 * Starter code: the schema and expected columns as comments. There is no signature to fill in,
 * so the comments are what tells the user which tables and output columns exist.
 * @param {object} sig
 */
export function sqlStarter(sig) {
  const tables = sig.tables.map((t) => {
    const type = (c) => (c.values ? `ENUM(${c.values.map((x) => `'${x}'`).join(', ')})` : SQL_COLUMN_TYPES[c.type].shown);
    const cols = t.columns.map((c) => `${c.name} ${type(c)}${c.primaryKey ? ' PRIMARY KEY' : ''}${c.nullable ? ' NULL' : ''}`);
    return `--   ${t.name}(${cols.join(', ')})`;
  });
  const order = sig.result.ordered ? 'row order matters, use ORDER BY' : 'any row order';
  return [
    '-- Tables (SQLite dialect, one SELECT or WITH statement):',
    ...tables,
    `-- Result columns: ${sig.result.columns.join(', ')} (${order})`,
    '',
    '-- Write your query here',
    '',
  ].join('\n');
}

// Rounding absorbs float noise (AVG, division) that differs between SQLite and a JS reference.
const cell = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e5) / 1e5 : v);
const rowKey = (r) => JSON.stringify(r.map(cell));

/**
 * Compares two result sets. Column names must match in order (case-insensitive, as SQL
 * identifiers are). Rows compare in order when `ordered`, otherwise as a multiset: duplicates
 * count, so a missing DISTINCT is still a wrong answer.
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {boolean} ordered
 */
export function resultSetEqual(actual, expected, ordered) {
  if (!actual || !expected || !Array.isArray(actual.columns) || !Array.isArray(actual.rows)) return false;
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.columns.some((c, i) => String(c).toLowerCase() !== String(expected.columns[i]).toLowerCase())) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  const a = actual.rows.map(rowKey);
  const e = expected.rows.map(rowKey);
  if (!ordered) {
    a.sort();
    e.sort();
  }
  return a.every((k, i) => k === e[i]);
}

/**
 * The `compare` argument for harness.judge() on a SQL problem.
 * @param {object} sig
 */
export const comparatorFor = (sig) => (actual, expected) => resultSetEqual(actual, expected, sig.result.ordered);

/**
 * Custom input for a SQL problem: a JSON object mapping table name to an array of rows.
 * A table left out is empty. Every row is checked against the schema.
 * @param {object} sig
 * @param {string} raw
 * @returns {{ ok: true, args: unknown[][][] } | { ok: false, error: string }}
 */
export function parseTablesInput(sig, raw) {
  const names = sig.tables.map((t) => t.name);
  const shape = `Enter a JSON object of rows per table, e.g. {"${names[0]}": [[...], ...]}.`;
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { ok: false, error: `Invalid JSON. ${shape}` };
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: shape };
  const unknown = Object.keys(obj).filter((k) => !names.includes(k));
  if (unknown.length) return { ok: false, error: `Unknown table "${unknown[0]}". Tables: ${names.join(', ')}.` };
  const args = names.map((n) => obj[n] ?? []);
  const errors = validateTables(sig, args);
  if (errors.length) return { ok: false, error: errors[0] };
  if (args.some((rows) => rows.length > 1000)) return { ok: false, error: 'At most 1000 rows per table in custom input.' };
  return { ok: true, args };
}

/**
 * Example text for the custom input box: the first visible case as the JSON the parser takes.
 * @param {object} sig
 * @param {unknown[][][]} args
 */
export function tablesInputExample(sig, args) {
  return JSON.stringify(Object.fromEntries(sig.tables.map((t, i) => [t.name, args[i]])));
}
