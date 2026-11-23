# Design references (stage F6, Phase A)

Research for the F6 redesign (`docs/REDESIGN_BRIEF.md`). Captured 2026-11-23 with headless Chromium (Playwright): full-page screenshots at 1440 and 390 px, a short video of the key interaction for most references, and 3 to 6 frames per video, each opened and described before it was used. Captures stay in the session scratchpad and are not committed (no third-party images in the repo). Timings come from 25 fps video and are estimates (about 40 ms precision).

**Originality rule.** These references are for principles. Nothing here copies a site's layout, illustration, icons, colours, logos or copy. Where an idea is adapted, the adaptation is ours and the source is credited below.

63 references were captured; 10 more were blocked (listed at the end).

## 1. Coding practice and challenge sites

| Site | Screens | Works | Fails | Idea we adapt | Informs |
|---|---|---|---|---|---|
| NeetCode | practice list, roadmap + drawer, workspace | Daily rail beside the list (calendar, reset countdown, streak); custom input split per parameter; the roadmap drawer reuses the problem table | Run/Submit dimmed with no reason; 300 ms row hover feels slow; roadmap shrunk to unreadable on a phone | A permanent "today" block; the map's panel reuses the list | Problems, Daily, Map |
| Exercism | tracks, concept map, exercise, community solutions | Progress drawn inside each map node (one dot per exercise); hover preview with one action | Low density; illustrated headers | Map node = name + one mark per problem | Map, Path |
| Codewars | library, kata | Difficulty as shape + colour + text (hex rank badge); "my progress" filter | Icon walls; hover flyout nav; six selects before the first result on a phone | A difficulty token that never relies on colour; a status filter | Problems |
| AlgoExpert | questions grid | "Pick random" beside a group-by switch | Difficulty colour only; locks shown only on hover | Random unsolved button | Problems |
| Boot.dev | lesson demo, submit | Running state can be cancelled; on a pass the emphasis moves to Next and the step fills | Verdict only in a self-dismissing toast; heavy skin; confetti on every pass | Accepted promotes "Next problem" and fills the mark in place | Workspace, Path |
| Advent of Code | 2015/2023 calendars, day, leaderboard, stats | The calendar is both navigation and a progress picture; part 2 opens after part 1 | Not responsive | A daily history grid that fills in and is never erased | Daily, Map |
| AtCoder | contests, task | Limits before the statement; copy on samples; one clock | Dated, tiny type | Time limit and case count at the top of the statement | Workspace |
| Kattis | problem table | Every column sorts; difficulty pill with number and word | Nav overlay on load; table scrolls sideways on a phone | Difficulty that reads without colour | Problems |
| CSES | problem set, task | Dense rows that stay scannable; sibling list with status inside the task | No search or filters | Status mark in a fixed first column | Problems, Workspace |
| CodeChef | practice, workspace | Prev/next in the header | Login wall appears only after Run; truncated tabs on a phone | Say limits before the action (editor-only languages) | Workspace |
| Codility | demo assessment | Pre-start card; the tour takes no time off the clock; minute-level timer; status icon in the results header; compile error as a mono block with a coloured edge; autosave line | | Interview pre-start card, calm minute timer, verdict status icon | Modes, Workspace |
| HackerRank (help-centre screenshots) | test results | Summary banner, then a case list with locks, then detail; a hidden case shows an explanation card | Shows the candidate's stdout for hidden cases (we must not) | 15-case console as summary + slots + detail; hidden cases show a lock and no data | Workspace |
| Wordle, Connections | splash, board, reveal | Number + date give the daily an identity; one deliberate sequential reveal | Result hidden behind sign-up | "Daily No. N"; a fast sequential reveal of the 15 cases | Daily, Workspace |
| Chess.com puzzles | level path, puzzle, Puzzle Rush | The verdict lands on the judged object; the main button becomes Next; best scores above the mode choice | Ads column | Accepted marks the hex in place; modes show your last result | Workspace, Modes |
| Monkeytype | test, result | Chrome hides while the clock runs; result shows two big numbers and next/again | Ad slot in the result | Focus mode for sessions; report with two big numbers | Modes |
| TypeRacer | race, result | Opponents as lanes; text visible during the countdown with input locked | Stacked modals at the moment of success; cartoon background | Battle as two lanes counting passed cases | Battle |
| CodeSignal Learn | collections | Collection tiles | Practice needs login | (low value) | |

## 2. Learning paths, progress and maps

| Site | Screens | Works | Fails | Idea we adapt | Informs |
|---|---|---|---|---|---|
| NeetCode roadmap | 18-topic graph, drawer | Right-sized graph; progress bar inside each node; one click to the topic's problems | No "next" marker, no locks; hover shows only the incoming edge; mobile is the desktop graph shrunk | Layered topic graph + side panel; add "you are here" and dependants | Map |
| roadmap.sh | frontend roadmap, drawer | Checkpoint callouts between stages ("At this point you can..."); a legend for how strict the order is | 120 SVG nodes with no role, label or tab stop; about 7 s first paint; mobile shrunk | Tier summaries as checkpoints; every node a real control | Map, Path |
| Brilliant | courses, course path | Sticky level header; four node states; a pinned Start card; jump back to current | Looping shimmer on Start | Pinned "Next" card, current-node ring | Path, Map |
| Duolingo (site, blog) | path, streak | Done / current / future / locked states; grace days ("freezes"); one-time milestone animations (the blog reports +1.7% day-7 retention from them) | Loss-aversion copy | Four topic states; milestones once; no guilt copy | Path, Daily |
| Coursera | specialization | Effort estimates per course; a goal row at the end | | Tier summaries say what finishing means | Path |
| Obsidian graph | local + global graph | The small local graph is useful | Global graph is a hairball that never settles | Show a topic's neighbourhood (builds on / leads to) in its panel, never a global force graph | Map |
| Path of Exile tree | passive tree | Search that lights up matching nodes | Tooltips cover a third of the canvas; zoom overshoots; hostile to newcomers | Company lens: fade everything a company does not ask | Map |
| Last Epoch tree viewer | skill tree + node list | "Map" and a sortable "List" as sibling tabs over the same nodes; "0/5" under each node; hexagons for major nodes | Hover card docks far from the node | Map / List toggle; fraction under each topic | Map |
| Metro maps (Road to Data Scientist, Metro Map Maker) | maps | A line is an ordered list; milestones make the route finite | About 150 stations and 10 colours is the ceiling; layout is hand work | Considered and set aside for the main map (direction B) | Map, Path |
| D3 zoomable circle packing | demo | Drill-in at about 700 ms ease-in-out with a label crossfade | No edges | Motion reference for focusing a district | Map |
| D3 force-directed | demo | | Settles after 2 s, drifts 4 s more; dragging reheats it | Precompute a seeded static layout | Map |
| The Pudding, Kevin Bacon | essay | Traces a route hop by hop (about 0.5 s per hop) with a caption | Auto-loops | Hover traces the prerequisite chain; one sentence says why | Map |
| The Pudding, Happy Map | essay | Territory with semantic zoom, a minimap | Cannot show prerequisites | Territory feel for districts, with roads for prerequisites | Map |
| GitHub contribution graph | profile | Calendar grid with a text tooltip | On a phone it opens at the oldest end | 16-week grid that opens on the current week, with a text summary | Daily |
| Strava | features | Progress against your own baseline; rolling 30-day counts | | Rolling 30-day count as the habit metric; streak second | Daily |
| Advent of Code (logged out) | calendars | The art is earned | Not responsive | A mosaic that fills in | Daily |

## 3. Craft, galleries and company pages

| Site | Screens | Works | Fails | Idea we adapt | Informs |
|---|---|---|---|---|---|
| Linear | home, features, changelog | Accent kept to a 6 px status dot and one chart line; dated changelog rail; 540 px reading column | Hero blurs in from invisible | Status = dot + word; a reading measure for statements | Shell, Workspace |
| Vercel | home, docs, search | Amber only for search matches; palette with a type pill and an Esc pill; the sidebar search field opens the palette | | Command palette with a type column and key hints | Palette |
| Resend | home | SDK tile row: monochrome icons, the selected one turns the accent; optically normalised logo grid | | Calm grids of many items in identical cells | Companies |
| Supabase | home | Near-black tinted toward the brand; body text at weight 450 | | Warm graphite neutrals tinted toward amber | Tokens |
| GitHub (Copilot page) | home | Mono eyebrows; green-tinted secondary text at 8.3:1 | | Mono eyebrow labels | Shell |
| Stripe | home | One per-digit roll for one live number | Three moving things in one fold | Count up one number once, on the dashboard | Problems |
| Raycast | home | Bold first clause, muted second clause in headings | WebGL hero stalled capture; 30% white text at 2.6:1 | Anti-pattern reference | |
| Notion | home | | A word rotator every 4.5 s | Anti-pattern reference | |
| Arc | farewell page | States a shutdown plainly | | State outages plainly (remote runner down) | Workspace |
| Figma, Warp | home | One oversized primary; a quiet dot-matrix status grid | | One primary per screen | |
| shadcn/ui | command, charts | Grouped palette results, instant arrow highlight, key hints | | Palette behaviour | Palette |
| Magic UI | number ticker, beam | Spring ticker; a beam pulse along a path | Beam loops forever | Unlock pulse along a road, once | Map |
| Aceternity | card hover | Shared highlight that follows the pointer | Showcase effects | (not adopted) | |
| React Flow | examples | Dot grid, minimap, fit control, 1:1 pan | React only | Copy the feel, not the library | Map |
| Cytoscape | demos | Plain JS, MIT, settles in under 1 s | A new dependency for a 26-node graph | Not needed: our layout is static and tiny | Map |
| Godly, Refero, Dribbble, Motion examples | galleries | Calm logo rows; chips under one search | Neon skill trees, purple gradients, HUD chrome | Hairline lines, no glow | |
| ESPN team page | Celtics | Crest + name + one record line; dense schedule as the spine; big numbers for leaders; own row bold in standings | Promo modal | Company briefing: mark, name, status line, list as spine, 2-3 big numbers | Companies |
| YC company page | Airbnb | Chips for batch, status, sector; a fact card | | Fact chips on the briefing | Companies |
| Wellfound | company | Facts sidebar, chips | A same-name company (two "Notion"s) | Disambiguate same-name companies | Companies |
| levels.fyi (phone) | company | A 2x2 fact block | Desktop blocked | Fact block | Companies |
| Work at a Startup, RemoteOK, Built In | logo grids | Identical cells with small logos stay calm | Colour-coded promoted rows, many colours | Monochrome, uniform tiles | Companies |
| Simple Icons, svgl, Wikimedia Commons | licensing pages | | | Logo sourcing facts, section 6 | Companies |

## 4. Recurring patterns across the best references

- **Layout.** Statement left, editor right, results docked under the editor. Separate panels with small gutters. A side panel at about a third to half width for detail on demand.
- **Hierarchy.** Summary first, then structure, then detail on demand (results console, company page, map panel). Big numbers only on end-of-session screens and briefings.
- **Progress.** Most compact first: a fraction under the node, a thin bar inside it, a ring on the current item only, fill or brightness, a global counter.
- **Locked.** Grey plus a padlock, visible at rest. No reference explains why something is locked in place: that is our opening.
- **You are here.** Brilliant, Duolingo and metro maps mark the current position; the coding references (NeetCode, roadmap.sh) do not. That is the biggest gap.
- **Success.** It moves you forward: the button becomes Next, the progress picture fills. Celebration is kept for milestones.
- **Daily.** Identity (number and date), a countdown to reset, current and best streak, and a history grid.
- **Timed modes.** Reading the rules is separate from the clock running; navigation hides while it runs.
- **Colour.** Tinted near-black grounds, off-white text, secondary text at 6 to 8.5:1, one accent used once or twice per screen.

## 5. Motion observations

| Interaction | Reference | Estimate | Our default |
|---|---|---|---|
| Row hover | Kattis, CSES (instant), NeetCode (300 ms, slow) | 0 to 120 ms | 90 ms (`--t-instant`) |
| Popover / tooltip | Exercism | 250 ms intent, 300 ms fade | Map tooltip on pointer move, no delay, no fade |
| Side panel open | NeetCode, roadmap.sh | about 500 ms | 220 ms ease-out (`--t-base`) |
| Command palette | Vercel, shadcn | 40 to 120 ms open, faster close | 220 ms spring-out on open, instant close |
| Sequential reveal | Wordle | 500 ms per tile, 300 ms stagger | 15 case hexes at 35 ms stagger, 260 ms each (about 0.75 s) |
| Drill-in zoom | D3 circle packing | 700 ms ease-in-out | Not used; selection is instant, the panel animates |
| Path tracing | Pudding | 0.5 s per hop | Instant chain highlight on hover; no auto-play |
| Number ticker | Magic UI, Stripe | 0.8 to 3 s | Once, 720 ms ease-out, dashboard only |
| Milestone | Duolingo, Boot.dev | under 1 s | Topic unlock and first solve: one 600 ms moment, once |
| Force layout | D3, Obsidian | 2 to 6 s settle | Never: static layout |

## 6. Logo sourcing facts (for the Companies decision)

- Simple Icons (npm `simple-icons@16.38.1`, 3,472 icons): the package is CC0-1.0, but CC0 section 4.1 does not waive trademark rights, and the project's DISCLAIMER asks users to "seek the correct permissions". Of the 74 brands we checked, 47 exist; none carries its own license data.
- Removed at the owners' request (merged pull requests): Microsoft (#10019), Amazon and AWS (#13056), IBM (#11314), LinkedIn (#11380), Adobe (#10018), Oracle (#11843), Salesforce (#13503), Twilio (#13389), Yahoo (#9861).
- Israeli coverage: only Wix, Fiverr, Similarweb and Palo Alto Networks. Absent: Check Point, Mobileye, monday.com, Amdocs, CyberArk, Taboola, Outbrain, Wiz, SentinelOne, AppsFlyer, Playtika, Armis, Lightricks, Gong.
- svgl: MIT code, but the site states "Permission must be obtained before using a logo".
- Wikimedia Commons tags simple text logos `PD-textlogo` plus `Trademarked`: that clears copyright, not trademark.
- Nominative fair use is a US doctrine; the Israeli position was not verified.

Conclusion (decision in `docs/research/DESIGN_DIRECTIONS.md`): logos would cover about a quarter of the 193 companies and almost none of the Israeli ones, and the most recognizable names (Microsoft, Amazon) are exactly the ones that asked to be removed. The site keeps letters and gets a better monogram system.

## 7. Anti-patterns for a tool used for hours

1. Physics that never settles; graphs with more than 30 to 40 labelled nodes.
2. A desktop poster shrunk to a phone instead of a different layout.
3. Graph nodes with no role, label or keyboard stop.
4. Tooltips that cover what you are inspecting; over-eager zoom.
5. No "you are here"; an ambiguous lock glyph (a paywall lock on NeetCode).
6. Nagging gamification: loss-aversion copy, looping shimmer, confetti on every pass.
7. Peripheral motion: marquees, word rotators, looping beams, autoplay video, scroll-jacking.
8. Continuous GPU effects; neon or purple gradients; glassmorphism everywhere.
9. Low-contrast "aesthetic" text (30% white at 2.6:1); display tracking at UI sizes.
10. Promo bars, modals or sign-in walls on load or after an action; buttons disabled without a reason.
11. A seconds-level clock ticking for 30 minutes or more.
12. Calendars that open at the oldest end; tables that scroll sideways on a phone.

## 8. Blocked or skipped (not bypassed)

LeetCode and leetcode.cn (403), HackerRank main site (403, help-centre screenshots used), Codeforces (403), lichess (403, Chess.com used), Project Euler and HackerEarth (403), Khan Academy (bot challenge), Observable (429, original D3 examples used), NYT (403), Civilization wiki and poewiki (403), Awwwards (502), Land-book desktop (403), Codrops desktop (403), Behance (400), Glassdoor (403), Crunchbase (403), levels.fyi desktop (403), NBA (403), EuroLeague (429). Pages behind a login were replaced by public pages or blog images.

## Credits

Ideas adapted from: NeetCode (today rail, panel that reuses the list), Exercism (marks inside map nodes), Codility (pre-start card, minute timer, status in the results header), HackerRank (hidden case explanation), Wordle (daily identity, sequential reveal), Chess.com and Boot.dev (success promotes Next), Monkeytype (focus mode, two-number report), TypeRacer (race lanes), Last Epoch (Map / List, fractions, hexagonal nodes), Brilliant and Duolingo (node states, pinned Next, milestones once), roadmap.sh (checkpoints between stages), The Pudding (chain tracing), GitHub and Strava (history grid, rolling counts), Linear and Vercel (accent rationing, palette), ESPN and YC (company briefing anatomy).
