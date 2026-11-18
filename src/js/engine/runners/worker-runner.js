/**
 * Generic worker-backed runner with a per-case watchdog.
 *
 * Worker protocol
 *   main  -> worker  { type: 'run', code, entry, cases: [{ id, args }], adapter?: { before, after, entry } }
 *   worker -> main   { type: 'ready' }                      (optional, slow-boot runtimes)
 *                    { type: 'case', id, state, actual?, error?, stdout?, timeMs }
 *                    { type: 'fatal', error }               (compile / load failure)
 *                    { type: 'done' }
 *
 * Expected values are never posted to the worker: user code could read them off
 * the message and "pass" by echoing the answer.
 *
 * Growth timing (measureGrowth) uses its own messages, documented in workers/js-worker.js.
 */
import { shouldMeasureNext, median, growthSeed } from '../growth.js';

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
    this.cancelled = false;
    this.pending = null; // resolves the growth message in flight, so cancelGrowth can end it
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
   * @param {{ before: string, after: string, entry: string } | null} [job.adapter] JSON <-> objects bridge (engine/adapters.js)
   * @returns {Promise<import('../harness.js').RawResult[]>}
   */
  async run({ code, entry, cases, timeLimitMs, onStatus, adapter = null }) {
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
      return await this.#execute({ code, entry, cases, timeLimitMs, adapter });
    } finally {
      this.busy = false;
      if (!this.persistent) this.#kill();
    }
  }

  /**
   * Times the code on growing inputs (docs/adr/0004-complexity-feedback.md). Sizes go up in
   * order and the run stops before a size that would be slow or over budget, so a quadratic
   * solution never reaches the largest inputs. Inputs are built here, one size at a time; no
   * expected value exists or is sent (invariant 2 holds trivially).
   *
   * @param {object} job
   * @param {string} job.code
   * @param {string} job.entry
   * @param {object|null} [job.adapter]
   * @param {{ sizes: number[], input: (n: number, seed: number) => unknown[] }} job.growth
   * @param {number} [job.reps]      calls per size
   * @param {number} [job.budgetMs]  total wall time, input building included
   * @param {number} [job.slowMs]    a call predicted above this is not attempted
   * @param {number} [job.warmupMs]  JIT warmup on the smallest size
   * @returns {Promise<{ samples: import('../growth.js').GrowthSample[], error?: string, cancelled?: boolean }>}
   */
  async measureGrowth({ code, entry, adapter = null, growth, reps = 5, budgetMs = 5000, slowMs = 1000, warmupMs = 100 }) {
    if (this.busy) throw new Error('A run is already in progress.');
    this.busy = true;
    this.cancelled = false;
    const samples = [];
    try {
      this.#ensureWorker();
      try {
        await this.ready;
      } catch (err) {
        this.#kill();
        return { samples, error: err.message };
      }
      if (this.cancelled) return { samples, cancelled: true };
      const started = performance.now();
      const loaded = await this.#exchange({ type: 'growth-load', code, entry, adapter }, slowMs * 5, () => {});
      if (loaded.error || loaded.timedOut) return { samples, error: loaded.error ?? 'Loading the code timed out.' };
      const done = [];
      for (const [i, n] of growth.sizes.entries()) {
        if (this.cancelled) return { samples, cancelled: true };
        if (!shouldMeasureNext({ done, nextN: n, elapsedMs: performance.now() - started, budgetMs, slowMs, reps })) break;
        const args = growth.input(n, growthSeed(n));
        const times = [];
        // The watchdog covers one call (re-armed per sample), plus the warmup on the first size.
        const r = await this.#exchange({ type: 'growth-time', n, args, reps, slowMs, warmupMs: i === 0 ? warmupMs : 0 }, 2 * slowMs + (i === 0 ? warmupMs : 0), (ms) => times.push(ms));
        times.forEach((ms) => samples.push({ n, ms }));
        if (r.cancelled) return { samples, cancelled: true };
        if (r.error) return { samples, error: r.error };
        if (r.timedOut) {
          samples.push({ n, ms: 2 * slowMs, timedOut: true });
          break;
        }
        done.push({ n, ms: median(times) });
        // Let the page paint between sizes: building a large input takes a few milliseconds here.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      return { samples };
    } finally {
      this.busy = false;
      this.pending = null;
      if (!this.persistent) this.#kill();
    }
  }

  /**
   * Stops a growth measurement: the next size is not started, and a size in progress is killed
   * with its worker (a later run boots a fresh one). Safe to call when nothing runs.
   */
  cancelGrowth() {
    this.cancelled = true;
    if (this.pending) {
      this.#kill();
      this.pending({ cancelled: true });
    }
  }

  /** Posts one growth message and collects samples until done, an error, or the watchdog fires. */
  #exchange(msg, limitMs, onSample) {
    return new Promise((resolve) => {
      const worker = this.worker;
      let timer = null;
      const finish = (result) => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        this.pending = null;
        resolve(result);
      };
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.#kill(); // a stuck call cannot be interrupted any other way
          finish({ timedOut: true });
        }, limitMs);
      };
      const onMessage = (e) => {
        const m = e.data;
        if (m.type === 'growth-sample') {
          onSample(m.ms);
          arm();
        } else if (m.type === 'growth-ready' || m.type === 'growth-done') finish({});
        else if (m.type === 'growth-error' || m.type === 'fatal') finish({ error: m.error });
      };
      const onError = (e) => {
        e.preventDefault?.();
        this.#kill();
        finish({ error: e.message || 'Worker crashed' });
      };
      this.pending = finish;
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      arm();
      worker.postMessage(msg);
    });
  }

  #execute({ code, entry, cases, timeLimitMs, adapter }) {
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
      worker.postMessage({ type: 'run', code, entry, cases, adapter });
    });
  }
}
