# Work plan (living)

Last updated: 2026-11-18. Owner: Roy.

A LeetCode-style practice platform for interviews and take-home tests, at $0. All 131 essential-path problems are verified in all 8 languages, every language runs on the live site, and the next stage is the practice experience. This file is open to change: every new decision goes into the decision log.

Live site: https://royc4515.github.io/leet-for-berger/

## Vision and principles

Goal: one place to prepare for a technical interview or take-home test, from easy to hard, in any common language, with trustworthy feedback. Audience: students and developers before interviews, including Israeli companies.

**What the user gets**
- **Essential path:** 131 problems, one per subtopic, easy to hard.
- **All 8 common languages:** Python, JavaScript, TypeScript, Java, C++, C, C#, Go, plus SQL.
- **Real judging:** 15 cases per problem (5 visible, 10 hidden), with a time limit.
- **Complexity feedback:** measured growth of the user's code against the target.
- **Company context:** which companies ask each problem, including Israeli ones.

**Non-negotiable principles**
1. **$0 infrastructure.** Every component must run on a free tier.
2. **Every solution is verified** in every language before it ships (CI).
3. **Honesty:** if something doesn't work or wasn't checked, the site says so. Never fake a verdict.
4. **Our own wording:** a problem's idea is reusable, LeetCode's text is not. Imported solutions only from openly licensed repos, with attribution.
5. **No secrets in the client:** keys and secrets stay on the server.

## Where we are

Stages 0 and 1 are nearly done and the runner is live. What's missing is the way to practice: paths, practice modes, and showing the data we already have.

| Stage | Progress | Done | Left |
|---|---|---|---|
| 0. Base platform | 100% | Editor, 15 cases, interview mode, bot battle, scripted mentor | - |
| 1. Content | ~80% | Index of 3,517 problems and 680 companies; essential path 131/131 verified in 8 languages + 5 SQL problems; special input types; growth measurement (pilot on 10 problems); sources and best known complexity saved (PR #9) | Paths and practice modes; company and complexity display; growth for all problems |
| 2. Server | ~55% | Live runner for Java, C++, C, C#, Go; PostgreSQL schema | Supabase setup; hidden tests and solutions server-only; monitoring |
| 3. Users | 0% | - | Sign-in, server-side progress, GitHub sync, real AI mentor, human battles |
| 4. New UI | 0% | - | Redesign once features accumulate |

**Languages on the live site:** JavaScript, TypeScript, Python and SQL run in the browser; Java, C++, C, C# and Go run on the server. A real Java submission on the live site was Accepted 15/15 in 3.8 s.

**Quality:** about 2,600 checks on every change, in 10 parallel CI jobs (about 6 minutes).

## Architecture

Principle: judging always happens in the page. The server only runs code and returns output; it never sees expected answers.

| Layer | Contents | Runs on |
|---|---|---|
| Site | Static SPA, Monaco, router, views | GitHub Pages |
| Judge engine | 15 cases, comparison, hidden-case redaction, growth measurement | Browser |
| Local execution | JS, TS (Monaco's compiler), Python (Pyodide), SQL (sql.js) | Web Workers |
| Remote execution | Java, C++, C, C#, Go | Cloudflare Worker -> Tunnel -> gate -> Piston on an Oracle VM |
| Content | Problems, solutions in 8 languages, families, company tags | git (source of truth), synced to PostgreSQL |
| Verification | Every solution runs the 15 cases in every language, within the time limit | GitHub Actions, one job per language |

Until stage C there is no backend with users: progress lives in localStorage, and there are no secrets in the client.

## Next steps

Recommended order: practice experience first (stage A), since all the content exists and runs; only the way to practice it is missing. Each item closes with a PR that passes CI and waits for the owner's approval to merge.

### Stage A: practice experience (next)
- [ ] Company tags on every problem: name, frequency, recency, Israeli companies marked
- [ ] Complexity on every problem: our target, and separately "best known" from kamyu104 with attribution
- [ ] Practice-by-company view, with search and an Israeli-companies filter
- [ ] Problem families on each problem: all versions of the same idea are marked as related, and each version clearly shows which companies asked that form and what changed from the base version (the twist). Serves both company practice and re-practicing a problem in a different wording
- [ ] Learning paths from the topic map (26 topics), replacing the 4 temporary milestones
- [ ] Mock OA: timer, 2-3 problems by difficulty, report at the end
- [ ] Daily problem and "weak spots" practice from history
- [ ] Solution explanation unlocked after solving, and submission history per problem
- [ ] More robust growth measurement, so one slow size doesn't skew it

### Stage B: small maintenance
- [ ] Automatic runner health check and an alert when it's down
- [ ] Redeploy the Worker so disabling preview URLs takes effect
- [ ] Browser Python check on the new input types
- [x] Script that fetches complexity and solution sources (PR #9)

### Stage C: users and server
- [ ] Supabase setup (free plan) and automatic sync from CI
- [ ] User management: sign-in with Google (and GitHub) via Supabase Auth, profile, and progress, drafts and submissions stored on the server and synced across devices. Existing localStorage progress moves to the account on first sign-in
- [ ] Personal GitHub sync: every Accepted solution is committed to a repo the user picks, one folder per problem with the code and a README with the complexity. Through a GitHub App with access to that one repo only; the token stays on the server, never in the browser
- [ ] Hidden tests and solutions served only from the server
- [ ] Real AI mentor that also explains complexity (depends on the budget decision)
- [ ] Real-time battle against a person, judged on the server

### Stage D: content expansion
- [ ] Growth measurement for all problems (target filled automatically, input generators gradually)
- [ ] Graphs as objects (Clone Graph) and numbers above 2^53
- [ ] Data for the 4 missing Israeli companies: Payoneer, Playtika, AppsFlyer, Gong
- [ ] The whole bank beyond the essential path: 465 more distinct problems and 92 families with versions by company and wording, in waves by company priority. Each version links to its base problem

### Stage E: new UI
- [ ] Redesign once features from stages A-D accumulate

## Content sources

Full list with licenses and refresh steps: `content/SOURCES.md`. Fetch script: `scripts/content/fetch-sources.sh`.

**Working rule:** an imported solution is raw material. It ships only after it's adapted to our signature and passes the verifier in every language. The sources had real bugs (32-bit overflow, recursion too deep, O(n^2) instead of O(n log n)), and the verifier caught them.

## Decision log

Every decision that changes direction goes here, newest first. Detailed technical decisions are also ADRs in `docs/adr`.

| Date | Decision | Why |
|---|---|---|
| 2026-11-18 | The plan lives in the repo, in English (`docs/PLAN.md`) | Fewer tokens per read and write; updated in the same PR as the work |
| 2026-11-18 | User management with Google sign-in, and solution sync to a personal GitHub repo (stage C) | Progress that isn't lost, and a portfolio visible to employers. Supabase Auth is already in the plan (ADR 0002) and free |
| 2026-11-18 | Problems with the same idea are marked as a family; each version shows the companies that asked it and what changed from the base | Company practice, and re-practicing a problem in a different wording |
| 2026-11-18 | The site includes the 131 essential problems as a learning path, **and also** all other problems and versions | Practice for a specific company, and repeat a problem in a different wording |
| 2026-11-18 | "Best known" complexity from kamyu104; our own target rules for problems we changed | Full coverage and MIT license; our limits sometimes differ from LeetCode's |
| 2026-11-18 | Runner: Piston on Oracle Always Free, behind a Cloudflare Worker and Tunnel (ADR 0005) | $0, real compilers, no open port. Piston's public API closed in 2026, Judge0 is paid |
| 2026-11-18 | TypeScript runs in the browser via Monaco's compiler | No extra download, and a type error is a Compile Error as on LeetCode |
| 2026-11-18 | Measured growth in coarse buckets (ADR 0004) | No reliable tool derives complexity from code; measurement can't tell n from n log n |
| 2026-11-17 | Solutions imported from open repos with attribution; problem wording is our own | Saves work; an idea is free, the wording is copyrighted |
| 2026-11-17 | SQL in the browser with sql.js, SQLite dialect (ADR 0003) | Free and in-browser; differences from MySQL are documented |
| 2026-11-17 | Essential path of 131 problems, one per subtopic | Covers everything without drowning in 596 problems |
| 2026-11-17 | 8 languages: Python, JS, TS, Java, C++, C, C#, Go | The common take-home languages; C added at the owner's request |
| 2026-11-17 | PostgreSQL on Supabase as the database, git as the source of truth for content (ADR 0002) | Content managed in code and tested; the free plan is enough |
| 2026-11-17 | Near-identical problems merged into families with versions by company | A real count of distinct problems, and practicing one problem in several wordings |

## Open decisions

Tick when decided, and move the decision to the log.

- [ ] GitHub sync: automatic on every Accepted, or only on click? And what about problems where the solution was revealed (marked "assisted")?
- [ ] Stage A: start with mock OA, practice by company, or learning paths?
- [ ] Show users the external "best known" complexity too, or only our target?
- [ ] Order for writing the rest of the bank: by companies you care about (which?), by topic, or by overall frequency?
- [ ] Oracle: stay on Free Tier and rebuild if the VM is reclaimed, or upgrade to Pay As You Go (still $0 within the free allowance)?
- [ ] AI mentor: provider and budget, or keep the existing hint ladder?
- [ ] Move first-match-index from Easy to Medium? With our limits it needs KMP.
- [ ] Keep the hard case in grid-word (Medium), which will likely fail in browser Python without pruning?

## Risks

| Risk | What happens | What we do |
|---|---|---|
| Oracle reclaims an idle Always Free VM (7 days) | Java, C++, C, C# and Go stop running; the site shows an honest message | New VM and `sudo ./setup.sh tunnel` (about 20 min), or upgrade to Pay As You Go |
| Cloudflare quota runs out (100,000 requests/day) | Server languages stop until midnight UTC | Plenty for current use; Turnstile against abuse |
| Monthly Claude usage runs out | Agent work stops mid-wave | Smaller waves; work is saved and resumes after reset |
| Solutions and hidden tests ship to the browser | A determined user can read them | Stage C: served from the server only |
| Company data is crowdsourced | Partial or stale tags | Show recency, present as a trend, not a promise |
| Growth measurement answers "inconclusive" | The user gets no clear answer | Improve the estimator (stage A) |

## How this file lives

- Every new decision goes to the top of the decision log, with date and reason. A decision that changes architecture also gets an ADR.
- A finished task is ticked in its stage, with the PR number, in the same PR as the work.
- A change in stage order is recorded as a decision, not rewritten silently.
- An open question stays in "Open decisions" until decided.
- This file holds the plan and decisions; technical detail stays in `docs/`, `CHANGELOG.md` and `content/SOURCES.md`.
