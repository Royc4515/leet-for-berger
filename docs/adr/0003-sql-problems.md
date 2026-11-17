# ADR 0003: SQL problems on sql.js (SQLite in WebAssembly)

- Status: accepted
- Date: 2026-11-17

## Context

The SQL topic has essential problems (Combine Two Tables, Duplicate Emails, Second Highest Salary, ...) that need a database to run user queries. The site is static (ADR 0001), so the database has to run in the browser, and CI must judge the shipped solutions with the same engine, the way `tests/solutions.test.js` judges the 8 algorithm languages.

## Decision

1. **Engine: sql.js 1.13.0** (SQLite 3.49 compiled to WebAssembly, MIT). The browser loads it from jsDelivr, pinned to the exact version, only inside a worker (`src/js/engine/workers/sql-worker.js`), like Pyodide. The worker stays alive between runs (the wasm boots once) and is recreated after a timeout kill.
2. **Dialect: SQLite.** LeetCode judges these problems on MySQL. Constructs that differ and are worth knowing:
   - date functions differ: `DATE_ADD`, `DATEDIFF`, `DATE_FORMAT` and `INTERVAL` do not exist; use `date()`, `julianday()`, `strftime()`. Dates are stored as `'YYYY-MM-DD'` text;
   - text comparison is case-sensitive (`'a' = 'A'` is false; MySQL's default collation says true), so problems keep text in one case;
   - integer division truncates (`7 / 2 = 3`; MySQL gives `3.5000`): multiply by `1.0` first;
   - no `POW()`, `POWER()` or other math functions in this build;
   - `GROUP BY` allows bare non-aggregated columns, like MySQL without `ONLY_FULL_GROUP_BY`;
   - the same as MySQL: `IF()`, `IFNULL()`, `COALESCE()`, `CONCAT()`, `GROUP_CONCAT()`, `LIMIT offset, count`, window functions (`LAG`, `ROW_NUMBER`, `DENSE_RANK`) and CTEs, including `WITH RECURSIVE`.

   The starter code and every statement say "Dialect: SQLite".
3. **One statement, read-only, fresh database per case.** For each case the runner creates the problem's tables (typed columns, `PRIMARY KEY`, `NOT NULL`), inserts the case's rows, sets `PRAGMA query_only`, then runs exactly one statement. More than one statement is an error; a statement without a result set is an error; a write (even `DELETE ... RETURNING`) fails on the read-only connection. Writes could not leak anyway (the next case gets a new database), but rejecting them keeps "Accepted" meaning "a query that computes the answer". The database holds only the case's tables, so there is nothing else to read.
4. **One code path for browser and CI.** `src/js/engine/workers/sql-core.js` runs a case; it is a plain script so the worker can `importScripts` it and the verifier can `import` it. The verifier uses sql.js as a **pinned npm devDependency** (`npm ci` installs it; no apt package, no system SQLite). `tests/sql.test.js` fails if the devDependency and the worker's CDN URL name different versions.
5. **15-case invariant, unchanged.** A SQL test case is `{ args, expected }` like any other: `args` holds one array of rows per table (rows are arrays in column order), `expected` is a result set `{ columns, rows }`. 5 visible + 10 hidden, expected values never reach the worker (it receives `{ id, args }` and the schema), `judge()` redacts hidden cases, generators use `mulberry32`.
6. **Row order.** A problem declares `result.ordered`. When `false` (the statement says "any order"), the judge compares rows as a sorted multiset: duplicates count, so a missing `DISTINCT` still fails. When `true` (the statement requires `ORDER BY`), rows compare in order. Column names must match in order, case-insensitively. Non-integer numbers compare after rounding to 5 decimals.
7. **One language.** A SQL problem offers only SQL in the language picker and ships exactly one verified solution, `solutions/solution.sql`. The 8-language rule (CLAUDE.md invariant 11) applies to algorithm problems.

## Alternatives considered

- **sqlite3 CLI in CI, sql.js in the browser.** Two SQLite builds can differ in version and compile options (window functions, math functions), so a solution could pass CI and fail in the browser. Rejected.
- **PGlite (PostgreSQL in wasm).** Closer to a "real" server dialect, but about 3 MB to download and still not MySQL. Rejected for now; the judging contract (tables in, result set out) would not change if the engine did.
- **A MySQL-compatible engine.** None runs in the browser. Exact MySQL semantics need the server runner (ROADMAP Phase 2).

## Consequences

- First SQL run downloads about 0.7 MB (sql.js + wasm) from jsDelivr, cached afterwards.
- Users coming from LeetCode may hit the dialect differences above; statements avoid problems whose canonical solution depends on MySQL-only functions, or say which SQLite function to use.
- Adding a SQL problem needs no codegen or harness changes: a schema, cases, a JS `reference` and `solution.sql` (docs/PROBLEM_FORMAT.md, "SQL problems").
- Upgrading sql.js is a deliberate task, like Monaco and Pyodide: bump the devDependency and the worker URL together, run the verifier and the e2e test.
