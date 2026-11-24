# Design directions and decision (stage F6, Phase B)

Three genuinely different directions came out of the research (`DESIGN_REFERENCES.md`). Each was prototyped with real data from the repo (catalog, taxonomy, essential path, company sets, a returning-user progress seed) as three screens: the Problem Map, the workspace with a verdict, and the dashboard, plus one motion prototype of its key moment. Prototypes and screenshots live in the session scratchpad (not committed); the decision page published for the owner shows them side by side.

## B1. The three directions

### A. Atlas: a territory you light up

**Thesis.** The curriculum is a map. Each of the 26 topics is a district made of hexes, one hex per problem, laid out in six tiers read left to right, with roads for prerequisites. Solving a problem lights its hex. The same hex is the unit everywhere: a status mark in lists, a day in the daily calendar, a test case in the verdict. Warm graphite ground, one lamp colour (amber) that means "light": what you have solved, and the next thing to do.

- References: Last Epoch (hexagonal nodes, fractions, Map/List), Exercism (marks inside nodes), NeetCode (graph + panel), The Pudding Happy Map (territory) and Kevin Bacon (chain tracing), Brilliant (current-node ring), Advent of Code (a picture that fills in), Supabase (neutrals tinted toward the brand).
- Palette: warm graphite `#100f0d` to `#312d27`, warm off-white ink `#f2ece2`, amber `#f3a93c`. Semantic green and red only for test results and difficulty.
- Type: Bricolage Grotesque (display: titles, verdicts, big numbers), Inter (interface), JetBrains Mono (code, counts, labels).
- Map: layered districts with every problem visible; the brief panel is the zoom.
- Verdict: the 15 cases resolve as a row of hexes; Accepted lands, the problem's hex lights, and if a topic opens, its road draws.
- Signature moments: the verdict resolving into the map; a topic opening (fog clears, road lights once); the daily calendar filling hex by hex.

### B. Transit: ride the lines

**Thesis.** The curriculum is a transit network. Topics are stations, prerequisite chains are coloured lines, the learning path is "your line", the daily is the 06:00 train. Light paper theme, heavy black rules, Swiss typography, bold line colours.

- References: metro maps (Road to Data Scientist, Metro Map Maker), Linear's dated rail, Warp, Resend's tile row.
- Palette: warm paper `#f4f1ea`, black ink, seven line colours (blue, red, green, violet, orange, teal, grey) and signal yellow.
- Type: Instrument Sans (tight display and UI), Geist Mono (labels, numbers).
- Map: octilinear stations with progress rings; problems live in a "timetable" panel.
- Verdict: a train runs the 15 stations of the line; stations fill as it passes.
- Signature moments: the train run; "change here" at an unlock; the departure-board daily.

### C. Orbit: a sky chart

**Thesis.** Foundations sit at the centre; each ring outward builds on the one inside it. Topics are constellations, problems are stars that ignite when solved. Deep blue-black, soft star glow, a geometric grotesk.

- References: Dribbble constellation skill trees (without the neon), the D3 circle-packing drill-in, Obsidian's local graph.
- Palette: void `#070b16`, star `#fff2c9`, a cool blue action colour `#7aa7ff`.
- Type: Space Grotesk, JetBrains Mono.
- Map: radial rings by tier; clusters of stars per topic.
- Verdict: stars ignite one by one with a flare.
- Signature moments: ignition; a new constellation coming into view; "star of the day".

## B2. Prototypes

| Direction | Map | Dashboard | Workspace + verdict | Motion |
|---|---|---|---|---|
| Atlas | hex districts, roads, brief panel; 2-column tier bands on a phone | daily hero with a hex month calendar, stats strip, list with hex status | hex case row, lit verdict, unlock line | cases resolve, hex lights, road draws, fog clears (1.8 s total) |
| Transit | octilinear lines, ring progress, timetable panel | departure board, black daily card, timetable list | train line of 15 stations, red stations for failures | train crosses the line in 1.5 s |
| Orbit | radial rings, star clusters | "Tonight", star of the day | 15 stars | stars ignite with a flare |

What the screenshots showed (1440 and 390):

- **Atlas** read at a glance at 1440: tiers, locked districts (dashed, dimmed), lit hexes, the chain highlight. The phone version needed a different layout (two districts per row per tier band, roads only for the selected district), which the real implementation adopts. District labels collided with counts and were moved to a two-line head.
- **Transit** had the strongest identity and very clear prerequisite lines, but problems were invisible on the map (counts only), seven line colours competed with difficulty colours, the line layout tangled where trees and graphs meet, and the paper colour is exactly the warm-cream default that generated designs cluster around. The strikethrough for solved rows read as "cancelled".
- **Orbit** looked attractive in a thumbnail and failed on use: the radial order is hard to read, labels collided, star clusters hid status, and it looks like every space-themed template.

## B3. Adversarial critique and scores

Before scoring, each direction was argued against as hard as possible.

**Atlas, against.** Hexes can read as a game. Amber as both "solved" and "primary action" risks two meanings. 225 small hexes are too small to tap individually. A warm dark palette can turn muddy. Answers: the hex is a quiet geometric unit, not a game skin (no XP, no avatars); amber's single meaning is "light: what you did and what to do next", while selection uses an outline and test results use green and red; hexes are not tap targets (districts and list rows are); contrast is checked by a unit test on every token pair.

**Transit, against.** A light paper theme for multi-hour sessions; heavy 2 px black rules everywhere (a current trend that will date); colour-coded lines fail for colour-blind users unless every line is also labelled; the map hides problems; the octilinear layout is hand work that will not survive 2 to 3 times the topics; train copy ("Board this line") wears thin.

**Orbit, against.** Clarity fails the 10-second test; keyboard order around a ring is arbitrary; glow is tiring; generic.

| Criterion (1 to 5) | Atlas | Transit | Orbit |
|---|---|---|---|
| Clarity: where am I, what is next, why locked, in 10 s | 5 | 4 | 2 |
| Long-session comfort (3 hours of coding) | 5 | 3 | 3 |
| Distinctiveness (not a template) | 4 | 4 | 2 |
| Fit with the data (26 / 131 / 225 now, 2 to 3 times later) | 5 | 3 | 2 |
| Accessibility (contrast, keyboard, screen reader, reduced motion) | 4 | 3 | 2 |
| Performance on a mid-range phone | 5 | 5 | 4 |
| Implementation cost in vanilla JS, no new dependency | 4 | 3 | 3 |
| **Total** | **32** | **25** | **18** |

## Decision

**Atlas, as a deliberate hybrid.** From Transit it takes typographic confidence (large, tight display headings and numbers) and the idea of "your route": the Learning Path is the route through the map, shown on the Path page as an ordered itinerary and on the map as the topic that holds "Next". From the research it takes the side panel that reuses the list (NeetCode), Map / List over one model (Last Epoch), the current-item ring (Brilliant), one-sentence lock reasons (the gap no reference fills), and the verdict structure (HackerRank, Codility).

Why: it is the only direction that shows every problem on the map, answers "where am I, what is next, why is this locked" without a legend, scales by area when the bank doubles, and gives the whole site one unit (the hex) that ties the map, lists, daily, verdict and modes together.

Rejected: Transit's light theme and line colours (comfort, colour dependence, the cream default); Orbit entirely (clarity). Also rejected after research: a physics graph, a canvas renderer, zoom and pan on the map (26 districts fit one screen; the panel is the zoom), Cytoscape (a dependency for a tiny static graph), company logos (section below).

What gets cut first if time runs short (idea pool, never a screen or state): the company lens on the map, the unlock road animation, the count-up on the dashboard, the daily month view beyond 16 weeks.

## Company identity decision

Letters, not logos, with a better system. Facts (`DESIGN_REFERENCES.md`, section 6): clean SVG sources exist for about a quarter of the 193 companies and 4 of the Israeli ones, and the best-known names (Microsoft, Amazon, IBM, Oracle) asked Simple Icons to remove theirs. A page where Google has a logo and Microsoft does not reads as broken, and the fallback would be the majority. So every company gets the same designed mark:

- a hex tile (the site's unit) with a two-letter monogram in the display face, neutral ink, no brand colours;
- an IL notch for companies with a major Israeli engineering presence, and a ring for tier-1 companies, so the mark carries information, not decoration;
- progress shown as the tile's fill level on cards (how much of the company's set you have solved);
- a footer line on company pages: names are trademarks of their owners, used to say which companies asked a problem; no affiliation.

This keeps the documented "letters, not logos" decision (no ADR needed) and makes it intentional rather than a placeholder.

**Update (2026-11-24): logos, at the owner's decision.** Shown a mockup of letters against logos, the owner preferred logos and asked for the best quality available. What changed since the facts above: instead of one licensed icon set, a pipeline (`scripts/content/fetch-logos.mjs`) takes each company's own published icons (an SVG favicon, the Apple touch icon, the web manifest), Simple Icons where the brand is there, the favicon services as a fallback, and, for the dozen whose sites only publish 32 px icons, an official logo file reviewed by hand. It cleans each one (white backdrops removed, white logos drawn in the ink, empty margins trimmed) onto a light plate. 187 of 193 companies get a logo, the Israeli ones included; the 6 others keep the monogram on the same tile, so the grid still reads alike. Logos are self-hosted (no request to a third party while browsing) and the trademark note on company pages now names logos too. The monogram system above stays as that fallback.

## B3.5 Surfaces in the chosen direction

| Surface | Design | References |
|---|---|---|
| Problem Map | Six tier columns (two-column tier bands on a phone), districts with a name, "x/y" and one hex per problem; dashed fog and "locked" for locked topics; roads that light to amber along the chain of the hovered or selected topic; a brief panel with state, one-sentence lock reason, builds on / leads to, the next problem and the topic's problems; Status / Difficulty / Company lenses; Map / List toggle; arrow keys move between districts | NeetCode, Last Epoch, Exercism, Pudding, Brilliant |
| Daily challenge | Its own page (#/daily) and the dashboard hero: "Daily No. N", date, difficulty, topic, countdown to the next one, current and best streak, rolling 30-day count, a 16-week hex calendar that opens on this week (each day's daily: solved, not yet), and a text summary | Wordle, NeetCode, GitHub, Strava, Advent of Code |
| Learning path | The route: a sticky summary with the next problem pinned, tiers as stages with checkpoint lines ("When you finish it: ..."), topics as rows with hex progress, current topic open | Brilliant, Duolingo, roadmap.sh |
| Problems list | Search first, chips, live "N of 225" count, random unsolved, status hex in a fixed first column, difficulty pips plus word, topic, two companies; whole row is the link; two-line rows on a phone; a Map button | Kattis, CSES, Codewars, AlgoExpert |
| Workspace | Statement column at a reading measure with limits up top; a toolbar grouped setup / help / run; the console: verdict word + "N of 15" + time on one line, then 15 hexes (5 open, 10 with a lock and pass or fail only), then the open case; Accepted adds "Next problem" and lights the hex; failures get no motion | HackerRank, Codility, Boot.dev, Chess.com, Wordle |
| Interview and Mock OA | A pre-start card (format cards with time and mix, company picker), the clock starts on Start; a focus banner with a calm minute clock that shows seconds only in the last five minutes; a report with two big numbers and per-problem rows | Codility, Monkeytype |
| Battle | Opponent cards with pace; two lanes counting passed cases out of 15; a result with next/again; says plainly that it is a bot | TypeRacer, Chess.com Puzzle Rush |
| Companies | Hex company marks in a calm grid (identical tiles), progress as fill; a briefing page: mark, name, one status line, fact chips (Israel presence, tier, set size), 2-3 big numbers, the problem list as the spine | ESPN, YC, Resend, Godly |
| System | Hex logo and favicon, social preview, header with a palette trigger, five-item tab bar, streak chip that lights once today is done, hex spinner, skeletons, one state block for empty / error, toasts with a hex marker, a 404 that offers the map | Linear, Vercel |
