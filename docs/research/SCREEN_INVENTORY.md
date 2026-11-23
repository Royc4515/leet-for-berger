# Screen inventory (stage F6)

The checklist the redesign is measured against (`docs/REDESIGN_BRIEF.md`, Phase A1). Every route, every state and every shared component of the site has an id. Each id gets the PR (commit) that redesigns it, and is ticked when the new version ships. No item may stay in the old style.

Baseline screenshots were taken on 2026-11-23 from `main` (`164d1e0`), before any F6 change. They are reproducible and are not committed (third-party-free, but large):

- `e2e/<name>.png`: `node e2e/smoke.mjs --shots=<dir>` (48 shots, states the smoke test drives: verdicts, sessions, menus).
- `full/<width>-<name>.png`: `node scripts/design/capture-screens.mjs <dir>` (full-page, 1440 and 390, a first-visit and a returning-user progress seed).

## Who this is for

Students and job seekers grinding interview problems, often for hours at a time and often aiming at Israeli tech hiring (Nvidia, Intel, Microsoft, Wix, Check Point, Mobileye and 190 more). They come back daily, want to know what to do next without thinking, care about which companies ask what, and spend most of their time inside the workspace reading a statement, typing code and reading a verdict. Many use a phone between other things (commute, reserve duty), so the browse screens and short practice must work at 390 px.

What each screen must help them do:

| Screen | Job |
|---|---|
| Problems | Find the right next problem fast; see status at a glance; switch to the map |
| Map | See the whole curriculum, where they are, what opens next and why something is locked |
| Learning path | Walk the essential 131 in order with no decisions to make |
| Daily | One shared problem a day; a reason to come back; honest streak and history |
| Workspace | Read, code, run, read the verdict, fix, submit; nothing between them and the code |
| Companies | Recognize a company, see what it asks and how far along they are |
| Modes | Practice under pressure: a timed interview, an exam room, a race against a bot |

## Status legend

`[ ]` not started · `[~]` in progress · `[x]` redesigned and shipped. PR column: the commit or PR that redesigned it.

## Routes and screens

| Id | Route / screen | States to cover | Baseline | PR | Status |
|---|---|---|---|---|---|
| R1 | `#/` Problems (dashboard) | first visit (zero stats), returning (stats, streak), daily solved, weak spots empty / filled, filters on, no results, topic panel open, 390 list rows | `full/1440-dashboard-first-visit`, `full/1440-dashboard-returning`, `e2e/01-dashboard`, `e2e/17-today`, `e2e/390-touch-dashboard` | | [ ] |
| R2 | `#/map` Problem Map (new) | first visit, returning, topic focused, locked topic explained, company lens, keyboard focus, reduced motion, 390 | none (new route; `full/1440-map` is the old not-found page) | | [ ] |
| R3 | `#/problem/:id` Workspace | Monaco loading, textarea fallback, before run, running, Accepted, Wrong Answer, Runtime Error, Time Limit, Compile Error (TS), editor-only language, remote runner down / running, custom input on, about-this-problem open, walkthrough open, history open, mentor open, solution revealed, SQL problem, class problem, growth estimate pending / linear / quadratic / inconclusive, 390 Description / Code / Results tabs | `full/1440-workspace-before-run`, `full/1440-workspace-wrong-answer`, `e2e/02-wrong-answer`, `e2e/03-accepted`, `e2e/04-mentor`, `e2e/05-sql-accepted`, `e2e/11-growth-linear`, `e2e/12-growth-quadratic`, `e2e/13-ts-compile-error`, `e2e/13-remote-java`, `e2e/14-problem-context`, `e2e/18-walkthrough-history`, `e2e/10-mobile*`, `e2e/390-workspace` | | [ ] |
| R4 | `#/path` Learning path | first visit, returning, next up, tier done, topic open / closed, 390 | `full/1440-path-first-visit`, `full/1440-path-returning`, `e2e/05-path`, `e2e/390-touch-path` | | [ ] |
| R5 | `#/companies` Companies | Hiring in Israel / Top in Israel / All, search, no results, 390 | `full/1440-companies`, `e2e/15-companies`, `e2e/15a-companies-hiring`, `e2e/390-touch-companies` | | [ ] |
| R6 | `#/companies/:slug` Company briefing | Israeli company, international company, filters, "not on the site yet" rows, 390 | `full/1440-company-google`, `full/1440-company-wix`, `e2e/16-company-wix`, `e2e/390-company-google` | | [ ] |
| R7 | `#/modes` Modes hub | no history, last interview and battle results, 390 | `full/1440-modes`, `e2e/06-modes`, `e2e/390-touch-modes` | | [ ] |
| R8 | `#/interview` setup | format choice, company picker, any company, picker empty, 390 | `full/1440-interview-setup`, `e2e/06-oa-setup`, `e2e/06-oa-setup-picker`, `e2e/390-touch-interview` | | [ ] |
| R9 | `#/interview` session | timer running, last five minutes, time up, tab switch logged, problem switcher, end dialog, editor-only language | `e2e/07-interview`, `e2e/390-interview` | | [ ] |
| R10 | `#/interview` report | score bands, per-problem rows, review links, new session | `e2e/08-report` | | [ ] |
| R11 | `#/battle` setup | opponent choice, problem picker, filters, random, empty, 390 | `full/1440-battle-setup`, `e2e/09a-battle-setup`, `e2e/390-touch-battle` | | [ ] |
| R12 | `#/battle` race and result | racing, you ahead / bot ahead, you won, bot won, leave dialog | `e2e/09-battle`, `e2e/390-battle` | | [ ] |
| R13 | Not found (unknown route, unknown problem) | heading, message, way back | `full/1440-not-found`, `full/1440-problem-not-found` | | [ ] |
| R14 | Could not load (view or problem module failed) | heading, message, retry / way back | e2e step 48 and 49 (no shot) | | [ ] |
| R15 | Route loading | skeleton while a view module loads | transient | | [ ] |
| R16 | `privacy.html` | desktop, 390, way back | `full/1440-privacy`, `e2e/20-privacy`, `e2e/390-privacy` | | [ ] |
| R17 | Daily challenge (new surface) | today unsolved, today solved, countdown to next, month calendar, history, streak | `e2e/17-today` (today card only) | | [ ] |

## Shared components

| Id | Component | Where | States | PR | Status |
|---|---|---|---|---|---|
| C1 | Header | `index.html` | active route, page title on phone, hidden in sessions | | [ ] |
| C2 | Desktop nav | `index.html` | `aria-current`, hover, focus | | [ ] |
| C3 | Phone tab bar | `index.html` | active, replaced by Run/Submit bar in workspace, hidden in sessions | | [ ] |
| C4 | Streak chip | `main.js` | 0, active today, active yesterday, label for screen readers | | [ ] |
| C5 | Account menu | `ui/account-menu.js` | not configured (hidden), signed out, sign-in choice, signing in, signed in, syncing / synced / error, GitHub wizard, GitHub connected, sign-out confirm, 390 sheet | | [ ] |
| C6 | Picker | `ui/picker.js` | search, scope, list / grid, selected line, empty, more | | [ ] |
| C7 | Results console | `ui/results.js` | idle, running, verdict header per type, case tabs, case detail (input, expected, output, stdout), hidden case grid, console error, growth block | | [ ] |
| C8 | Mentor panel | `ui/mentor-panel.js` | closed, open, messages, compose, 390 sheet | | [ ] |
| C9 | Problem context ("About this problem") | `ui/problem-context.js` | closed, open, companies, complexity, family versions | | [ ] |
| C10 | Problem extras (walkthrough, history) | `ui/problem-extras.js` | closed, open, empty history, load code dialog | | [ ] |
| C11 | Resizers | `ui/resizer.js` | idle, hover, dragging, keyboard | | [ ] |
| C12 | Editor chrome and textarea fallback | `ui/editor.js` | Monaco theme, loading, fallback | | [ ] |
| C13 | Confirm dialog | `dom.js confirmDialog` | neutral, danger, 390 | | [ ] |
| C14 | Toast | `dom.js toast` | info, success, warn, error, stacking | | [ ] |
| C15 | Skip link | `index.html` | focus | | [ ] |
| C16 | Footer | `dom.js siteFooter` | browse pages | | [ ] |
| C17 | Buttons | `app.css` | primary, secondary, ghost, danger, icon, sizes, disabled, loading | | [ ] |
| C18 | Chips and chip groups | `dom.js chip, chipGroup` | off, on, focus | | [ ] |
| C19 | Segmented control | `dom.js segmented` | selected, focus | | [ ] |
| C20 | Tables and list rows | `app.css` | header, row hover, solved row, 390 stacked rows | | [ ] |
| C21 | Tabs | workspace tabs, case tabs | selected, focus, status dot | | [ ] |
| C22 | Form controls | search, input, select, textarea, switch, radio | focus, filled, clear | | [ ] |
| C23 | Focus ring | global | keyboard focus on every control | | [ ] |
| C24 | Tags, difficulty, status dot, IL mark | `dom.js` | Easy, Medium, Hard, solved, attempted, assisted | | [ ] |
| C25 | State blocks (empty, loading skeleton, error) | `dom.js stateBlock, loadingState` | each kind | | [ ] |
| C26 | Company mark (monogram or logo) | companies, picker, interview | logo, fallback mark, sizes | | [ ] |
| C27 | Progress bars and meters | path, companies, frequency meter | 0, partial, full | | [ ] |
| C28 | Session banner | interview, battle | running, warning, ended | | [ ] |
| C29 | Command palette (new) | global | open, results, empty, keyboard | | [ ] |

## Brand assets

| Id | Asset | Today | PR | Status |
|---|---|---|---|---|
| B1 | Site logo | `{ }` text in an amber rounded square | | [ ] |
| B2 | Favicon | inline SVG data URI of the same | | [ ] |
| B3 | Social preview image | none | | [ ] |
| B4 | `<meta name="theme-color">`, app name | none | | [ ] |
