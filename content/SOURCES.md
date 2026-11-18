# Sources

Every external source the bank is built from, what we take from it, and how to refresh it. Use this
when adding problems or solutions. Raw downloads go to `content/.cache` (gitignored); only derived
facts are committed.

Rule: a problem's idea and facts (number, difficulty, companies, complexity) are reusable; its
wording is not. Statements, examples and tests are always our own (`content/README.md`).

## Problem facts

| Source | License | What we take | Refresh | Lands in |
|---|---|---|---|---|
| [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems) | public dataset | Company tags, frequency, recency window | `fetch-sources.sh` | `content/index/problems.json` |
| [snehasishroy/leetcode-companywise-interview-questions](https://github.com/snehasishroy/leetcode-companywise-interview-questions) | public dataset | More companies, incl. Israeli ones | `fetch-sources.sh` | `content/index/problems.json` |
| [zerotrac/leetcode_problem_rating](https://github.com/zerotrac/leetcode_problem_rating) | public dataset | Contest rating (numeric difficulty) | `fetch-sources.sh` | `content/index/problems.json` |
| [neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode) | MIT | Pattern, Blind 75 / NeetCode 150 membership | `fetch-sources.sh` | `content/index/problems.json` |
| [javadev/LeetCode-in-Java](https://github.com/javadev/LeetCode-in-Java) | MIT | Top Interview 150 list | `fetch-sources.sh` | `content/index/problems.json` |
| [kamyu104/LeetCode-Solutions](https://github.com/kamyu104/LeetCode-Solutions) | MIT | Best known time and space complexity, every problem | `fetch-sources.sh`, then `node scripts/content/complexity.mjs` | `content/index/complexity.json` |

Rebuild everything:

```bash
bash scripts/content/fetch-sources.sh
node scripts/content/build-index.mjs
node scripts/content/complexity.mjs
node scripts/content/build-meta.mjs   # problem page context -> src/js/data/problem-meta.json
node scripts/content/audit.mjs
```

### Complexity policy

`complexity.json` is the best known complexity for LeetCode's version of a problem. Our own
`growth` target (ADR 0004) is authoritative for our variants, whose limits sometimes differ. The UI
shows kamyu104's value as "best known" with attribution. doocs/leetcode also states complexity in
its per-problem READMEs (about 68% coverage, CC BY-SA), used only as a cross-check.

## Solutions

| Source | License | Languages | Used how |
|---|---|---|---|
| [doocs/leetcode](https://github.com/doocs/leetcode) | CC BY-SA 4.0 | py, java, cpp, go, ts, js, cs, c | First choice |
| [walkccc/LeetCode](https://github.com/walkccc/LeetCode) | MIT | py, java, cpp | When doocs lacks a language |

Stage them for a problem, then adapt to our signature and pass `tests/solutions.test.js`:

```bash
node scripts/import/fetch-solutions.mjs <slug> [...]        # -> content/.cache/imports/<slug>/
node scripts/import/fetch-solutions.mjs --essential --coverage
```

Adapted files keep their first-line attribution comment. Licenses and notices: `THIRD_PARTY_NOTICES.md`.

## Adding a source

1. Check the license allows reuse of what we take (facts, or code with attribution).
2. Add the download to `scripts/content/fetch-sources.sh` (into `content/.cache`), a pinned branch or file where possible.
3. Commit only derived data, with the source and license recorded in it.
4. Add a row here, and in `THIRD_PARTY_NOTICES.md` if anything we ship derives from it.
