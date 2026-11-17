/*
 * SQL case execution on top of sql.js (SQLite compiled to WebAssembly). See docs/adr/0003-sql-problems.md.
 *
 * Shared by the browser worker (sql-worker.js loads it with importScripts) and the CI verifier
 * (scripts/verify/sql.mjs imports it), so the query a user submits and the shipped solution run
 * through exactly the same code. That is why this file is a plain script with no import/export:
 * it must load both as a classic worker script and as an ES module.
 *
 * Every case gets a fresh in-memory database: tables are created, the case's rows inserted, the
 * connection is made read-only, then the user's single statement runs. A write cannot leak into
 * the next case, and nothing but the case's own tables exists to be read.
 */
(function (root) {
  'use strict';

  /** Drops comments, semicolons and whitespace: what is left after the first statement must be empty. */
  function hasMoreSql(rest) {
    return (
      rest
        .replace(/--[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/[;\s]/g, '').length > 0
    );
  }

  function message(err) {
    if (err && typeof err.message === 'string') return err.message;
    return String(err);
  }

  /**
   * Runs one case.
   * @param {any} SQL the initialised sql.js module
   * @param {{ ddl: string[], tables: { name: string, columns: string[] }[] }} setup from engine/sql.js sqlSetup()
   * @param {string} query the user's SQL
   * @param {unknown[][][]} args one array of rows per table, in setup.tables order
   * @returns {{ columns: string[], rows: unknown[][] }}
   */
  function runSqlCase(SQL, setup, query, args) {
    const db = new SQL.Database();
    try {
      for (const ddl of setup.ddl) db.run(ddl);
      db.run('BEGIN');
      setup.tables.forEach(function (table, i) {
        const rows = args[i] || [];
        if (!rows.length) return;
        const marks = table.columns.map(function () {
          return '?';
        });
        const insert = db.prepare('INSERT INTO "' + table.name + '" VALUES (' + marks.join(', ') + ')');
        try {
          for (const row of rows) insert.run(row);
        } finally {
          insert.free();
        }
      });
      db.run('COMMIT');
      // don't touch / makes every write in the user's statement fail, so a DELETE or UPDATE can
      // never pass as an answer. It sits after the inserts because it applies to them too.
      db.run('PRAGMA query_only = 1');

      const it = db.iterateStatements(query);
      const first = it.next();
      if (first.done) throw new Error('No SQL statement found. Write one SELECT (or WITH) query.');
      const stmt = first.value;
      if (hasMoreSql(it.getRemainingSQL())) throw new Error('Write exactly one SQL statement. Remove everything after the first semicolon.');
      const columns = stmt.getColumnNames();
      if (!columns.length) throw new Error('The statement returned no result set. Write a SELECT (or WITH) query.');
      const rows = [];
      while (stmt.step()) rows.push(stmt.get().map(plain));
      return { columns: columns, rows: rows };
    } catch (err) {
      throw new Error(message(err));
    } finally {
      db.close();
    }
  }

  /** BLOBs arrive as Uint8Array, which would not compare or print like the other values. */
  function plain(v) {
    if (v instanceof Uint8Array) return Array.from(v);
    return v;
  }

  root.LfbSqlCore = { runSqlCase: runSqlCase };
})(typeof self !== 'undefined' ? self : globalThis);
