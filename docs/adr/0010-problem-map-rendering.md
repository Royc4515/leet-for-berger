# ADR 0010: Problem Map rendering: static pure layout, plain SVG

Status: accepted (2026-11-23)

## Context

F6 adds an interactive Problem Map (`#/map`, `docs/archive/F6_PLAN.md` step 2): 26 topics in six tiers with 34 prerequisite links, and one hex per problem (225 today, two to three times that later). It must run at 60 fps on a mid-range phone, keep main-thread tasks under 50 ms during interaction, work with a keyboard and a screen reader, and work at 390 px without sideways page scroll.

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

## Amendment (2026-11-23): drill-down levels

The owner asked for a map that opens up step by step down to one problem. The research decision against pan and zoom stands (it fights page scroll on a phone and is hard to drive from a keyboard); what was added is **semantic zoom by level**, each level a hash:

| Level | Hash | Canvas | Panel |
|---|---|---|---|
| All topics | `#/map` | the districts above | the topic under the pointer or focus (your next topic by default) |
| One topic | `#/map/<topic>` | its subtopics (taxonomy `concepts`) as blocks on a winding road in learning order, one hex per problem (`layoutTopic`) | topic state, lock reason, links, the subtopic list |
| One subtopic | `#/map/<topic>/<subtopic>` | its problems as named hex tiles (HTML, so titles wrap) | the path's pick and the next problem |
| One problem | `#/map/<topic>/<subtopic>/<problem>` | the same tiles, the picked one lit | difficulty, status, where it is asked (`problem-meta.json`), Open |

- **Routing**: the router hands a new map hash to the mounted view (`update` on the view's cleanup, `main.js`) instead of rebuilding it, so levels animate and Back and Forward still work. `parseMapLevel` turns any hash into the deepest valid level, so old `#/map/<topic>` links land on the topic.
- **Motion**: going in, the new level grows out of the element you picked (`transform: scale` from its centre, 360 ms); going out, the level above settles back around the one you left. Reduced motion skips it.
- **Keyboard**: arrows move between districts and between subtopic blocks (the same `neighbours`), Enter zooms in, Esc goes up one level. Esc reads the level from the address, not the view's state: the hash changes at once but `hashchange` lands a task later, and a quick second Esc must still climb.
- **Cost**: a topic level draws at most a few dozen elements; the subtopic level is a short HTML list. Nothing in the measurements above changes.

## Amendment 2 (2026-11-23): one continuous map

The owner then asked for the levels to be one map you zoom into, like a real map, not a screen that changes into another. This reverses the "no pan or zoom" decision above for the map canvas only; the reasons against it are answered as follows.

- **One world** (`src/js/data/map-world.js`, pure, unit-tested): `layoutWorld` lays out the whole curriculum once. Tiers are columns left to right (`orderTiers`); each topic is a district; inside it each subtopic is a block (a name strip, then a row of its hexes) and blocks flow left to right, then onto the next line, in learning order, at least three hexes wide so the name has room when zoomed. Progress never moves anything. `layoutTopic` and the tile level are gone.
- **A camera** `{ k, x, y }` (screen = world x k + (x, y)) moves the world: it is the `transform` of one group inside the SVG, so strokes can stay non-scaling. `fitCamera`, `zoomAround` (keeps the point under the pointer), `clampCamera` (some of the world always stays on screen) and `flightPath` (van Wijk and Nuij 2003: the zoom-and-pan path that feels shortest; exact endpoints) are pure functions.
- **Labels** are HTML over the world at a constant size, positioned by CSS variables (`--k`, `--tx`, `--ty`) so a camera move is three property writes. Which names show depends on the zoom (`lodOf`: topics, then subtopics from 1.75x, then problem names inside hexes from 5x) and on room: `placeLabels` keeps the higher priority name when two would touch and drops names that do not fit. They are refreshed at most every 110 ms while moving and once at rest.
- **Line widths** are written in screen pixels times `--zs` (1 / zoom), so lines stay thin at every zoom instead of growing with the camera.
- **Levels are still hashes**, now camera targets: a topic fits its district (at least subtopic-name zoom, at most 3.4x), a subtopic fits its row at problem-name zoom (5.4x to 7.5x), a problem picks the hex (the camera stays if it is already readable). The router's `update` hook flies instead of rebuilding.
- **Phone and page scroll**: the canvas has a fixed height and owns its gestures (`touch-action: none`: one finger drags, two pinch); the page scrolls outside it. The map opens at reading zoom on your next topic when the whole map would be too small to read.
- **Keyboard**: only one kind of element is focusable at a time (topics, a topic's subtopics, or its problems), with roving tabindex, so buttons never nest; arrows move by geometry, Enter flies closer, Esc flies out, + - 0 zoom. Focus moving off screen pans the camera to it. The List view and the panel's lists remain the screen-reader route.
- **Cost**: one SVG of about 560 elements built once. A camera move changes one attribute (the camera group's `transform`, inside the SVG so strokes stay non-scaling with `vector-effect`), one composited transform on the label layer, and `--k` on it only when the zoom changes; only names on screen are in the page, and their widths are measured in batches (the whole map's first, the rest in idle time). An earlier version set a zoom variable on the whole world each frame: style recalculation took 60 % of frame time and flights ran at 30 fps under 4x CPU throttling. Measured (Playwright, CDP throttling; flights, wheel zoom, drag, buttons): median 17 ms per frame at 1x and 4x, p95 17 ms at 1x and 33 ms at 4x. Opening the map is one build task (about 60 ms at 1x), before the entry flight's first frame.
