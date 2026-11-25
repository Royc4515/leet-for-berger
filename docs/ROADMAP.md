# Roadmap

Phase checklist. The living plan, with stages and the decision log, is [`PLAN.md`](PLAN.md); this file was last checked against it on 2026-11-24.

Status legend: [x] done, [~] partial / placeholder, [ ] not started.

## Phase 0 - Core platform (v0.1.0)

- [x] Split workspace: description | Monaco (vs-dark) + console, both axes resizable (mouse + keyboard), persisted
- [x] 15-case harness: 5 detailed + 10 hidden, per-case watchdog, compile / runtime / TLE verdicts
- [x] Custom test input (Run only, validated, reference-computed expected)
- [x] Run Code / Submit / Reveal Solution (confirm + "assisted" flag)
- [x] JavaScript execution (Web Worker), Python execution (Pyodide); Java, C++, C, C# and Go later ran on the remote runner (Phase 2)
- [x] TypeScript execution: Monaco's TypeScript service type-checks and transpiles, the JavaScript worker runs it; type errors are a Compile Error, as on LeetCode
- [x] Problem bank with difficulty / topic / search filters, planned problems visible
- [x] Progress: solved, streak, accuracy, submissions (localStorage)
- [x] Learning Path: 4 milestones, progress derived from solves
- [x] Interview Simulator: 45 min, lockdown, tab-switch log, scored report
- [~] 1v1 Battle: bot opponent with live progress; peers need Phase 3
- [~] AI Mentor: scripted Socratic hints; LLM needs Phase 3
- [x] Unit tests + Playwright smoke test + CI + Pages deploy

## Phase 1 - Content

Scope: every classic topic and every commonly asked company problem, with an easy on-ramp, in the 8 common interview languages (Python, JavaScript, TypeScript, Java, C++, C, C#, Go). Core bank: 596 distinct problems (711 entries including versions) in two waves (company-specific versions of 92 problem families, Israeli companies, Codility lessons), on a learning network of 26 topics with an Easy -> Hard ladder per topic (225 problems). See `content/README.md`.

- [x] Topic taxonomy: prerequisites, concepts per topic, ladder targets, practice modes (`src/js/data/taxonomy.js`)
- [x] Problem index: 3,398 problems with topic, rating, company frequency and recency, priority (`content/index/problems.json`)
- [x] Select per-topic ladders from the index and assign concepts (`content/ladders.json`)
- [x] Review `content/AUDIT.md`: core bank of 552 (waves), Matrix topic, 0 audit gaps
- [x] Problem families: 79 families, company version picking, company versions in the core bank (579)
- [x] More sources: second tag dataset, Top Interview 150, Codility lessons, Israeli companies (tags + candidate reports)
- [x] Topic + subtopic for every core problem, secondary topic tags
- [ ] CodeSignal / HackerRank question data: none public; revisit if a source appears
- [x] Original problem for the monday.com tasks: Notify Recipients
- [x] Solution verifier for JavaScript, Python and Java in CI (`tests/solutions.test.js`)
- [ ] Original problems for remaining reported tasks (JFrog connection pool, Payoneer multithreaded logger: concurrency, needs a runner that supports threads)
- [x] Essential path: 131 problems, one per subtopic; the rest is optional practice
- [x] Language-neutral problem format: typed signature, generated starter code, solution files per language
- [x] 8-language verifier in CI (Python, JavaScript, TypeScript, Java, C++, C, C#, Go)
- [x] Signature types for linked lists and trees, class-based design problems (pilots: Reverse List, Level Order, Min Stack)
- [x] Signature types for lists with random or cycle pointers and nested lists, judge mode for random answers (List Loop, Random Link Copy, Nested Flattener, Random Pool)
- [ ] Signature types for graphs as node objects (Clone Graph)
- [x] Author the 131 essential problems: all 131 done, each verified (8 languages, or SQL). New problems start from imported open-source solutions (`npm run import:solutions`)
- [~] Complexity feedback: after Accepted (JavaScript, TypeScript, Python), time the code on growing inputs and compare the growth to the target (ADR 0004); 10 pilot problems declare `growth`, CI checks their targets. Next: `growth` for the remaining algorithm problems (checklist in docs/PROBLEM_FORMAT.md), other languages with the server runner, LLM explanation with the backend
- [x] SQL runner: sql.js (SQLite wasm) in a worker and in the CI verifier, ADR 0003; first 5 SQL problems
- [ ] Author problems topic by topic, tier 0 first; 15 tests each, solutions in 3 languages
- [x] Replace the 4 hand-picked milestones with paths derived from the taxonomy (essential path, [PR #12](https://github.com/Royc4515/leet-for-berger/pull/12))
- [~] Practice modes on top of the index: mock OA ([PR #13](https://github.com/Royc4515/leet-for-berger/pull/13)), daily and weak spots ([PR #14](https://github.com/Royc4515/leet-for-berger/pull/14)), company sets done; topic drill and mixed review not yet
- [x] Problem editorial view: solution walkthrough unlocked after solving ([PR #15](https://github.com/Royc4515/leet-for-berger/pull/15))
- [x] Per-problem submission history in the workspace ([PR #15](https://github.com/Royc4515/leet-for-berger/pull/15))
- [ ] Interview mode picks 2 problems by difficulty mix once the bank allows it

## Phase 2 - Server runner (needs a backend, moved up: Java and C++ are required languages)

- [x] ADR 0002: PostgreSQL on Supabase, schema (`db/schema.sql`), git -> database sync (`scripts/db/export-sql.mjs`), verified by `scripts/db/check-schema.sh` in CI
- [x] Create the Supabase project and apply the schema (accounts are live)
- [ ] Run the git -> database content sync from CI on merge to main (deferred, see `PLAN.md`)

- [x] Execution service with the same `run()` contract: self-hosted Piston on an Oracle Always Free Arm VM behind a Cloudflare Worker, $0 (ADR 0005). Code, Worker, VM kit and deploy guide done (`docs/DEPLOY_RUNNER.md`)
- [x] Create the Oracle and Cloudflare accounts, run `deploy/piston/setup.sh`, deploy the Worker, set the URL in `src/js/config.js` (owner steps in `docs/DEPLOY_RUNNER.md`)
- [x] Java, C++, C, C# and Go execution in practice mode via the remote runner (judged in the browser; versions match CI: Java 21, .NET 8, Go 1.23; GCC 12 for C11 and C++17)
- [ ] Remote languages in interview and battle (needs server-side judging, Phase 3)
- [ ] Growth estimates for the remote languages (server-side timing)
- [ ] Hidden tests and solutions served from the server only; real "secure reveal"
- [x] Rate limiting and resource caps per submission (remote runner: per-IP limit in the Worker, time, memory, process and output caps in the gate and Piston)

## Phase 3 - Accounts and live features

- [x] Auth + server-side progress, migrating `lfb:progress:v1` on first sign-in ([PR #18](https://github.com/Royc4515/leet-for-berger/pull/18), ADR 0006); personal GitHub sync ([PR #20](https://github.com/Royc4515/leet-for-berger/pull/20), ADR 0007)
- [ ] `RemoteMentor` behind `/api/mentor` (LLM key server-side, Socratic system prompt already in repo)
- [ ] Real-time Battle: WebSocket rooms, `RemoteOpponent`, server-side judging
- [ ] Interview analytics history and trends
- [x] Notifications (`PLAN.md` F7): the rules, settings, draft edit times, the bell in the header, the streak rest day, and Web Push (ADR 0011): the hourly server, the service worker, notifications per device with the hours on a day dial, and the iPhone Home Screen guide

## Open decisions

- ~~Backend stack~~: decided in ADR 0002, PostgreSQL on Supabase with git as the content source of truth.
- Whether to adopt TypeScript once the codebase passes ~5k lines (JSDoc types today).
