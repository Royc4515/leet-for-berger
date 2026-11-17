/*
 * SQL execution worker, backed by sql.js (SQLite compiled to WebAssembly).
 *
 * Kept alive between runs like the Python worker: the wasm module is fetched and compiled once,
 * then every case builds its own in-memory database (see sql-core.js). Announces {type:'ready'}
 * once loaded, so the runner's per-case watchdog does not count the download.
 *
 * Protocol: see src/js/engine/runners/worker-runner.js. For SQL, `code` is the query and
 * `adapter` is { ddl, tables } from engine/sql.js sqlSetup(); `entry` is unused.
 */
'use strict';

// don't touch / pinned to the same version as the sql.js devDependency the CI verifier runs, so
// the browser and CI execute the same SQLite build (tests/sql.test.js checks they match).
const SQLJS_URL = 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/';

let sqlReady = null;

function boot() {
  importScripts(`${SQLJS_URL}sql-wasm.js`, 'sql-core.js');
  // eslint-disable-next-line no-undef
  return initSqlJs({ locateFile: (file) => `${SQLJS_URL}${file}` });
}

sqlReady = Promise.resolve()
  .then(boot)
  .then(
    (SQL) => {
      self.postMessage({ type: 'ready' });
      return SQL;
    },
    (err) => {
      self.postMessage({ type: 'fatal', error: `SQL runtime failed to load: ${err && err.message ? err.message : err}` });
      throw err;
    },
  );

self.onmessage = async (event) => {
  const { type, code, cases, adapter } = event.data || {};
  if (type !== 'run') return;

  let SQL;
  try {
    SQL = await sqlReady;
  } catch {
    return; // fatal already reported at boot
  }
  if (!adapter || !Array.isArray(adapter.ddl)) {
    self.postMessage({ type: 'fatal', error: 'This problem has no table schema.' });
    return;
  }

  for (const tc of cases) {
    const started = performance.now();
    try {
      // eslint-disable-next-line no-undef
      const actual = LfbSqlCore.runSqlCase(SQL, adapter, code, tc.args);
      self.postMessage({ type: 'case', id: tc.id, state: 'ok', actual, timeMs: performance.now() - started });
    } catch (err) {
      self.postMessage({ type: 'case', id: tc.id, state: 'error', error: err && err.message ? err.message : String(err), timeMs: performance.now() - started });
    }
  }
  self.postMessage({ type: 'done' });
};
