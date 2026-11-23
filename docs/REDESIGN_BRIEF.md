# Redesign brief: research-led, with an interactive Problem Map

Status: written 2026-11-23, not started. Stage F6 in `docs/PLAN.md`. To run it, start a fresh session and give the agent this file as its prompt ("Read docs/REDESIGN_BRIEF.md and execute it").

Context for the agent: a first design pass already shipped (stage F5, `docs/DESIGN_PLAN.md`, ten PRs, #33 to #42). It fixed consistency, phone layouts and touch targets inside the "quiet instrument" direction. This brief goes further: a research-led redesign of the whole site with no style decided in advance. Learn from what F5 decided and why, but you are not bound by it.

---

You are redesigning Leet-For-Berger, a static vanilla-JS SPA for coding practice (LeetCode / HackerRank style, no framework, no bundler, GitHub Pages). The goal: a site so good to use that it feels unbelievable, with an **interactive Problem Map** instead of only a list, and design, effects and animation that are genuinely excellent.

**You are not committed to any style.** No palette, font, layout, metaphor or motion language is decided in advance. The current look (`docs/DESIGN.md`, and the F5 plan in `docs/DESIGN_PLAN.md`) describes where the site is today. Treat it as input, not as a constraint. You decide the design, and you decide it from research, prototypes and explicit criteria, not from taste or habit.

What is fixed is quality and engineering (Section 1). Everything visual is open (Section 2).

---

## 1. Fixed: non-negotiable (engineering and quality, not style)

- Read `CLAUDE.md` in full first. Every invariant there holds: 15 cases per run, expected values never reach a worker, hidden case data never reaches the UI, user strings never through `innerHTML`, pure modules stay pure (time passed as `now`), every view returns a cleanup function, CDN versions pinned, zero console errors, no secrets in the client.
- No framework and no bundler. Any new runtime dependency (graph library, animation library, font) needs an ADR in `docs/adr/` with its size and license, written before it is added.
- Copy rules from `CLAUDE.md`: no em dashes anywhere, short direct UI copy, no exclamation marks except genuine success states, English.
- Accessibility: WCAG 2.1 AA contrast, full keyboard use, real buttons and links, screen reader support, touch targets at least 44 px on touch devices, text never under 12 px, `prefers-reduced-motion` respected everywhere.
- Performance: 60 fps on a mid-range laptop and phone during interaction, no main-thread task over 50 ms while the user interacts, animate compositor-friendly properties.
- Works at 390 px and 1440 px with no sideways page scroll.
- Required outcomes: (1) an interactive Problem Map that lets people explore the problems spatially, with a complete list view kept as the accessible alternative; (2) **every screen, state and component in the site is redesigned and implemented**, not only the main views, and (3) **the whole site reads as one coherent design**: same tokens, same components, same motion language, same voice, from the header to a 404. No screen may be left in the old style when the work is done.
- **You make every decision.** Style, metaphor, logos versus monograms, whether the Learning Path and the map merge, which ideas to keep, the order of work: all yours. Do not stop to ask me to choose. Decide, write down why in the decision docs, and keep going.

## 2. Open: you decide all of this

Visual identity (colors, including whether the amber accent stays, dark, light or both), typography (self-hosted, properly licensed), layout and navigation structure, density, component shapes, iconography, illustration, the map's metaphor (graph, skill tree, subway map, territory, constellation, something else), motion language and personality, celebration moments, gamification, sound (if any, off by default). The "quiet instrument" direction in `DESIGN.md` may be kept, evolved or replaced. Whatever you choose, justify it.

## 2.5 Surfaces that need special attention

These are places where the site can be much more beautiful and interactive than it is today. For each one the problem and the goal are given; the solution is yours to find in research. Research each surface specifically (Phase A), and give each one its own designed treatment (Phase B), not just a reskin. This list is a starting point: audit every screen and add any surface you find that deserves the same care.

1. **Company identity and the Companies page.** Today each of the 193 companies is a two-letter monogram (`monogram()` in `src/js/data/company-sets.js`, deliberately "letters, not logos, so there is no trademark or asset to ship"). Goal: companies should be recognizable at a glance, and the company page should feel like a briefing on that company (what it asks, how often, how far along you are, Israel hiring context from `content/israel-hiring.json`).
   - Real logos or a better monogram system: your decision, based on research and on what can be sourced cleanly. If you choose real logos, note they reverse a documented decision, so they need an ADR first: source, license and trademark position for each logo, how they are stored, and what happens for companies with no clean source.
   - Never hotlink a third-party logo or favicon service (it leaks every visitor's IP to that service, breaks when the service changes, and adds an unpinned external dependency). Logos are self-hosted files generated by a script under `scripts/content/` with a manifest of source and license per logo, the way the repo generates its other data.
   - Many Israeli companies will have no usable logo. The fallback (an improved monogram or another treatment) must look intentional next to real logos, not like a missing image.
   - Logos must stay legible on your chosen background and must not be recolored or distorted beyond what each brand's guidelines allow. Decide how a page of 193 different brand colors stays calm.
2. **Daily Challenge.** Today it is one card on the dashboard (`dailyProblem()` in `src/js/data/recommend.js`, the same problem for everyone each day, picked from the essential path). Goal: a reason to come back every day. Research how products make a daily ritual feel special (calendar or history view, streak, time until the next one, monthly progress, a distinct visual identity for "today"). Everything must come from real local data; no fake leaderboards or invented social activity.
3. **Learning mode / Learning Path.** Today `src/js/ui/views/path.js` is a long collapsible list of 131 problems by tier and topic with progress bars. Goal: an interactive, motivating experience of moving through the curriculum: seeing the whole journey, where you are, what unlocks next, and feeling progress when it happens. Decide whether the Learning Path and the Problem Map are one experience or two connected ones, and justify it.
4. **Problems page (the list).** Today it is the dashboard in `src/js/ui/views/dashboard.js`: daily card, weak spots, search, filters, table. Goal: finding the right problem fast and enjoying browsing: search, filters, status, difficulty, companies, and a clear way to switch to the map. The list view must stay excellent on its own; it is also the accessible alternative to the map.
5. **Problem workspace.** Statement, Monaco editor, run/submit, the 15-case results console, verdict, hints (scripted mentor), reveal solution. Goal: the moment of running code and getting a verdict should be the best moment on the site, without ever distracting from the code. Invariants 1 to 3 (15 cases, no expected values in workers, hidden data never in the UI) shape what can be shown.
6. **Modes: Interview Simulator, Battle (vs. bot), Mock OA.** Goal: each mode should feel like its own experience (timer pressure, an opponent, an exam room) while staying in the same design system. Battle is bot-only and must not pretend otherwise.
7. **The rest of the system:** the site's own logo, favicon and social preview image; header, navigation and the mobile tab bar; streak chip and account menu; empty, loading (Monaco, Pyodide and sql.js take time) and error states; toasts and dialogs; a 404 route.

---

## 3. Phase A: Learn the product, then research the world

### A1. Learn what you are designing for

Read the data and screens before looking outside:
- Data: `src/js/data/taxonomy.js` (26 topics, tiers, `prereqs`, ordered `concepts`), `learning-path.js`, `families.js`, `problem-meta.js`, `company-sets.js`, `recommend.js`, `src/js/problems/index.js` + `catalog.js`, progress in `src/js/state/progress.js`.
- Views: `src/js/ui/views/*.js`, `src/css/app.css`, `index.html`.
- Run the app (`npm run dev`) and screenshot every current view at 1440 and 390 px so you know the baseline.
- Build a complete **screen inventory** in `docs/research/SCREEN_INVENTORY.md`. It is the checklist the whole project is measured against. Include at least:
  - every route in `src/js/main.js`: `#/` (problems), `#/problem/:id` (workspace), `#/path`, `#/companies`, `#/companies/:slug`, `#/modes`, `#/interview`, `#/battle`, plus the not-found and could-not-load states and the new map route;
  - every state of each screen: loading, empty, error, signed in and out, first visit versus returning user, before and after a run, every verdict type, timers running and finished, mobile layouts;
  - every shared component: header, nav, mobile tab bar, streak chip, account menu (`ui/account-menu.js`), pickers (`ui/picker.js`), results console (`ui/results.js`), mentor panel (`ui/mentor-panel.js`), problem context and extras, resizer, editor chrome and the textarea fallback, confirm dialogs, toasts, skip link, footer, buttons, chips, tables, tabs, form controls, focus rings;
  - brand assets: site logo, favicon, social preview image.
  Give every item an id, a baseline screenshot path, and later the PR that redesigns it.

Write down who the user is (students and job seekers grinding for interviews, often for hours, often Israeli tech hiring) and what each screen must help them do.

### A2. Collect references, broadly

Look wide before you look deep. Do not settle on the first aesthetic you like, and include references outside the usual "dark developer tool" look.

1. **Coding practice and challenge sites**: LeetCode, HackerRank, NeetCode, Codeforces, AlgoExpert, Exercism, CodeSignal, Codewars, Brilliant, Boot.dev, roadmap.sh, Advent of Code.
2. **Learning paths and progress**: Duolingo, Khan Academy, Brilliant, Coursera, language and fitness apps with streaks and paths.
3. **Interactive maps, graphs and skill trees**: roadmap.sh, Obsidian graph view, game skill and tech trees (as interaction references), subway map visualizations, data-viz work (Observable, The Pudding, NYT graphics).
4. **Design galleries and motion**: Awwwards, Godly, Mobbin, Dribbble and Behance (search "coding platform", "learning roadmap", "skill tree UI", "progress dashboard"), Refero, Land-book, Codrops demos.
5. **Product sites known for craft**: Linear, Raycast, Vercel, Stripe, Arc, Figma, Notion, and any others you find during research.
6. **Component and effect libraries, as idea sources only** (never added as dependencies): shadcn/ui, Aceternity UI, Magic UI, Motion (Framer Motion) examples, React Flow and Cytoscape demos.

Aim for 30 to 50 references total. Follow good leads you find along the way.

Also research each surface in Section 2.5 on its own: how the best products show company identity and company briefings (job boards, Glassdoor-style company pages, sports team pages), daily rituals (Wordle, Duolingo, LeetCode daily, Advent of Code calendar), curriculum journeys, searchable catalogs with rich filters, code result and test output screens, and timed or competitive modes in games and exam platforms. Give each surface at least 3 references.

### A3. Capture and actually look

- Use the pre-installed Playwright (`require('playwright')`, `chromium.launch()`). For each reference, save full-page screenshots at 1440 px and 390 px, and record a short video (`recordVideo`) of the key interaction: hover, opening an item, a result or verdict, panning or zooming a graph, a path progressing, a command palette.
- Extract 3 to 6 frames from each video (ffmpeg if available, otherwise timed screenshots) and open every screenshot and frame with the Read tool. Describe what you see; do not reason about a site you have not looked at.
- Store everything in the scratchpad, never in the repo.
- Pages behind login: use public pages, docs, marketing pages, or gallery shots (Mobbin, Dribbble) instead. If a site blocks automated access or the network policy refuses the host, note it and move on. Do not try to bypass blocks.

### A4. Analyze

Write `docs/research/DESIGN_REFERENCES.md` (text only, no third-party images committed):
- a table per reference: site, screen, what works, what fails, the idea worth adapting, which of our views it informs;
- recurring patterns across the best references (layout, hierarchy, how progress and locked/unlocked content is shown, how verdicts and success are communicated);
- motion observations with estimated timings and easing from the video frames;
- an anti-patterns list: things that look great in a gallery but hurt a tool used for hours.

**Originality rule**: references are for principles and ideas. Do not reproduce any site's layout, illustrations, icons, color scheme, logos or copy. Credit inspirations in the research doc.

---

## 4. Phase B: Explore directions, then decide

### B1. Three genuinely different directions

From the research, define 3 directions that differ in substance (map metaphor, palette, typography, density, motion personality), not three shades of the same idea. For each: a name, a one-paragraph thesis, the references behind it, palette and type, the map concept, how the workspace verdict feels, and 3 signature moments.

### B2. Prototype them

For each direction, build quick static HTML prototypes in the scratchpad of three screens: the Problem Map, the workspace with a verdict, and the dashboard. Use real data from the repo (import the catalog and taxonomy), not lorem ipsum. Add one small motion prototype of the direction's key moment. Screenshot each at 1440 and 390 px and look at them.

### B3. Score and decide

Score every direction from 1 to 5 on these criteria, and show the table:
1. **Clarity**: can a first-time user tell where they are, what is next and why something is locked within 10 seconds?
2. **Long-session comfort**: would this still feel good after 3 hours of coding?
3. **Distinctiveness**: does it have its own identity, or does it look like a generic template (default purple gradients, glassmorphism everywhere, stock hero sections)? Generic loses.
4. **Fit with the data**: does the map work for 26 topics, 131 subtopics and about 200 problems today, and for 2 to 3 times that later?
5. **Accessibility**: contrast, keyboard, screen reader, reduced motion.
6. **Performance** on a mid-range phone.
7. **Implementation cost** in vanilla JS with no new dependencies.

Run an adversarial self-critique of each direction before scoring. Then choose one direction, or a deliberate hybrid, and write down why, what you rejected, and what you would cut first if time runs short.

### B3.5 Design every surface in the chosen direction

Once the direction is chosen, design each surface from Section 2.5 in it: a prototype at 1440 and 390 px with real data, its interactive behavior described or prototyped (what happens on hover, click, keyboard, success, empty state), and the references that informed it. For company logos, include a sample of at least 20 companies mixing big international names and Israeli companies, so the fallback is visible next to real logos.

### B4. Show me the decision

Publish one private HTML page that contains the moodboard (screenshots grouped by theme, one-line takeaway each), the three directions with their prototypes, the score table, your chosen direction with its reasoning, and the per-surface designs from B3.5. Send it to me so I can follow along, then continue straight to Phase C without waiting. You are the one choosing: do not ask me to pick between options. If I send feedback later, fold it into the next steps.

---

## 5. Phase C: Plan

- Rewrite `docs/DESIGN.md` for the chosen direction: tokens (color, type, spacing, radius, elevation, motion durations and easings), component rules, map rules, motion rules, accessibility rules.
- Add ADRs for the map rendering approach and for any dependency or font.
- Build the shared foundation before any screen: tokens, a component set (buttons, chips, cards, tables, tabs, inputs, dialogs, toasts, progress, status, empty/loading/error blocks, company mark) and motion helpers, each documented in `DESIGN.md`. Screens are then assembled from these, so consistency comes from shared code rather than from discipline.
- A plan doc linked from `docs/PLAN.md`: PR-sized steps, risks (performance, accessibility, mobile gestures, regressions in the workspace), e2e coverage per step, and an explicit "not building" list.
- A **coverage matrix**: every item in `SCREEN_INVENTORY.md` mapped to the PR that redesigns it. The plan is not complete while any inventory item has no PR. "Not building" may cut ideas from the idea pool, never a screen or a state.

## 6. Phase D: Implement

Suggested order, adjust if your design calls for it: design tokens and foundations, then a motion helper, then the map's pure layout module with tests, then the map view, then each other view, then the signature moments, then polish.

Engineering rules for the map, whatever it looks like:
- Layout and state logic live in a pure module (for example `src/js/data/map-layout.js`): deterministic, no DOM, no `Math.random` (seed with `mulberry32` if you want jitter), `now` passed in. Unit-tested: no overlaps, stable output for the same input, prerequisite direction respected, node states (locked / available / in progress / mastered, or whatever states your design defines) derived correctly.
- Rendering choice (SVG, canvas or a mix) justified in the ADR by measured performance.
- Keyboard navigation between nodes, visible focus, a text accessible name for every visual state, deep links that restore view and selection, a cleanup function that removes every listener, animation loop and observer.

Every PR:
- unit tests first for pure logic, and an e2e step in `e2e/smoke.mjs` for each new UI flow (including a reduced-motion run);
- `npm run check` green with zero console errors;
- screenshots at 1440 and 390 px via `--shots` that you open, look at and compare against the prototype;
- a Playwright performance trace for the heaviest interaction, with long tasks and dropped frames reported;
- `CHANGELOG.md` (Unreleased), `docs/PLAN.md` and `docs/DESIGN.md` updated, and the inventory items it covers ticked in `SCREEN_INVENTORY.md`.

### Final consistency pass (its own PR, last)

- Screenshot every inventory item at 1440 and 390 px and put them side by side in one HTML contact sheet (published privately and sent to me), next to the baseline screenshots. Look at every one; anything that looks like it belongs to a different site gets fixed.
- Audit `src/css/app.css` and the views: no hard-coded colors, font sizes, spacing, radii, shadows or durations outside the tokens; no two components doing the same job with different styles; old selectors and unused CSS deleted.
- Check the motion language is consistent: same durations and easings for the same kind of change everywhere, and the reduced-motion e2e run passes on every route.
- Check voice: labels, empty states, errors and success messages use the same tone and the copy rules from `CLAUDE.md`.
- Report the result as a short table: inventory item, before, after, status.

## 7. Idea pool (optional, use, change or discard based on research)

Semantic zoom from topics to concepts to problems; hovering a topic lights its prerequisite chain; a company filter that fades unrelated problems; weak-spot and problem-of-the-day overlays; "next best problem" path from the user's frontier; the 15 test cases resolving one by one after a run (animating only what `judge()` already returns); a first-solve celebration; an unlock moment when a topic opens; a command palette (Ctrl/Cmd+K) that can fly the map to any item; View Transitions between routes; skeleton loaders while Monaco, Pyodide and sql.js load; number tickers and streak growth on the dashboard.

## 8. Acceptance criteria

- A new user understands the map in 10 seconds: where they are, what is next, why something is locked.
- Every item in `SCREEN_INVENTORY.md` is redesigned, implemented and ticked; none remains in the old style.
- The whole site follows one coherent design system documented in `DESIGN.md`, and the final consistency pass is clean.
- Every surface in Section 2.5 has its own designed treatment: recognizable companies with an intentional fallback, a Daily Challenge worth returning for, an interactive learning journey, a fast and pleasant problems list, a verdict moment that feels great, and modes that each feel distinct.
- Fully usable by keyboard, by screen reader (via the list view), on a 390 px touch phone, and with reduced motion.
- All `CLAUDE.md` invariants intact, zero console errors, no new dependency without an ADR.
- Every design decision traces back to a reference, a prototype or a criterion in the research and decision docs.
