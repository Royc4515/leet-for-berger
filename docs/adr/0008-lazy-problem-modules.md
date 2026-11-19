# ADR 0008: Load problem modules only when a problem opens

Status: accepted (2026-11-19)

## Context

`src/js/problems/index.js` imported all 145 `problems/<id>/problem.js` modules statically, so the
dashboard (`#/`) could not render until every module had downloaded and run. Each module builds
its 10 hidden tests at import time: seeded generators at maximum constraints plus the reference
solution for every expected value. Measured on the live site: the problem list appeared after
about 12.4 s, almost all of it one 12.4 s main-thread task, after 205 requests and 745 KB of
gzipped JavaScript. Locally (Chromium, `npm run dev`) the dashboard was ready after 13.9 to 15.2 s
with a 13.4 to 14.7 s longest task. The Min Stack generator fix (O(n^2) to O(n)) only took the
worst offender out; the cost grows with every problem added.

ADR 0001 said to revisit the no-build decision when first-load JavaScript passes about 150 KB.
It passed that several times over, but nearly all of it is problem modules no listing view needs.
A bundler would minify them; it would not stop the dashboard from running 1,450 test generators.

## Decision

1. **A generated catalog.** `scripts/content/build-catalog.mjs` imports every problem once at
   content time and writes `src/js/problems/catalog.js`, one line per problem: id, title,
   difficulty, topics, status (`available` or `planned`), kind (`function`, `class`, `sql`) and the
   languages that run in the browser. It is a JS module rather than JSON so it imports
   synchronously in the browser and in Node without import attributes or a fetch. Existing entries
   keep their order (the dashboard lists them in catalog order); planned entries live in the
   generator.
2. **Lazy problem modules.** `problems/index.js` exports `catalog`, `catalogEntry(id)`,
   `availableEntries()`, `loadProblem(id)` (dynamic `import()` plus hydration, memoised, rejects
   for ids outside the catalog before any import path is built) and `loadAllProblems()` for tests,
   the verifier and scripts. Hydration moved to `problems/hydrate.js`, loaded together with the first
   problem, so `index.js` no longer imports codegen, adapters or the SQL engine.
3. **Views read the catalog.** Dashboard, learning path, companies, the modes hub and the mock OA
   and battle setups list problems from catalog entries. The workspace route and the interview and
   battle starts await `loadProblem`; interview and battle create their sessions only after the
   problems have loaded, so download and test-building time never counts against the clock. Async
   views guard against resolving after cleanup and show a loading state, and a failed import shows
   "Could not load" without a console error.
4. **Guards.** `tests/catalog.test.js` fails when the catalog is stale (an entry that differs from
   its module, a directory missing from the catalog). `tests/solutions.test.js` asserts it verified
   as many problems as there are directories. `tests/suite-snapshot.test.js` hashes every problem's
   15 cases, so this change provably moved no test. The e2e test asserts the dashboard fetches no
   problem module and opening a problem fetches exactly one, and logs the ready time against a
   4000 ms budget.

## Consequences

- The dashboard is ready in about 0.3 s locally with no long task, and fetches 0 of the 145
  problem modules. Opening a problem costs one module (plus `hydrate.js` once); its tests still
  build at import, now on demand and for one problem only.
- Adding a problem has one more step: run `node scripts/content/build-catalog.mjs`. Forgetting it
  fails `tests/catalog.test.js` and `tests/solutions.test.js`, never silently.
- Tests and scripts that need every problem call `await loadAllProblems()`.
- Still no build step (ADR 0001 stands). The remaining first-load JavaScript is the app shell and
  the views; `main.js` still imports the workspace (and through it the runners and codegen)
  statically. Lazy views are the next step if the shell grows, not a bundler.
