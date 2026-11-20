# Architecture

## Goals that drive the design

1. **Runs as a static site** (GitHub Pages) until a backend is genuinely needed.
2. **Untrusted code never runs on the main thread.** An infinite loop must cost one worker, not the tab.
3. **Judging is pure and testable.** Execution and judging are separate, so the same harness will later judge server-side runs.
4. **Every mode reuses one workspace.** Interview and Battle wrap it with a `session`; they do not fork it.

## Execution flow (Run / Submit)

```
Workspace.execute(kind)
  -> problem.parseCustomInput()            (Run only, if enabled)
  -> harness.buildSuite(problem, custom)   15 cases: {id, visible, custom, args, expected}
  -> runner.run({code, entry, cases:[{id,args}], timeLimitMs})
        WorkerRunner
          posts {type:'run'} to worker     (no expected values)
          per-case watchdog: timer re-armed after every case result
          timeout -> worker.terminate(), case = timeout, rest = skipped
  -> harness.judge(suite, raw)             pass/fail per case, verdict, hidden redaction
  -> results.renderResult()                5 detailed tabs + 10 hidden pills
  -> store.update(recordSubmission)        Submit + executable language only
  -> session.onResult()                    interview / battle hooks
```

### Why a per-case watchdog instead of one global timeout

A global budget makes the verdict ambiguous (which case hung?). Re-arming after every result attributes the TLE to the exact case and keeps the per-case limit meaningful for big hidden inputs.

### Runners

| Language | Runner | Lifecycle | Notes |
|---|---|---|---|
| JavaScript | `js-worker.js` | fresh worker per run | clean globals every run; boot is ~ms |
| Python | `py-worker.js` (Pyodide 0.27.2) | persistent, recreated after a kill | boot is seconds, so it warms up when Python is selected; watchdog starts only after `ready` |
| SQL | `sql-worker.js` (sql.js 1.13.0) | persistent, recreated after a kill | SQL problems only; fresh read-only SQLite database per case, results judged as result sets (ADR 0003) |
| TypeScript | `TypeScriptRunner` -> `js-worker.js` | fresh worker per run | type-checked and transpiled by Monaco's TypeScript service, then run as JavaScript with the JavaScript adapter (see below) |
| Java, C++, C, C#, Go | `RemoteRunner` when `src/js/config.js` has a URL, else `UnsupportedRunner` | one HTTP request per run | practice mode only; compiled and run by Piston on a free VM behind a Cloudflare Worker, judged in the page (ADR 0005) |

### TypeScript

TypeScript reuses the compiler Monaco already loads for the editor (its TypeScript language-service worker, TypeScript 5.4.5 in Monaco 0.52.2), so it costs no extra download. `ui/ts-compiler.js` puts the code in a throwaway model, reads its syntactic and semantic diagnostics, and asks for the emitted JavaScript; `engine/runners/ts-runner.js` runs that JavaScript in `js-worker.js` with the JavaScript adapter (`problem.adapters.typescript` is the JavaScript one). The runner gets the compiler injected, so it stays free of Monaco and is unit-tested with a fake.

- **Type errors.** A type error is a **Compile Error** (new verdict) and nothing runs, as on LeetCode. The flags are LeetCode's (`--strict false --alwaysStrict --strictBindCallApply --strictFunctionTypes`, support.leetcode.com "What are the environments for the programming languages?"), target ES2022 because Monaco's TypeScript has no ES2024. So an implicit `any` is fine, a wrong type is not. The editor uses the same options (`configureTypeScript` in `ui/editor.js`), so its squiggles show what a Submit rejects.
- **Line numbers.** The code is checked as a module: `export {};` is appended after it, never prepended, so diagnostic lines are the editor's lines. Being a module also keeps it from clashing with the editor's own model, a global script with the same declarations. Diagnostics are printed LeetCode-style: `Line 2: Char 9: error TS2322: ...`. Runtime errors show the message only, as for JavaScript.
- **Ambient types.** `ListNode`, `TreeNode`, `RandomListNode` and `NestedInteger` are declared to the checker as an extra lib (`AMBIENT_TYPES`, mirroring the TypeScript prelude in `engine/adapters.js`); the JavaScript adapter defines them at run time.
- **No Monaco.** With the textarea fallback there is no compiler: every case is "Language Not Supported Yet" with a message that TypeScript needs the editor to load. No other transpiler is downloaded.
- **Verification.** CI's TypeScript job also runs `tests/typescript.test.js`: every TypeScript solution must type-check with these options and ambient types, and its transpiled output must pass the 15 cases through the JavaScript adapter, the path the browser takes (the tsc harness checks the other path).

After an Accepted submit, the same JavaScript and Python workers (TypeScript through its transpiled JavaScript) also time the code on growing inputs (`measureGrowth`, protocol in `js-worker.js`; ADR 0004). The estimator is the pure `engine/growth.js`.

Adding a language = a worker (or remote runner) implementing the protocol in `worker-runner.js` + an entry in `runners/index.js` + starter code and solution in each problem.

### Remote runner (ADR 0005)

`RemoteRunner.run()` keeps the worker contract: it builds the language's test program with `engine/programs/build.js` (the exact program CI compiles), posts it with the 15 cases' args as stdin (gzip, no expected values) to the Cloudflare Worker, and maps Piston's `{compile, run}` answer to one RawResult per case with `mapResponse()`. The native programs mark each case on stderr and each result on stdout (`programs/output.js`), so a crash or a timeout is attributed to the case that caused it and the user's prints appear per case. Server unreachable, busy or rate limited throws `RemoteUnavailableError`: the console shows one line and nothing is recorded. Inside interview and battle, `getRunner(lang, { session: true })` returns the editor-only runner. Deployment: `docs/DEPLOY_RUNNER.md`.

## State

- `state/progress.js`: pure reducers (`recordSubmission`, `markRevealed`, `computeStreak`, `stats`) + a tiny observable store persisted to `localStorage` key `lfb:progress:v1`. Versioned: an unknown version resets instead of crashing.
- `state/drafts.js`: per-problem, per-language code drafts in separate keys so autosave never rewrites the progress blob.
- Sessions (interview, battle) keep drafts in memory so a timed attempt never starts from practice code.

Streak = consecutive local days with an accepted submission, ending today or yesterday. Accuracy = accepted / total submissions. Runs never count.

## Routing

Hash routes (`#/`, `#/problem/:id`, `#/path`, `#/modes`, `#/interview`, `#/battle`) so Pages needs no rewrite rules. Each render returns a cleanup; the router always calls the previous cleanup before rendering.

Only the dashboard is in the first load. Other views load with `import()` when their route opens, and a problem loads through `loadProblem(id)` (one module, hydrated, memoised); listing views read the generated `problems/catalog.js` instead. A problem module builds its hidden tests when evaluated, so importing all of them up front cost about 12 s per page load (ADR 0008). The cleanup a route returns is valid while its view is still loading: leaving mid-load cancels the render.

## Modes

- **Interview** (`modes/interview.js` + `ui/views/modes.js`): pure session (timer from `startedAt`, attempts, tab switches, score). View applies lockdown: hides nav (`body.lockdown`), disables reveal and mentor, logs `visibilitychange`, guards `beforeunload`. Score = coverage x 90 + speed bonus (max 10, only if something was solved) - 5 per tab switch (max 20).
- **Battle** (`modes/battle.js`): seeded bot whose test count climbs in steps. `Opponent` contract (`name`, `passedAt(elapsedMs)`) is what a future `RemoteOpponent` implements.
- **Mentor** (`mentor/mentor.js`): provider contract `reply(ctx) -> Promise<string>`. `ScriptedMentor` walks `problem.hints` and reacts to the last failing visible case. `RemoteMentor` posts to `/api/mentor` (backend not built yet).

## Editor

Monaco 0.52.2 from jsDelivr via the AMD loader. Cross-origin language workers are created through a same-origin `data:` URL shim (`MonacoEnvironment.getWorkerUrl`), marked `don't touch`. If Monaco fails to load within 12s, a textarea fallback with the same interface takes over and a toast says so.

## Security model (current, static)

- User code: sandboxed in Web Workers (no DOM, killable). Not a security boundary against a determined user reading the bundle, and does not need to be: it is their own browser.
- Hidden tests and solutions are in the bundle. Fine for practice, not for hiring-grade assessment. Phase 2 moves judging and solutions server-side.
- Remote runner (ADR 0005): untrusted code runs in Piston's isolate sandbox on a single-purpose VM with no network for jobs; the VM opens no inbound port (Cloudflare Tunnel); a shared secret known only to the Worker and the VM's gate; the page holds only the Worker's public URL.
- All user-facing strings render as text nodes.
