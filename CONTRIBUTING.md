# Contributing

Thanks for helping. This is a small project with strict rules about correctness, so please read this page before opening a pull request. The full engineering manual, with the file-by-file map, is [`CLAUDE.md`](CLAUDE.md).

## Set up

```bash
npm install
```

```bash
npm run dev
```

The site runs at <http://localhost:5173>. See [Getting started](README.md#getting-started) for prerequisites and the test commands.

## Workflow

1. **Branch per task:** `feat/...`, `fix/...`, `content/<problem-id>`, `docs/...`, `chore/...`.
2. **Tests first** for any change to pure logic (`src/js/engine/`, `src/js/data/`, `src/js/state/`, `src/js/modes/`).
3. **`npm run check` must pass** (unit tests and the Playwright smoke test, zero console errors). For UI changes, run `node e2e/smoke.mjs --shots=/tmp/shots` and look at the screenshots at desktop and 390 px. Read [`docs/DESIGN.md`](docs/DESIGN.md) before touching the UI.
4. **Update [`CHANGELOG.md`](CHANGELOG.md)** under Unreleased, and [`docs/PLAN.md`](docs/PLAN.md) if you finish a planned task.
5. **Small commits** with imperative subjects. The pull request template asks what changed, why, and how you verified it.

## Invariants

Breaking one of these is a bug, not a style choice. Details and reasons are in [`CLAUDE.md`](CLAUDE.md#invariants-breaking-any-of-these-is-a-bug-not-a-style-choice).

- Every run executes exactly 15 cases: 5 visible, 10 hidden.
- Expected values never reach a worker, and hidden case data never reaches the UI.
- User strings never go through `innerHTML`; use `h()` from `src/js/ui/dom.js`.
- Hidden tests are deterministic (seeded `mulberry32`, never `Math.random()`).
- Pure modules take time as a parameter and never touch the DOM.
- Every view returns a cleanup function.
- CDN versions are pinned; upgrading one is its own task with an e2e run.
- No secrets in the client: this is a static site.
- Every shipped solution is verified in all 8 languages in CI; starter code is generated, never hand-written.

## Conventions

- Vanilla JavaScript ES modules, no framework and no bundler. Adding either needs an ADR in [`docs/adr/`](docs/adr/) first.
- JSDoc on every exported function. Comments explain why, not what. Mark load-bearing lines with `// don't touch / <reason>`.
- `camelCase` functions, `PascalCase` classes, `kebab-case` files. A problem id is kebab-case and equals its folder name.
- No em dashes anywhere; use a regular hyphen.
- Interactive elements are real `<button>` or `<a>` elements, keyboard reachable, with `aria-*` where state is not visual-only.

## Adding a problem

Follow [`docs/PROBLEM_FORMAT.md`](docs/PROBLEM_FORMAT.md): a statement, a typed signature, a reference solution, a seeded generator for the 10 hidden tests, a solution in each of the 8 languages (or one `solution.sql`), and a unit test. CI verifies every solution in every language.

## Reporting bugs and ideas

Open an [issue](https://github.com/Royc4515/leet-for-berger/issues/new/choose). For a wrong verdict, include the problem id, the language and your code.
