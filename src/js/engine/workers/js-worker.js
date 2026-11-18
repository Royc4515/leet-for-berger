/*
 * JavaScript execution worker (classic worker, not a module).
 *
 * Runs untrusted user code off the main thread so an infinite loop can be killed with
 * worker.terminate() instead of freezing the tab. A worker has no DOM and no access to
 * the app's localStorage-backed state through the page, which is the isolation we rely on.
 *
 * Protocol: see src/js/engine/runners/worker-runner.js
 */
'use strict';

const STDOUT_LIMIT = 2000;

/*
 * Growth timing (docs/adr/0004-complexity-feedback.md), after an Accepted submit:
 *   main -> worker  { type: 'growth-load', code, entry, adapter }   compile once, keep the JIT warm
 *                   { type: 'growth-time', n, args, reps, warmupMs, slowMs }
 *   worker -> main  { type: 'growth-ready' } | { type: 'fatal', error }
 *                   { type: 'growth-sample', n, ms } per call, { type: 'growth-error', n, error }, { type: 'growth-done', n }
 * Only the call itself is timed: copying and converting the input, and settling it, happen first.
 */
let growthFn = null;

function loadGrowth({ code, entry, adapter }) {
  try {
    if (adapter && adapter.growth) {
      const pair = new Function(`${adapter.before}${code}${adapter.after}\nreturn [${adapter.growth.prepare}, ${adapter.growth.call}];`)();
      growthFn = { prepare: pair[0], call: pair[1], objects: true };
    } else {
      const fn = adapter
        ? new Function(`${adapter.before}${code}${adapter.after}\nreturn ${adapter.entry};`)()
        : new Function(`${code}\nreturn typeof ${entry} === 'function' ? ${entry} : undefined;`)();
      if (typeof fn !== 'function') throw new Error(`Function "${entry}" was not found.`);
      growthFn = { prepare: (...args) => args, call: (args) => fn(...args), objects: false };
    }
    self.postMessage({ type: 'growth-ready' });
  } catch (err) {
    self.postMessage({ type: 'fatal', error: describe(err) });
  }
}

// Short-lived garbage so freshly built input nodes leave the young generation before the clock
// starts; otherwise the call pays to copy its own input. Same rule as settle() in scripts/verify/growth.mjs.
function settle(n) {
  let last = null;
  for (let k = 0, m = Math.min(2 * n, 1000000); k < m; k++) last = [k];
  return last;
}

function timeOnce(n, args) {
  const prepared = growthFn.prepare(...structuredClone(args));
  if (growthFn.objects) settle(n);
  const started = performance.now();
  growthFn.call(prepared);
  return performance.now() - started;
}

function timeGrowth({ n, args, reps, warmupMs, slowMs }) {
  const original = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  // Printing would be timed too, and nobody reads the output of a timing run.
  console.log = console.info = console.warn = console.error = () => {};
  try {
    // JIT warmup: the first calls run unoptimized code and would inflate the smallest size.
    const warmStart = performance.now();
    for (let i = 0; warmupMs > 0 && i < 200 && (i < 2 || performance.now() - warmStart < warmupMs); i++) timeOnce(n, args);
    for (let r = 0; r < reps; r++) {
      const ms = timeOnce(n, args);
      self.postMessage({ type: 'growth-sample', n, ms });
      if (ms >= slowMs) break;
    }
  } catch (err) {
    self.postMessage({ type: 'growth-error', n, error: describe(err) });
  } finally {
    Object.assign(console, original);
  }
  self.postMessage({ type: 'growth-done', n });
}

self.onmessage = (event) => {
  const { type, code, entry, cases, adapter } = event.data || {};
  if (type === 'growth-load') return loadGrowth(event.data);
  if (type === 'growth-time') return timeGrowth(event.data);
  if (type !== 'run') return;

  let fn;
  try {
    // Function constructor instead of eval: user code gets its own function scope, and
    // the trailing lookup finds the entry whether it was declared with function/const/class.
    // don't touch / the "\n" before return protects against user code ending in a // comment.
    // With an adapter (linked lists, trees, design classes) the user's code is wrapped by
    // engine/adapters.js, which converts JSON cases to objects and back.
    fn = adapter
      ? new Function(`${adapter.before}${code}${adapter.after}\nreturn ${adapter.entry};`)()
      : new Function(`${code}\nreturn typeof ${entry} === 'function' ? ${entry} : undefined;`)();
  } catch (err) {
    self.postMessage({ type: 'fatal', error: `Compile error: ${describe(err)}` });
    return;
  }
  if (typeof fn !== 'function') {
    self.postMessage({ type: 'fatal', error: `Function "${entry}" was not found. Keep the starter signature.` });
    return;
  }

  for (const tc of cases) {
    let out = '';
    const capture = (...parts) => {
      if (out.length < STDOUT_LIMIT) out += parts.map(stringify).join(' ') + '\n';
    };
    const original = { log: console.log, info: console.info, warn: console.warn, error: console.error };
    console.log = console.info = console.warn = console.error = capture;

    const started = performance.now();
    try {
      // structuredClone so a solution that mutates its input cannot poison later cases.
      const actual = fn(...structuredClone(tc.args));
      send({ type: 'case', id: tc.id, state: 'ok', actual, stdout: out, timeMs: performance.now() - started });
    } catch (err) {
      send({ type: 'case', id: tc.id, state: 'error', error: describe(err), stdout: out, timeMs: performance.now() - started });
    } finally {
      Object.assign(console, original);
    }
  }
  self.postMessage({ type: 'done' });
};

function send(msg) {
  try {
    self.postMessage(msg);
  } catch {
    // Return value was not structured-cloneable (a function, a DOM-like object...).
    self.postMessage({ ...msg, actual: `[unserializable: ${stringify(msg.actual)}]` });
  }
}

function describe(err) {
  return err && err.name ? `${err.name}: ${err.message}` : String(err);
}

function stringify(v) {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
