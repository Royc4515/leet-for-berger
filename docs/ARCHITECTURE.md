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
| Java | `UnsupportedRunner` | n/a | honest "not supported yet" verdict |

Adding a language = a worker (or remote runner) implementing the protocol in `worker-runner.js` + an entry in `runners/index.js` + starter code and solution in each problem.

## State

- `state/progress.js`: pure reducers (`recordSubmission`, `markRevealed`, `computeStreak`, `stats`) + a tiny observable store persisted to `localStorage` key `lfb:progress:v1`. Versioned: an unknown version resets instead of crashing.
- `state/drafts.js`: per-problem, per-language code drafts in separate keys so autosave never rewrites the progress blob.
- Sessions (interview, battle) keep drafts in memory so a timed attempt never starts from practice code.

Streak = consecutive local days with an accepted submission, ending today or yesterday. Accuracy = accepted / total submissions. Runs never count.

## Routing

Hash routes (`#/`, `#/problem/:id`, `#/path`, `#/modes`, `#/interview`, `#/battle`) so Pages needs no rewrite rules. Each render returns a cleanup; the router always calls the previous cleanup before rendering.

## Modes

- **Interview** (`modes/interview.js` + `ui/views/modes.js`): pure session (timer from `startedAt`, attempts, tab switches, score). View applies lockdown: hides nav (`body.lockdown`), disables reveal and mentor, logs `visibilitychange`, guards `beforeunload`. Score = coverage x 90 + speed bonus (max 10, only if something was solved) - 5 per tab switch (max 20).
- **Battle** (`modes/battle.js`): seeded bot whose test count climbs in steps. `Opponent` contract (`name`, `passedAt(elapsedMs)`) is what a future `RemoteOpponent` implements.
- **Mentor** (`mentor/mentor.js`): provider contract `reply(ctx) -> Promise<string>`. `ScriptedMentor` walks `problem.hints` and reacts to the last failing visible case. `RemoteMentor` posts to `/api/mentor` (backend not built yet).

## Editor

Monaco 0.52.2 from jsDelivr via the AMD loader. Cross-origin language workers are created through a same-origin `data:` URL shim (`MonacoEnvironment.getWorkerUrl`), marked `don't touch`. If Monaco fails to load within 12s, a textarea fallback with the same interface takes over and a toast says so.

## Security model (current, static)

- User code: sandboxed in Web Workers (no DOM, killable). Not a security boundary against a determined user reading the bundle, and does not need to be: it is their own browser.
- Hidden tests and solutions are in the bundle. Fine for practice, not for hiring-grade assessment. Phase 2 moves judging and solutions server-side.
- All user-facing strings render as text nodes.
