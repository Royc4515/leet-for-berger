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

self.onmessage = (event) => {
  const { type, code, entry, cases } = event.data || {};
  if (type !== 'run') return;

  let fn;
  try {
    // Function constructor instead of eval: user code gets its own function scope, and
    // the trailing lookup finds the entry whether it was declared with function/const/class.
    // don't touch / the "\n" before return protects against user code ending in a // comment.
    fn = new Function(`${code}\nreturn typeof ${entry} === 'function' ? ${entry} : undefined;`)();
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
