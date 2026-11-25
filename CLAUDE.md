# CLAUDE.md - Leet-For-Berger

Interactive coding assessment platform (LeetCode / HackerRank style). Static SPA, vanilla ES modules, no build step, deploys to GitHub Pages.

Read this file fully before any task. Then read the docs it points to for the area you touch.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Static server on http://localhost:5173 (ES modules + workers need HTTP, not file://) |
| `npm test` | Unit tests (`node --test`), pure logic only, ~1s |
| `npm run test:affected` | Only the unit tests this branch's changes reach, as CI picks them (`scripts/ci/deps.mjs`) |
| `npm run test:e2e` | Playwright smoke test in Chromium: Monaco, workers, Pyodide, routing, lockdown. Fails on any console error |
| `npm run check` | Both. Run before every commit |
| `npm run check:db` | Schema + git -> database sync against a throwaway PostgreSQL (needs PostgreSQL binaries) |
| `node scripts/ci/check-selection.mjs` | Proves the affected-test selection: runs every test traced and checks each file a test read is predicted (~3 min; after changing `scripts/ci/deps.mjs`) |

Local e2e on a machine with Chrome but no Playwright browsers: `PW_CHANNEL=chrome npm run test:e2e`, or `PW_EXECUTABLE=/path/to/chrome`. Skip the slow Pyodide download: `node e2e/smoke.mjs --no-python`. Screenshots: `--shots=/tmp/shots`.

## Architecture map

```
index.html                 shell: header, <main id="view">, loads src/js/theme-boot.js (in <head>) and src/js/main.js
src/css/app.css            all styles; Atlas design tokens at the top, colours in theme layers: palettes, derived, code themes (docs/DESIGN.md "Themes")
src/fonts/                 self-hosted Bricolage Grotesque (display), Inter, JetBrains Mono woff2 fonts (README.md, ADR 0009)
src/brand/                 logo, favicon, social preview (scripts/design/social-preview.mjs); companies/<slug>.webp = company logos (scripts/content/fetch-logos.mjs, rules in logo-pick.mjs, sources in content/company-domains.json)
src/js/main.js             bootstrap + hash router (every view returns a cleanup fn)
src/js/theme-boot.js       classic script before the stylesheet: applies the site theme (data-theme on <html>) before the first paint; window.lfbTheme
src/js/engine/             PURE judging logic + execution
  harness.js               buildSuite (15 cases), judge, deepEqual, preview
  codegen.js               8 languages, neutral signature (function or class) -> names, types, starter code
  adapters.js              JSON <-> ListNode/TreeNode/class dispatch for JS, TS, Python (browser + verifier)
  structures.js            tree/list helpers for problem references and generators
  growth-inputs.js         seeded input generators for growth specs (ADR 0004); coverage: scripts/content/growth-coverage.mjs, exclusions: growth-exclusions.mjs
  runners/index.js         language -> runner registry
  runners/worker-runner.js generic Web Worker runner, per-case watchdog
  runners/ts-runner.js     TypeScript: compile (injected compiler), then run as JS
  typescript.js            TS compiler options (LeetCode's flags), ambient types, diagnostics format
  runners/remote-runner.js Java, C++, C, C#, Go on the server (ADR 0005); judged in the page
  programs/                native test programs per language, shared by the CI verifier and the remote runner
    build.js, extra-types.js, output.js (case protocol), java/Harness.java + structure classes
  workers/js-worker.js     executes user JS (and transpiled TS)
  workers/py-worker.js     executes user Python via Pyodide (persistent worker)
  workers/sql-worker.js    executes user SQL via sql.js (SQLite wasm); sql-core.js is shared with the verifier
  sql.js                   SQL problems: schema validation, starter, result-set judging (ADR 0003)
src/js/config.js          public site config: remote runner URL (empty = editor-only), Turnstile site key
src/js/problems/<id>/      problem.js + solutions/ (8 language files, or solution.sql); index.js = catalog + loadProblem (lazy, ADR 0008); catalog.js is generated (scripts/content/build-catalog.mjs); hydrate.js
src/js/state/              progress (pure reducers + localStorage), drafts, sync.js (merge across devices), tours.js (which tours this device has seen)
src/js/auth/               account.js (Supabase sign-in, inert unless configured), sync-controller.js (ADR 0006), github-sync.js (ADR 0007), quiz-board.js (daily quiz leaderboard client)
src/js/modes/              interview.js, battle.js, mock-oa.js (pure session logic and OA problem picking), quiz.js (multiple-choice sessions, daily quiz, validateBank)
src/js/mentor/             mentor providers (scripted today, remote later)
src/js/data/quiz-topics.js quiz topics (titles in English and Hebrew); quiz-index.js (generated: id, topic, level) plans sessions; quiz-loader.js fetches quiz/<lang>/<topic>.json on demand; state/quiz-progress.js keeps answers per browser
src/js/data/taxonomy.js    learning network: 26 topics, 131 subtopics, ladders, validators
src/js/data/families.js    problem families, pickVersion per company, distinctProblems
src/js/data/problem-meta.js companies, best known complexity, family per shipped problem (-> problem-meta.json, scripts/content/build-meta.mjs)
src/js/data/company-sets.js practice by company: per-company problem lists, one row per family (-> company-sets.json, same script, which also merges content/israel-hiring.json via scripts/content/israel-companies.mjs: aliases collapsed, Israel fields, display order)
src/js/data/learning-path.js essential path: 131 problems by tier and topic, easy to hard (-> essential-path.json, same script)
src/js/data/recommend.js   problem of the day, weak spots from progress
src/js/data/daily.js       daily challenge maths: number, streaks, rolling count, 16-week calendar
src/js/data/map-layout.js  Problem Map model: topic and subtopic states, lock reasons, tier order, keyboard neighbours, map level URLs (ADR 0010 + amendments); layoutMap draws the social preview
src/js/data/map-world.js   the continuous map: one world layout, camera maths (fit, zoom at a point, clamp, smooth flight), zoom levels, label placement (ADR 0010 amendment 2)
src/js/data/problem-topics.js taxonomy topic per shipped problem (-> problem-topics.json, build-meta.mjs)
src/js/data/palette-search.js command palette ranking
src/js/data/themes.js      code themes (Dark Berger, Berger Light, Shuvat Light Pink), Match site, monacoTheme from the --code-* tokens; ui/theme.js = choices and their controls (Profile, toolbar, palette)
src/js/data/profile.js     profile numbers and the leaderboard nickname rule (shared with the quiz board)
src/js/data/share.js       what each share button sends (spoiler-free texts and links); ui/share.js = the button (share sheet or copy)
src/js/data/tours.js       guided tour content (one per page + welcome + mentor), validateTour; tour-routes.js = route to tour (startup); tour-layout.js = card and spotlight placement (pure)
src/js/data/company-loader.js fetch loaders for company-sets.json, problem-topics.json, company-logos.json (which companies have a logo, bleed, brand colour) and company-pages.json (which companies have a page: chips link there); each company in the sets carries its careers link (content/company-careers.json, scripts/content/check-careers.mjs)
content/                   problem index, ladders, families, sources, AUDIT.md (see content/README.md); quiz/<topic>.json = quiz source bank, English + Hebrew (scripts/content/build-quiz.mjs builds the site files)
scripts/content/           fetch sources, build index, audit
scripts/verify/            verifier helpers (harnesses.mjs re-exports engine/programs; sql, growth)
scripts/share/             preview pages behind shared links, built on deploy (pages.mjs: what each holds; card.html: the image template; build-share-pages.mjs)
scripts/ci/                affected-test selection for CI (deps.mjs: what each test reaches; affected.mjs: what to run; check-selection.mjs + trace/: proof against a traced run)
deploy/cloudflare-worker/  Worker in front of the runner: CORS, rate limit, size caps, secret (wrangler.toml)
deploy/supabase/functions/ Edge Functions: github-sync, daily-quiz (scores the daily quiz, leaderboard, streak; bank.js generated by build-quiz.mjs); core.js is unit-tested in Node, index.ts is the Deno entry; migrations/ = SQL to apply on the live project
deploy/piston/             VM kit: Piston image, runtime packages, gate, compose, setup.sh, smoke.mjs, dev/
db/schema.sql              PostgreSQL schema (ADR 0002); scripts/db/ = git -> database sync + checks
src/js/ui/                 dom helpers, editor (Monaco + fallback), ts-compiler (Monaco's TS service), resizer, results console, motion.js (durations, View Transitions, glide, spotlight, burst, shake), palette.js (Ctrl+K), daily-card.js, tour.js (guided tour overlay)
src/js/ui/views/           dashboard, map, daily, workspace, path, companies, modes (hub, interview, battle), quiz (hub, play, results, daily quiz), profile (#/me: account, numbers, settings)
scripts/design/            capture-screens.mjs (before/after shots), perf-map.mjs (ADR 0010), social-preview.mjs
tests/                     node --test unit tests + solutions.test.js (8-language verifier)
e2e/smoke.mjs              Playwright smoke test
docs/                      ARCHITECTURE, DESIGN, PROBLEM_FORMAT, ROADMAP, PLAN, DEPLOY_RUNNER, DEPLOY_AUTH, DEPLOY_GITHUB_SYNC, REPO_AUDIT, adr/, archive/ (finished plans), research/
```

Plan, stages and decision log: `docs/PLAN.md` (tick tasks there in the same PR). Deeper: `docs/ARCHITECTURE.md` and `docs/DESIGN.md` (the Atlas design system: read it before any UI change). Adding a problem: `docs/PROBLEM_FORMAT.md` or `/add-problem`.

## Invariants (breaking any of these is a bug, not a style choice)

1. **Every run executes exactly 15 cases**: 5 visible (detailed feedback) + 10 hidden (pass/fail). `buildSuite` throws otherwise. Custom input replaces visible slot 1 on Run only; Submit always uses the canonical 15.
2. **Expected values never reach a worker.** Workers get `{ id, args }` only. User code could read the message and echo answers.
3. **Hidden case data never reaches the UI.** `judge()` strips args/expected/actual from hidden cases. Redaction lives in the harness, not in rendering.
4. **User strings never go through `innerHTML`.** Use `h()` from `ui/dom.js` (text nodes). `trustedHtml` is only for author-written problem statements.
5. **Hidden tests are deterministic.** Generated inputs use the seeded `mulberry32`, never `Math.random()`.
6. **Pure modules stay pure.** `engine/harness.js`, `engine/codegen.js`, `data/*.js`, `state/progress.js`, `modes/*.js`, `mentor/mentor.js` have no DOM access and take time as a parameter (`now`) so they are unit-testable. Do not read `Date.now()` inside a reducer without a `now` override. (This already caused one bug: tab-switch tracking.)
7. **Every view returns a cleanup function.** Monaco instances, intervals and listeners leak otherwise.
8. **CDN versions are pinned** (Monaco 0.52.2, Pyodide 0.27.2, sql.js 1.13.0, which must equal the `sql.js` devDependency, supabase-js 2.118.0). Upgrading is a deliberate task with an e2e run, not a drive-by.
9. **Zero console errors.** The e2e test enforces it.
10. **No secrets in the client.** This is a static site. LLM keys, solution vaults and real judging for competitive modes require the backend (ROADMAP Phase 2-3).
11. **Every shipped solution is verified.** Each algorithm problem has a solution file per language (8); each SQL problem has exactly one, `solutions/solution.sql` (ADR 0003). `tests/solutions.test.js` runs all of them against the 15 cases, and each language must finish all 15 within one case's `timeLimitMs`; CI requires every toolchain (`REQUIRE_ALL_LANGUAGES=1`). Starter code is generated from the signature, never hand-written.

## Conventions

- Vanilla JS, ES modules, no framework, no bundler. Adding either needs an ADR in `docs/adr/` first (see ADR 0001 for why).
- JSDoc on every exported function. Inline comments explain **why**, never what.
- Flag counterintuitive or load-bearing lines with `// don't touch / <reason>`. Treat these as spec. Do not "simplify" them without reading the reason.
- Naming: `camelCase` functions, `PascalCase` classes, `kebab-case` files. Problem ids are kebab-case and match the file name.
- No em dashes anywhere (code, comments, docs, UI copy). Use a regular hyphen.
- UI copy is short and direct. No exclamation marks except in genuine success states.
- Accessibility: interactive elements are real `<button>`/`<a>`, keyboard reachable, `aria-*` where state is not visual-only.
- English for code and docs.

## Workflow

1. Branch per task: `feat/...`, `fix/...`, `content/<problem-id>`, `docs/...`.
2. Write or update unit tests for any pure-logic change first.
3. `npm run check` must pass. For UI changes, also look at the screenshots (`--shots`).
4. Update `CHANGELOG.md` (Unreleased section) and, if the change shifts scope, `docs/ROADMAP.md`.
5. Small commits with imperative subjects. PR description: what, why, how verified.
6. When a one-off plan or brief is finished (every step shipped), `git mv` it to `docs/archive/`, add a line to `docs/archive/README.md`, and point every reference at the new path (`CHANGELOG.md` entries stay as written). `docs/` holds only living docs.

## Definition of done

- `npm test` green, `npm run test:e2e` green with zero console errors.
- New behavior covered by a unit test (logic) or an e2e step (UI flow).
- Docs and CHANGELOG updated.
- No new invariant violations (re-read the list above).

## Known limits (do not "fix" by faking)

- Only JavaScript, TypeScript, Python and SQL (SQLite dialect, not LeetCode's MySQL) run in the browser. TypeScript is type-checked and transpiled by Monaco's TypeScript service (no extra download), then runs as JavaScript; a type error is a Compile Error, as on LeetCode (`engine/typescript.js`). With Monaco unavailable (textarea fallback) TypeScript cannot compile and the verdict says so.
- Java, C++, C, C# and Go run on the remote runner (ADR 0005, `docs/DEPLOY_RUNNER.md`) once `src/js/config.js` has its URL, in practice mode only; unset, they are editor-only and the verdict says so honestly. Interview and battle keep them editor-only (scored sessions need server judging, Phase 3). All solutions are verified in CI (`tests/solutions.test.js`) with the same programs the remote runner sends.
- The remote runner is a free Oracle VM behind a free Cloudflare Worker: 100,000 requests per day, two jobs at a time, and Oracle may reclaim an idle Always Free VM (ADR 0005). When it is down the page says so; never fake a verdict.
- "Reveal Solution" is gated by a confirm dialog and marks the problem as assisted, but solutions ship in the client bundle. True secrecy needs the server (Phase 2).
- Battle is bot-only. Peer battles need server-side judging so clients cannot fake progress (Phase 3).
- AI Mentor runs on a scripted hint ladder. The LLM provider needs a backend proxy (Phase 3). The system prompt already lives in `src/js/mentor/mentor.js`.
