# Design System

Direction: **a quiet instrument**. Keep the dark, IDE-adjacent palette, reserve amber strictly for primary action, active selection, and focus, give every control one shape per job, keep touch targets at least 44 px on touch devices, and never drop text below 12 px.

All tokens and component styles live in [`src/css/app.css`](../src/css/app.css) (`:root` tokens at the top, plain class selectors below, no preprocessor or bundler).

## Tokens

### Surfaces

| Token | Value | Usage rule |
|---|---|---|
| `--bg` | `#0d0e10` | Page background and code inputs |
| `--panel` | `#15171a` | Cards, split panes, header, modals |
| `--panel-2` | `#1b1e22` | Inset blocks, hover states, menus, controls |
| `--panel-3` | `#22262b` | Selected/pressed states, secondary buttons, inline code, static tags |
| `--panel-hover` | `#2b3036` | Hover on secondary buttons (text stays >= 4.5:1) |

### Text and borders

| Token | Value | Contrast bar |
|---|---|---|
| `--text` | `#e7e9ec` | Primary text (>= 12.5:1 across all surfaces) |
| `--text-2` | `#b4bac3` | Secondary copy (>= 7.7:1 across all surfaces) |
| `--muted` | `#8f97a3` | Captions and metadata (5.16:1 on `--panel-3`, passes AA everywhere) |
| `--border` | `#2a2f36` | Decorative dividers and panel hairlines |
| `--border-strong` | `#3a4049` | Elevated card/modal borders and hover borders |
| `--border-control` | `#646d7a` | Interactive control borders (inputs, selects, chips, segmented; >= 3.19:1 on `--bg`, `--panel`, `--panel-2`) |

### Accent, semantic, and difficulty

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#f5a623` | Primary action, selected state, focus outline only |
| `--accent-ink` | `#1a1203` | Text on `--accent` (9.15:1) |
| `--accent-soft` | `rgba(245, 166, 35, 0.12)` | Selected chip/row fill |
| `--accent-hover` | `#ffb93f` | Primary button hover (ink stays >= 4.5:1) |
| `--ok` | `#2fbf71` | Passing status, solved indicator |
| `--ok-soft` | `rgba(47, 191, 113, 0.12)` | Pass banner/background tint |
| `--bad` | `#f05252` | Error text and icons |
| `--bad-solid` | `#cf3636` | Danger button background |
| `--bad-ink` | `#ffffff` | Text on `--bad-solid` (4.96:1) |
| `--bad-soft` | `rgba(240, 82, 82, 0.12)` | Error/fail background tint |
| `--warn` | `#e8b931` | Warning banner and unsupported/slow-growth state |
| `--info` | `#5aa7ff` | Inline links and info toast border |
| `--easy` | `#2fbf71` | Easy difficulty dot + label |
| `--medium` | `#e3b341` | Medium difficulty dot + label (distinct from `--accent`) |
| `--hard` | `#f05252` | Hard difficulty dot + label |

### Type scale and fonts

Inter and JetBrains Mono are self-hosted as Latin variable `.woff2` files in `src/fonts/` with `font-display: swap` (no external font CDN).

| Token | Desktop | Coarse pointer | Role |
|---|---|---|---|
| `--fs-xs` | `12px` | `12px` | Floor for all text (labels, tags, metadata, table headers) |
| `--fs-sm` | `13px` | `13px` | Controls, table cells, secondary labels |
| `--fs-md` | `14px` | `15px` | Body copy and code editor |
| `--fs-lg` | `16px` | `16px` | Card and section headings |
| `--fs-xl` | `20px` | `20px` | Problem title, verdict, session clock |
| `--fs-2xl` | `26px` | `26px` | Page headings and primary stat numbers |
| `--fs-display` | `38px` | `38px` | Session report score ring readout |

### Spacing, radii, control heights, layout, and motion

- **Spacing (4 px base):** `--s-1: 4px`, `--s-2: 8px`, `--s-3: 12px`, `--s-4: 16px`, `--s-5: 24px`, `--s-6: 32px`, `--s-7: 48px`. Inside a component use 8 or 12 px; between components 16 px; between sections 32 px.
- **Radii:** `--r-tag: 4px` (static tags, inline code), `--r-sm: 6px` (controls), `--r-md: 10px` (cards, dialogs), `--r-pill: 999px` (filter chips, pills, progress bars).
- **Control heights:** `--ctl-sm: 30px`, `--ctl-md: 36px`, `--ctl-lg: 44px`. Under `@media (pointer: coarse)`, `--ctl-sm` and `--ctl-md` both resolve to `44px`.
- **Layout widths:** `--page: 1120px`, `--page-narrow: 720px`, `--header-h: 52px`, `--tab-bar-h: 56px`.
- **Motion:** `--t-fast: 120ms`, `--t-med: 200ms`, `--ease: cubic-bezier(0.2, 0.8, 0.2, 1)`. All transitions and animations disable under `prefers-reduced-motion: reduce`.

## Components

| Component | Job | Rule |
|---|---|---|
| Button | Triggers an action | Variants: primary, secondary, ghost, danger. Three heights (`--ctl-sm`, `--ctl-md`, `--ctl-lg`). One primary per screen. Real `<button>`, or `<a>` if it navigates. |
| Chip | Toggles a filter (many can be on) | Pill (`--r-pill`), `--border-control`, `aria-pressed`. Selected state combines accent border, `--accent-soft` fill, and a check mark (never colour alone). |
| Segmented | Picks one view of the same data | Rectangular track (`--r-sm`). Used for scope (`Hiring in Israel` / `Top in Israel` / `All`) and phone workspace tabs. |
| Tag | Static non-interactive label | `--r-tag` (4 px), no border, never clickable. Israeli companies use a compact `IL` mark instead of a repeating amber pill. |
| Difficulty | Easy, Medium, Hard | Semantic dot + word, no tinted pill. Identical across tables, pickers, and problem headers. Each colour is >= 4.5:1 on `--bg`, `--panel` and `--panel-2`. |
| Card | Groups content or acts as one link | When clickable, the entire card is one `<a>` or `<button>` with hover and focus states. Never nest a card inside a card. |
| Option card | One choice in a picker | Monogram, name, one supporting fact, optional progress bar. Used for companies, interview formats, and battle opponents. |
| Picker | Choose one item from many | Shared `src/js/ui/picker.js`: search + optional scope segmented + option grid/list + `aria-live` selection summary. Used by interview, battle, and companies. |
| List row | Tables on narrow viewports | Below 640 px, table rows stack: title on line 1, difficulty and tags on line 2; whole row is a link, minimum 52 px tall. |
| Dialog | Confirm destructive/irreversible actions | Native `<dialog>`. Title asks the question; confirm button repeats the verb. Full width near bottom on phones. |
| Toast | Confirms an event that already happened | Top centre under header, solid panel with coloured left edge, `role="status"`. Never the only place a result appears. |
| Nav | Four destinations | Header links at >= 821 px; bottom tab bar with icon and label at <= 820 px. `aria-current="page"` on active item. Hidden during active sessions. |
| States | Empty, loading, error | Shared `.state` block with explanation and one recovery action. Loading uses skeleton rows matching real row height. |

## Shared helpers

Views build components through `src/js/ui/dom.js` instead of hand-writing markup, so the classes, ARIA state and touch sizing stay identical everywhere. All helpers build with `h()` and text nodes only (never `innerHTML`), and they live in `dom.js` so the ADR 0008 startup graph does not grow.

| Helper | Renders |
|---|---|
| `difficulty(d)` | `span.difficulty.diff-<level>`: dot + word |
| `chip({ label, pressed, onClick, attrs })` | One filter chip (`button.chip`, `aria-pressed`) |
| `chipGroup({ label, options, value, onChange })` | A labelled `role="group"` of chips with exactly one pressed |
| `segmented({ label, options, value, onChange })` | A labelled segmented control (`button.segmented-btn`, `aria-pressed`) |
| `ilMark()` | The `IL` tag with screen-reader text (no `aria-label` on a plain span) |
| `stateBlock()`, `loadingState()`, `siteFooter()` | Empty/error/loading states and the browse-page footer (Step 2) |

Touch sizing: buttons, chips, segmented buttons, inputs and selects take their height from `--ctl-*`, which become 44 px under `@media (pointer: coarse)`. Text-like controls (logo, `.btn-link`, `.back-link`, `.problem-link`, footer links, checkbox labels) get a 44 px `min-height` only under a coarse pointer, so desktop layout does not change. Inputs use 16 px text on touch devices so iOS does not zoom on focus.

The account control is a disclosure (toggle with `aria-expanded` and `aria-controls`), not an ARIA menu: its panel holds hints, a wizard and radio buttons, which `role="menu"` does not allow. Arrow keys still move between its controls as a convenience.

## Screen Consistency Rules

1. Every browse page opens the same way: title, one line of context, then at most one row of controls.
2. One primary button per screen. Competing actions drop to secondary.
3. Amber means action ("do this"), selection ("this is selected"), or focus. Status uses green, red, and neutral tags.
4. No text smaller than 12 px, and no text/surface pair below 4.5:1 contrast.
5. Filters use chips, exclusive scopes use segmented controls, long option lists use the shared picker. Native `<select>` is reserved for dense toolbars (language selector).
6. State is never communicated by colour alone: selected has a check mark, solved has a filled dot plus text, failed has a word.
7. Every reachable touch control is at least 44 px tall on coarse-pointer devices.
8. No nested scroll boxes on phones; the page scrolls cleanly and pickers expand or paginate.
9. UI copy describes what the user gets, never internal roadmap phases or implementation details.
10. All colours, type sizes, spacing, and radii reference `:root` tokens; literal values in component rules are treated as bugs.

## Approved Redesign Decisions (Stage F5)

- **Fonts:** Self-host Inter and JetBrains Mono as `.woff2` in `src/fonts/` with `font-display: swap`.
- **Phone navigation:** Bottom tab bar at <= 820 px, replaced by pinned Run / Submit bar inside the workspace.
- **Battle lockdown:** Hide the top navigation during an active battle race (with a visible "Leave race" exit), matching interview mode.
- **Modes hub:** Keep two mode cards (Interview and Battle); move AI Mentor to a short note linking to the workspace until F4 ships.
- **Light theme:** Out of scope for F5; tokens prepare the ground for later.
- **Hebrew / RTL:** Out of scope for F5; new layout CSS uses logical properties (`margin-inline`, `inset-inline`) where applicable.
