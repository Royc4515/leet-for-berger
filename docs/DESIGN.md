# Design system: Atlas

Direction (stage F6, `docs/research/DESIGN_DIRECTIONS.md`): **a territory you light up.** The curriculum is a map of 26 topics in six tiers; every problem is a hex; solving one lights it. The hex is the unit everywhere: on the map, as the status mark in lists, as a day in the daily calendar, as a test case in the verdict, as the company mark and the logo. The ground is warm graphite. Status is told by plain colours (the owner asked for success and failure at a glance): **green** solved, a **green ring** solved with help, **coral** tried and not solved yet, **grey** not started. There is one lamp colour, **amber**, and it only ever means **what to do now**: your next problem, the primary action, where you are.

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
| `--accent` | `#f3a93c` | The next problem (its ring), the primary action, the current position, the streak. Never a status. |
| `--accent-hover`, `--accent-ink`, `--accent-soft`, `--accent-line`, `--accent-glow`, `--accent-dim` | | Hover, ink on amber, tints, the assisted (solved with help) hex |
| `--focus` | `#ffc874` | Keyboard focus ring, everywhere |
| `--ok`, `--bad`, `--warn`, `--info` (+ `-soft`) | green, red, yellow, blue | Test results, errors, warnings, informational marks (the IL mark). Never decoration. |
| `--bad-solid` / `--bad-ink` | `#c63a2c` / white | Danger buttons (5.1:1) |
| `--easy`, `--medium`, `--hard` | green, gold, red | Difficulty, always with pips and the word |

Selection is shown by an outline and a check mark, not by amber fill alone.

### Status

| Token | Value | Means |
|---|---|---|
| `--hex-solved` | `--ok` (green) | Solved: hexes, progress fills, a day you solved something, a company's fill |
| `--hex-assisted` | green, drawn as a ring | Solved with help (after Reveal) |
| `--hex-tried` | `#d9634f` (coral) | Tried and not solved yet |
| `--hex-new` | `#2d2a24` | Not started |

Difficulty moved off the status colours so the two never read alike: `--easy` teal `#3ec5b4`, `--medium` gold, `--hard` rose `#ff6b94`, always with pips and the word.

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
| Status hex | A problem's state | Hex mark: grey (not started), coral (tried), green (solved), green ring (solved with help); an amber ring marks your next problem. Always paired with a word or an accessible name. |
| Company mark | Identifies a company | The company's logo on a warm light tile (`--logo-plate`), so brand colours read on the dark ground; an app-icon logo fills the tile; a company with no good logo gets its two-letter monogram on the same tile. A blue corner dot for major Israeli presence, an outer ring for tier-1 companies. Large with a faint glow in the brand's colour on a company page, small in the interview picker, the map's problem card and its company header; at text size (`miniLogo()`, 20 or 16 px) in the command palette and in front of a name in a problem's company chips, where a chip is a link to the company's page when it has one. The company list's views: Hiring in Israel (the default), Jobs in Israel (companies whose page links to their job search in Israel, with a line saying the search shows what is open now), Top in Israel, All; two rows on a phone. A company page's header carries its Israel badge and, beside it, a secondary button to the company's jobs: "Jobs in Israel" (its own job search filtered to Israel) for a company that hires engineers in Israel and has one, else "Careers site" (new tab, "opens in a new tab" in its name); stacked on the right on a laptop, side by side under the name on a phone. Where logos are not loaded, the hex monogram (its fill is progress). Logos come from `scripts/content/fetch-logos.mjs` (owner's decision, DESIGN_DIRECTIONS.md). |
| Card | Groups content or is one link | Whole card is one `<a>` or `<button>` when clickable. No card in a card. |
| Table / list row | Lists of problems | Status first column, title link stretched over the row (`.row-link`), 48 px rows; stacked two-line rows under 640 px. |
| Progress | How much is done | 6 px bar with an amber fill that grows once; the text beside it carries the number. |
| Dialog | Confirms a destructive or irreversible step | Native `<dialog>`, title is the question, the confirm button repeats the verb. |
| Toast | Confirms something that already happened | Top centre, hex marker in the semantic colour, `role="status"`. Never the only place a result appears. |
| Command palette | Jump anywhere | Ctrl or Cmd+K, or the header button. Combobox + listbox, arrow keys, Enter, Esc. Pages, topics, problems, companies. Disabled in sessions. |
| Guided tour | Explains a screen the first time | Spotlight on the element a step explains, a card beside it (a sheet under 640 px). See Tour rules. |
| State block | Empty, error, loading | One block with a hex, a title, one line, one action. Loading uses skeleton rows the height of real rows. |
| Spinner | Work in progress | A rotating hex. |

Helpers in `src/js/ui/dom.js` build these with `h()` and text nodes only (never `innerHTML` for user strings): `difficulty()`, `chip()`, `chipGroup()`, `segmented()`, `ilMark()`, `stateBlock()`, `loadingState()`, `siteFooter()`, `hexMark()`, `companyMark()`, `miniLogo()`, `progressBar()`.

## Map rules

- **One continuous map** (owner's request): a single world you zoom into, never screens that replace each other. Tiers read left to right; each topic is a district; inside it each subtopic is a named row of hexes, flowing in learning order like a paragraph; each problem is a hex. A camera moves over it: scroll or pinch to zoom at the pointer, drag to move, the + / - / Show all buttons (bottom right, like any map), or + - 0 on the keyboard.
- **Names appear as you get closer**, at a constant 12 px: topic names and tiers on the whole map, subtopic names from about 1.75x, problem names inside their hexes from 5x, where a hex becomes a tile (a tinted face, its status as the rim). A name that would not fit or would overlap another is left out, as on a street map. Line widths stay the same on screen at every zoom.
- **Clicking flies one step closer**: a topic, then a subtopic, then a problem, along a smooth zoom-and-pan path (it rises a little for long hops). Each step is a hash (`#/map`, `#/map/<topic>`, `#/map/<topic>/<subtopic>`, `.../<problem>`); the breadcrumb names it; Esc and Back fly out one. Flown into a topic, the rest of the map stays visible, quieter.
- The map opens with all of it in view where it reads (a laptop); on a phone it opens at reading zoom on your next topic, and you drag across the tiers. The canvas owns the gestures on it (`touch-action: none`); the page scrolls around it.
- Path problems carry a thin outline. A picked problem has an amber rim and its card in the panel with Open.
- **Asked at, as logos** (owner's request): a problem card shows the first five companies that ask it (Israeli companies first, as on the problem page) as a row of logo tiles, side by side (stacked tiles cut wordmarks), then their names. Hovering or focusing a logo turns the names into what it does; pressing it is a **spotlight**: the Company lens lights that company's problems and the map flies out to frame the districts holding them (the whole map when it asks almost everywhere; on a phone the map scrolls into view first). Back returns to the problem. While a company is lit, the panel opens with its logo, how many problems in how many topics, and a link to its practice set.
- **Locked** = dashed fog, the word "locked", and a one-sentence reason in the panel ("Opens after Two Pointers (1 of 2 solved). You can still practice it now."). Locked is advice; everything still opens.
- **You are here**: the district and the subtopic holding your next problem carry a single pulsing ring on that hex (static under reduced motion); the panel defaults to your next topic.
- Pointing at or focusing a district lights its whole prerequisite chain in amber and its dependants in a dashed line, and the panel follows. On a phone only the selected district's roads show.
- One kind of thing is focusable at a time, so buttons never nest: the topics on the whole map, a topic's subtopics, then that topic's problems. Each has a full accessible name; arrows move by geometry; Enter flies closer; the panel lists what the hexes show, as links.
- Map / List show the same model; List is the screen-reader route.

## Tour rules

- Every page explains itself the first time it opens (Problems, Map, Path, Daily, Companies, a company, Modes, a problem, Interview, Battle), and the mentor's panel on its first open. The first tour a device sees opens with a one-step welcome. Each is shown once per device and replayable: "Guide for this page" in the footer and the palette, "How it works" on a setup page, the mentor's "?" button. Content lives in `src/js/data/tours.js`; `tourForRoute` maps a route to its tour.
- Short and simple: at most 4 steps, a title of 24 characters and one line of 80; the same voice as the rest of the site (`validateTour` enforces it).
- A step points at one real element: the spotlight rings it in amber and the scrim dims the rest. The card goes below, above or beside it and never covers it; on a phone it is a sheet on the edge away from the target, and a tall target (the map) scrolls clear of it when both fit. Steps without a target are centred.
- A native modal `<dialog>`: focus stays in the card and starts on Next; Esc and Skip close it; arrow keys move between steps; every close marks the tour seen. Clicking the scrim does nothing, so a stray tap cannot end an explanation.
- Never during a session (lockdown), never over another dialog, never in place of content: the site works the same with every tour skipped.

## Motion rules

- The owner asked for motion that impresses and stays perfectly smooth. Every effect animates `transform` and `opacity` (the compositor runs them), costs nothing while idle, and no animation loop runs while the user types. Measured with `scripts/design` style traces: interactions hold a median 17 ms frame at 1x and 4x CPU throttling.
- **Pages**: a View Transition cross-fades page to page (old page fades back 140 ms, new one rises 220 ms); the header and the phone tab bar are their own groups and stay still. A slow-loading view shows its skeleton only after 160 ms.
- **Gliders**: one highlight slides to the active item (segmented controls, the header nav, the phone tab bar) with a small spring, instead of jumping (`glide` in `ui/motion.js`).
- **Spotlight**: a soft light follows the mouse over cards (`installSpotlight`, one passive listener, one style write per frame, mouse and pen only); cards lift 2 to 3 px with a spring.
- **Scroll**: cards and sections rise into place as they scroll in, driven by the scroll itself (`animation-timeline: view()`, no JS); never table rows.
- **Map**: the camera flies (van Wijk and Nuij's smooth zoom and pan, 320 to 1100 ms by distance, ease in and out); names fade in as they fit; hexes swell under the pointer; tiers rise in order on first load. The world is one SVG whose camera group carries the transform (strokes non-scaling); nothing is rebuilt between levels, and a frame restyles almost nothing.
- **The verdict**: 15 case hexes resolve left to right (35 ms stagger, 260 ms each); the verdict word rises. Accepted sends a burst of green hexes from the verdict (a bigger green and amber burst on a first solve); a failed submit gives the word a short shake.
- **Daily**: the 16-week calendar fills in as a wave from the top left; the streak chip ignites once when today's first solve lights it.
- No marquees, rotators, looping shimmers, parallax or scroll-jacking; the only loop is the next problem's pulse ring.
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
3. Status is green (solved), coral (tried), grey (not started), with a word. Amber means the next thing to do, the primary action or the current position, never a status.
4. Filters are chips, exclusive scopes are segmented, long option lists use the shared picker; a native `<select>` only in dense toolbars (language, company lens).
5. Every page ends with the shared footer, except the workspace and sessions.
6. New colours, sizes, radii, shadows and durations come from tokens.
