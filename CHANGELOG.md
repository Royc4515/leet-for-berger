# Changelog

## [Unreleased]

### Added
- Problem: Notify Recipients (original, from reported monday.com tasks): resolve user and group targets to a sorted, deduplicated recipient list. Hidden tests punish re-expanding a repeated group, scanning all users per request, and sorting ids as text.
- Solution verifier: `tests/solutions.test.js` runs every problem's shipped JavaScript, Python and Java solution against all 15 cases; Java through `scripts/verify/Harness.java`. Smallest Base Segment's Python and Java solutions are now verified too.
- Distinct problem count: `distinctProblems()` collapses family versions; the core bank's 711 entries are 596 distinct problems. Reported first in `content/AUDIT.md`.
- More Israeli companies: Taboola, JFrog and Payoneer reports; Playtika, AppsFlyer and Gong listed with no concrete coding data found.
- More sources: a second company-tag dataset (678 companies in total, including Israeli ones), LeetCode's Top Interview 150, 47 Codility lesson tasks (`content/external/codility.json`) linked into families, and candidate reports for Israeli companies without tag data (`content/reports.json`: Check Point, CyberArk, Wiz, monday.com). Company groups in `content/companies.json`.
- Topic + subtopic for every core problem: hand-assigned in `content/subtopics.json` where ladders and tag rules do not place a problem, plus `secondary` topic tags. New subtopics where the data needed them (closed-form math, tree DP, implicit-graph BFS, greedy with a heap, peak finding, Eulerian path and others).
- Core bank is now 710 problems (wave 1: 419, wave 2: 291). Audit adds subtopic counts, Israeli company and other-site sections.
- Problem index: `content/index/problems.json`, 3,398 problems from 470 companies' tag lists, NeetCode lists and contest ratings, each mapped to a topic with rating, company frequency and recency, and a priority score. Built by `scripts/content/build-index.mjs`, validated by `tests/content-index.test.js`.
- Problem families: `content/families.json`, 79 families of near-identical problems (222 problems), each version with its one-line twist. `pickVersion` (`src/js/data/families.js`) returns the version a given company asks most; those versions join the core bank (+27, total 579). Audit reports per-company versions.
- Core bank: 552 problems in two waves (`content/selection.json`). Wave 1 (356): ladders, Blind 75, NeetCode 150 and easy classics. Wave 2 (196): problems asked by 15+ companies or in the top 30 of a top-20 company. Every index record carries `wave` and `core` (why it was selected).
- Matrix topic (Spiral Matrix, Rotate Image, Set Matrix Zeroes, Game of Life). Removed the `sparse-table` concept, which had no interview problems.
- Ladders: `content/ladders.json`, 225 hand-picked problems across 26 topics, each with a concept and a learning-order step, filling every Easy/Medium/Hard target.
- Content audit: `scripts/content/audit.mjs` writes `content/AUDIT.md`.
- Learning network taxonomy: 26 topics (including SQL, Matrix and Data Structure Design) in 6 tiers with prerequisites, ordered concepts and Easy/Medium/Hard ladder targets (225 problems), plus the practice modes the content must support.
- `content/README.md`: two-layer content model (index of facts vs. original content), index record format, allowed sources, pipeline.
- `scripts/taxonomy-graph.mjs` to regenerate the network diagram.

## [0.1.0] - 2026-11-16

### Added
- Core workspace: problem description, Monaco editor (vs-dark), execution console, draggable column and row resizers (mouse + keyboard, persisted).
- 15-case test harness: 5 detailed visible cases, 10 hidden pass/fail cases, per-case time limit, compile / runtime / TLE / wrong-answer verdicts.
- Runners: JavaScript (Web Worker), Python (Pyodide worker), Java (editor only, honest verdict).
- Problem: Smallest Base Segment (KMP prefix function, O(n)) with solutions in JS, Python, Java.
- Custom test input on Run, validated against constraints.
- Reveal Solution with confirmation and "assisted" tracking.
- Problem bank with difficulty, topic and text filters; 16 planned problems listed.
- Progress tracking: solved, streak, accuracy, submissions.
- Learning Path with 4 milestones.
- Interview Simulator (45 min, lockdown, tab-switch logging, scored report).
- 1v1 Battle against a seeded bot with live progress bars.
- AI Mentor side panel (scripted Socratic hints; LLM provider interface + system prompt).
- Unit tests (node --test), Playwright smoke test, CI and GitHub Pages workflows, CLAUDE.md and Claude Code commands.

### Fixed (during build)
- Interview tab-switch counter read the wall clock instead of the injected time, so it silently stopped counting in tests.
- Interview and Battle opened on the practice draft (possibly a revealed solution); sessions now keep their own in-memory drafts.
- Mobile layout squeezed the description pane; panes now stack and the view scrolls.
