# ADR 0010: Problem Map rendering: static pure layout, plain SVG

Status: accepted (2026-11-23)

## Context

F6 adds an interactive Problem Map (`#/map`, `docs/F6_PLAN.md` step 2): 26 topics in six tiers with 34 prerequisite links, and one hex per problem (225 today, two to three times that later). It must run at 60 fps on a mid-range phone, keep main-thread tasks under 50 ms during interaction, work with a keyboard and a screen reader, and work at 390 px without sideways page scroll.

Options considered:

1. **A graph library** (Cytoscape 3.35, MIT, plain JS; React Flow needs React and is out under ADR 0001). Cytoscape brings force layouts, pan and zoom and a canvas renderer. It is a pinned runtime dependency of several hundred KB for a 26-node graph whose layout never changes, and its canvas nodes are not focusable controls.
2. **Canvas, hand-written.** Fast at thousands of cells, but every node needs a parallel accessible structure and hit testing.
3. **SVG from a precomputed layout.** About 370 elements; every district is a real focusable element with an accessible name; CSS does hover, focus and state; the browser does hit testing.

The research (`docs/research/DESIGN_REFERENCES.md`) argued against force layouts (they never settle; D3 and Obsidian drift for seconds) and against shrinking a desktop graph to a phone (NeetCode, roadmap.sh).

## Decision

Option 3.

- **Pure model and layout** in `src/js/data/map-layout.js`: `topicStates()` (locked, open, started, mastered and the reason a topic is locked), `layoutMap()` (tiers as columns, or as two-column bands below 720 px; one barycentre pass orders each tier to reduce crossings; hexes packed in rows), `neighbours()` (arrow-key targets by geometry). Deterministic, no DOM, no randomness; 16 unit tests check no overlaps at 358 to 1400 px, prerequisites always before dependants, stable output, one hex per problem, and that every district is reachable by arrow keys.
- **View** in `src/js/ui/views/map.js` draws SVG from the layout: bands, roads (cubic Bezier paths), districts (`role="button"`, roving `tabindex`, `aria-pressed`, a full accessible name with state and lock reason). Hover and focus light the prerequisite chain through classes; nothing animates continuously except one ring on the next problem's hex, which stops under reduced motion. The entrance animation is transform and opacity only, once.
- **No pan or zoom.** The whole map fits; the brief panel beside it is the zoom. On a phone the layout changes shape instead of shrinking.
- **The list view** on the same page, and the Problems page, carry everything the map shows for screen readers.
- **Re-layout** only when the width changes by more than 24 px (`ResizeObserver`); progress changes re-render from the store; the view's cleanup disconnects the observer, the store subscription and every listener.

## Measurements

Chromium 157, `npm run dev`, returning-user seed, a 120-step pointer sweep across the map followed by seven keyboard moves and selections (`node scripts/design/perf-map.mjs`):

| Setup | Map ready | SVG elements | Longest task while loading | Long tasks while interacting | Frame p95 / worst |
|---|---|---|---|---|---|
| 1440 px, no throttling | 160 ms | 372 | none | none | 17 / 17 ms |
| 390 px, 4x CPU throttling | 414 ms | 366 | 106 ms | none | 17 / 33 ms |
| 1440 px, 4x CPU throttling | 441 ms | 372 | 164 ms | none | 17 / 33 ms (1 frame over 33 ms) |

The one long task is module evaluation and the first draw, before the user can interact. At three times today's problems the element count stays near 1,000, well inside what SVG handles; if the bank grows past that, hexes for a district can be drawn into one `<path>` without changing the layout module.

## Consequences

- No new dependency, no ADR 0001 exception.
- Visual changes to the map are CSS changes; layout changes go through the pure module and its tests.
- If a future design needs zoom (thousands of problems), the layout already returns coordinates a camera transform can use.
