# Work plan (living)

Last updated: 2026-11-22. Owner: Roy.

A LeetCode-style practice platform for interviews and take-home tests, at $0. 145 problems are verified in all 8 languages, every language runs on the live site, accounts and GitHub sync are live, and the dashboard loads in under a second. The bottleneck now is content: most company lists show many more asked problems than we have. This file is open to change: every new decision goes into the decision log.

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

Platform, practice modes and accounts are done. What limits the site now is how many problems it has, and the complexity feedback, which covers only a pilot.

| Area | State | Left |
|---|---|---|
| Platform | Done: editor, 15 cases, 8 languages live, dashboard in 0.3 s (ADR 0008) | Small speed steps (F1) |
| Practice | Done: paths, company practice by Israel hiring, mock OA, daily, weak spots, walkthroughs, battle vs bot | - |
| Content | 225 problems (131 essential + 94 company problems) | Company waves (F2), growth for all (F3) |
| Accounts | Done: Google and GitHub sign-in, synced progress, GitHub sync of solutions | Owner check of GitHub sync |
| AI mentor | Scripted hint ladder | Real LLM mentor (F4, needs a budget decision) |
| Design | F6 Atlas redesign in progress (`docs/F6_PLAN.md`, `docs/DESIGN.md`) | F5 done |

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

Stages A to D2 below are the history. The order from here is stage F. Each item closes with a PR that passes CI and waits for the owner's approval to merge.

### Stage F: focus from 2026-11-19 (in this order)
- [x] **F1. Last speed steps (small, one PR):** load views only when opened, and load supabase-js only with a stored session, an auth callback, or a click on Sign in. Fresh `#/`: 50 to 19 local modules, 62 to 22 requests, supabase-js 7 to 0
- [ ] **F2. Company waves by hiring in Israel (main work, repeating):** each wave adds 15 to 20 of the most-asked problems we lack for the next companies in `content/israel-hiring.json` rank order (Nvidia, Intel, Amdocs, Microsoft, Mobileye, Check Point, Wix, Palo Alto Networks, Apple, Google, ...), counting a family once. Same bar as today: our own wording, 15 cases, 8 verified languages, explanation, family links. Graphs as objects and numbers above 2^53 are built when the first wave needs them, not before
  - [x] Wave 1: 20 problems for Nvidia, Intel, Microsoft, Wix, Palo Alto Networks, Apple and Google (Unfold Brackets, Balanced Pairs, Dotted Quads, Hill Rearrange, Paren Depth, Rot Spread, BST Check, List Mirror, Stone Smash, Streak Watch, Word Order Flip, Digit Flip, Mirror Bits, Next Arrangement, Ring Shift, Sudoku Check, Dominant Value, Unique Prefix, Gap in Range, Equal After Deletes); 145 -> 165 problems. Intel's whole list and Microsoft's top 30 are now covered
  - [x] Wave 2: 20 problems (Rank Boost, Flag Sort, Squeeze Runs, Same Letters, Crack Palindrome, Zero by Powers, Undo Running Xor, Fizz Buzz List, Base Four Check, Product Cap Subarrays, Checkpoint Array, Ring Queue, Message Throttle, Plain Arithmetic, Skyline Block, Dictionary Split, Balanced Cuts, Column Sweep, Typeahead Hints, King Path); 165 -> 185. Top 30 now: Nvidia 28/30, Microsoft 30/30, Wix 30/30, Palo Alto 25/30, Apple 29/30
  - [x] Wave 3: 20 problems for Meta, Qualcomm, Palo Alto Networks, Salesforce, Cisco, IBM, Dell and monday.com (Interleave Words, Abbrev Match, Matching Bit Blocks, Start Value Floor, Flip Budget Run, Drop From Tail, Tidy Path, Text To Int, Shoreline View, Digit Path Total, Weighted Draw Lookup, Bounded Sum Pairs, Grid Duel, Mini Feed, Daily Load Limit, Backup Station, Value Harvest, Range Groups, Best Job Selection, Coin Sweep); 185 -> 205, all but Grid Duel with growth feedback from the start. Top 30 now: Meta 27/30, Qualcomm 24/30, Palo Alto 27/30, Dell 14/14, monday.com 2/2
  - [x] Wave 4 (Nvidia, 20 problems, 4 groups of 5, Claude and Antigravity alternate as author and reviewer): Nvidia's most frequent problems not yet on the site, so its top 60 is fully covered. Left out as not fitting the harness: Read N Characters (read4 API), Find the Celebrity (interactive), Fizz Buzz Multithreaded (threads), Linked List Random Node (randomized)
    - [x] Group A (Claude): View Cone, Cover Area, Digit Sum Pair, Closest Gaps, Two Power Check; 205 -> 210. Nvidia top 60: 52 -> 57
    - [x] Group B (Antigravity): Number in Words, First Lone Character, Repeat Check, Best Triple Product, Balanced Subsequence Count; 215 -> 220
    - [x] Group C (Claude): Collinear Max, Most Events, Stone Halving, Sparse Dot, Bit Tally; 210 -> 215. Nvidia top 60: 57 -> 60 (all of it)
    - [x] Group D (Antigravity): Smallest Positive Gap, Sorted List Dedupe, List Midpoint, Bit Sum Subarrays, Largest Ones Square; 220 -> 225
  - [ ] Wave 5: candidates from the wave 3 reserve list: Number of Divisible Substrings (Amdocs), Advantage Shuffle, Food Buckets and Invert Binary Tree (Palo Alto to 30/30), Time Needed to Rearrange a Binary String (Salesforce), Implement Router (Cisco), Min Operations to Make All Equal (IBM), Diagonal Traverse
- [x] **F3. Growth measurement for every problem:** complexity feedback is a core promise. Targets start from the statement and the best known complexity, inputs from shared generators; new wave problems ship with it
  - [x] Step 1, tooling and the first batch: input helpers for the common shapes (`src/js/engine/growth-inputs.js`), a coverage report that suggests targets (`node scripts/content/growth-coverage.mjs`), one exclusion policy with reasons (`scripts/content/growth-exclusions.mjs`, docs/PROBLEM_FORMAT.md "Coverage and exclusions"), a test that every problem is covered, excluded or pending and that the pending list only shrinks, and the growth verifier moved to one worker thread per problem (no more 1.5 GB heap behind the timings). 20 problems added: Product Except Self, Rain Trap, Window Maximums, Double Inversions, Stone Smash, Flag Sort, Bracket Check, First Match Index, Squeeze Runs, Rot Spread, Edit Steps (`n^2`), Tree Height, BST Check, Best Tree Path, Reverse List, Merge Many Lists, Merge Ranges, Meeting Room Minimizer, Course Order, Recent Cache
  - [x] Batches A to D (PRs #29, #30 and this one): every shape tried; 98 more problems covered. Two CI rules came out of it and are in the batch brief: the top 3 sizes take at least 3 ms on a dev machine (GitHub's runner is about 3x faster), and no single doubling in the judged window may grow more than about 2.6x (cache and allocation bends sit lower on CI). A spec that passes only on a retry does not ship
  - [x] The verifier found a real bug: the shipped JavaScript and TypeScript Unfold Brackets were quadratic (string flattening); fixed in #30
  - Progress: 128 of 149 measurable problems covered (185 in all: 36 excluded with a reason, 6 of them SQL; 21 pending)
  - [ ] The 21 pending, each tried and left out for a stated reason (allocation or cache bends, too fast to time on CI, recursion limits, retry-only passes): bucket-map, column-sweep, course-finish-time, dictionary-split, digit-list-sum, fizz-buzz-list, gap-in-range, hill-rearrange, jump-reach, justify-lines, list-loop, lone-number, prefix-tree, random-link-copy, ring-shift, rotate-grid, ticket-itinerary, trade-cooldown, two-color-check, unfold-brackets (solution fixed, spec still to write), word-order-flip. Fixing these needs measurement work, not more specs: e.g. timing several reps per size to average out bends, packed (non-holey) arrays in the generators, a larger browser budget for big linked lists. Worth doing only if users ask for feedback on these problems
- [ ] **F4. Real AI mentor:** an LLM behind a Supabase Edge Function with a hard monthly cap, using the system prompt already in `src/js/mentor/mentor.js`. Starts only after the budget decision below
- [x] **F5. Design session:** after F1, F3 and the first three F2 waves. A dedicated session (Fable 5.2): a plan per screen, then execution per screen
  - Plan: `docs/DESIGN_PLAN.md`, rules: `docs/DESIGN.md`. Ten steps, one PR each
  - [x] Step 1, tokens and fonts (#33)
  - [x] Step 2, shell: phone tab bar, account panel, dialogs, toasts, page states (#34)
  - [x] Step 3, core components: buttons, chips, segmented, tags, difficulty, inputs, cards, 44 px touch targets, shared helpers in `ui/dom.js` (#35)
  - [x] Step 4, dashboard: single-strip stats, new-visitor start block, Today Solve CTA, search-first filters + Topic disclosure + Clear filters empty state, full-row links and phone list rows
  - [x] Step 5, companies: option cards (monogram, name, IL mark, "x of y solved" with a bar, two per row on a phone), company page with a progress header, chip filters, Practice links named after the problem, a 3-step frequency meter and phone list rows
  - [x] Step 6, pickers: shared `ui/picker.js` (search, scope, roving arrow-key focus, pagination, `aria-live` selected summary, cleanup), interview setup (format cards, company option cards, 3-line rules, pinned Start bar), battle setup (opponent cards, difficulty + topic chips without `<select>`, pinned Start bar, no inner scroll box on phones)
  - [x] Step 7, workspace: statement first with a collapsed "About this problem", grouped toolbar that wraps instead of clipping Run / Submit, token-matched Monaco theme, mentor as a third column only above 1200 px (overlay below, sheet on phones), ARIA case tabs, phone Description / Code / Results tabs with a pinned Run / Submit bar
  - [x] Step 8, sessions: shared session banner with tabular timer and single 5-minute warning announcement, interview problem switcher with per-problem status, colour-banded interview report with difficulty and Review links, battle lockdown with Leave race exit and two distinct thicker race bars
  - [x] Step 9, learning path: thicker green overall bar with the count, a one-line description per tier, topic disclosure buttons with `aria-expanded` and a mini bar on every topic header, full-row links with the shared status and difficulty, a visible Next up tag, two-line rows on phones
  - [x] Step 10, polish: Modes hub redesigned to two cards (Interview, Battle) with user-facing copy, last session results, one primary button, and an AI Mentor note; privacy page on shared page-head and tokens; dead CSS removed and carried Step 4/5/9 nits swept
- [x] **F6. Full redesign, research-led:** an interactive Problem Map, a redesign of every screen and state in one consistent style, no style decided in advance. Brief: `docs/REDESIGN_BRIEF.md`. Started 2026-11-23 on the owner's go
  - [x] Phase A: screen inventory (`docs/research/SCREEN_INVENTORY.md`) and research from 63 captured sites (`docs/research/DESIGN_REFERENCES.md`)
  - [x] Phase B: three directions prototyped and scored; **Atlas** chosen (`docs/research/DESIGN_DIRECTIONS.md`)
  - [x] Phase C: `docs/DESIGN.md` rewritten, ADR 0009 (display font), ADR 0010 (map rendering), plan and coverage matrix (`docs/F6_PLAN.md`)
  - [x] Phase D: steps 1 to 9 in `docs/F6_PLAN.md`: Map (`#/map`), Daily (`#/daily`), command palette, and every screen in the Atlas design; inventory fully ticked
  - [x] Guided tours (owner's request): a site tour on the first visit, and a guide for each mode the first time it opens; replayable
- [ ] **Owner:** check GitHub sync end to end (connect a repo, solve, see the commit); redeploy the Worker (stage B)

### Deferred until there is a reason (decided 2026-11-19)
- Hidden tests and solutions served only from the server, and the CI to Supabase content sync that would feed them. The judge runs in the page, so expected values reach the browser anyway; serving them from the server only hides them from casual reading. Worth it only with scored peer battles or leaderboards.
- Real-time battles against people. Needs server-side judging so clients cannot fake progress. Revisit if more users arrive.
- Faster problem open (build hidden tests on first Run) and faster heavy references (perf plan steps 4 and 6). Opening a problem costs 0.05 to 0.9 s today; revisit if it feels slow. Trap when it is done: `hydrate()` copies the problem with an object spread, which invokes getters, so a lazy `hiddenTests` getter must be copied by property descriptor (with a unit test), and the module-level `rnd` in prime-count and roman-numeral-value must move inside the same thunk.

### Stage A: practice experience (next)
- [x] Company tags on every problem: name, frequency, recency, Israeli companies marked (PR #10)
- [x] Complexity on every problem: our target, and separately "best known" from kamyu104 with attribution, behind a toggle until solved (PR #10)
- [x] Practice-by-company view, with search and an Israeli-companies filter (PR #11)
- [x] Problem families on each problem: all versions of the same idea are marked as related, and each version clearly shows which companies asked that form and what changed from the base version (the twist). Serves both company practice and re-practicing a problem in a different wording (PR #10)
- [x] Learning paths from the topic map (26 topics), replacing the 4 temporary milestones (PR #12)
- [x] Mock OA: timer, 2-3 problems by difficulty, report at the end (PR #13)
- [x] Daily problem and "weak spots" practice from history (PR #14)
- [x] Solution walkthrough unlocked after solving, and submission history per problem (PR #15)
- [x] More robust growth measurement, so one slow size doesn't skew it (PR #16)

### Stage B: small maintenance
- [x] Remove the legacy `milestone` field from problem files and the catalog (PR #17)
- [x] Automatic runner health check and an alert when it's down (PR #17; the deep check needs the Worker redeployed)
- [ ] Redeploy the Worker (owner, one command: `cd deploy/cloudflare-worker && npx wrangler deploy`) so disabling preview URLs and the deep health check take effect
- [x] Browser Python check on the new input types (PR #17: list-loop, random-link-copy, nested-flatten pass in Pyodide)
- [x] Script that fetches complexity and solution sources (PR #9)

### Stage C: users and server
- [x] Supabase setup (free plan, Frankfurt; owner steps in `docs/DEPLOY_AUTH.md`), project `jezwwmnczliubfmqgutc`, Google and GitHub sign-in on
- [ ] Automatic content sync from CI into Supabase (deferred, see above)
- [x] User management (code, PR #18; live once the project exists): sign-in with Google (and GitHub) via Supabase Auth, profile, and progress, drafts and submissions stored on the server and synced across devices. Existing localStorage progress moves to the account on first sign-in
- [x] Personal GitHub sync (code, PR #20; live once the GitHub App exists, `docs/DEPLOY_GITHUB_SYNC.md`): every Accepted solution is committed to a repo the user picks, one folder per problem with the code and a README with the complexity. Through a GitHub App with access to that one repo only; the token stays on the server, never in the browser
- [ ] Hidden tests and solutions served only from the server (deferred, see above)
- [ ] Real AI mentor that also explains complexity (now F4)
- [ ] Real-time battle against a person, judged on the server (deferred, see above)

### Stage D: content expansion
- [x] Wix wave: 12 problems, Wix at 35 of its top 50 on the site (PR #20)
- [x] Load each problem only when it is opened (ADR 0008): a generated catalog (`src/js/problems/catalog.js`) feeds the listing views and `loadProblem(id)` imports one module on demand; the dashboard went from about 14 s to 0.3 s locally
- [x] Write `explanationHtml` (our own prose: the idea, why it works, the pitfall) for the 131 essential problems (PR #18; `tests/explanations.test.js` keeps the format and full coverage)
- [ ] Growth measurement for all problems (now F3)
- [ ] Graphs as objects (Clone Graph) and numbers above 2^53
- [ ] Data for the 4 missing Israeli companies: Payoneer, Playtika, AppsFlyer, Gong (folded into F2: added when a wave reaches them)
- [ ] The whole bank beyond the essential path: 465 more distinct problems and 92 families with versions by company and wording (now F2, ordered by hiring in Israel). Each version links to its base problem

### Stage D2: owner review fixes (2026-11-19)
- [x] Sign-out clears the user's data from the device; sign out, disconnect GitHub and loading old code ask first; a failed save offers "Sign out anyway"
- [x] AI Mentor panel no longer hides behind the editor
- [x] Companies: top companies first, a filter for top employers in Israel (any company with Israeli R&D, not only Israeli ones), companies that do not hire in Israel lower (`content/israel-hiring.json`)
- [x] Interview: a readable company picker sorted by relevance to hiring in Israel
- [x] Battle (1v1): a readable problem picker that shows topic and difficulty
- [x] Load views only when opened, and load supabase-js only with a session or on Sign in (done in F1)

### Stage E: new UI
- [x] Redesign (done in F5): 10-step design system rollout across every screen (`docs/DESIGN.md`, `docs/DESIGN_PLAN.md`), including company option cards, shared pickers, phone navigation, workspace and session polish

## Content sources

Full list with licenses and refresh steps: `content/SOURCES.md`. Fetch script: `scripts/content/fetch-sources.sh`.

**Working rule:** an imported solution is raw material. It ships only after it's adapted to our signature and passes the verifier in every language. The sources had real bugs (32-bit overflow, recursion too deep, O(n^2) instead of O(n log n)), and the verifier caught them.

## Decision log

Every decision that changes direction goes here, newest first. Detailed technical decisions are also ADRs in `docs/adr`.

| Date | Decision | Why |
|---|---|---|
| 2026-11-23 | Stage F6 direction: Atlas (a territory of hex districts, one hex per problem, warm graphite with one amber lamp colour), chosen over Transit (subway lines, light paper) and Orbit (radial sky chart) on a scored comparison; company marks stay letters, not logos; map rendered as plain SVG from a pure static layout (ADR 0010); Bricolage Grotesque added as the display face (ADR 0009) | Only Atlas shows every problem on the map and answers where am I, what is next and why locked without a legend; logo sources cover a quarter of the companies and the best-known brands asked to be removed (`docs/research/DESIGN_DIRECTIONS.md`) |
| 2026-11-22 | Stage F5 design plan approved with all 6 owner recommendations: self-host Inter and JetBrains Mono (`src/fonts/`), phone bottom tab bar (replaced by Run/Submit bar in workspace), hide header during battle race, 2 mode cards on Modes hub (AI Mentor note only until F4), defer light theme and RTL (`docs/DESIGN.md`) | One shared token system and consistent component rules across desktop and 390 px phone views without adding external runtime CDN dependencies |
| 2026-11-19 | New order (stage F): last speed steps, then company waves ranked by hiring in Israel, growth for every problem, real AI mentor after a budget decision, then the design session | Platform and practice modes are done; problem count and complexity feedback are what limit the site for an Israeli job seeker |
| 2026-11-19 | Defer server-only hidden tests, the CI to Supabase content sync and peer battles | The judge runs in the page, so server-only data only hides answers from casual reading; it pays off only with scored peer play |
| 2026-11-19 | Content waves follow `content/israel-hiring.json` rank, not global company frequency | The owner and the audience are hiring in Israel; the data is now verified with sources |
| 2026-11-19 | Design waits for a dedicated session after content and features | Owner's call: polishing screens that still change is waste; one planned pass per screen later |
| 2026-11-19 | Problems load on demand from a generated catalog (ADR 0008), no bundler | One 12.4 s main-thread task built every hidden test on every page load |
| 2026-11-18 | Stage A starts with the problem page: company tags, complexity, and the family view. Then practice by company, learning paths, mock OA, daily and weak spots | The data already exists and needs no backend; the problem page is what every later mode links to |
| 2026-11-18 | Sign-in and GitHub sync come after stage A, in stage C | Stage A needs no backend; sync has little to save until there is more to practice |
| 2026-11-18 | GitHub sync is opt-in once, then automatic on every Accepted. Assisted problems (solution revealed) are not synced automatically; the user can push one by hand, and its README says "assisted" | One setup click, no friction after; the portfolio stays honest |
| 2026-11-18 | Show both complexities: our target, and "best known (LeetCode version)" from kamyu104. Before the first Accepted both sit behind a "Show" toggle | Complexity is a hint; the user decides when to see it |
| 2026-11-18 | The rest of the bank is written by overall company frequency, with Israeli companies boosted (the existing wave rules in `content/selection.json`) | Most interview value per problem written; matches the waves already defined |
| 2026-11-18 | Oracle stays on Free Tier. The stage B health check alerts on downtime, and the documented rebuild takes about 20 minutes | Pay As You Go needs a card on file and can bill by mistake; $0 is a principle |
| 2026-11-18 | AI mentor stays on the scripted hint ladder until stage C; then a provider with a hard monthly cap | An LLM needs the backend proxy anyway, and a cap keeps the cost bounded |
| 2026-11-18 | first-match-index moves from Easy to Medium | With our limits it needs KMP, which is Medium material |
| 2026-11-18 | grid-word keeps its hard case; the stage B browser-Python check confirms it fits the time limit, and only then is the limit revisited | The case tests the pruning the problem is about; change the limit on evidence, not a guess |
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

- [ ] **AI mentor budget (F4):** a provider and a hard monthly cap in dollars (or $0 with a free tier and its limits). Nothing is spent until this is decided.
- [ ] **When the design session starts (F5):** proposed after F1, F3 and three F2 waves; the owner can move it.

## Risks

| Risk | What happens | What we do |
|---|---|---|
| Oracle reclaims an idle Always Free VM (7 days) | Java, C++, C, C# and Go stop running; the site shows an honest message | New VM and `sudo ./setup.sh tunnel` (about 20 min), or upgrade to Pay As You Go |
| Cloudflare quota runs out (100,000 requests/day) | Server languages stop until midnight UTC | Plenty for current use; Turnstile against abuse |
| Monthly Claude usage runs out | Agent work stops mid-wave | Waves of 15 to 20 problems, one PR each; work is saved and resumes after reset |
| Israel hiring data goes stale (layoffs, acquisitions) | Company order is a little off | Sources and dates in `content/israel-hiring.md`; refresh twice a year |
| Solutions and hidden tests ship to the browser | A determined user can read them | Stage C: served from the server only |
| Company data is crowdsourced | Partial or stale tags | Show recency, present as a trend, not a promise |
| Growth measurement answers "inconclusive" | The user gets no clear answer | Improve the estimator (stage A) |

## How this file lives

- Every new decision goes to the top of the decision log, with date and reason. A decision that changes architecture also gets an ADR.
- A finished task is ticked in its stage, with the PR number, in the same PR as the work.
- A change in stage order is recorded as a decision, not rewritten silently.
- An open question stays in "Open decisions" until decided.
- This file holds the plan and decisions; technical detail stays in `docs/`, `CHANGELOG.md` and `content/SOURCES.md`.
