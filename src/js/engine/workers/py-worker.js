/*
 * Python execution worker, backed by Pyodide (CPython compiled to WebAssembly).
 *
 * Pyodide takes several seconds to boot, so this worker is kept alive between runs and
 * only recreated after a timeout kill. It announces {type:'ready'} once loaded; the
 * runner does not start its timeout clock until then, otherwise every first run would TLE.
 */
'use strict';

// don't touch / version is pinned on purpose: Pyodide's JS<->Python conversion API changes between minors.
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/';
const STDOUT_LIMIT = 2000;

let pyodideReady = null;
let stdoutBuffer = '';

async function boot() {
  importScripts(`${PYODIDE_URL}pyodide.js`);
  // eslint-disable-next-line no-undef
  const py = await loadPyodide({ indexURL: PYODIDE_URL });
  py.setStdout({ batched: (line) => append(line) });
  py.setStderr({ batched: (line) => append(line) });
  return py;
}

function append(line) {
  if (stdoutBuffer.length < STDOUT_LIMIT) stdoutBuffer += line + '\n';
}

pyodideReady = boot().then(
  (py) => {
    self.postMessage({ type: 'ready' });
    return py;
  },
  (err) => {
    self.postMessage({ type: 'fatal', error: `Python runtime failed to load: ${err && err.message ? err.message : err}` });
    throw err;
  },
);

/*
 * Growth timing, same protocol as js-worker.js (growth-load / growth-time). The JS -> Python
 * conversion and the adapter's prepare step run before the clock starts; only the call is timed.
 */
let growth = null;

function dropGrowth() {
  if (!growth) return;
  growth.call.destroy();
  if (growth.prepare) growth.prepare.destroy();
  growth = null;
}

async function loadGrowth({ code, entry, adapter }) {
  let py;
  try {
    py = await pyodideReady;
  } catch {
    return;
  }
  dropGrowth();
  try {
    py.globals.set('__lfb_code', code);
    py.globals.set('__lfb_before', adapter ? adapter.before : '');
    py.globals.set('__lfb_after', adapter ? adapter.after : '');
    py.runPython('__lfb_gns = {}\nexec(__lfb_before, __lfb_gns)\nexec(__lfb_code, __lfb_gns)\nexec(__lfb_after, __lfb_gns)');
    const ns = py.globals.get('__lfb_gns');
    const g = adapter && adapter.growth;
    const call = ns.get(g ? g.call : adapter ? adapter.entry : entry);
    const prepare = g ? ns.get(g.prepare) : null;
    ns.destroy();
    if (!call) throw new Error(`Function "${entry}" was not found.`);
    growth = { py, call, prepare };
    self.postMessage({ type: 'growth-ready' });
  } catch (err) {
    self.postMessage({ type: 'fatal', error: cleanTrace(err) });
  }
}

function timeGrowth({ n, args, reps, warmupMs, slowMs }) {
  const { py, call, prepare } = growth;
  const timeOnce = () => {
    const pyArgs = args.map((a) => (typeof a === 'object' && a !== null ? py.toPy(a) : a));
    let prepared = null;
    try {
      // With an adapter, __lfb_call takes the prepared list; without, the function takes the args.
      prepared = prepare ? prepare(...pyArgs) : null;
      const started = performance.now();
      const result = prepared ? call(prepared) : call(...pyArgs);
      const ms = performance.now() - started;
      if (result instanceof py.ffi.PyProxy) result.destroy();
      return ms;
    } finally {
      pyArgs.forEach((a) => a && typeof a.destroy === 'function' && a.destroy());
      if (prepared) prepared.destroy();
    }
  };
  stdoutBuffer = '';
  try {
    const warmStart = performance.now();
    for (let i = 0; warmupMs > 0 && i < 20 && (i < 1 || performance.now() - warmStart < warmupMs); i++) timeOnce();
    for (let r = 0; r < reps; r++) {
      const ms = timeOnce();
      self.postMessage({ type: 'growth-sample', n, ms });
      if (ms >= slowMs) break;
    }
  } catch (err) {
    self.postMessage({ type: 'growth-error', n, error: cleanTrace(err) });
  }
  stdoutBuffer = ''; // printed output of timing runs is discarded
  self.postMessage({ type: 'growth-done', n });
}

self.onmessage = async (event) => {
  const { type, code, entry, cases, adapter } = event.data || {};
  if (type === 'growth-load') return loadGrowth(event.data);
  if (type === 'growth-time') return timeGrowth(event.data);
  if (type !== 'run') return;

  let py;
  try {
    py = await pyodideReady;
  } catch {
    return; // fatal already reported at boot
  }

  let fn;
  try {
    // Fresh namespace per run so a function deleted from the editor does not linger.
    // An adapter runs as separate exec calls around the user's code so the user's traceback
    // line numbers stay their own.
    py.globals.set('__lfb_code', code);
    py.globals.set('__lfb_before', adapter ? adapter.before : '');
    py.globals.set('__lfb_after', adapter ? adapter.after : '');
    py.runPython('__lfb_ns = {}\nexec(__lfb_before, __lfb_ns)\nexec(__lfb_code, __lfb_ns)\nexec(__lfb_after, __lfb_ns)');
    const ns = py.globals.get('__lfb_ns');
    fn = ns.get(adapter ? adapter.entry : entry);
    ns.destroy();
  } catch (err) {
    self.postMessage({ type: 'fatal', error: `Compile error:\n${cleanTrace(err)}` });
    return;
  }
  if (!fn) {
    self.postMessage({ type: 'fatal', error: `Function "${entry}" was not found. Keep the starter signature.` });
    return;
  }

  for (const tc of cases) {
    stdoutBuffer = '';
    const started = performance.now();
    const pyArgs = tc.args.map((a) => (typeof a === 'object' && a !== null ? py.toPy(a) : a));
    try {
      const result = fn(...pyArgs);
      const actual = toJs(py, result);
      self.postMessage({ type: 'case', id: tc.id, state: 'ok', actual, stdout: stdoutBuffer, timeMs: performance.now() - started });
    } catch (err) {
      self.postMessage({ type: 'case', id: tc.id, state: 'error', error: cleanTrace(err), stdout: stdoutBuffer, timeMs: performance.now() - started });
    } finally {
      // PyProxies are not garbage-collected by JS; leaking them grows wasm memory every run.
      pyArgs.forEach((a) => a && typeof a.destroy === 'function' && a.destroy());
    }
  }
  fn.destroy();
  self.postMessage({ type: 'done' });
};

function toJs(py, value) {
  if (value instanceof py.ffi.PyProxy) {
    const converted = value.toJs({ dict_converter: Object.fromEntries });
    value.destroy();
    return converted;
  }
  return value === undefined ? null : value; // Python None arrives as undefined
}

function cleanTrace(err) {
  const text = err && err.message ? err.message : String(err);
  // Drop Pyodide's internal frames so the user sees their own traceback lines.
  return text
    .split('\n')
    .filter((l) => !l.includes('/lib/python') && !l.includes('_pyodide'))
    .join('\n')
    .trim();
}
