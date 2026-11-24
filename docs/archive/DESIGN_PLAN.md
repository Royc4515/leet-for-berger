Stage F5 · Phase 1 · research and plan

# Leet-For-Berger design plan

An audit of every screen at 1440 and 390 px, one design direction for the whole product, and ten PR-sized steps to get there. No code has been changed. Execution starts after the owner approves.

Waiting for approval · 2026-11-20

[1 Verdict](#verdict)[2 Screen audit](#audit)[3 Direction](#direction)[4 Mockups](#mockups)[5 Steps](#plan)[6 Owner decisions](#decisions)

1

## Verdict: solid on desktop, unfinished on a phone, no shared component rules

The dark IDE look with one amber accent is right for this product and stays. The work is in three places: the phone layout, the pickers, and consistency. All 42 screenshots rendered with zero console errors and no sideways page scroll.

2 of 4

### Nav links visible at 390 px

Companies and Modes sit behind a faded sideways scroll. A first-time phone visitor cannot tell they exist.

\~93%

### Controls under 32 px tall

212 of 229 interactive elements on the phone dashboard are shorter than 32 px. Chips are 24 px, table links 20 px. The touch minimum is 44 px.

12 sizes

### Type scale has drifted

Twelve font sizes from 10 to 26 px, with 12 px the most used and a 12.5 px in between. Body copy is 14 px but most of the UI reads at 12.

6 jobs

### Amber does everything

Brand, primary button, selected chip, Medium difficulty, the "Major in Israel" tag and progress bars are all the same amber. On the company page nothing stands out because everything does.

0 loaded

### Fonts are named, never loaded

The CSS asks for Inter and JetBrains Mono but nothing ships them. Visitors get Segoe UI, Roboto or San Francisco, so the site looks different on every machine.

3 fails

### Contrast below the bar

Muted text on the lightest panel is 4.19:1 (needs 4.5). White on the red danger button is 3.48:1. Input and chip borders are 1.3 to 1.7:1 (controls need 3).

### The two known asks, checked against today's build

- **Company buttons instead of a plain list.** The Companies page already uses cards. The plain lists that remain are the interview company picker (51 small chips in a clipped 240 px box) and the "Practice" text links on a company page. Both are in the plan.
- **Readable pickers in every mode.** Interview and battle each built their own picker with different shapes and sizes. The plan replaces both with one shared picker component.

2

## Screen audit

Before screenshots from the current build. Click any image to enlarge. Desktop is 1440×900, phone is 390×844.

### Shell: header, nav, account menu

Desktop, account menu open

Phone

#### Works

- Compact 52 px header, clear active link, skip link, visible focus ring.
- Sign-in menu is short and says what signing in does.

#### Weak

- Phone: only Problems and Learning Path are visible. The brand name is dropped and the logo mark is the only way home.
- Active link is marked by colour only, no `aria-current`.
- The account menu is `role="menu"` but has no arrow-key handling or Escape to close; on the phone it covers the page title with no backdrop.
- The streak chip is an emoji with a number and no label for screen readers.
- Route loading is a bare "Loading..." line; not-found is an empty page with one button.

### Dashboard (Problem Bank)

Desktop

Phone: four stat cards fill the first screen

#### Works

- Clear order on desktop: stats, today's problem, filters, table.
- Honest empty state for weak spots.

#### Weak

- Phone: the first problem row starts about 1,100 px down. Four full-width stat cards plus two info cards come first.
- The page column is 900 px on a 1440 screen, so the table wastes half the width while the Topics column shows one tag.
- Two chip rows (difficulty and topic) look identical and sit on one line with nothing separating the groups.
- Problem of the day has no button; the title is the only link. A new visitor has no obvious "start here".
- A zero-state stat row (0, 0 days, -, 0) is the loudest thing a new visitor sees.
- Table rows are 32 px with the link only on the title text.

### Problem workspace

Before Run

After Submit, accepted

Walkthrough open

Mentor open: Run Code is cut off, Submit is gone

Phone, top of the page

Phone, scrolled to the editor

Phone, mentor sheet

#### Works

- The classic split is right: statement left, editor and console right, both resizable.
- Verdict line is strong (colour plus word plus counts). Case tabs carry a status dot.
- Growth estimate is honest about being an estimate.

#### Weak

- The context box (companies, complexity, four family versions) comes before the statement and takes about 330 px. On a 900 px screen the task text starts below the middle.
- Opening the mentor squeezes the toolbar until Submit disappears.
- Monaco's stock background (#1e1e1e) does not match the panels around it.
- Run Code and Submit are the same size and sit next to two ghost buttons; the toolbar has no grouping.
- Phone: one long scroll. Statement, context, walkthrough, submissions, custom input, then the editor at 88% of the screen height. Run and Submit scroll off with the toolbar, which itself scrolls sideways. Results land below the editor, off screen.
- Phone mentor sheet covers the editor and the Run buttons.
- "Accepted. Nice work." toast appears bottom right over the console at low contrast.

### Learning path

Desktop

Phone: subtopic wraps beside the title

#### Works

- Best screen in the product: one summary, one primary button ("Next up"), tiers that open in place, the next problem highlighted.

#### Weak

- The global progress bar is 3 px and reads as a divider.
- Collapsed topics show "0 / 11" but no bar, so the tier's shape is invisible until opened.
- Phone: the subtopic label wraps into a narrow second column beside the title ("Complement / lookup").
- Rows are links only on the title text; 26 px tall.

### Companies list and company page

Companies

Company page

Phone: one card per row, about five per screen

Phone: titles wrap to four lines

#### Works

- Cards already exist here, ordered by hiring in Israel, with a scope switch and search.
- The company table says honestly what is "Not on the site yet".

#### Weak

- Every card carries the same amber "Major in Israel" tag, so the tag carries no information in the default view.
- "147 tagged problems / 52 to practice here, 1 solved" is two lines of small grey text. Progress should be a bar.
- Company page: "Practice" is bold text, not a button. The frequency column is an amber bar with no scale next to a second time label.
- Phone: the table keeps its columns, so titles get about 80 px and wrap to four lines.
- Filters mix a select and a checkbox here, chips on the dashboard, segmented on the list.

### Modes hub

Desktop: three cards, two thirds of the page empty

Phone

#### Works

- Honest status tags (Live, Bot only, Offline).

#### Weak

- The copy explains the roadmap ("server-side judge, roadmap Phase 3", "LLM provider plugs into the same interface") instead of what the user gets.
- Two primary buttons side by side. AI Mentor is not a mode; its button goes to the problem list.
- No sign of past sessions or a last score.

### Interview and Mock OA: setup, session, report

Setup

Active session

Phone setup: chip box clips mid-row

Phone session

Report

#### Works

- Format, company, a summary of what you will get, rules, then Start. The order is right.
- Lockdown is real: the header is gone and the banner has one exit.
- The report is plain and readable.

#### Weak

- The company picker is 51 chips of 24 px in a box that cuts the last row in half. "Nvidia (51) ★" needs a legend to read.
- The three formats are bare chips. What differs (time, number and level of problems) only appears lower down after you pick.
- Start is below the fold on a 900 px screen and on the phone.
- Session banner: the timer is small mono text and "Tab switches: 0" is grey on grey. The problem switcher does not show per-problem status.
- Report: the score ring is a grey circle with a number. No colour, no per-problem difficulty, and no link back into each problem to review.

### Battle: setup and race

Setup

Race

#### Works

- The problem picker shows title, difficulty and topic per row, with search, filters and Random.
- The race banner compares you and the bot on one scale.

#### Weak

- The list is a 300 px scroll box inside a card inside the page: three nested scroll areas on the phone.
- Difficulty is chips but topic is a select, in the same row.
- Opponents are three bare chips with no hint of how fast each bot is.
- Race bars are 3 px tall and both grey at the start; "You" and the bot are told apart only by the label.
- The header and nav stay visible during a race, unlike the interview.

### Privacy page

Desktop

Phone

#### Works

- Readable measure, plain language, clear headings.

#### Weak

- No way back except the logo mark. No nav, and no footer anywhere in the app links to it apart from the sign-in menu.

3

## Design direction: a quiet instrument

Keep the dark, IDE-adjacent palette. Make amber mean exactly two things, action and selection. Give every control one shape per job, a height that works for a finger, and text that never drops below 12 px. All of it stays in `src/css/app.css` as tokens at the top and plain class selectors below.

### Tokens

| Group | Today | Proposed | Why |
| --- | --- | --- | --- |
| Surfaces | bg, panel, panel-2, panel-3 | Keep all four. Rule: page = bg, card = panel, inset or hover = panel-2, selected or pressed = panel-3. | The values are good; the usage is ad hoc. |
| Text | --muted #7f8792 | #8f97a3 | 5.16:1 on panel-3 (was 4.19). Passes AA on every surface. |
| Borders | --border 1.33:1 --border-strong 1.72:1 | add --border-control #646d7a | 3.2 to 3.7:1. Used on inputs, selects, chips, segmented. Decorative borders stay as they are. |
| Accent | Amber for brand, primary, selected, Medium, Israel tag, bars | Amber for the primary action, the selected state and focus. Nothing else. | One meaning, so it works as a signal again. |
| Difficulty | --medium = --accent | --medium #e3b341, shown as dot + word, no filled pill | Separates Medium from "selected" by hue and by form. |
| Danger | white on #f05252 = 3.48:1 | white on --bad-solid #cf3636 = 4.96:1 | --bad stays for text and icons; the solid button gets its own token. |
| Type scale | 10, 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 22, 26 | --fs-xs 12 · --fs-sm 13 · --fs-md 14 · --fs-lg 16 · --fs-xl 20 · --fs-2xl 26 | Six steps. 12 is the floor. Body is 14, and 15 on phones. |
| Fonts | Inter and JetBrains Mono named, not loaded | Self-host both as woff2 in `src/fonts/` with `font-display: swap` (owner decision 1) | Same look everywhere. No new CDN, so invariant 8 is untouched. |
| Spacing | 4, 6, 8, 10, 12, 14, 16, 20, 28 ... | --s-1 4 · --s-2 8 · --s-3 12 · --s-4 16 · --s-5 24 · --s-6 32 · --s-7 48 | 4 px base. Inside a component 8 or 12, between components 16, between sections 32. |
| Radius | 2, 3, 4, 6, 7, 10, 999 | --r-sm 6 (controls) · --r-md 10 (cards, dialogs) · --r-pill | Tags use 4 px to look different from chips. |
| Control height | 24 to 32 px, unspecified | --ctl-sm 30 · --ctl-md 36 · --ctl-lg 44; under `@media (pointer: coarse)` sm and md both become 44 | Dense on a mouse, safe on a finger, one switch. |
| Page width | 900 px | --page 1120 px, --page-narrow 720 px | Uses a laptop screen; forms and reading pages stay narrow. |
| Motion | 0.15s, one easing | --t-fast 120ms, --t-med 200ms, existing --ease | Already respects reduced motion. Keep. |

### Components

Each has one job. Rendered below with the proposed tokens.

Button

SubmitRun codeReveal solutionEnd interviewRandomStart interview

Chip (filter)

EasyMediumHard

Segmented (one of)

Hiring in IsraelTop in IsraelAll

Tag (static)

Arrays / StringsHash MapNot on the site yet

Difficulty

EasyMediumHard

Input

Search problems

Option card

Nv**Nvidia**52 problems

Wx**WixIL**40 problems

| Component | Job | Rule |
| --- | --- | --- |
| Button | Does something | Primary, secondary, ghost, danger. Three heights. One primary per screen. A real `<button>`, or `<a>` if it navigates. |
| Chip | Toggles a filter (many can be on) | Pill, control border, `aria-pressed`. Selected = accent border + soft fill + check mark, so it is not colour alone. |
| Segmented | Picks one view of the same data | Rectangular track. Used for scope (Hiring / Top / All) and for the phone workspace tabs. |
| Tag | Static label | 4 px radius, no border, never clickable. Replaces the amber "Major in Israel" pill with a small **IL** mark beside Israeli companies only. |
| Difficulty | Easy, Medium, Hard | Dot + word in the semantic colour. Same everywhere: tables, pickers, headers. |
| Card | Groups content, or is one big link | If clickable, the whole card is one `<a>` or `<button>` with a hover and focus state. No card inside a card. |
| Option card | One choice in a picker | Monogram, name, one fact, optional progress bar. Used for companies, formats and opponents. |
| Picker | Choose one from many (new, shared) | Search + scope segmented + grid or list of options + a "Selected: X" line with `aria-live`. One module in `src/js/ui/picker.js`, used by interview, battle and the companies page. |
| List row | Tables on a phone | Under 640 px a table becomes rows: title on line one, difficulty and tags on line two, the whole row one link, 52 px minimum. |
| Dialog | Confirm a destructive or irreversible step | Native `<dialog>` as today. Title is the question, the confirm button repeats the verb. Full width at the bottom on phones. |
| Toast | Confirms something that already happened | Top centre under the header, solid panel with a coloured left edge, `role="status"`. Never the only place a result is shown. |
| Nav | Four destinations | Header links from 821 px up. Bottom tab bar with icon and label at 820 px and below. `aria-current="page"` on the active one. Hidden in sessions. |
| States | Empty, loading, error | One `.state` block: a line saying what is missing and one action. Loading uses skeleton rows the same height as the real ones. |

### Rules that keep screens consistent

- Every browse page has the same top: title, one line of context, then at most one row of controls.
- One primary button per screen. If two things compete, the second is secondary.
- Amber means "do this" or "this is selected". Status uses green, red and the neutral tag.
- Text is never smaller than 12 px, and never grey-on-grey below 4.5:1.
- Filters are chips, exclusive scopes are segmented, long lists of options are a picker. A select is used only inside dense toolbars (language).
- State is never colour alone: selected has a check, solved has a filled dot and the word, failed has a word.
- Any control a finger can reach is at least 44 px tall on touch devices.
- No nested scroll boxes on a phone. The page scrolls; pickers page or open full height.
- UI copy says what the user gets, not how the system is built. No roadmap phases in the interface.
- New colours, sizes and radii come from tokens. A literal value in a component rule is a review comment.

4

## Mockups of the key screens

Built with the proposed tokens. Content is real data from today's build. These show layout and hierarchy; spacing gets tuned in each PR against screenshots.

{ }**Problems**1 daySign in

**1**solved

**1 d**streak

**100%**accuracy

**1**submits

Problem of the day

**Smaller Count**\
Easy

Solve

Search 205 problems

AllEasyMediumHardTopic

**Smallest Base Segment**Arrays / Strings

Medium

**Notify Recipients**Arrays / Strings

Medium

**Reverse List**Arrays / Strings

Easy

**Pair Sum Target**Arrays / Strings · solved

Easy

ProblemsPathCompaniesModes

**Phone dashboard.** All four destinations in a bottom bar. Stats collapse to one strip. Today's problem gets the one primary button. Problems are rows, first row visible without scrolling.

←**Pair Sum Target**Easy

DescriptionCodeResults

JavaScript ▾Mentor⋯

/\*\* * @param {number\[\]} nums * @param {number} target * @return {number\[\]} \*/ function pairSum(nums, target) { const seen = new Map(); for (let j = 0; j \< nums.length; j++) { // ... } }

**Wrong answer** · 0 / 15 passed · Run\
Tap to see the 5 detailed cases

RunSubmit

**Phone workspace.** Three tabs instead of one long scroll. Run and Submit stay pinned at the bottom in place of the tab bar. A run switches to Results or shows the one-line verdict here.

←**Mock OA and interview**

Format

**Phone screen**45 min1 Easy + 1 Medium

**Online assessment**70 min1 Easy + 1 Medium

**Hard OA**90 min2 Medium + 1 Hard

Company (optional)

Search 51 companies

***Any**199 problems

Nv**Nvidia**51 problems

In**Intel**20 problems

Wx**WixIL**37 problems

**Online assessment**\
Any company · 70 min

Start interview

**Interview setup.** Formats are cards that show time and problem mix before you pick. Companies are the same option cards as the Companies page. Start is pinned with a summary of the choice. Duration is illustrative for Phone screen.

{ }**Leet-For-Berger**

ProblemsLearning PathCompaniesModes

1 day

##### Practice by company

57 companies hiring in Israel. Pick one to practice the problems it asks most.

Hiring in IsraelTop in IsraelAll

Search companies

Nv**Nvidia**1 of 52 solved

In**Intel**1 of 21 solved

Am**AmdocsIL**0 of 1 solved

Ms**Microsoft**1 of 56 solved

Mb**MobileyeIL**0 of 1 solved

CP**Check PointIL**0 of 5 solved

Wx**WixIL**1 of 40 solved

PA**Palo Alto Networks**1 of 40 solved

Ap**Apple**1 of 54 solved

Go**Google**1 of 54 solved

**Companies.** The same option card as the interview picker: monogram, name, an IL mark only where it adds information, and progress as a bar. Monograms are letters, not logos, so there is no trademark or asset question. Two columns on a phone.

5

## Execution: ten PR-sized steps, in order

Each step is one branch and one PR that passes `npm run check`, updates CHANGELOG, and attaches before and after screenshots at 1440 and 390. Foundations first so later screens only compose what exists. Every PR also keeps: zero console errors, no sideways scroll at 390 on every route (existing e2e loop), and a keyboard pass of the changed screen.

Step 1

### Tokens and the e2e safety net

feat/design-tokens

#### Change

- Add the type, spacing, radius, control-height and page-width tokens. Fix --muted, add --border-control and --bad-solid, split --medium from --accent.
- Replace the 12 font sizes and stray radii in app.css with tokens. No layout changes.
- Self-host fonts if decision 1 is yes.
- New `docs/DESIGN.md` with the tokens, components and rules from section 3; linked from CLAUDE.md.

#### Acceptance

- New unit test `tests/design-tokens.test.js`: parses the `:root` block, asserts each text token is ≥ 4.5:1 on each surface, control border ≥ 3:1, button ink pairs ≥ 4.5:1.
- Same test fails on any `font-size` below 12 px or not from the scale.
- `e2e/smoke.mjs --shots` also writes a 390 px set for every route.
- Screenshots: every screen looks the same apart from slightly larger small text.

Risk: invariant 8 (pinned CDN versions) if fonts came from a CDN. Self-hosting avoids it. Larger small text can wrap in the workspace toolbar; checked in the screenshots.

Step 2

### Shell: header, phone tab bar, account menu, dialogs, toasts, page states

feat/design-shell

#### Change

- Bottom tab bar at 820 px and below (four real links, inline SVG icons, safe-area padding). Header keeps mark, page title, streak, account.
- `aria-current="page"` on the active link in both navs.
- Account menu: Escape and outside click close it, focus returns to the toggle, arrow keys move between items.
- Streak chip gets a text label for screen readers.
- Dialog and toast restyle. Shared `.state` block for loading, not found and load errors. A small footer with the Privacy link on browse pages; privacy.html gets the header and a back link.

#### Acceptance

- e2e at 390: all four nav links are inside the viewport and at least 44 px tall; exactly one has `aria-current` after each navigation.
- e2e: during an interview neither the header nor the tab bar is visible (extends the existing lockdown check).
- e2e: account menu opens, Escape closes it, focus is back on the toggle. supabase-js lazy-load assertions unchanged.
- Keyboard: Tab order is skip link, header, content, tab bar.

Risk: the tab bar must not cover content or Monaco. `#view` gets bottom padding equal to the bar; the workspace replaces the bar with its action bar in step 7. The bar lives in index.html, not in a view, so invariant 7 (cleanup) is not involved.

Step 3

### Core components

feat/design-components

#### Change

- Buttons, chips, segmented, tags, difficulty, inputs, selects, cards and tables restyled to the spec, with the coarse-pointer 44 px rule.
- Small helpers in `ui/dom.js` or a new `ui/components.js`: `difficulty()`, `chipGroup()`, `segmented()`, `stateBlock()`, so views stop hand-building them.
- Views switch to the helpers; no layout change yet.

#### Acceptance

- e2e at 390 with touch emulation: on the dashboard, companies and both setup screens, no visible button, link or input is under 44 px tall (allow-list for inline text links).
- Existing selectors used by e2e keep working (`.chip-group[aria-label]`, `.segmented-btn`, `.company-card`, `.pick-row`) or are updated in the same PR.
- Screenshots: chips and tags are visibly different shapes on every screen.

Risk: invariant 4. Helpers build with `h()` and text nodes only; no `innerHTML`. Helpers stay DOM-only and do not leak into pure modules (invariant 6).

Step 4

### Dashboard

feat/design-dashboard

#### Change

- 1120 px page. Stats become one strip; a new visitor sees a short "Start with the learning path or today's problem" block instead of four zeros.
- Problem of the day gets a Solve button. Weak spots sit beside it.
- Search first, then difficulty chips and a topic control, with a result count and a "Clear filters" empty state.
- Table rows are full-row links with a solved state that is a dot plus text; list rows under 640 px.

#### Acceptance

- e2e at 390: the first problem link is within the first 844 px of the page.
- Existing checks kept: stats update after a solve, today card link, weak list.
- e2e: a filter combination with no results shows the empty state and Clear restores the list.

Risk: ADR 0008 load budget. No new modules on the first paint of `#/` beyond the shared components file; the existing request-count check guards it.

Step 5

### Companies list and company page

feat/design-companies

#### Change

- Company option cards: monogram, name, IL mark, "x of y solved" with a bar. Two columns on a phone.
- Company page: header with progress, filters as chips, Practice as a real button, frequency as a labelled 3-step meter, list rows on a phone.
- "Not on the site yet" rows are visually quieter and grouped by the "On the site only" toggle, which defaults on for phones.

#### Acceptance

- Existing e2e counts for Hiring, Top and All stay green.
- e2e at 390: no problem title on a company page wraps past two lines.
- Every Practice control is a `<a>` with an accessible name that includes the problem title.

Risk: company names come from data and are rendered with `h()` only (invariant 4). Monogram derivation is a pure function with a unit test.

Step 6

### Shared picker, then interview and battle setup

feat/design-pickers

#### Change

- `ui/picker.js`: search, optional scope, option grid or list, selected line with `aria-live`, roving focus with arrow keys. Returns a cleanup.
- Interview: format cards with time and mix, company picker using the company card, pinned Start bar with a summary. Rules collapse to three short lines.
- Battle: opponent cards with a one-line description, problem picker with difficulty chips and topic chips (no select), no inner scroll box on phones.

#### Acceptance

- Existing interview and battle e2e flows pass (format, company, All, Random, empty state, start).
- e2e at 390 and 1440: the Start button is in the viewport as soon as the setup screen renders.
- Keyboard: arrows move inside the picker, Enter selects, Tab leaves it; the selected option has `aria-pressed="true"`.
- Unit test for the picker's pure filter function.

Risk: `modes/*.js` stay pure (invariant 6); the picker only reads their output. The picker registers listeners, so its cleanup must be chained into the view's (invariant 7).

Step 7

### Workspace

feat/design-workspace

#### Change

- Desktop: statement first; companies, complexity and family versions move into a collapsed "About this problem" block under the tags. Toolbar grouped: language and reset left, Mentor and Reveal in the middle, Run and Submit right and never clipped. A Monaco theme that matches the panels.
- Mentor opens as a third column only above 1200 px; below that it overlays the left pane, not the editor.
- Results: verdict header, case tabs with pass or fail words for screen readers, hidden cases as a compact grid.
- Phone: Description, Code, Results tabs; pinned Run and Submit bar replaces the tab bar; mentor is a full-height sheet.

#### Acceptance

- All existing workspace e2e steps pass: 15 cases, 5 tabs, 10 hidden pills, resizer, description pane overflow, growth, history, walkthrough.
- e2e: with the mentor open at 1440, Run Code and Submit are fully inside the viewport.
- e2e at 390: Run and Submit are visible without scrolling on the Code tab; after Run, the verdict is visible without scrolling.
- Verdict regions keep `role="status"`; tabs follow the ARIA tabs pattern.

Risk: the largest step. Invariant 3: the results redesign renders only what `judge()` returns, never raw case data. Invariant 7: tab switching must call `editor.layout()` and its listeners go into the existing cleanup. Monaco must not be re-created on tab switch. A custom Monaco theme is defined through the pinned 0.52.2 API, no upgrade.

Step 8

### Sessions: interview banner and report, battle race and result

feat/design-sessions

#### Change

- One session banner component: large tabular timer, state text, one exit. Timer turns to the warning colour in the last five minutes, with a single `aria-live` announcement.
- Problem switcher shows per-problem status (not started, tried, solved).
- Report: score with colour bands, per-problem rows with difficulty and a "Review" link, clear next actions.
- Battle: thicker bars in two distinct colours with labels; the header is hidden during a race like the interview.

#### Acceptance

- Existing lockdown, end dialog, score ring and race row checks pass.
- e2e: nav is hidden during a race and returns after it.
- Timer colour change is not the only signal: the text "5 minutes left" appears once.

Risk: invariant 6. Time stays a parameter (`now`) in the pure session logic; the banner only renders it. Hiding nav in battle changes behaviour, so it is listed in owner decisions.

Step 9

### Learning path

feat/design-path

#### Change

- A thicker overall bar with the count; each collapsed topic shows its own mini bar.
- Rows: full-row links, subtopic on a second line on phones, difficulty in the shared form.
- Tiers get a one-line description of what finishing them means.

#### Acceptance

- Existing e2e: tier count, 131 problems, "Next up" target.
- e2e at 390: no row shows a two-column wrap of the subtopic.
- Topic disclosure buttons have `aria-expanded`.

Step 10

### Modes hub, privacy, final sweep

feat/design-polish

#### Change

- Modes hub: two mode cards (Interview, Battle) with user-facing copy, last result if one exists, one primary. AI Mentor moves to a short note linking to a problem.
- Privacy page on the shared tokens and shell.
- Sweep: remove dead CSS, check every screen against the rules list, update README screenshots, tick F5 and stage E in docs/PLAN.md.

#### Acceptance

- e2e: the hub has exactly one primary button; mode cards count updated in the same PR (today's test expects 3).
- Full before and after gallery of all 21 screens at both sizes attached to the PR.
- Manual keyboard-only run of one full flow: pick a problem, run, submit, start and end an interview.

Risk: copy changes must not overpromise. The known limits in CLAUDE.md (bot only, scripted mentor, editor-only languages in sessions) stay stated in plain words.

6

## Decisions for the owner

Each has a recommendation. The plan works with either answer; these change scope, not order.

| # | Question | Recommendation | If no |
| --- | --- | --- | --- |
| 1 | Self-host Inter and JetBrains Mono (about 150 to 200 KB of woff2, loaded with swap)? | Yes. It is the only way the site looks the same on every machine. | Switch the tokens to an honest system stack and drop the unused names. |
| 2 | Bottom tab bar on phones, replaced by Run and Submit inside a problem? | Yes. It is the pattern phone users already know. | A menu button in the header that opens the four links. |
| 3 | Hide the header during a battle, like the interview? | Yes, with a visible "Leave race" button. A race is a session. | Keep nav; only restyle the banner. |
| 4 | Remove AI Mentor as a third "mode" card until the real mentor (F4) ships? | Yes. Keep it as a note on the hub and a button in the workspace. | Keep three cards with clearer copy. |
| 5 | Light theme? | Not in F5. The tokens will make it possible later; doing it now doubles the screenshot and contrast work. | Add as step 11 after the sweep. |
| 6 | Hebrew or RTL? | Out of scope. New CSS will use logical properties (`margin-inline`, `inset-inline`) so it is cheap later. | Needs its own plan. |