/**
 * Generic worker-backed runner with a per-case watchdog.
 *
 * Worker protocol
 *   main  -> worker  { type: 'run', code, entry, cases: [{ id, args }] }
 *   worker -> main   { type: 'ready' }                      (optional, slow-boot runtimes)
 *                    { type: 'case', id, state, actual?, error?, stdout?, timeMs }
 *                    { type: 'fatal', error }               (compile / load failure)
 *                    { type: 'done' }
 *
 * Expected values are never posted to the worker: user code could read them off
 * the message and "pass" by echoing the answer.
 */
export class WorkerRunner {
  /**
   * @param {object} opts
   * @param {string} opts.workerUrl
   * @param {boolean} [opts.persistent] keep the worker alive between runs (expensive boot)
   * @param {boolean} [opts.waitForReady] worker posts {type:'ready'} before it can run
   */
  constructor({ workerUrl, persistent = false, waitForReady = false }) {
    this.workerUrl = workerUrl;
    this.persistent = persistent;
    this.waitForReady = waitForReady;
    this.worker = null;
    this.ready = null;
    this.busy = false;
  }

  /** Start booting early (e.g. when the user switches language) to hide load latency. */
  warmUp() {
    this.#ensureWorker();
    return this.ready;
  }

  #ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(this.workerUrl);
    if (!this.waitForReady) {
      this.ready = Promise.resolve();
      return;
    }
    this.ready = new Promise((resolve, reject) => {
      const onMsg = (e) => {
        if (e.data?.type === 'ready') {
          this.worker?.removeEventListener('message', onMsg);
          resolve();
        } else if (e.data?.type === 'fatal') {
          this.worker?.removeEventListener('message', onMsg);
          reject(new Error(e.data.error));
        }
      };
      this.worker.addEventListener('message', onMsg);
    });
  }

  #kill() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }

  /**
   * @param {object} job
   * @param {string} job.code
   * @param {string} job.entry
   * @param {{ id: number, args: unknown[] }[]} job.cases
   * @param {number} job.timeLimitMs per-case wall-clock budget
   * @param {(status: string) => void} [job.onStatus]
   * @returns {Promise<import('../harness.js').RawResult[]>}
   */
  async run({ code, entry, cases, timeLimitMs, onStatus }) {
    if (this.busy) throw new Error('A run is already in progress.');
    this.busy = true;
    try {
      this.#ensureWorker();
      if (this.waitForReady) onStatus?.('Loading runtime...');
      try {
        await this.ready;
      } catch (err) {
        this.#kill();
        return cases.map((c) => ({ id: c.id, state: 'error', error: err.message }));
      }
      onStatus?.('Running...');
      return await this.#execute({ code, entry, cases, timeLimitMs });
    } finally {
      this.busy = false;
      if (!this.persistent) this.#kill();
    }
  }

  #execute({ code, entry, cases, timeLimitMs }) {
    return new Promise((resolve) => {
      const worker = this.worker;
      const results = new Map();
      let timer = null;

      const finish = () => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        resolve(cases.map((c) => results.get(c.id) ?? { id: c.id, state: 'skipped' }));
      };

      // Reset on every case so the budget is per case, not shared by all 15.
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const pending = cases.find((c) => !results.has(c.id));
          if (pending) results.set(pending.id, { id: pending.id, state: 'timeout', timeMs: timeLimitMs });
          // A stuck worker cannot be interrupted any other way.
          this.#kill();
          finish();
        }, timeLimitMs);
      };

      const onMessage = (e) => {
        const msg = e.data;
        if (msg.type === 'case') {
          results.set(msg.id, msg);
          arm();
        } else if (msg.type === 'fatal') {
          cases.forEach((c) => results.set(c.id, { id: c.id, state: 'error', error: msg.error }));
          finish();
        } else if (msg.type === 'done') {
          finish();
        }
      };
      const onError = (e) => {
        e.preventDefault?.(); // keep uncaught worker errors out of the page console
        cases.forEach((c) => results.has(c.id) || results.set(c.id, { id: c.id, state: 'error', error: e.message || 'Worker crashed' }));
        this.#kill();
        finish();
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      arm();
      worker.postMessage({ type: 'run', code, entry, cases });
    });
  }
}
