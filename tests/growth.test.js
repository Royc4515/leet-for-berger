// The growth estimator (src/js/engine/growth.js) on synthetic timings: clean power laws, constant
// overhead, multiplicative noise, GC-style outliers, timeouts and too-fast code. The rule under
// test is "never claim a bucket the data cannot support".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  estimateGrowth,
  targetBucket,
  bucketOfSlope,
  fitLine,
  median,
  shouldMeasureNext,
  shouldRetryGrowth,
  describeGrowth,
  validateGrowth,
  growthSeed,
  GROWTH_TARGETS,
} from '../src/js/engine/growth.js';
import { mulberry32 } from '../src/js/engine/rng.js';

const LADDER = [2000, 4000, 8000, 16000, 32000, 64000];
const MODELS = {
  n: (n) => n,
  'n log n': (n) => n * Math.log2(n),
  'n^2': (n) => n * n,
  'n^2 log n': (n) => n * n * Math.log2(n),
  'n^3': (n) => n ** 3,
};

/**
 * Samples of `reps` calls per size: time = overheadMs + scale * f(n), times a lognormal-ish factor
 * with the given relative spread. `scale` puts the largest size at `topMs`.
 */
function synth({ model, sizes = LADDER, topMs = 50, overheadMs = 0, noise = 0, reps = 5, seed = 1 }) {
  const f = MODELS[model] ?? model;
  const scale = topMs / f(sizes[sizes.length - 1]);
  const rnd = mulberry32(seed);
  const out = [];
  for (const n of sizes) {
    for (let r = 0; r < reps; r++) {
      const factor = Math.exp(noise * (rnd() + rnd() + rnd() - 1.5) * 2); // roughly +-noise
      out.push({ n, ms: (overheadMs + scale * f(n)) * factor });
    }
  }
  return out;
}

test('targets map to coarse buckets; unknown targets are rejected', () => {
  assert.equal(targetBucket('n'), 'linear');
  assert.equal(targetBucket('n log n'), 'linear');
  assert.equal(targetBucket('n^2'), 'quadratic');
  assert.equal(targetBucket('n^2 log n'), 'quadratic');
  assert.equal(targetBucket('log n'), 'sublinear');
  assert.equal(targetBucket('n^3'), 'cubic');
  assert.throws(() => targetBucket('n^1.5'), /Unknown growth target/);
});

test('slope boundaries sit between the targets they separate', () => {
  assert.equal(bucketOfSlope(0.2), 'sublinear');
  assert.equal(bucketOfSlope(1), 'linear');
  assert.equal(bucketOfSlope(1.13), 'linear'); // n log n over our sizes
  assert.equal(bucketOfSlope(1.4), 'linear'); // linear code with cache and GC effects on large inputs
  assert.equal(bucketOfSlope(1.7), 'quadratic');
  assert.equal(bucketOfSlope(2), 'quadratic');
  assert.equal(bucketOfSlope(2.1), 'quadratic');
  assert.equal(bucketOfSlope(3), 'cubic');
  assert.equal(bucketOfSlope(6), 'exponential');
});

test('fitLine and median basics', () => {
  const f = fitLine([1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 1 })));
  assert.ok(Math.abs(f.slope - 2) < 1e-12 && Math.abs(f.intercept - 1) < 1e-12 && f.rms < 1e-12);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('clean power laws land in their bucket and match their own target', () => {
  for (const [model, expected] of [['n', 'linear'], ['n log n', 'linear'], ['n^2', 'quadratic'], ['n^2 log n', 'quadratic'], ['n^3', 'cubic']]) {
    const est = estimateGrowth(synth({ model, topMs: model.startsWith('n^') ? 2000 : 50 }), model);
    assert.equal(est.bucket, expected, model);
    assert.equal(est.verdict, 'matches', model);
  }
});

test('n log n is reported as linear and matches a linear target, and vice versa', () => {
  assert.equal(estimateGrowth(synth({ model: 'n log n' }), 'n').verdict, 'matches');
  assert.equal(estimateGrowth(synth({ model: 'n' }), 'n log n').verdict, 'matches');
});

test('faster than the target still matches (the estimate is "no slower than")', () => {
  const est = estimateGrowth(synth({ model: 'n' }), 'n^2');
  assert.equal(est.verdict, 'matches');
  assert.equal(est.bucket, 'linear');
  assert.match(describeGrowth(est, { n: 'nums.length' }).headline, /even faster than the target/);
});

test('quadratic code against a linear target is slower than target', () => {
  const est = estimateGrowth(synth({ model: 'n^2', topMs: 3000 }), 'n');
  assert.equal(est.verdict, 'slower than target');
  assert.equal(est.bucket, 'quadratic');
  assert.ok(Math.abs(est.slope - 2) < 0.01);
});

test('cubic code against a quadratic target is slower than target', () => {
  const est = estimateGrowth(synth({ model: 'n^3', sizes: [250, 500, 1000, 2000], topMs: 1200 }), 'n^2');
  assert.equal(est.verdict, 'slower than target');
  assert.equal(est.bucket, 'cubic');
});

test('constant overhead flattens the slope but never makes quadratic code look like it matches linear', () => {
  for (const overheadMs of [0.5, 2, 5, 20]) {
    const est = estimateGrowth(synth({ model: 'n^2', topMs: 2000, overheadMs }), 'n');
    assert.notEqual(est.verdict, 'matches', `overhead ${overheadMs}`);
  }
  // Overhead on linear code only lowers the slope: still no false "slower".
  for (const overheadMs of [0.5, 2, 5, 20]) {
    assert.equal(estimateGrowth(synth({ model: 'n', overheadMs }), 'n').verdict, 'matches', `overhead ${overheadMs}`);
  }
});

test('sizes below the timer floor are dropped, the rest still decide', () => {
  // Linear at 0.25 .. 8 ms: 2000 and 4000 fall under 1 ms, four sizes remain.
  const est = estimateGrowth(synth({ model: 'n', topMs: 8 }), 'n');
  assert.equal(est.verdict, 'matches');
  assert.deepEqual(est.points.map((p) => p.n), [8000, 16000, 32000, 64000]);
});

test('code too fast to time is inconclusive, never a bucket', () => {
  const est = estimateGrowth(synth({ model: 'n^2', topMs: 0.8 }), 'n');
  assert.equal(est.verdict, 'inconclusive');
  assert.equal(est.reason, 'times too small to measure');
  assert.equal(est.bucket, null);
  const two = estimateGrowth(synth({ model: 'n', topMs: 3 }), 'n'); // only 32000 and 64000 >= 1 ms
  assert.equal(two.verdict, 'inconclusive');
  assert.equal(two.reason, 'too few sizes took long enough to time');
});

test('a single GC-style outlier per size does not move the median', () => {
  const samples = synth({ model: 'n', reps: 5 });
  samples.forEach((s, i) => i % 5 === 2 && (s.ms *= 15));
  const est = estimateGrowth(samples, 'n');
  assert.equal(est.verdict, 'matches');
  assert.ok(Math.abs(est.slope - 1) < 0.05);
});

test('random times are inconclusive, not a bucket', () => {
  // Five random calls (1 to 101 ms) per size, 200 times. Time that does not depend on n is flat,
  // so "does not grow" is the most this data may say. It is never called slower than linear, and a
  // rising bucket appears only when the four top medians happen to line up (about 1 in 200).
  let rising = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const rnd = mulberry32(seed);
    const est = estimateGrowth(LADDER.flatMap((n) => [0, 1, 2, 3, 4].map(() => ({ n, ms: 1 + rnd() * 100 }))), 'n');
    assert.notEqual(est.verdict, 'slower than target', `seed ${seed}`);
    if (est.verdict !== 'inconclusive' && est.bucket !== 'sublinear') rising++;
  }
  assert.ok(rising <= 4, `${rising} of 200 random runs read as growing`);
  // One random time per size gives no spread to judge by: an unknown spread is assumed, and only
  // the runs that happen to land nearly in line read as anything, and never as slower.
  let confident = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const rnd = mulberry32(seed);
    const est = estimateGrowth(LADDER.map((n) => ({ n, ms: 1 + rnd() * 100 })), 'n');
    assert.notEqual(est.verdict, 'slower than target', `seed ${seed}`);
    if (est.verdict !== 'inconclusive') confident++;
  }
  assert.ok(confident <= 50, `${confident} of 200 single-call random runs got a verdict`);
});

test('noise robustness: 400 noisy runs never produce a wrong verdict', () => {
  // +-30% per call, 5 calls per size: far noisier than a quiet machine.
  const tally = (model, target, topMs) => {
    const counts = { matches: 0, 'slower than target': 0, inconclusive: 0 };
    for (let seed = 1; seed <= 400; seed++) counts[estimateGrowth(synth({ model, topMs, noise: 0.3, seed }), target).verdict]++;
    return counts;
  };
  const lin = tally('n', 'n', 30);
  assert.equal(lin['slower than target'], 0, JSON.stringify(lin));
  assert.ok(lin.matches >= 380, JSON.stringify(lin)); // at most 5% inconclusive
  const nlogn = tally('n log n', 'n', 30);
  assert.equal(nlogn['slower than target'], 0, JSON.stringify(nlogn));
  const quad = tally('n^2', 'n', 2000);
  assert.equal(quad.matches, 0, JSON.stringify(quad));
  // Only the top 4 sizes decide (see GROWTH_DEFAULTS.window), so heavy noise costs some verdicts.
  assert.ok(quad['slower than target'] >= 320, JSON.stringify(quad));
  const quadOk = tally('n^2', 'n^2', 2000);
  assert.equal(quadOk['slower than target'], 0, JSON.stringify(quadOk));
});

test('a timeout after fast sizes is a lower bound that proves "slower"', () => {
  const samples = [
    ...synth({ model: 'n', sizes: [2000, 4000, 8000, 16000], topMs: 40 }),
    { n: 32000, ms: 3000, timedOut: true },
  ];
  const est = estimateGrowth(samples, 'n');
  assert.equal(est.verdict, 'slower than target');
  assert.equal(est.atLeast, true);
  assert.ok(est.slope > 5);
  assert.match(describeGrowth(est, { n: 'nums.length' }).headline, /^Growth estimate: at least /);
});

test('a timeout that a linear trend could explain does not decide', () => {
  // 16000 took 900 ms; 32000 hit a 2000 ms cap: a slope of only 1.15, compatible with linear.
  const samples = [...synth({ model: 'n', sizes: [2000, 4000, 8000, 16000], topMs: 900 }), { n: 32000, ms: 2000, timedOut: true }];
  assert.equal(estimateGrowth(samples, 'n').verdict, 'matches');
  // With too few finished sizes, the same bound is inconclusive.
  const short = [...synth({ model: 'n', sizes: [8000, 16000], topMs: 900 }), { n: 32000, ms: 2000, timedOut: true }];
  const est = estimateGrowth(short, 'n');
  assert.equal(est.verdict, 'inconclusive');
  assert.equal(est.reason, 'a larger input hit the time cap before enough sizes finished');
});

test('a timeout on the smallest size is inconclusive', () => {
  const est = estimateGrowth([{ n: 2000, ms: 3000, timedOut: true }], 'n');
  assert.equal(est.verdict, 'inconclusive');
  assert.equal(est.reason, 'the smallest input already hit the time cap');
});

test('a fit straddling the target boundary is "too close to call"', () => {
  // Slope 1.6, the boundary itself: neither linear nor quadratic can be claimed.
  const est = estimateGrowth(synth({ model: (n) => n ** 1.6, topMs: 300 }), 'n');
  assert.equal(est.verdict, 'inconclusive');
  assert.equal(est.reason, 'too close to call');
});

test('shouldMeasureNext stops before slow or over-budget sizes', () => {
  const base = { elapsedMs: 0, budgetMs: 5000, slowMs: 1000, reps: 3 };
  assert.equal(shouldMeasureNext({ ...base, done: [], nextN: 1000 }), true);
  // Quadratic so far: 100 -> 400 ms, next predicted 1600 ms > slowMs.
  assert.equal(shouldMeasureNext({ ...base, done: [{ n: 1000, ms: 100 }, { n: 2000, ms: 400 }], nextN: 4000 }), false);
  // Linear so far: 100 -> 200 ms, next 400 ms fits.
  assert.equal(shouldMeasureNext({ ...base, done: [{ n: 1000, ms: 100 }, { n: 2000, ms: 200 }], nextN: 4000 }), true);
  // Fits slowMs but not the budget: 3 reps of 400 ms after 4 s spent.
  assert.equal(shouldMeasureNext({ ...base, elapsedMs: 4000, done: [{ n: 1000, ms: 100 }, { n: 2000, ms: 200 }], nextN: 4000 }), false);
  // Below the timer floor the local slope is noise: assume linear.
  assert.equal(shouldMeasureNext({ ...base, done: [{ n: 1000, ms: 0.01 }, { n: 2000, ms: 0.5 }], nextN: 4000 }), true);
  assert.equal(shouldMeasureNext({ ...base, elapsedMs: 5000, done: [], nextN: 1000 }), false);
});

test('describeGrowth: headline per verdict, note says it is an estimate', () => {
  const g = { n: 'nums.length' };
  const ok = describeGrowth(estimateGrowth(synth({ model: 'n log n' }), 'n log n'), g);
  assert.equal(ok.headline, 'Growth estimate: about linear (n or n log n) (target n log n): matches.');
  assert.match(ok.note, /^An estimate from timing your accepted code on n = 8,000 to 64,000 \(n = nums.length\), not a proof\./);
  const slow = describeGrowth(estimateGrowth(synth({ model: 'n^2', topMs: 2000 }), 'n'), g);
  assert.equal(slow.headline, 'Growth estimate: about quadratic (n^2), target n: slower than target.');
  const inc = describeGrowth(estimateGrowth(synth({ model: 'n', topMs: 0.1 }), 'n'), g);
  assert.equal(inc.headline, 'Growth estimate: inconclusive (times too small to measure), target n.');
  for (const t of [ok, slow, inc]) assert.ok(!/\u2014/.test(t.headline + t.note));
});

test('validateGrowth checks the spec shape', () => {
  const good = { id: 'x', growth: { target: 'n', n: 'nums.length', sizes: [1000, 2000, 4000, 8000], input: () => [[]] } };
  assert.deepEqual(validateGrowth(good), []);
  assert.deepEqual(validateGrowth({ id: 'x' }), []);
  const bad = { id: 'x', growth: { target: 'n^1.5', n: '', sizes: [8000, 4000, 2000, 1000], input: 'nope', inconclusiveOk: 1 } };
  const errs = validateGrowth(bad);
  assert.equal(errs.length, 6, errs.join('\n'));
  assert.match(validateGrowth({ id: 'x', growth: { ...good.growth, sizes: [1000, 2000, 3000, 4000] } })[0], /factor of 8/);
});

test('growthSeed is deterministic and differs per size', () => {
  assert.equal(growthSeed(1000), growthSeed(1000));
  assert.notEqual(growthSeed(1000), growthSeed(2000));
  assert.ok(Number.isInteger(growthSeed(123456)) && growthSeed(123456) >= 0);
});

test('every declared target string is a key of GROWTH_TARGETS', () => {
  assert.deepEqual(Object.keys(GROWTH_TARGETS).sort(), ['1', '2^n', 'log n', 'n', 'n log n', 'n^2', 'n^2 log n', 'n^3'].sort());
});

test('growth.js stays pure: no DOM, no clock, no randomness', () => {
  const src = readFileSync(new URL('../src/js/engine/growth.js', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const banned of [/Date\.now/, /performance\.now/, /Math\.random/, /\bdocument\./, /\bwindow\./, /new Worker/]) assert.ok(!banned.test(src), String(banned));
});

test('one spoiled size among many is dropped; a real bend is not hidden by it', () => {
  // Linear over 8 sizes, but 16000 hit a JIT tier-up and took 6x as long.
  const sizes = [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000];
  const samples = synth({ model: 'n', sizes, topMs: 100 }).map((s) => (s.n === 16000 ? { ...s, ms: s.ms * 6 } : s));
  const est = estimateGrowth(samples, 'n');
  assert.equal(est.verdict, 'matches');
  assert.equal(est.dropped.n, 16000);
  // Quadratic code with one fast outlier is still slower than a linear target.
  const quad = synth({ model: 'n^2', sizes, topMs: 3000 }).map((s) => (s.n === 256000 ? { ...s, ms: s.ms / 8 } : s));
  assert.equal(estimateGrowth(quad, 'n').verdict, 'slower than target');
  // Linear for small sizes, then quadratic: several points bend, so dropping one cannot make it match.
  const bent = synth({ model: (n) => (n <= 16000 ? n * 16000 : n * n), sizes, topMs: 3000 });
  assert.notEqual(estimateGrowth(bent, 'n').verdict, 'matches');
});

test('with only 4 sizes, one spoiled interior size is dropped, and nothing else is', () => {
  const sizes = [8000, 16000, 32000, 64000];
  const spoil = (samples, n, f) => samples.map((s) => (s.n === n ? { ...s, ms: s.ms * f } : s));
  // Linear with a 6x slow middle size: dropped, and the verdict is the honest one.
  const four = estimateGrowth(spoil(synth({ model: 'n', sizes, topMs: 50 }), 16000, 6), 'n');
  assert.equal(four.dropped?.n, 16000);
  assert.equal(four.verdict, 'matches');
  // Quadratic with a fast middle size is still slower than a linear target.
  const quad = estimateGrowth(spoil(synth({ model: 'n^2', sizes, topMs: 400 }), 32000, 1 / 4), 'n');
  assert.equal(quad.verdict, 'slower than target');
  // A slow LAST size may be growth setting in: never dropped, so it cannot be explained away.
  const last = estimateGrowth(spoil(synth({ model: 'n', sizes, topMs: 50 }), 64000, 6), 'n');
  assert.equal(last.dropped, null);
  assert.notEqual(last.verdict, 'matches');
  // Linear that turns quadratic halfway: two points bend, so no single drop makes it match.
  const bent = estimateGrowth(synth({ model: (n) => (n <= 16000 ? n * 16000 : n * n), sizes, topMs: 400 }), 'n');
  assert.notEqual(bent.verdict, 'matches');
  // Noisy everywhere: the other 3 sizes do not lie on a tight line, so nothing is dropped.
  const noisy = synth({ model: 'n', sizes, topMs: 50 }).map((s) => ({ ...s, ms: s.ms * ({ 16000: 1.8, 32000: 0.6, 64000: 1.7 }[s.n] ?? 1) }));
  assert.equal(estimateGrowth(noisy, 'n').dropped, null);
});

test('linear code whose per-item cost creeps up with the heap still reads as linear', () => {
  // Cache misses: cost per item rises about 30% per doubling at the top, as measured for Map-heavy code.
  const est = estimateGrowth(synth({ model: (n) => n * (n > 32000 ? (n / 32000) ** 0.35 : 1), topMs: 80 }), 'n');
  assert.equal(est.verdict, 'matches');
});

test('shouldRetryGrowth: one more pass only for transient inconclusive reasons that fit the budget', () => {
  assert.equal(shouldRetryGrowth({ verdict: 'inconclusive', reason: 'too close to call' }, 1500, 5000), true);
  assert.equal(shouldRetryGrowth({ verdict: 'inconclusive', reason: 'timings too noisy' }, 2500, 5000), true);
  // Over half the budget already spent: a second pass at the same pace would overrun it.
  assert.equal(shouldRetryGrowth({ verdict: 'inconclusive', reason: 'too close to call' }, 2600, 5000), false);
  // These would repeat on a second pass.
  assert.equal(shouldRetryGrowth({ verdict: 'inconclusive', reason: 'times too small to measure' }, 100, 5000), false);
  assert.equal(shouldRetryGrowth({ verdict: 'inconclusive', reason: 'a larger input hit the time cap' }, 100, 5000), false);
  // A decided verdict is never re-measured.
  assert.equal(shouldRetryGrowth({ verdict: 'matches', reason: null }, 100, 5000), false);
  assert.equal(shouldRetryGrowth({ verdict: 'slower than target', reason: null }, 100, 5000), false);
});
