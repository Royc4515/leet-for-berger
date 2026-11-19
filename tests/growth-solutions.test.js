// Growth targets (docs/adr/0004-complexity-feedback.md): for every problem that declares `growth`,
// the generator must build valid, deterministic input, and the shipped JavaScript solution must
// measure as matching its target. That validates both the target and the generator: a generator
// that lets the solution exit early, or a target that is wrong, fails here.
//
// Timing runs only when JavaScript solutions are selected (VERIFY_LANGUAGES, as in
// tests/solutions.test.js); CI runs it in the javascript verify job, alone, so parallel jobs do not
// add noise. A measurement that is not conclusive is retried: noise does not repeat, a real
// mismatch does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { loadAllProblems, loadProblem } from '../src/js/problems/index.js';
import { comparatorFor } from '../src/js/engine/harness.js';
import { validateGrowth, growthSeed } from '../src/js/engine/growth.js';
import { compileJs, measureGrowth } from '../scripts/verify/growth.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const ONLY = process.env.VERIFY_LANGUAGES ? new Set(process.env.VERIFY_LANGUAGES.split(',').map((l) => l.trim())) : null;
const timing = !ONLY || ONLY.has('javascript');
const ATTEMPTS = 3;
// A full collection before each measurement: without it, the garbage of the previous problem's
// largest inputs was collected during the next problem's smallest sizes and bent its curve.
setFlagsFromString('--expose-gc');
const gc = runInNewContext('gc');

const PILOT = ['pair-sum-target', 'longest-streak', 'top-k-frequent', 'zero-triplets', 'warmer-days', 'subarray-sum-k', 'island-count', 'level-order', 'median-stream', 'rising-chain'];
const withGrowth = (await loadAllProblems()).filter((p) => p.growth);
const shipped = (id) => readFileSync(join(ROOT, 'src/js/problems', id, 'solutions/solution.js'), 'utf8');

/** Measures up to ATTEMPTS times; stops at the first estimate `accept` likes. */
function measureUntil(problem, code, accept) {
  const fn = compileJs(problem, code);
  const tries = [];
  for (let i = 0; i < ATTEMPTS; i++) {
    const r = measureGrowth(problem, fn, { gc });
    tries.push(r);
    if (accept(r.estimate)) break;
  }
  return tries;
}

const summary = (r) => {
  const e = r.estimate;
  const pts = r.medians.map((m) => `${m.n}:${m.ms.toFixed(1)}`).join(' ');
  return `${e.verdict} (${e.bucket ?? '-'}, slope ${e.slope?.toFixed(2) ?? '-'} +- ${e.margin?.toFixed(2) ?? '-'}${e.reason ? `, ${e.reason}` : ''}) in ${Math.round(r.wallMs)} ms [${pts}]`;
};

test('the pilot problems declare growth', async () => {
  for (const id of PILOT) assert.ok((await loadProblem(id)).growth, `${id} has no growth spec`);
});

for (const problem of withGrowth) {
  const g = problem.growth;

  test(`${problem.id}: growth spec is valid`, () => {
    assert.deepEqual(validateGrowth(problem), []);
    assert.ok(!problem.signature.kind || problem.signature.kind === 'class', 'growth is for algorithm problems, not SQL');
  });

  test(`${problem.id}: growth input is deterministic, well-formed and judged like a real case`, () => {
    const n = g.sizes[0];
    const args = g.input(n, growthSeed(n));
    assert.deepEqual(g.input(n, growthSeed(n)), args, 'same seed must give the same input (invariant 5)');
    const arity = problem.signature.kind === 'class' ? 2 : problem.signature.params.length;
    assert.equal(args.length, arity, 'input must return the full argument list');
    // The shipped solution must agree with the reference on the smallest growth input, so the
    // generator produces input inside the problem's rules.
    const actual = compileJs(problem, shipped(problem.id)).entry(...structuredClone(args));
    const expected = problem.solveReference(args);
    assert.ok(comparatorFor(problem)(actual, expected, { args }), 'shipped solution and reference disagree on the growth input');
  });

  test(`${problem.id}: shipped JavaScript solution measures as target ${g.target}`, { skip: !timing && 'JavaScript not in VERIFY_LANGUAGES' }, (t) => {
    const ok = (e) => e.verdict === 'matches' || (g.inconclusiveOk === true && e.verdict === 'inconclusive');
    const tries = measureUntil(problem, shipped(problem.id), ok);
    tries.forEach((r, i) => t.diagnostic(`attempt ${i + 1}: ${summary(r)}`));
    assert.ok(ok(tries[tries.length - 1].estimate), `${problem.id}: ${tries.map(summary).join(' | ')}`);
  });
}

// The negative control: a quadratic Pair Sum Target must be called out, not waved through.
test('a quadratic JavaScript Pair Sum Target measures as slower than target', { skip: !timing && 'JavaScript not in VERIFY_LANGUAGES' }, async (t) => {
  const quadratic = `function pairSum(nums, target) {
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) return [i, j];
  return [];
}`;
  const tries = measureUntil(await loadProblem('pair-sum-target'), quadratic, (e) => e.verdict === 'slower than target');
  tries.forEach((r, i) => t.diagnostic(`attempt ${i + 1}: ${summary(r)}`));
  const e = tries[tries.length - 1].estimate;
  assert.equal(e.verdict, 'slower than target', tries.map(summary).join(' | '));
  assert.equal(e.bucket, 'quadratic');
});
