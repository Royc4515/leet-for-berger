/**
 * Empirical complexity feedback: estimate how a solution's run time grows with input size.
 * Design and limits: docs/adr/0004-complexity-feedback.md.
 *
 * Pure module (no DOM, no workers, no clock): callers pass timings in, so the browser, the CI
 * verifier and the unit tests share one estimator.
 *
 * The estimate is a least-squares slope of log(time) against log(n), sorted into coarse buckets.
 * The buckets are coarse on purpose: n and n log n differ by a slope of about 0.1 over the sizes
 * we can afford, far less than timing noise, so both are "linear". The estimator says
 * "inconclusive" whenever the data cannot support a bucket.
 */

/** Buckets in increasing cost; a bucket's index is its rank. */
export const GROWTH_BUCKETS = ['sublinear', 'linear', 'quadratic', 'cubic', 'exponential'];

/**
 * Largest log-log slope of each bucket but the last. In theory n log n reads about 1.1 over our
 * sizes and n^2 log n about 2.1. In practice linear JavaScript reads 1.05 to 1.4 on large inputs
 * (cache misses and garbage collection grow with the heap) while quadratic code reads 1.95 to
 * 2.05, so the linear/quadratic boundary sits at 1.6 rather than halfway (ADR 0004 has the data).
 */
const UPPER_SLOPE = { sublinear: 0.5, linear: 1.6, quadratic: 2.5, cubic: 4.5, exponential: Infinity };

/** Targets a problem may declare, and the bucket each one falls into. */
export const GROWTH_TARGETS = {
  1: 'sublinear',
  'log n': 'sublinear',
  n: 'linear',
  'n log n': 'linear',
  'n^2': 'quadratic',
  'n^2 log n': 'quadratic',
  'n^3': 'cubic',
  '2^n': 'exponential',
};

/** Defaults for estimateGrowth; the tests pin what each one protects against. */
export const GROWTH_DEFAULTS = {
  // Medians below this are dropped: browser timers are coarse (0.1 ms in a Chrome worker) and
  // sub-millisecond calls are dominated by call overhead, not by the algorithm.
  minMs: 1,
  // A slope needs at least this many sizes and this ratio between the smallest and largest one.
  minSizes: 3,
  minSpan: 4,
  // A slope closer than this to a bucket boundary is not trusted to either side.
  minMargin: 0.15,
  // Root-mean-square residual (in log2 units) above which the points do not lie on any power law.
  maxResidual: 0.35,
  // With at least `outlierMinSizes` sizes, one size whose median sits this far off the fit (in log2
  // units: 0.5 is 41%) is dropped before judging. A JIT tier-up or a stray collection can spoil
  // one size; a real change of growth bends several, which one drop cannot hide.
  outlierMinSizes: 5,
  outlierResidual: 0.5,
  // The slope is judged on the largest `window` timeable sizes. Small sizes carry call overhead
  // (a linear term under a quadratic one), which bends the low end of the curve; growth is about
  // the large end. Measured: a splice-based quadratic read 1.54, 2.1, 2.05 per doubling.
  window: 4,
  // Assumed log2 standard error of a size's median when it has fewer than 3 calls (unknown spread).
  unknownSpread: 0.5,
  // A size whose own calls disagree this much (log2 standard error of their median: 0.6 is about
  // 50%) cannot anchor a slope: its median is as much luck as measurement.
  maxSpread: 0.6,
};

/**
 * Bucket of a declared target ('n log n' -> 'linear').
 * @param {string} target
 * @returns {string}
 */
export function targetBucket(target) {
  const b = GROWTH_TARGETS[target];
  if (!b) throw new Error(`Unknown growth target "${target}". Use one of: ${Object.keys(GROWTH_TARGETS).join(', ')}`);
  return b;
}

/**
 * Bucket a log-log slope falls into.
 * @param {number} slope
 * @returns {string}
 */
export function bucketOfSlope(slope) {
  return GROWTH_BUCKETS.find((b) => slope < UPPER_SLOPE[b]);
}

const rank = (bucket) => GROWTH_BUCKETS.indexOf(bucket);

/** Median of a non-empty numeric array. */
export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Least-squares line through (x, y) points.
 * @param {{x: number, y: number}[]} pts at least 2 distinct x
 * @returns {{ slope: number, intercept: number, se: number, rms: number }}
 *   se is the slope's standard error (Infinity with 2 points), rms the root-mean-square residual
 */
export function fitLine(pts) {
  const k = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / k;
  const my = pts.reduce((s, p) => s + p.y, 0) / k;
  let sxx = 0;
  let sxy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const ssr = pts.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const se = k > 2 ? Math.sqrt(ssr / (k - 2) / sxx) : Infinity;
  return { slope, intercept, se, rms: Math.sqrt(ssr / k) };
}

/**
 * Standard error (log2 units) of a size's median from the spread of its calls: 1.4826 * MAD is the
 * normal-equivalent spread, 1.25 / sqrt(k) turns it into the error of a median of k calls.
 * Floored at 0.03, because a perfectly steady size still carries timer and scheduling error.
 */
function medianSpread(times, unknown) {
  if (times.length < 3) return unknown;
  const logs = times.map((t) => Math.log2(Math.max(t, 1e-6)));
  const mid = median(logs);
  const mad = median(logs.map((v) => Math.abs(v - mid)));
  return Math.max(0.03, (1.4826 * mad * 1.25) / Math.sqrt(times.length));
}

/**
 * @typedef {Object} GrowthSample  one timed call
 * @property {number} n         input size
 * @property {number} ms        time of the call alone (for a timeout: the cap it exceeded)
 * @property {boolean} [timedOut] the call was killed at `ms` without finishing
 */

/**
 * @typedef {Object} GrowthEstimate
 * @property {'matches'|'slower than target'|'inconclusive'} verdict
 * @property {string|null} bucket       measured bucket (null when inconclusive without data)
 * @property {boolean} atLeast          bucket is a lower bound (a size timed out)
 * @property {string} target
 * @property {string} targetBucket
 * @property {number|null} slope        fitted log-log slope (or the timeout lower bound)
 * @property {number|null} margin       half-width of the slope's trusted range
 * @property {string|null} reason       why the verdict is inconclusive
 * @property {{n: number, ms: number}[]} points  per-size medians the slope was fitted on (the top window)
 * @property {{n: number, ms: number}|null} dropped  the one outlier size left out of the fit, if any
 */

/**
 * Estimates growth from timed samples and compares it to the target.
 *
 * "matches" means "no slower than the target's bucket": a solution that beats the target is fine.
 * "slower than target" needs the whole trusted slope range above the target bucket.
 *
 * @param {GrowthSample[]} samples several repetitions per size; medians are used
 * @param {string} target e.g. 'n log n'
 * @param {Partial<typeof GROWTH_DEFAULTS>} [opts]
 * @returns {GrowthEstimate}
 */
export function estimateGrowth(samples, target, opts = {}) {
  const o = { ...GROWTH_DEFAULTS, ...opts };
  const tb = targetBucket(target);
  let dropped = null;
  const result = (fields) => ({ bucket: null, atLeast: false, target, targetBucket: tb, slope: null, margin: null, reason: null, points: [], dropped, ...fields });

  // One point per size: the median of its finished runs. A size with a timeout is a lower bound.
  const bySize = new Map();
  for (const s of samples) {
    if (!(s.n > 0) || !(s.ms >= 0)) continue;
    const e = bySize.get(s.n) ?? { n: s.n, times: [], timedOut: false, capMs: 0 };
    if (s.timedOut) {
      e.timedOut = true;
      e.capMs = Math.max(e.capMs, s.ms);
    } else e.times.push(s.ms);
    bySize.set(s.n, e);
  }
  const sizes = [...bySize.values()].sort((a, b) => a.n - b.n);
  const finished = sizes
    .filter((e) => !e.timedOut && e.times.length)
    .map((e) => ({ n: e.n, ms: median(e.times), spread: medianSpread(e.times, o.unknownSpread), measured: e.times.length >= 3 }));
  const firstTimeout = sizes.find((e) => e.timedOut);
  const measurable = finished.filter((p) => p.ms >= o.minMs && (!firstTimeout || p.n < firstTimeout.n));

  // A timeout bounds the slope from below: time grew from the last finished size to past the cap.
  let bound = null;
  if (firstTimeout) {
    const prev = [...finished].reverse().find((p) => p.n < firstTimeout.n && p.ms > 0);
    if (prev) bound = Math.log2(firstTimeout.capMs / Math.max(prev.ms, o.minMs)) / Math.log2(firstTimeout.n / prev.n);
  }

  const toXY = (pts) => pts.map((p) => ({ x: Math.log2(p.n), y: Math.log2(p.ms) }));
  let fit = null;
  if (measurable.length >= o.outlierMinSizes) {
    const first = fitLine(toXY(measurable));
    const resid = measurable.map((p) => Math.abs(Math.log2(p.ms) - (first.intercept + first.slope * Math.log2(p.n))));
    const worst = resid.indexOf(Math.max(...resid));
    // The drop must leave a tight fit (within 10%, and the outlier 4x further out than the rest
    // scatter): otherwise the data is just noisy, and dropping its worst point would fake a line.
    const restRms = fitLine(toXY(measurable.filter((_, i) => i !== worst))).rms;
    if (resid[worst] > o.outlierResidual && restRms <= 0.15 && 4 * restRms < resid[worst]) [dropped] = measurable.splice(worst, 1);
  }
  const win = measurable.slice(-o.window);
  const span = win.length ? win[win.length - 1].n / win[0].n : 0;
  if (win.length >= o.minSizes && span >= o.minSpan) fit = fitLine(toXY(win));

  if (bound !== null && bound > UPPER_SLOPE[tb] + o.minMargin) {
    // The bound alone proves the target is exceeded, whatever the fit says about smaller sizes.
    const slope = fit ? Math.max(fit.slope, bound) : bound;
    return result({ verdict: 'slower than target', bucket: bucketOfSlope(slope), atLeast: true, slope, points: win });
  }

  if (!fit) {
    let reason;
    if (firstTimeout && !finished.some((p) => p.n < firstTimeout.n)) reason = 'the smallest input already hit the time cap';
    else if (firstTimeout) reason = 'a larger input hit the time cap before enough sizes finished';
    else if (finished.length && finished.every((p) => p.ms < o.minMs)) reason = 'times too small to measure';
    else if (measurable.length && measurable.length < o.minSizes) reason = 'too few sizes took long enough to time';
    else reason = 'not enough sizes measured';
    return result({ verdict: 'inconclusive', reason, points: win.map(({ n, ms }) => ({ n, ms })) });
  }

  // Two standard errors of the slope, from whichever is larger: how far the points scatter around
  // the line, or how much each size's median could move given the spread of its own calls.
  const xs = win.map((p) => Math.log2(p.n));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const seNoise = Math.sqrt(win.reduce((a, p, i) => a + (xs[i] - mx) ** 2 * p.spread ** 2, 0)) / sxx;
  const margin = Math.max(o.minMargin, 2 * Math.max(fit.se, seNoise));
  const base = { slope: fit.slope, margin, points: win.map(({ n, ms }) => ({ n, ms })) };
  const shaky = win.some((p) => p.measured && p.spread > o.maxSpread);
  if (shaky || fit.rms > o.maxResidual || fit.slope + margin < 0) {
    return result({ ...base, verdict: 'inconclusive', reason: 'timings too noisy' });
  }

  const low = bucketOfSlope(fit.slope - margin);
  const high = bucketOfSlope(fit.slope + margin);
  const bucket = bucketOfSlope(fit.slope);
  if (rank(high) <= rank(tb)) return result({ ...base, verdict: 'matches', bucket });
  if (rank(low) > rank(tb)) return result({ ...base, verdict: 'slower than target', bucket });
  // The trusted range straddles the target's upper boundary. A timeout that came on top of an
  // inconclusive fit is still only a lower bound, so it does not decide either.
  return result({ ...base, verdict: 'inconclusive', bucket, reason: bound !== null ? 'a larger input hit the time cap' : 'too close to call' });
}

/**
 * Should the measurement go on to the next size? Stops before a size that would be slow or would
 * not fit the remaining budget, predicting its time from the growth seen so far.
 * @param {object} p
 * @param {{n: number, ms: number}[]} p.done per-size medians measured so far, ascending n
 * @param {number} p.nextN
 * @param {number} p.elapsedMs  wall time spent so far, input building and messaging included
 * @param {number} p.budgetMs   total wall-time budget
 * @param {number} p.slowMs     a single call predicted above this is not attempted
 * @param {number} p.reps       calls per size
 * @param {number} [p.minMs]    medians below this carry no slope information
 * @returns {boolean}
 */
export function shouldMeasureNext({ done, nextN, elapsedMs, budgetMs, slowMs, reps, minMs = GROWTH_DEFAULTS.minMs }) {
  if (elapsedMs >= budgetMs) return false;
  if (!done.length) return true;
  const last = done[done.length - 1];
  if (last.ms >= slowMs) return false;
  // Local slope from the last two timeable sizes, clamped: below 1 would under-predict once real
  // work starts to dominate, above 3 would stop cubic solutions before they show a trend.
  let slope = 1;
  const prev = done[done.length - 2];
  if (prev && prev.ms >= minMs && last.ms >= minMs) slope = Math.log2(last.ms / prev.ms) / Math.log2(last.n / prev.n);
  slope = Math.min(3, Math.max(1, slope));
  const predicted = Math.max(last.ms, minMs) * (nextN / last.n) ** slope;
  return predicted < slowMs && elapsedMs + predicted * reps <= budgetMs;
}

/** Words for a bucket as the console shows it. */
export const BUCKET_LABEL = {
  sublinear: 'below linear (about constant or log n)',
  linear: 'about linear (n or n log n)',
  quadratic: 'about quadratic (n^2)',
  cubic: 'cubic or worse (n^3 or more)',
  exponential: 'explosive (exponential or a high power)',
};

const fmtN = (n) => n.toLocaleString('en-US');

/**
 * The console text for an estimate: a headline and a one-line note on what it means.
 * @param {GrowthEstimate} est
 * @param {{ n: string }} growth the problem's growth spec (what n counts)
 * @returns {{ headline: string, note: string }}
 */
export function describeGrowth(est, growth) {
  const target = `target ${est.target}`;
  let headline;
  if (est.verdict === 'inconclusive') {
    headline = `Growth estimate: inconclusive (${est.reason}), ${target}.`;
  } else if (est.verdict === 'matches') {
    const better = rank(est.bucket) < rank(est.targetBucket);
    headline = `Growth estimate: ${BUCKET_LABEL[est.bucket]} (${target}): ${better ? 'matches, even faster than the target' : 'matches'}.`;
  } else {
    headline = `Growth estimate: ${est.atLeast ? 'at least ' : ''}${BUCKET_LABEL[est.bucket]}, ${target}: slower than target.`;
  }
  const pts = est.points;
  const range = pts.length >= 2 ? ` on n = ${fmtN(pts[0].n)} to ${fmtN(pts[pts.length - 1].n)}` : '';
  const note = `An estimate from timing your accepted code${range} (n = ${growth.n}), not a proof. Timing cannot separate n from n log n, so both read as linear.`;
  return { headline, note };
}

/**
 * What is wrong with a problem's `growth` spec, as messages (empty when it is valid or absent).
 * Checks the shape only; tests/growth-solutions.test.js runs `input` and checks its output.
 * @param {{ id: string, growth?: any }} problem
 * @returns {string[]}
 */
export function validateGrowth(problem) {
  const g = problem.growth;
  if (g === undefined) return [];
  const errs = [];
  const where = `${problem.id}.growth`;
  if (!g || typeof g !== 'object') return [`${where} must be an object`];
  if (!(g.target in GROWTH_TARGETS)) errs.push(`${where}.target "${g.target}" is not one of ${Object.keys(GROWTH_TARGETS).join(', ')}`);
  if (typeof g.n !== 'string' || !g.n) errs.push(`${where}.n must say what n counts (e.g. 'nums.length')`);
  if (typeof g.input !== 'function') errs.push(`${where}.input must be a function (n, seed) => args`);
  const sizes = g.sizes;
  if (!Array.isArray(sizes) || sizes.length < 4) errs.push(`${where}.sizes needs at least 4 sizes`);
  else {
    if (!sizes.every((n) => Number.isInteger(n) && n >= 1)) errs.push(`${where}.sizes must be positive integers`);
    if (!sizes.every((n, i) => i === 0 || n > sizes[i - 1])) errs.push(`${where}.sizes must be strictly ascending`);
    if (sizes[sizes.length - 1] / sizes[0] < 8) errs.push(`${where}.sizes must span at least a factor of 8`);
  }
  if (g.inconclusiveOk !== undefined && typeof g.inconclusiveOk !== 'boolean') errs.push(`${where}.inconclusiveOk must be a boolean`);
  return errs;
}

/**
 * Seed for the input of size n: fixed per size, so a growth run is reproducible (invariant 5).
 * @param {number} n
 */
export function growthSeed(n) {
  return (n * 2654435761) >>> 0;
}
