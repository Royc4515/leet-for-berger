---
description: Author a new problem end-to-end (statement, 15 tests, 3 solutions, unit tests)
argument-hint: <problem-id or short description>
---

Add a new problem to Leet-For-Berger: $ARGUMENTS

1. Read `CLAUDE.md`, `docs/PROBLEM_FORMAT.md` and `src/js/problems/smallest-base-segment.js` (reference implementation).
2. If the id matches a `planned` entry in `src/js/problems/index.js`, reuse its title, difficulty, topics and milestone.
3. Write a plain JS `reference` solution first, then a brute force in the test file. Make them agree on 1000+ seeded random inputs before writing anything else.
4. Design tests with the checklist in PROBLEM_FORMAT.md: exactly 5 visible, exactly 10 hidden, at least 2 at max constraints, all generated inputs seeded.
5. Write starter code + optimal solutions for javascript, python, java. Solutions get WHY comments.
6. Write a 3-5 step Socratic `hints` ladder: questions, never answers.
7. Register in `problems/index.js` (move out of `planned`).
8. Add `tests/<id>.test.js`. Run `npm run check`. Python solution must pass in the e2e flow too: open the problem, select Python, Reveal, Submit.
9. Update CHANGELOG.md (Unreleased).
