# Design system: Atlas

Direction (stage F6, `docs/research/DESIGN_DIRECTIONS.md`): **a territory you light up.** The curriculum is a map of 26 topics in six tiers; every problem is a hex; solving one lights it. The hex is the unit everywhere: on the map, as the status mark in lists, as a day in the daily calendar, as a test case in the verdict, as the company mark and the logo. The ground is warm graphite; there is one lamp colour, amber, and it means **light**: what you have solved and the next thing to do.

Everything lives in [`src/css/app.css`](../src/css/app.css): tokens in `:root` at the top, component rules below, view rules last. Component rules never use a literal colour, font size, radius, shadow or duration; `tests/design-tokens.test.js` enforces contrast, the type floor and token use.

Replaces the F5 "quiet instrument" system (`docs/DESIGN_PLAN.md`, kept for history). What F5 got right stays: one primary per screen, 44 px touch targets, a 12 px floor, state never shown by colour alone, filters as chips, scopes as segmented controls.

## Tokens

### Surfaces and lines

| Token | Value | Use |
|---|---|---|
| `--bg` | `#100f0d` | Page ground, code |
| `--panel` | `#171512` | Cards, panels, header, dialogs |
| `--panel-2` | `#1e1c18` | Inset blocks, hover, map districts |
| `--panel-3` | `#27241f` | Selected, pressed, tags, company tiles |
| `--panel-hover` | `#312d27` | Hover on secondary buttons |
| `--scrim` | warm black, 72% | Behind dialogs and the palette |
| `--border` | `#2c2823` | Decorative hairlines |
| `--border-strong` | `#3d3831` | Card and dialog edges |
| `--border-control` | `#6f675b` | Inputs, chips, segmented (at least 3:1 on every surface) |

### Ink

| Token | Value | Contrast |
|---|---|---|
| `--text` | `#f2ece2` | at least 12:1 on every surface |
| `--text-2` | `#cbc2b5` | at least 8:1 |
| `--muted` | `#a1988a` | at least 4.9:1 on `--panel-3` (AA everywhere) |

### Lamp and semantics

| Token | Value | Meaning |
|---|---|---|
| `--accent` | `#f3a93c` | Solved (lit hexes, progress fills), the primary action, the current position |
| `--accent-hover`, `--accent-ink`, `--accent-soft`, `--accent-line`, `--accent-glow`, `--accent-dim` | | Hover, ink on amber, tints, the assisted (solved with help) hex |
| `--focus` | `#ffc874` | Keyboard focus ring, everywhere |
| `--ok`, `--bad`, `--warn`, `--info` (+ `-soft`) | green, red, yellow, blue | Test results, errors, warnings, informational marks (the IL mark). Never decoration. |
| `--bad-solid` / `--bad-ink` | `#c63a2c` / white | Danger buttons (5.1:1) |
| `--easy`, `--medium`, `--hard` | green, gold, red | Difficulty, always with pips and the word |

Selection is shown by an outline and a check mark, not by amber fill alone; amber fill means "lit".

### Type

| Token | Font | Role |
|---|---|---|
| `--display` | Bricolage Grotesque (ADR 0009) | Page titles, verdicts, district names, big numbers. 13 px and up. |
| `--font` | Inter | Interface and reading text |
| `--mono` | JetBrains Mono | Code, counts, eyebrow labels, key hints |

Scale (px): `--fs-xs` 12 (floor), `--fs-sm` 13, `--fs-md` 14 (15 on touch), `--fs-lg` 16, `--fs-xl` 20, `--fs-2xl` 26, `--fs-3xl` 34, `--fs-display` 48. Line heights: `--lh-tight` 1.1 (display), `--lh-snug` 1.3, `--lh-body` 1.6. Display tracking -1.5% to -3%, only at 20 px and up. Eyebrows: mono, 12 px, uppercase, `--track-label`.

### Space, radius, elevation, size

- Spacing on a 4 px base: `--s-1` 4 to `--s-8` 64. Inside a component 8 or 12; between components 16 or 24; between sections 32 or 48.
- Radii: `--r-tag` 4 (tags, kbd), `--r-sm` 8 (controls), `--r-md` 12 (cards, rows), `--r-lg` 18 (panels, dialogs, the map), `--r-pill`.
- Elevation: `--shadow-1` (popovers, tooltips), `--shadow-2` (dialogs, palette, toasts), `--shadow-lamp` (the one lit element on a screen, sparingly).
- Controls: `--ctl-sm` 30, `--ctl-md` 38, `--ctl-lg` 46; under `pointer: coarse` sm and md become 44.
- Layout: `--page` 1180, `--page-wide` 1560 (map), `--page-narrow` 720 (reading, states), `--header-h` 56, `--tab-bar-h` 60. `--hex` is the shared hexagon clip path.

### Motion

| Token | ms | For |
|---|---|---|
| `--t-instant` | 90 | Row hover, tab highlight |
| `--t-fast` | 140 | Buttons, chips, borders |
| `--t-base` | 220 | Panels, dialogs, toasts, page entrance |
| `--t-slow` | 360 | District entrance, progress fills |
| `--t-stage` | 600 | One signature moment (unlock, first solve) |

Easing: `--ease` (out, default), `--ease-in-out` (things that move across the screen), `--ease-spring` (dialogs, toggles; a small overshoot). The same values are exported from `src/js/ui/motion.js` for script-driven animation.

## Components

| Component | Job | Rules |
|---|---|---|
| Button | Does something | Primary (amber), secondary, ghost, danger; sm, md, lg, icon. One primary per screen. `<button>`, or `<a>` when it navigates. Press: 1 px down, 98.5% scale. |
| Chip | Toggles a filter | Pill, control border, `aria-pressed`; selected = amber outline + soft fill + check mark. A disclosure chip (`aria-expanded`) shows a chevron. |
| Segmented | One of several views | Rectangular track; Map / List, Status / Difficulty / Company, Hiring / Top / All. |
| Tag | Static label | 4 px radius, no border; `tag-muted` outlined, `tag-live` green, `tag-lamp` amber. Never clickable. |
| Difficulty | Easy / Medium / Hard | Three pips (1, 2 or 3 filled) + the word in the semantic colour. Reads without colour. |
| Status hex | A problem's state | Hex mark: grey (not started), ring (tried), amber (solved), dim amber (solved with help). Always paired with a word or an accessible name. |
| Company mark | Identifies a company | Hex tile with a two-letter monogram in the display face; a blue dot for major Israeli presence; an outline ring for tier-1 companies. No logos (DESIGN_DIRECTIONS.md). |
| Card | Groups content or is one link | Whole card is one `<a>` or `<button>` when clickable. No card in a card. |
| Table / list row | Lists of problems | Status first column, title link stretched over the row (`.row-link`), 48 px rows; stacked two-line rows under 640 px. |
| Progress | How much is done | 6 px bar with an amber fill that grows once; the text beside it carries the number. |
| Dialog | Confirms a destructive or irreversible step | Native `<dialog>`, title is the question, the confirm button repeats the verb. |
| Toast | Confirms something that already happened | Top centre, hex marker in the semantic colour, `role="status"`. Never the only place a result appears. |
| Command palette | Jump anywhere | Ctrl or Cmd+K, or the header button. Combobox + listbox, arrow keys, Enter, Esc. Pages, topics, problems, companies. Disabled in sessions. |
| Guided tour | Explains a screen the first time | Spotlight on the element a step explains, a card beside it (a sheet under 640 px). See Tour rules. |
| State block | Empty, error, loading | One block with a hex, a title, one line, one action. Loading uses skeleton rows the height of real rows. |
| Spinner | Work in progress | A rotating hex. |

Helpers in `src/js/ui/dom.js` build these with `h()` and text nodes only (never `innerHTML` for user strings): `difficulty()`, `chip()`, `chipGroup()`, `segmented()`, `ilMark()`, `stateBlock()`, `loadingState()`, `siteFooter()`, `hexMark()`, `companyMark()`, `progressBar()`.

## Map rules

- Tiers read left to right (columns); on a phone, top to bottom (bands of two districts). Never a shrunk desktop map.
- A district shows its name, "solved/total" and one hex per problem. Path problems carry a thin outline.
- **Locked** = dashed fog, the word "locked", and a one-sentence reason in the panel ("Opens after Two Pointers (1 of 2 solved). You can still practice it now."). Locked is advice; everything still opens.
- **You are here**: the district holding the learning path's next problem is selected on arrival, and that hex carries a single pulsing ring (static under reduced motion).
- Pointing at or focusing a district lights its whole prerequisite chain in amber and its dependants in a dashed line. On a phone only the selected district's roads show.
- The panel is the zoom: no pan, no zoom, no minimap.
- Every district is a focusable control with a full accessible name; arrows move by geometry; Enter selects and updates the hash (`#/map/<topic>`) without re-routing.
- Map / List show the same model; List is the screen-reader route.

## Tour rules

- One site tour (first visit to any browse page) and one guide per mode (Interview, Battle, Mentor), each shown once per device and replayable: the footer and the palette for the site tour, "How it works" on a setup page, the mentor's "?" button. Content lives in `src/js/data/tours.js`.
- Short and simple: at most 4 steps, a title of 24 characters and one line of 80; the same voice as the rest of the site (`validateTour` enforces it).
- A step points at one real element: the spotlight rings it in amber and the scrim dims the rest. The card goes below, above or beside it and never covers it; on a phone it is a sheet on the edge away from the target. Steps without a target are centred.
- A native modal `<dialog>`: focus stays in the card and starts on Next; Esc and Skip close it; arrow keys move between steps; every close marks the tour seen. Clicking the scrim does nothing, so a stray tap cannot end an explanation.
- Never during a session (lockdown), never over another dialog, never in place of content: the site works the same with every tour skipped.

## Motion rules

- One orchestrated moment per screen at most; everything else is a 90 to 220 ms state change.
- Animate `transform` and `opacity` only. No animation loop runs while the user types.
- The verdict: 15 case hexes resolve left to right (35 ms stagger, 260 ms each); the verdict word rises (180 ms). Failures get no extra motion.
- Milestones (first solve, a topic opening) play once, never on every Accepted.
- No marquees, rotators, looping shimmers, parallax or scroll-jacking.
- `prefers-reduced-motion: reduce` makes every animation and transition effectively instant; nothing is skipped, only not moved. The e2e suite runs a reduced-motion pass.

## Accessibility rules

1. Text at least 12 px and at least 4.5:1; control borders at least 3:1; the focus ring at least 3:1 on every surface.
2. Every interactive element is a real `<button>` or `<a>` (or an SVG element with a role, tab stop and name), keyboard reachable, with a visible focus ring.
3. State is never colour alone: hexes carry words or accessible names, selected chips carry a check, difficulty carries pips and a word.
4. Touch targets at least 44 px under `pointer: coarse`.
5. Live regions: the results console (`role="status"`), toasts, the map panel (`aria-live="polite"`), the session timer's five-minute warning (once).
6. No nested scroll areas on a phone; the page scrolls.

## Voice

Short, direct, from the user's side ("Opens after Two Pointers", not "prerequisite unmet"). No em dashes. No exclamation marks except a genuine success. Numbers as digits. Say limits plainly (editor-only languages, a bot opponent, a runner that is down). Never invent activity or leaderboards.

## Screen consistency rules

1. Every browse page opens the same way: an eyebrow with a fact, the title, one line of context, at most one row of controls on the right.
2. One primary button per screen.
3. Amber means lit (solved, progress), the primary action, or the current position. Status uses green, red and neutral words.
4. Filters are chips, exclusive scopes are segmented, long option lists use the shared picker; a native `<select>` only in dense toolbars (language, company lens).
5. Every page ends with the shared footer, except the workspace and sessions.
6. New colours, sizes, radii, shadows and durations come from tokens.
