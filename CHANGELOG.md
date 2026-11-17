# Changelog

## [Unreleased]

### Added
- Time limits in the 8-language verifier: every language must run all 15 cases within one case's `timeLimitMs`. The browser only enforced limits for JavaScript and Python, so a slow solution in another language passed CI. An O(n^2) C++ Pair Sum Target now fails (3.9 s against 2 s); all shipped solutions finish in under 1.2 s.
- Essential problems, batches 2 to 5, each with solutions in 8 languages. Math Basics: Digit Palindrome, Roman Numeral Value, String Multiply, Prime Count, Power Mod, String GCD. Two Pointers and Stack: Rain Trap, Merge Sorted, Zeros To End, Zero Triplets, Bracket Check, Asteroid Collision, Warmer Days, Postfix Eval. Prefix Sum and Intervals: Product Except Self, Subarray Sum K, Region Sum, Range Bookings, Largest Concat, Merge Ranges, Meeting Room Minimizer, Smaller Count. Matrix, Bits and Recursion: Spiral Order, Rotate Grid, Zero Rows Cols, Lone Number, Bit Count, Add Without Plus, Circle Elimination, Grammar Symbol. Several limits are raised above LeetCode's so max-size tests separate the target complexity. 39 of the 131 essential problems are done; Power Mod stands in for Pow(x, n) as an exact integer variant.
- Solution import pipeline: `npm run import:solutions` stages open-source solutions (doocs/leetcode, CC BY-SA 4.0; walkccc/LeetCode, MIT) for any indexed problem, deriving JavaScript from TypeScript when missing. For the 131 essential problems: Python 131, JavaScript 109, TypeScript 105, Java 126, C++ 126, Go 125, C# 54, C 16. Adapted files keep an attribution line; `THIRD_PARTY_NOTICES.md` lists the sources. Tests and statements are still written here, and every shipped file must pass the verifier.
- Essential problems, batch 1 (Arrays & Hashing), each with solutions in 8 languages: Pair Sum Target, Anagram Buckets, Top K Frequent, Longest Streak, Isomorphic Strings, Ticket Queue. Where several answers would be valid, the statement fixes one order so judging is exact. 9 of the 131 essential problems are done.
- Verifier check that every test case passes exactly the signature's arguments (JavaScript silently ignores extra arguments; this caught a malformed hidden test).
- Linked lists, binary trees and design problems in the problem format: `ListNode`, `ListNode[]` and `TreeNode` signature types (LeetCode JSON forms) and class signatures tested as operation sequences. Starter code, browser runtime (`src/js/engine/adapters.js`) and the 8-language verifier support all of them.
- Problems: Reverse List (linked list), Level Order (binary tree) and Min Stack (design), each in 8 languages. All three are on the essential path.
- `src/js/engine/structures.js`: tree and list helpers for problem references and generators.

### Fixed
- Java verifier reused one `Solution` object for all 15 cases, so state left in instance fields leaked between cases (found with an imported Subsets solution). It now creates one per case, like LeetCode and the C++ and C# harnesses.
- Uncaught "Canceled" errors when leaving a problem: Monaco cancels in-flight work on close, and its scripts loaded without CORS, so the errors were muted and impossible to handle. Monaco now loads with CORS, editors are disposed before their models, and only Monaco's exact cancellation error is ignored.
- ADR 0002: PostgreSQL on Supabase as the runtime store, git as the content source of truth. `db/schema.sql` (18 tables, row level security: hidden test cases and solutions never reach clients, `reveal_solution()` marks a problem assisted). `scripts/db/export-sql.mjs` syncs git into the database without touching user data. `scripts/db/check-schema.sh` (`npm run check:db`, in CI) verifies all of it against a throwaway PostgreSQL with the real content.
- Essential path: 131 problems, one per subtopic (the most asked, ladder problems first). Index records carry `essential`; the audit lists the path by topic. The rest of the bank is optional practice.
- Eight interview languages: Python, JavaScript, TypeScript, Java, C++, C, C#, Go. Problems declare one neutral typed `signature`; `src/js/engine/codegen.js` generates entry names and starter code for every language (C in LeetCode style).
- Problem folders: `src/js/problems/<id>/problem.js` plus `solutions/` with one real file per language. "Reveal Solution" fetches the file.
- 8-language verifier: `tests/solutions.test.js` compiles and runs every solution against the 15 cases and checks the generated starter code compiles. Harnesses in `scripts/verify/harnesses.mjs`; C, C++, Go and C# read a flat token stream. CI installs Java, Go, .NET and TypeScript and sets `REQUIRE_ALL_LANGUAGES=1` so no language is skipped.
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
