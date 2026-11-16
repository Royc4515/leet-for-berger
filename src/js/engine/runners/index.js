/**
 * Runner registry: one runner per language.
 * The harness never knows how code executes; adding a language means adding an entry here
 * and a worker (or a remote runner with the same run() contract).
 */
import { WorkerRunner } from './worker-runner.js';

const workerUrl = (file) => new URL(`../workers/${file}`, import.meta.url).href;

/** Java needs a JVM; in-browser options are too heavy for v1, so execution is server-side (roadmap). */
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

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', executable: true },
  { id: 'python', label: 'Python 3', monaco: 'python', executable: true },
  { id: 'java', label: 'Java 17', monaco: 'java', executable: false },
];

const runners = {
  javascript: new WorkerRunner({ workerUrl: workerUrl('js-worker.js') }),
  python: new WorkerRunner({ workerUrl: workerUrl('py-worker.js'), persistent: true, waitForReady: true }),
  java: new UnsupportedRunner(
    'Java execution needs the server-side runner (see docs/ROADMAP.md, Phase 2). Editor support only for now.',
  ),
};

/** @param {string} language */
export function getRunner(language) {
  const r = runners[language];
  if (!r) throw new Error(`No runner for language "${language}"`);
  return r;
}
