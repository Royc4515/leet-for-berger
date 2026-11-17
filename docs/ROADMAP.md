# Roadmap

Status legend: [x] done, [~] partial / placeholder, [ ] not started.

## Phase 0 - Core platform (v0.1.0, this release)

- [x] Split workspace: description | Monaco (vs-dark) + console, both axes resizable (mouse + keyboard), persisted
- [x] 15-case harness: 5 detailed + 10 hidden, per-case watchdog, compile / runtime / TLE verdicts
- [x] Custom test input (Run only, validated, reference-computed expected)
- [x] Run Code / Submit / Reveal Solution (confirm + "assisted" flag)
- [x] JavaScript execution (Web Worker), Python execution (Pyodide), Java editor-only
- [x] Problem bank with difficulty / topic / search filters, planned problems visible
- [x] Progress: solved, streak, accuracy, submissions (localStorage)
- [x] Learning Path: 4 milestones, progress derived from solves
- [x] Interview Simulator: 45 min, lockdown, tab-switch log, scored report
- [~] 1v1 Battle: bot opponent with live progress; peers need Phase 3
- [~] AI Mentor: scripted Socratic hints; LLM needs Phase 3
- [x] Unit tests + Playwright smoke test + CI + Pages deploy

## Phase 1 - Content

Scope: every classic topic and every commonly asked company problem, with an easy on-ramp, in all common interview languages (Python, Java, C++, JavaScript; C# and Go as extras). Core bank: 552 problems in two waves, on a learning network of 26 topics with an Easy -> Hard ladder per topic (225 problems). See `content/README.md`.

- [x] Topic taxonomy: prerequisites, concepts per topic, ladder targets, practice modes (`src/js/data/taxonomy.js`)
- [x] Problem index: 3,398 problems with topic, rating, company frequency and recency, priority (`content/index/problems.json`)
- [x] Select per-topic ladders from the index and assign concepts (`content/ladders.json`)
- [x] Review `content/AUDIT.md`: core bank of 552 (waves), Matrix topic, 0 audit gaps
- [ ] Problem families: group near-identical problems, pick the version each company asks
- [ ] Language-neutral problem format: typed signature spec, JSON tests, generated starter code and harness per language
- [ ] Multi-language verifier in CI (Python, Java, C++, JavaScript)
- [ ] SQL runner (e.g. sql.js) so the SQL topic can ship
- [ ] Author problems topic by topic, tier 0 first; 15 tests each, solutions in 3 languages
- [ ] Replace the 4 hand-picked milestones with paths derived from the taxonomy
- [ ] Practice modes on top of the index: topic drill, mixed review, mock OA, company set, daily, weak spots
- [ ] Problem editorial view (unlocked after solve)
- [ ] Per-problem submission history in the workspace
- [ ] Interview mode picks 2 problems by difficulty mix once the bank allows it

## Phase 2 - Server runner (needs a backend, moved up: Java and C++ are required languages)

- [ ] Execution service (e.g. Judge0 self-hosted or containerized runners) with the same `run()` contract
- [ ] Java execution
- [ ] Hidden tests and solutions served from the server only; real "secure reveal"
- [ ] Rate limiting and resource caps per submission

## Phase 3 - Accounts and live features

- [ ] Auth + server-side progress (migrate `lfb:progress:v1`)
- [ ] `RemoteMentor` behind `/api/mentor` (LLM key server-side, Socratic system prompt already in repo)
- [ ] Real-time Battle: WebSocket rooms, `RemoteOpponent`, server-side judging
- [ ] Interview analytics history and trends

## Open decisions

- Backend stack (Supabase + edge functions vs. small Node service). Write an ADR before Phase 2.
- Whether to adopt TypeScript once the codebase passes ~5k lines (JSDoc types today).
