/**
 * Runner registry: one runner per language.
 * The harness never knows how code executes; adding a language means adding an entry here
 * and a worker (or a remote runner with the same run() contract).
 */
import { WorkerRunner } from './worker-runner.js';
import { TypeScriptRunner } from './ts-runner.js';
import { LANGUAGES } from '../codegen.js';

export { LANGUAGES };

const workerUrl = (file) => new URL(`../workers/${file}`, import.meta.url).href;

/** Languages that cannot run in the browser report an honest "not supported" per case until the server runner exists. */
class UnsupportedRunner {
  constructor(message) {
    this.message = message;
  }
  warmUp() {
    return Promise.resolve();
  }
  async run({ cases }) {
    return cases.map((c) => ({ id: c.id, state: 'unsupported', error: this.message }));
  }
  cancelGrowth() {}
}

const runners = {
  javascript: new WorkerRunner({ workerUrl: workerUrl('js-worker.js') }),
  python: new WorkerRunner({ workerUrl: workerUrl('py-worker.js'), persistent: true, waitForReady: true }),
  // SQL problems only (docs/adr/0003-sql-problems.md): sql.js boots once, each case gets a fresh database.
  sql: new WorkerRunner({ workerUrl: workerUrl('sql-worker.js'), persistent: true, waitForReady: true }),
  // Type-checked and transpiled by the editor's TypeScript service, then run as JavaScript (engine/typescript.js).
  // Imported lazily so this registry never pulls Monaco code into a context without a page.
  typescript: new TypeScriptRunner({
    js: new WorkerRunner({ workerUrl: workerUrl('js-worker.js') }),
    loadCompiler: () => import('../../ui/ts-compiler.js').then((m) => m.loadTypeScriptCompiler()),
  }),
};
// Compiled and typed languages need the server-side runner (ROADMAP Phase 2): editor only today.
for (const l of LANGUAGES.filter((x) => !x.executable)) {
  runners[l.id] = new UnsupportedRunner(
    `${l.label} execution needs the server-side runner (see docs/ROADMAP.md, Phase 2). Editor support only for now.`,
  );
}

/** @param {string} language */
export function getRunner(language) {
  const r = runners[language];
  if (!r) throw new Error(`No runner for language "${language}"`);
  return r;
}
