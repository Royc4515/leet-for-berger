# Leet-For-Berger

Interactive coding assessment platform in the spirit of LeetCode and HackerRank: a Monaco editor, a 15-case test harness, a structured learning path, and timed Interview / Battle / AI Mentor modes.

Static single-page app. Vanilla ES modules, no build step, deploys to GitHub Pages as-is.

## Quick start

```bash
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run test:e2e     # browser smoke test (needs: npx playwright install chromium)
```

No install is needed to run the app; `npm install` only pulls Playwright for the e2e test.

## What is in v0.1

| Area | Status |
|---|---|
| Workspace: description, Monaco (vs-dark), console, resizable splits | done |
| 15-case harness: 5 detailed + 10 hidden, per-case time limit, verdicts | done |
| JavaScript and Python execution in the browser (Web Worker, Pyodide) | done |
| Languages | 8: Python, JavaScript, TypeScript, Java, C++, C, C#, Go. Starter code generated from a typed signature; every solution verified in CI. JavaScript, TypeScript and Python run in the browser, the rest are editor-only until the server runner |
| Problem bank, filters, progress (solved, streak, accuracy) | done |
| Learning Path, 4 milestones | done |
| Interview Simulator (45 min, lockdown, report) | done |
| 1v1 Battle | bot opponent; live peers need a backend |
| AI Mentor | scripted Socratic hints; LLM needs a backend proxy |

Full plan: [docs/ROADMAP.md](docs/ROADMAP.md).

## Featured problem: Smallest Base Segment

Given a non-empty string `s`, return the shortest `t` such that `s` is `t` repeated `k >= 1` times. Optimal solution: KMP prefix function, O(n). The smallest period is `n - pi[n-1]`, and it is the answer only if it divides `n` (`"ababa"` returns itself).

## Working on it with Claude Code

`CLAUDE.md` is the operating manual: commands, architecture map, invariants, conventions and definition of done. Project commands:

- `/add-problem <id>`: author a problem end-to-end with tests and solutions in 8 languages
- `/verify`: full check before committing

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Problem format](docs/PROBLEM_FORMAT.md)
- [Content: index, ladders, families, audit](content/README.md)
- [Roadmap](docs/ROADMAP.md)
- [ADR 0001: no build step](docs/adr/0001-no-build-step.md)
- [ADR 0002: PostgreSQL on Supabase, git as content source](docs/adr/0002-postgres-supabase.md)
- [ADR 0003: SQL problems on sql.js](docs/adr/0003-sql-problems.md)

## Deploy

Push to `main`. `.github/workflows/pages.yml` publishes `index.html` + `src/` to GitHub Pages (enable Pages with source "GitHub Actions" once in the repo settings). CI runs unit + e2e tests on every push and PR.
