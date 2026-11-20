// One growth check in its own worker thread (tests/growth-solutions.test.js, scripts/verify/growth.mjs
// checkGrowthInWorker). A fresh isolate loads only this problem, like the browser's worker does:
// the test process used to load all problems first, which kept about 1.5 GB alive, and a full
// collection of that heap (0.7 s) or its incremental steps landing inside a timed call put steps
// into otherwise straight curves (Product Except Self read 512000 and 1024000 at the same time).
import { parentPort, workerData } from 'node:worker_threads';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { isDeepStrictEqual } from 'node:util';
import { loadProblem } from '../../src/js/problems/index.js';
import { comparatorFor } from '../../src/js/engine/harness.js';
import { validateGrowth, growthSeed } from '../../src/js/engine/growth.js';
import { compileJs, measureGrowth } from './growth.mjs';

setFlagsFromString('--expose-gc');
const gc = runInNewContext('gc');

const { id, code, timing, attempts, want } = workerData;
const problem = await loadProblem(id);
const g = problem.growth;
const errors = validateGrowth(problem);
const result = { errors, classKind: problem.signature.kind ?? null, target: g?.target ?? null, inconclusiveOk: g?.inconclusiveOk === true, tries: [] };

if (g && !errors.length) {
  const n = g.sizes[0];
  const args = g.input(n, growthSeed(n));
  result.deterministic = isDeepStrictEqual(g.input(n, growthSeed(n)), args);
  result.arity = args.length;
  result.expectedArity = problem.signature.kind === 'class' ? 2 : problem.signature.params.length;
  const fn = compileJs(problem, code);
  // The code must agree with the reference on the smallest growth input, so the generator stays
  // inside the problem's rules.
  const actual = fn.entry(...structuredClone(args));
  result.agrees = comparatorFor(problem)(actual, problem.solveReference(args), { args });

  if (timing) {
    // Retried while not conclusive: noise does not repeat, a real mismatch does.
    const ok = (e) => (want === 'slower' ? e.verdict === 'slower than target' : e.verdict === 'matches' || (g.inconclusiveOk === true && e.verdict === 'inconclusive'));
    for (let i = 0; i < attempts; i++) {
      const r = measureGrowth(problem, fn, { gc });
      result.tries.push({ estimate: r.estimate, medians: r.medians, wallMs: r.wallMs });
      if (ok(r.estimate)) break;
    }
  }
}
parentPort.postMessage(result);
