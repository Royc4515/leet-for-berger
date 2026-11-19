// Measures a JavaScript solution's growth in node for the CI verifier (tests/growth-solutions.test.js).
// It compiles the code the way src/js/engine/workers/js-worker.js does (same adapter from
// engine/adapters.js) and feeds the samples to the same estimator as the browser
// (engine/growth.js), so a target that passes here means the same thing in the app.
import { estimateGrowth, shouldMeasureNext, median, growthSeed } from '../../src/js/engine/growth.js';

/**
 * Compiles user or solution code the way the worker does for a growth run: `prepare` turns JSON
 * args into what the user's code takes (untimed), `call` runs the user's code on them (timed).
 * @param {object} problem hydrated problem (problems/index.js loadProblem)
 * @param {string} code
 * @returns {{ prepare: (...args: unknown[]) => unknown[], call: (prepared: unknown[]) => unknown, entry: Function, objects: boolean }}
 *   entry is the judged path (JSON in, JSON out), used to check a generator's input is valid;
 *   objects is true when prepare builds node objects (lists, trees), which need settling
 */
export function compileJs(problem, code) {
  const adapter = problem.adapters?.javascript ?? null;
  const entry = problem.signatures.javascript.entry;
  // don't touch / same wrapping as js-worker.js, "\n" included: timings must cover the same code path.
  if (adapter?.growth) {
    const [prepare, call, judged] = new Function(`${adapter.before}${code}${adapter.after}\nreturn [${adapter.growth.prepare}, ${adapter.growth.call}, ${adapter.entry}];`)();
    return { prepare, call, entry: judged, objects: true };
  }
  const fn = adapter
    ? new Function(`${adapter.before}${code}${adapter.after}\nreturn ${adapter.entry};`)()
    : new Function(`${code}\nreturn typeof ${entry} === 'function' ? ${entry} : undefined;`)();
  if (typeof fn !== 'function') throw new Error(`Function "${entry}" was not found`);
  return { prepare: (...args) => args, call: (args) => fn(...args), entry: fn, objects: false };
}

/**
 * Allocates short-lived garbage so freshly built input nodes are promoted out of the young
 * generation before the clock starts. Without it the timed call paid to copy its own input during
 * its first collections: a BFS over 512k prepared nodes read as slope 1.4 instead of 1.0.
 * Same rule as settle() in js-worker.js.
 * @param {number} n
 */
export function settle(n) {
  let last = null;
  for (let k = 0, m = Math.min(2 * n, 1000000); k < m; k++) last = [k];
  return last;
}

/**
 * Times compiled code on the problem's growth sizes and estimates its growth.
 *
 * Sizes go up in order, `reps` calls each, and the run stops before a size that would be slow
 * or over budget (shouldMeasureNext), so a quadratic solution never reaches the largest inputs.
 * Calls of one size run back to back, as in the browser: interleaving sizes made each small call
 * pay the garbage collection left by the large call before it.
 *
 * @param {object} problem hydrated problem with `growth`
 * @param {ReturnType<typeof compileJs>} fn compiled solution
 * @param {{ reps?: number, warmupMs?: number, budgetMs?: number, slowMs?: number, gc?: (() => void) | null }} [opts]
 *   gc: a full garbage collection, run first so the previous measurement's garbage is not billed here
 * @returns {{ estimate: import('../../src/js/engine/growth.js').GrowthEstimate, samples: object[], medians: {n: number, ms: number}[], wallMs: number }}
 */
export function measureGrowth(problem, fn, { reps = 7, warmupMs = 300, budgetMs = 6000, slowMs = 1000, gc = null } = {}) {
  const g = problem.growth;
  gc?.();
  const started = performance.now();
  let current = { n: 0, args: null };
  const argsFor = (n) => {
    if (current.n !== n) current = { n, args: g.input(n, growthSeed(n)) };
    // A fresh copy per call, outside the timed region, as the worker does with structuredClone.
    return structuredClone(current.args);
  };
  const time = (n) => {
    const args = fn.prepare(...argsFor(n));
    if (fn.objects) settle(n);
    const t0 = performance.now();
    fn.call(args);
    return performance.now() - t0;
  };

  // JIT warmup on the smallest size: the first calls run unoptimized code and would inflate the
  // small sizes, flattening the slope. Two calls were not enough for a sort comparator to be optimized.
  const warmStart = performance.now();
  for (let i = 0; i < 200 && (i < 2 || performance.now() - warmStart < warmupMs); i++) time(g.sizes[0]);

  const samples = [];
  const done = [];
  for (const n of g.sizes) {
    if (!shouldMeasureNext({ done, nextN: n, elapsedMs: performance.now() - started, budgetMs, slowMs, reps })) break;
    const times = [];
    for (let r = 0; r < reps; r++) {
      times.push(time(n));
      // One slow call is enough to know this size is slow; the rest would only burn budget.
      if (times[r] >= slowMs) break;
    }
    times.forEach((ms) => samples.push({ n, ms }));
    done.push({ n, ms: median(times) });
  }
  const estimate = estimateGrowth(samples, g.target);
  return { estimate, samples, medians: done, wallMs: performance.now() - started };
}
