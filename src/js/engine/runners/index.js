/**
 * Runner registry: one runner per language.
 * The harness never knows how code executes; adding a language means adding an entry here
 * and a worker (or a remote runner with the same run() contract).
 */
import { WorkerRunner } from './worker-runner.js';
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
}

const runners = {
  javascript: new WorkerRunner({ workerUrl: workerUrl('js-worker.js') }),
  python: new WorkerRunner({ workerUrl: workerUrl('py-worker.js'), persistent: true, waitForReady: true }),
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
