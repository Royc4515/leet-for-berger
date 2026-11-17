# Problem format

One file per problem: `src/js/problems/<id>.js`, default export = problem object. Reference implementation: `smallest-base-segment.js`.

## Required fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, equals file name |
| `title` | string | |
| `difficulty` | `'Easy' \| 'Medium' \| 'Hard'` | |
| `topics` | string[] | ids from `TOPICS` in `problems/index.js` |
| `patterns` | string[] | free text tags shown in the header |
| `milestone` | 1-4 | learning path placement |
| `timeLimitMs` | number | **per case** wall clock |
| `argNames` | string[] | used to print `s = "..."` in the console |
| `statementHtml` | string | trusted author HTML only |
| `constraints` | string[] | |
| `examples` | `{input, output, explanation?}[]` | usually the first 2-3 visible tests |
| `hints` | string[] | Socratic ladder for the mentor, 3-5 items, questions not answers |
| `signatures` | `{ [lang]: { entry } }` | function name per language |
| `starterCode` | `{ javascript, python, java }` | |
| `solutions` | `{ javascript, python, java }` | optimal, commented with WHY |
| `visibleTests` | exactly 5 `{args, expected}` | detailed feedback |
| `hiddenTests` | exactly 10 `{args, expected}` | pass/fail only |
| `parseCustomInput(raw)` | fn | returns `{ok:true,args}` or `{ok:false,error}`; enforce constraints |
| `solveReference(args)` | fn | computes expected for custom input |

Also export the JS `reference` function so tests can import it.

## Test design checklist

Hidden tests must target the classic wrong answers, not just "more of the same":

- [ ] smallest input (n = 1) and the empty-ish edge the constraints allow
- [ ] the "looks right but isn't" case (for SBS: period that does not divide n)
- [ ] near-miss: valid structure broken by the last element
- [ ] at least 2 inputs at max constraint size, so O(n^2) times out at `timeLimitMs`
- [ ] generated inputs use `mulberry32(seed)`, never `Math.random()`
- [ ] every `expected` computed by `reference`, and `reference` verified against a brute force in `tests/`

## Registering

1. Import it in `src/js/problems/index.js` and add to `implemented`.
2. Remove its `planned` entry if one exists.
3. Add `tests/<id>.test.js`: reference vs brute force on random inputs, visible expectations agree with reference, parser accepts/rejects correctly.
4. `npm run check`. `tests/solutions.test.js` runs the shipped JavaScript, Python and Java solutions against all 15 cases (Python and Java where `python3` / `javac` exist; CI has both). Java solutions run through `scripts/verify/Harness.java`, which supports `int`, `long`, `double`, `boolean`, `String`, `char`, arrays of these and `List` parameters.
