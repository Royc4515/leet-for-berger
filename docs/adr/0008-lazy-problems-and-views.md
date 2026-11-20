# ADR 0008: Load problems and views when they are opened

Status: accepted (2026-11-19)

## Context

The problem list took 12-13 s to appear (headless Chromium on a 4 vCPU Xeon, live and local; about 10-18 s on the owner's machine), almost all of it one main-thread task.

- Every `problems/<id>/problem.js` builds its 10 hidden tests when it is evaluated. That means running seeded generators and the reference solution at the maximum constraints, often n = 10^5.
- `problems/index.js` imported all 145 problem modules so it could offer a synchronous `catalog`, `getProblem()` and `availableProblems()`.
- The dashboard imports `problems/index.js`, so every page load ran 145 test builds (12.4 s of scripting) and downloaded 145 modules (474 KB gzip).
- `main.js` also imported every view statically, which pulled the workspace and the whole engine (codegen, adapters, runners, the remote-runner program builders) into the first load. The module chain was 7 levels deep, which costs round trips on a cold load from Israel.

ADR 0001 accepted "no code splitting" while first-load JS stayed under about 150 KB. It had reached about 745 KB.

Measured on a prototype (local server, cold cache, +100 ms latency at 10 Mbps in brackets):

| | Ready | Longest task | Requests |
|---|---|---|---|
| Before | 12.8 s (17.3 s) | 12.5 s | 205 |
| Catalog + problems on demand | 0.14 s (1.4 s) | < 50 ms | 60 |
| + views on demand | 0.10 s (0.72 s) | < 50 ms | 29 |

## Decision

1. **A generated catalog.**
   - `src/js/problems/catalog.js` holds what listing views read: `id`, `title`, `difficulty`, `topics` and `sql`.
   - `scripts/content/build-catalog.mjs` writes it from the problem modules.
   - `tests/catalog.test.js` fails when it is stale or misses a problem folder.
   - It is a JS module, not JSON, so `catalog` stays synchronous for the dashboard, path and modes.
2. **Problems load on demand.**
   - `loadProblem(id)` imports one module and hydrates it, memoised per page. Only ids in the catalog reach `import()`.
   - `catalogEntry(id)` gives metadata without loading.
   - `loadAllProblems()` is for tests, the verifier and scripts.
   - Hydration (`problems/hydrate.js`) and solution URLs (`problems/solutions.js`) moved out of `index.js`, so the dashboard never loads the code generators.
3. **Views load on demand.**
   - `main.js` imports only the dashboard. The other routes `import()` their view.
   - The cleanup a route returns is valid before the view arrives: leaving mid-load cancels the render, so a late view never mounts over the next one.
   - The essential path loader moved to `ui/path-loader.js`, so the dashboard does not import the Learning Path view.
4. **Timed sessions load their problems before the clock starts.** Mock OA, interview and battle await `loadProblem` before creating the session, so loading never costs session time.

## Alternatives rejected

- **A lazy `hiddenTests` getter only, keeping the static imports.**
  - It fixes the CPU cost but still downloads every problem module, and that grows with the bank.
  - It is still worth doing for the cost of opening one problem (follow-up). Note that `hydrate()` spreads the module, which would invoke a getter, so it must copy property descriptors instead.
- **Splitting each problem into meta and tests files.** That means 290 files, and the dashboard would still fetch 145 of them unless they were combined: the catalog again.
- **Precomputing expected values into JSON.** Several MB per heavy problem, and the reference would stop being the source of truth.
- **Caching built suites in IndexedDB.** User code runs in a same-origin worker that can read IndexedDB, so it could read the expected values (invariant 2).
- **A bundler.** It would save about 0.3 s more at high latency, at the cost of ADR 0001's "the file in the diff is the file that runs". Revisit if a cold load from Israel stays above 1.5 s, or the bank passes about 500 problems.

## Consequences

- Adding, removing or renaming a problem, or changing its title, difficulty or topics, needs `node scripts/content/build-catalog.mjs`. The catalog test says so when it is forgotten.
- Opening a problem now pays for that one problem's tests: about 0.1 s typically, up to 0.9 s for the heaviest (word-morph). A lazy `hiddenTests` getter and faster references for the heaviest problems are the follow-ups (docs/PLAN.md).
- The startup graph is checked by `tests/catalog.test.js`: no problem module, no non-dashboard view and no engine module is imported statically from `main.js`. `e2e/smoke.mjs` checks the same in the browser and that opening a problem requests exactly one problem module.
- Problem modules and their test generation are unchanged, so hidden tests stay byte-identical and deterministic (invariant 5).
