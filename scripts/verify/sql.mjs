// Runs SQL problems in node with the same sql.js build and the same case runner
// (src/js/engine/workers/sql-core.js) as the browser worker. sql.js is a pinned devDependency,
// so CI needs no system package: `npm ci` installs it.
import { createRequire } from 'node:module';
import { sqlSetup } from '../../src/js/engine/sql.js';

const require = createRequire(import.meta.url);

/** True when the sql.js devDependency is installed (it is the "toolchain" for SQL). */
export function sqlEngineAvailable() {
  try {
    require.resolve('sql.js');
    return true;
  } catch {
    return false;
  }
}

let engine = null;

/** Loads sql.js and the shared case runner once. */
export async function loadSqlEngine() {
  if (!engine) {
    engine = (async () => {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      // sql-core.js is a plain script shared with the worker: importing it registers LfbSqlCore.
      await import('../../src/js/engine/workers/sql-core.js');
      return { SQL, core: globalThis.LfbSqlCore };
    })();
  }
  return engine;
}

/**
 * Runs a query on every case. A case that errors yields { error } instead of a result set.
 * @param {object} signature a SQL signature (engine/sql.js)
 * @param {string} query
 * @param {unknown[][][][]} casesArgs one args array per case
 */
export async function runSqlCases(signature, query, casesArgs) {
  const { SQL, core } = await loadSqlEngine();
  const setup = sqlSetup(signature);
  return casesArgs.map((args) => {
    try {
      return core.runSqlCase(SQL, setup, query, args);
    } catch (err) {
      return { error: err.message };
    }
  });
}
