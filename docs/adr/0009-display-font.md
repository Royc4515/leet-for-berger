# ADR 0009: A self-hosted display face (Bricolage Grotesque)

Status: accepted (2026-11-23)

## Context

The F6 redesign (Atlas, `docs/research/DESIGN_DIRECTIONS.md`) gives the site a voice in its large type: page titles, the verdict, district names on the map, big numbers on the daily and in reports. Inter alone reads well at interface sizes but gives every heading the same neutral voice; the research (`docs/research/DESIGN_REFERENCES.md`, section 2 of the craft notes) found that the products with a recognisable feel pair one interface face with one display face used only at large sizes.

Constraints: no font CDN (it would leak every visitor's IP and add an unpinned dependency, the same reasoning as F5's self-hosted Inter and JetBrains Mono), a license that allows redistribution in a public repository, a Latin subset small enough to stay inside the 250 KB font budget that `tests/design-tokens.test.js` enforces.

## Decision

Add **Bricolage Grotesque** (variable weight 200 to 800, Latin subset) as the display face.

- Source: `@fontsource-variable/bricolage-grotesque` 5.3.0 from npm, built from github.com/ateliertriay/bricolage. File: `src/fonts/bricolage-grotesque-latin.woff2`, 44 KB.
- License: SIL Open Font License 1.1, copied to `src/fonts/OFL-bricolage-grotesque.txt`; all three faces are listed in `src/fonts/README.md`.
- Loaded with `@font-face` and `font-display: swap` from `src/css/app.css`; the fallback stack is Inter, then the system sans.
- Total self-hosted fonts: about 130 KB (Inter 48 KB, JetBrains Mono 40 KB, Bricolage 44 KB), under the 250 KB budget.
- Use: `--display` token only, at 13 px and above for district names and 16 px and above elsewhere. Body text, controls and tables stay Inter; code and numbers in columns stay JetBrains Mono.

## Consequences

- One more font request on first paint (cached after). Swap means text is never invisible.
- The design tokens test checks that every `@font-face` is local woff2 with swap and that the total stays under budget.
- Upgrading the font is a deliberate change with a screenshot check, like a CDN pin (CLAUDE.md invariant 8).
