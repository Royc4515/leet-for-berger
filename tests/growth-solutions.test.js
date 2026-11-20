// Growth targets (docs/adr/0004-complexity-feedback.md): for every problem that declares `growth`,
// the generator must build valid, deterministic input, and the shipped JavaScript solution must
// measure as matching its target. That validates both the target and the generator: a generator
// that lets the solution exit early, or a target that is wrong, fails here.
//
// Each problem is checked in its own worker thread that loads only that problem
// (scripts/verify/growth-worker.mjs), as the browser's worker does. Loading every problem in this
// process first kept about 1.5 GB alive, and collecting that heap during a timed call bent curves.
//
// Timing runs only when JavaScript solutions are selected (VERIFY_LANGUAGES, as in
// tests/solutions.test.js); CI runs it in the javascript verify job, alone, so parallel jobs do not
// add noise. A measurement that is not conclusive is retried: noise does not repeat, a real
// mismatch does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { availableEntries } from '../src/js/problems/index.js';
import { checkGrowthInWorker, declaresGrowth } from '../scripts/verify/growth.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const ONLY = process.env.VERIFY_LANGUAGES ? new Set(process.env.VERIFY_LANGUAGES.split(',').map((l) => l.trim())) : null;
const timing = !ONLY || ONLY.has('javascript');
const ATTEMPTS = 3;

const PILOT = ['pair-sum-target', 'longest-streak', 'top-k-frequent', 'zero-triplets', 'warmer-days', 'subarray-sum-k', 'island-count', 'level-order', 'median-stream', 'rising-chain'];
const source = (id, file) => readFileSync(join(ROOT, 'src/js/problems', id, file), 'utf8');
const withGrowth = availableEntries().filter((e) => declaresGrowth(source(e.id, 'problem.js')));

const summary = (r) => {
  const e = r.estimate;
  const pts = r.medians.map((m) => `${m.n}:${m.ms.toFixed(1)}`).join(' ');
  return `${e.verdict} (${e.bucket ?? '-'}, slope ${e.slope?.toFixed(2) ?? '-'} +- ${e.margin?.toFixed(2) ?? '-'}${e.reason ? `, ${e.reason}` : ''}) in ${Math.round(r.wallMs)} ms [${pts}]`;
};

test('the pilot problems declare growth', () => {
  for (const id of PILOT) assert.ok(withGrowth.some((e) => e.id === id), `${id} has no growth spec`);
});

for (const entry of withGrowth) {
  // One worker per problem, shared by its three tests; it starts when the first of them runs.
  let pending = null;
  const check = () => (pending ??= checkGrowthInWorker({ id: entry.id, code: source(entry.id, 'solutions/solution.js'), timing, attempts: ATTEMPTS, want: 'target' }));

  test(`${entry.id}: growth spec is valid`, async () => {
    const r = await check();
    assert.deepEqual(r.errors, []);
    assert.ok(!r.classKind || r.classKind === 'class', 'growth is for algorithm problems, not SQL');
  });

  test(`${entry.id}: growth input is deterministic, well-formed and judged like a real case`, async () => {
    const r = await check();
    assert.equal(r.deterministic, true, 'same seed must give the same input (invariant 5)');
    assert.equal(r.arity, r.expectedArity, 'input must return the full argument list');
    assert.equal(r.agrees, true, 'shipped solution and reference disagree on the growth input');
  });

  test(`${entry.id}: shipped JavaScript solution measures as its target`, { skip: !timing && 'JavaScript not in VERIFY_LANGUAGES' }, async (t) => {
    const r = await check();
    r.tries.forEach((x, i) => t.diagnostic(`attempt ${i + 1}: ${summary(x)}`));
    const last = r.tries[r.tries.length - 1]?.estimate;
    assert.ok(last, 'no measurement ran');
    assert.ok(last.verdict === 'matches' || (r.inconclusiveOk && last.verdict === 'inconclusive'), `${entry.id} (target ${r.target}): ${r.tries.map(summary).join(' | ')}`);
  });
}

// The negative control: a quadratic Pair Sum Target must be called out, not waved through.
test('a quadratic JavaScript Pair Sum Target measures as slower than target', { skip: !timing && 'JavaScript not in VERIFY_LANGUAGES' }, async (t) => {
  const quadratic = `function pairSum(nums, target) {
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) return [i, j];
  return [];
}`;
  const r = await checkGrowthInWorker({ id: 'pair-sum-target', code: quadratic, timing: true, attempts: ATTEMPTS, want: 'slower' });
  r.tries.forEach((x, i) => t.diagnostic(`attempt ${i + 1}: ${summary(x)}`));
  const e = r.tries[r.tries.length - 1].estimate;
  assert.equal(e.verdict, 'slower than target', r.tries.map(summary).join(' | '));
  assert.equal(e.bucket, 'quadratic');
});
