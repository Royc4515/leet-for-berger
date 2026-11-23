# F6 plan: the Atlas redesign

Stage F6 in `docs/PLAN.md`. Brief: `docs/REDESIGN_BRIEF.md`. Research: `docs/research/DESIGN_REFERENCES.md`. Decision: `docs/research/DESIGN_DIRECTIONS.md`. Rules: `docs/DESIGN.md`. Checklist: `docs/research/SCREEN_INVENTORY.md`.

The work ships on one branch as a sequence of commits, one per step below, each with `npm run check` green, screenshots at 1440 and 390 opened and compared against the prototype, and `CHANGELOG.md`, this file and the inventory updated.

## Steps

| # | Step | Inventory items | e2e coverage |
|---|---|---|---|
| 1 | Foundation: tokens, fonts, base, components (buttons, chips, segmented, tags, difficulty pips, status hex, inputs, switch, cards, tables, tabs, progress, company mark, dialog, toast, palette), motion helpers, state blocks and skeletons, shell (header, nav, tab bar, streak chip), brand assets, 404 and could-not-load | C1-C5, C13-C25, C27, C29, B1-B4, R13-R15 | fonts loaded locally, 5 nav links with `aria-current`, tab bar 44 px targets, palette opens with Ctrl+K and navigates, 404 state, reduced-motion run |
| 2 | Problem Map: pure layout and states (unit-tested), SVG view, brief panel, lenses, list view, keyboard, deep links | R2 | map renders 26 districts and 225 hexes, arrows move focus, Enter selects and updates the hash, list view toggles, no sideways scroll at 390, reduced motion |
| 3 | Problems page and Daily challenge | R1, R17 | start block, filters, empty state, today card, daily page calendar and countdown |
| 4 | Workspace: layout, toolbar, statement, verdict console, mentor, context and extras, editor theme | R3, C7-C12 | all existing workspace steps; verdict hexes (5 open, 10 locked), Next problem after Accepted |
| 5 | Learning path as the route | R4 | tiers, 131 problems, Next up, checkpoints |
| 6 | Companies and company briefing, hex company marks | R5, R6, C26 | Hiring / Top / All counts, briefing facts, practice links |
| 7 | Modes: hub, interview setup, session, report, battle setup, race, result, shared picker, session banner | R7-R12, C6, C28 | existing lockdown, picker, report, race checks |
| 8 | Account menu and privacy page | C5, R16 | existing account checks, privacy back link |
| 9 | Final consistency pass: contact sheet of every item before and after, CSS audit (no literal values outside tokens, no dead selectors), motion and voice check | all | full suite, reduced-motion route sweep |

## Coverage matrix

Every inventory item maps to a step. The plan is incomplete while any item has no step.

| Item | Step | Item | Step | Item | Step |
|---|---|---|---|---|---|
| R1 Problems | 3 | C1 Header | 1 | C17 Buttons | 1 |
| R2 Map | 2 | C2 Desktop nav | 1 | C18 Chips | 1 |
| R3 Workspace | 4 | C3 Tab bar | 1 | C19 Segmented | 1 |
| R4 Path | 5 | C4 Streak chip | 1 | C20 Tables, list rows | 1, 3 |
| R5 Companies | 6 | C5 Account menu | 8 | C21 Tabs | 1, 4 |
| R6 Company briefing | 6 | C6 Picker | 7 | C22 Form controls | 1 |
| R7 Modes hub | 7 | C7 Results console | 4 | C23 Focus ring | 1 |
| R8 Interview setup | 7 | C8 Mentor panel | 4 | C24 Tags, difficulty, status | 1 |
| R9 Interview session | 7 | C9 Problem context | 4 | C25 State blocks | 1 |
| R10 Interview report | 7 | C10 Problem extras | 4 | C26 Company mark | 6 |
| R11 Battle setup | 7 | C11 Resizers | 4 | C27 Progress, meters | 1 |
| R12 Battle race | 7 | C12 Editor chrome | 4 | C28 Session banner | 7 |
| R13 Not found | 1 | C13 Dialog | 1 | C29 Command palette | 1 |
| R14 Could not load | 1 | C14 Toast | 1 | B1 Logo | 1 |
| R15 Route loading | 1 | C15 Skip link | 1 | B2 Favicon | 1 |
| R16 Privacy | 8 | C16 Footer | 1 | B3 Social preview | 1 |
| R17 Daily | 3 | | | B4 Theme colour, app name | 1 |

## Risks

| Risk | Mitigation |
|---|---|
| Workspace regressions (Monaco layout, resizers, phone tabs) | Keep the workspace DOM and its listeners; the redesign is CSS, the console renderer and the toolbar grouping. Every existing workspace e2e step stays. |
| Map performance on a phone | Static pure layout, about 300 SVG elements, transform and opacity animation only, no animation loop; measured in ADR 0010. |
| Map accessibility | Districts are real focusable controls with full accessible names; the List view and the Problems page carry everything the map shows. |
| Touch gestures | No pan or zoom to fight the page scroll; taps select districts; hexes are not tap targets. |
| Contrast drift | `tests/design-tokens.test.js` checks every text and control pair against WCAG AA. |
| A screen left in the old style | The inventory and this matrix; the final contact sheet compares every item before and after. |

## Not building

Ideas from the brief's idea pool that research or the decision ruled out (never a screen or state):

- Pan and zoom, semantic zoom and a minimap on the map: 26 districts fit one screen and the panel is the zoom.
- A physics or force layout, a canvas renderer, Cytoscape or any graph library.
- Company logos (letters, not logos: `docs/research/DESIGN_DIRECTIONS.md`).
- Sound.
- A light theme in F6 (tokens make it possible later).
- Leaderboards or social activity (no real data for them).
- Confetti or celebration on every Accepted (milestones only: first solve of a topic, a topic opening).
