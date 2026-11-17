# Changelog

## [Unreleased]

### Added
- Learning network taxonomy: 23 topics in 6 tiers with prerequisites, ordered concepts and Easy/Medium/Hard ladder targets (194 problems), plus the practice modes the content must support.
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
