# ADR 0004: Empirical complexity feedback

- Status: accepted
- Date: 2026-11-18

## Context

Until now the only complexity check was a time budget: max-size hidden tests make a naive solution time out. A solution that passes all 15 cases says nothing about how it scales, and an O(n^2) answer on a problem whose limits are too small to catch it is Accepted without comment. We want honest feedback after Accepted: how does the run time grow with input size, and does that match the problem's target? The site is static (ADR 0001), so the measurement has to run in the browser, and CI has to prove that every declared target is right.

## Decision

1. **Problem format.** A problem may declare `growth: { target, n, sizes, input, inconclusiveOk? }` (docs/PROBLEM_FORMAT.md). `input(n, seed)` builds a full argument list of size n with `mulberry32(seed)` (seed = `growthSeed(n)`, fixed per size, invariant 5), shaped to hit the target's worst case. Design classes take an operation sequence of n calls. SQL problems do not declare it. `growth` stays in `problem.js` only: the database export reads named fields and never sees the function.

2. **Pure estimator** (`src/js/engine/growth.js`, no DOM, no clock). Input: timed samples `{ n, ms, timedOut? }`, several calls per size. Steps:
   - per size, the median of its calls and the spread of that median (MAD-based); medians under 1 ms are dropped (Chrome worker timers are 0.1 ms, and sub-millisecond calls are overhead);
   - with 5 or more sizes, one clear outlier (more than 41% off the line while the rest fit within 10%) is dropped: a JIT tier-up or a stray collection spoils one size, a real change of growth bends several;
   - with exactly 4 sizes (common, since the run stops before slow sizes), one interior outlier may be dropped under a stricter rule: the other 3 must fit within about 7% (log2 rms 0.1). The first and last sizes are never dropped at 4 sizes, because a slow last size can be growth setting in. Each candidate is judged against the line through the other sizes, not one pulled toward it (amended 2026-11-18: one slow middle size used to turn an honest linear run into "timings too noisy");
   - least-squares slope of log(time) against log(n) over the **largest 4** timeable sizes (at least 3, spanning at least 4x). Small sizes carry call overhead, a linear term under a quadratic one: a splice-based quadratic measured 1.54, 2.1, 2.05 per doubling;
   - trusted range: slope +- max(0.15, 2 standard errors), the standard error being the larger of the residual one and the one implied by each size's own spread;
   - buckets by slope: `sublinear` < 0.5 <= `linear` < 1.6 <= `quadratic` < 2.5 <= `cubic` (or worse polynomial) < 4.5 <= `exponential`;
   - verdict: `matches` when the whole trusted range is at or below the target's bucket, `slower than target` when it is entirely above, `inconclusive` otherwise, and also when times are too small, too few sizes finished, the points do not lie on a power law (rms residual > 0.35 in log2), or a size's calls disagree by more than about 50%;
   - a timeout (a call killed by the watchdog) gives a lower bound on the slope from the last finished size; if that bound alone exceeds the target bucket, the verdict is `slower than target` with `atLeast`.

   Buckets are coarse on purpose. Over the sizes we can afford, n log n differs from n by a slope of about 0.1, less than timing noise, so both are "linear". The linear/quadratic boundary sits at 1.6, not halfway at 1.5, because measured linear JavaScript reads 1.0 to 1.4 at large n (cache misses and garbage collection grow with the heap) while quadratic code reads 1.95 to 2.1.

3. **Browser run.** After an Accepted Submit in JavaScript or Python, in practice mode (not interview or battle, where the clock runs), the workspace calls `WorkerRunner.measureGrowth` on the same worker type and adapter path as judging. The verdict is rendered first; timing starts two frames later. Sizes go up in order; each is built on the main thread (`input(n, seed)`), posted as `{ n, args }`, and the worker times `reps` calls (5 in JavaScript, 3 in Python) with `performance.now()` around the call only: copying, JSON-to-object conversion (`__lfb_prepare` in the adapter) and a "settle" step happen before the clock. The run stops before a size that `shouldMeasureNext` predicts to be slow (over 1 s per call) or over the 5 s budget, so a quadratic solution never reaches the largest inputs. A watchdog kills a call that exceeds 2 s and records a timeout. Navigating away or starting another run cancels it (the view's cleanup function). No expected value exists for these inputs, so nothing of the kind reaches the worker (invariant 2 holds trivially), and the inputs are not hidden tests.

   Settle: building 10^5 tree nodes right before the call left them in the young generation, and the timed call paid to promote them: a BFS over 512k nodes read 1.4 instead of 1.0. For object inputs the worker allocates `min(2n, 10^6)` short-lived arrays before starting the clock.

4. **Console line.** One plain-text block under the verdict, in the console's live region: a headline and a note.
   - `Growth estimate: about linear (n or n log n) (target n log n): matches.`
   - `Growth estimate: about quadratic (n^2), target n log n: slower than target.`
   - `Growth estimate: inconclusive (too close to call), target n.`
   - note: `An estimate from timing your accepted code on n = 64,000 to 512,000 (n = nums.length), not a proof. Timing cannot separate n from n log n, so both read as linear.`
   A user's code that throws on a larger generated input shows `Growth estimate: unavailable (the code failed on a larger generated input).` with the first error line.

5. **Verifier.** `tests/growth-solutions.test.js` checks every problem with `growth`: the spec is valid; `input` is deterministic and gives the signature's arity; the shipped JavaScript solution agrees with the reference on the smallest growth input (the generator stays inside the problem's rules); and the shipped solution measures `matches` (or `inconclusive` when the problem sets `inconclusiveOk: true`). It runs the same compile, adapter split, settle and estimator as the browser (`scripts/verify/growth.mjs`), with 7 calls per size, a time-based JIT warmup (300 ms), and a forced full collection before each problem so the previous problem's garbage is not billed to the next one. A measurement that is not conclusive is retried up to 3 times: noise does not repeat, a real mismatch does. A deliberately quadratic Pair Sum Target must measure `slower than target`. CI runs it in the javascript verify job, alone. Each problem is checked in its own worker thread that loads only that problem, as the browser's worker does (amended 2026-11-20: the test process used to load every problem first, which kept about 1.5 GB alive, and a full collection of that heap takes 0.7 s; its steps inside timed calls put jumps into straight curves, so Product Except Self failed 3 attempts in a row).

## Evidence

- Synthetic (tests/growth.test.js, 400 runs per case, +-30% noise per call, 5 calls per size): zero wrong verdicts. Linear and n log n against a linear target: no "slower"; quadratic against linear: no "matches", at least 80% "slower". At 50% noise still zero wrong verdicts, about half inconclusive. Constant overhead never makes quadratic code match linear. Random times are never called slower.
- Node, verifier alone (5 runs, 50 measurements): all 10 pilots `matches`, one needed a retry. Shipped slopes: 0.9 to 1.3 for linear and n log n targets, 1.94 to 1.98 for Zero Triplets (n^2). Negative control: 1.99 to 2.04. Measuring takes about 22 s for the pilot; loading the catalog adds about 25 s that every test file pays.
- Node under load (`npm test` with 2 to 8 languages verifying in parallel): one failure in the first full run, Zero Triplets, whose n = 1000 read 3x slow in all three attempts (a JIT artifact, not noise). Its ladder now goes to 16000 so the top-4 window starts at 2000; the next loaded run passed with no retry.
- Node, stage F3 batch 1 (30 problems, worker per problem): all 30 `matches` on the first attempt in two consecutive runs, 64 to 70 s for the file; the same file with every problem loaded in one process needed retries on 4 problems and failed one.
- Chromium (Playwright): all 10 pilots `matches` in JavaScript and in Python (Pyodide); the splice-based Median Stream (Accepted, quadratic) read `slower than target` 8 of 8 times. Each estimate takes 0.4 to 5 s after the verdict.

## Alternatives considered

- **Operation counting** (instrumenting user code): exact, but needs a parser per language and changes what runs. Timing measures the real code.
- **Fine classes (n vs n log n)**: not separable by timing at sizes a browser can afford. Claiming them would be dishonest.
- **Fitting `c + a * n^k`**: three parameters on four or five noisy points is unstable. The top window does the same job (keep overhead out) with one parameter.
- **Interleaving sizes** to spread load bursts: each small call then paid for the garbage of the large call before it.

## Consequences

- Sizes go beyond the statement's limits when needed (a linear pass needs about 10^6 elements to take measurable milliseconds); values stay within the value constraints. A solution that relies on the length limit (a fixed-size buffer) gets "unavailable", not a wrong verdict.
- The estimate is an estimate. It can be inconclusive on a busy machine; it never upgrades n log n to n or the reverse.
- TypeScript gets the JavaScript estimate: it is timed as its transpiled JavaScript in the same worker. Java, C++, C, C# and Go get no estimate in the browser; they will with the server runner (ROADMAP Phase 2), which can reuse the estimator unchanged.
- Adding `growth` to a problem needs no engine change: see the checklist in docs/PROBLEM_FORMAT.md.
