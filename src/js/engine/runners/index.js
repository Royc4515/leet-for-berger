/**
 * Runner registry: one runner per language.
 * The harness never knows how code executes; adding a language means adding an entry here
 * and a worker (or a remote runner with the same run() contract).
 */
import { WorkerRunner } from './worker-runner.js';
import { RemoteRunner, REMOTE_LANGUAGES } from './remote-runner.js';
import { LANGUAGES } from '../codegen.js';
import { remoteRunnerConfig } from '../../config.js';
import { turnstileTokenProvider } from './turnstile.js';

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
};
// Compiled and typed languages need the server-side runner (ROADMAP Phase 2): editor only today.
for (const l of LANGUAGES.filter((x) => !x.executable)) {
  runners[l.id] = new UnsupportedRunner(
    `${l.label} execution needs the server-side runner (see docs/ROADMAP.md, Phase 2). Editor support only for now.`,
  );
}

// With a remote runner configured (docs/adr/0005-remote-runner.md), Java, C++, C, C# and Go run on
// the server in practice mode. Unset, they keep the honest editor-only verdict above.
const remote = remoteRunnerConfig();
if (remote.url) {
  const getToken = remote.turnstileSiteKey ? turnstileTokenProvider(remote.turnstileSiteKey) : null;
  for (const id of REMOTE_LANGUAGES) runners[id] = new RemoteRunner({ language: id, url: remote.url, getToken });
}
// Interview and battle stay editor-only for these languages: a scored result needs server-side
// judging first (ROADMAP Phase 3), and practice mode is what the free server is sized for.
const sessionOnly = new UnsupportedRunner('In interview and battle modes this language is editor-only for now: scored sessions need server-side judging (see docs/ROADMAP.md, Phase 3). It runs on the server in practice mode.');

/** True when the language runs on the remote runner (in practice mode). */
export const isRemote = (language) => runners[language] instanceof RemoteRunner;

/**
 * @param {string} language
 * @param {{ session?: boolean }} [opts] session: inside an interview or battle
 */
export function getRunner(language, { session = false } = {}) {
  const r = runners[language];
  if (!r) throw new Error(`No runner for language "${language}"`);
  return session && r instanceof RemoteRunner ? sessionOnly : r;
}
