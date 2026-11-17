---
description: Author a new problem end-to-end (statement, 15 tests, solutions in 8 languages, unit tests)
argument-hint: <problem-id or short description>
---

Add a new problem to Leet-For-Berger: $ARGUMENTS

1. Read `CLAUDE.md`, `docs/PROBLEM_FORMAT.md` and `src/js/problems/notify-recipients/` (reference implementation).
2. Check `content/index/problems.json` for the problem's topic, subtopic (`concept`) and family; if the id matches a `planned` entry in `src/js/problems/index.js`, reuse its title, difficulty, topics and milestone.
3. Write a plain JS `reference` solution first, then a brute force in the test file. Make them agree on 1000+ seeded random inputs before writing anything else.
4. Design tests with the checklist in PROBLEM_FORMAT.md: exactly 5 visible, exactly 10 hidden, at least 2 at max constraints, all generated inputs seeded.
5. Declare the neutral `signature`. Do not write starter code: it is generated.
6. Solutions in all 8 languages under `solutions/` (Python, JavaScript, TypeScript, Java, C++, C, C#, Go). Start from imports: `npm run import:solutions -- <leetcode-slug>` stages open-source candidates in `content/.cache/imports/<slug>/`; adapt them (keep the attribution line, see PROBLEM_FORMAT.md) and translate the missing languages. Same algorithm in each, WHY comments, idiomatic per language (C uses LeetCode size conventions).
7. Write a 3-5 step Socratic `hints` ladder: questions, never answers.
8. Register in `problems/index.js` (move out of `planned`).
9. Add `tests/<id>.test.js`. Run `npm run check`: `tests/solutions.test.js` must pass for all 8 languages (install missing toolchains or rely on CI, which requires all of them).
10. Update CHANGELOG.md (Unreleased).
