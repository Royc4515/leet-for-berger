# Problem format

One folder per problem, written once and verified in all 8 interview languages:

```
src/js/problems/<id>/
  problem.js          statement, typed signature, tests (reference + seeded generators), hints
  solutions/
    solution.py       Python 3
    solution.js       JavaScript
    solution.ts       TypeScript
    Solution.java     Java
    solution.cpp      C++17
    solution.c        C
    Solution.cs       C#
    solution.go       Go
```

Reference implementations: `src/js/problems/notify-recipients/` (arrays and strings), `reverse-list/` (linked list), `level-order/` (binary tree), `min-stack/` (design class).

## Starting from imported solutions

Do not write 8 solutions from scratch when an open-source one exists. `npm run import:solutions -- <leetcode-slug>...` (or `-- --essential`) stages candidates in `content/.cache/imports/<slug>/` (gitignored): doocs/leetcode first, walkccc/LeetCode as fallback, JavaScript transpiled from TypeScript when missing. `--coverage` only reports what is available. C# and C are often missing; translate them from the Java and C++ files.

Staged files are raw material. To ship one:
- adapt it to this problem's signature, names and output rules (fixed order, returning instead of mutating);
- keep the first-line `Adapted from ...` attribution comment (license requirement, see `THIRD_PARTY_NOTICES.md`);
- rewrite or drop comments so they are English, explain why, and contain no em dashes;
- pass `tests/solutions.test.js`. The verifier, not the source, is what makes it shippable.

The statement, tests, hints and `reference` are always written for this project.

Starter code and per-language entry names are **generated** from the signature (`src/js/engine/codegen.js`); never write them by hand. Solutions are real files so the verifier can compile them and editors can highlight them; the app fetches one when the user clicks "Reveal Solution".

## Required fields in `problem.js`

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, equals the folder name |
| `title` | string | |
| `difficulty` | `'Easy' \| 'Medium' \| 'Hard'` | |
| `topics` | string[] | ids from `TOPICS` in `problems/index.js` |
| `patterns` | string[] | free text tags shown in the header |
| `timeLimitMs` | number | **per case** wall clock |
| `argNames` | string[] | used to print `s = "..."` in the console |
| `statementHtml` | string | trusted author HTML only |
| `constraints` | string[] | |
| `examples` | `{input, output, explanation?}[]` | usually the first 2-3 visible tests |
| `hints` | string[] | Socratic ladder for the mentor, 3-5 items, questions not answers |
| `explanationHtml` | string, optional | Our own prose shown on top of the walkthrough after a solve: the idea, why it works, the common pitfall. Author-written HTML, same rules as `statementHtml` |
| `signature` | `{ name, params: {name, type}[], returns }` | neutral types, see below |
| `visibleTests` | exactly 5 `{args, expected}` | detailed feedback |
| `hiddenTests` | exactly 10 `{args, expected}` | pass/fail only |
| `parseCustomInput(raw)` | fn | returns `{ok:true,args}` or `{ok:false,error}`; enforce constraints |
| `solveReference(args)` | fn | computes expected for custom input |
| `judge` | string, optional | judge mode when exact equality cannot judge the answer (see Judge modes); default `'exact'` |
| `growth` | object, optional | growth estimate after Accepted (see Growth estimate); algorithm problems only |

Also export the JS `reference` function so tests can import it.

## Signature types

`int`, `long`, `double`, `bool`, `string`, and arrays of them up to two dimensions (`int[]`, `string[][]`). Names are camelCase; each language gets its own convention (`notify_recipients` in Python, `NotifyRecipients` in C#).

Structures, written in tests as JSON in the LeetCode convention:

| Type | JSON form | Notes |
|---|---|---|
| `ListNode`, `ListNode[]` | `[1,2,3]` (head to tail), `[]` for an empty list | singly linked list of int |
| `TreeNode` | level order with `null` for a missing child, no trailing nulls: `[3,9,20,null,null,15,7]`, `[]` for an empty tree | binary tree of int; use `src/js/engine/structures.js` in references and generators |
| `ListNode@cycle` | `[values, pos]`: `[[3,2,0,-4], 1]`, `pos` = index the tail links back to, `-1` for none | input only. Every language receives a plain `ListNode` head and never sees `pos` (List Loop) |
| `RandomListNode` | `[[val, randomIndex], ...]` head to tail, `randomIndex` `null` for none: `[[3,null],[8,0]]` | list whose nodes also have `random`; param and return (Random Link Copy) |
| `NestedInteger[]` | nested arrays of int: `[[1,1],2,[1,1]]` | input only. LeetCode's read-only interface `isInteger()`, `getInteger()`, `getList()` (Python `is_integer` etc., camelCase also works; C# and Go PascalCase; C `nestedIntegerIsInteger(n)`, `nestedIntegerGetList(n)` + `nestedIntegerGetListSize(n)`). Java `List<NestedInteger>`, C# `IList<NestedInteger>`, C++ `vector<NestedInteger>`, Go `[]*NestedInteger`, C `struct NestedInteger**` + size (Nested Flattener) |

Starter code shows each structure's definition as a comment; the runtime provides it (do not redefine it in solutions).

### Design problems (class signatures)

```js
signature: {
  kind: 'class',
  name: 'MinStack',
  constructor: { params: [] },
  methods: [
    { name: 'push', params: [{ name: 'val', type: 'int' }], returns: 'void' },
    { name: 'getMin', params: [], returns: 'int' },
  ],
},
```

A test is a sequence of calls: `args` is `[operations, argumentLists]` with `operations[0]` the class name, and `expected` lists every call's result (`null` for the constructor and `void` methods). Method names follow each language (Python `get_min`, C# and Go `GetMin`, C `minStackGetMin(MinStack* obj)` with `minStackCreate` / `minStackFree`, Go `Constructor()`).

### How structures and classes run

`src/js/engine/adapters.js` generates source placed before and after the user's code for JavaScript, TypeScript and Python. It provides ListNode and TreeNode, converts JSON to objects and back, and dispatches design operations. The browser workers and the CI verifier run the same adapter. C, C++, Go, C# and Java harnesses in `src/js/engine/programs/` do the same natively; the CI verifier and the remote runner (ADR 0005) use the same programs.

| Neutral | Python | Java | C++ | C | C# | Go | TS / JS |
|---|---|---|---|---|---|---|---|
| `int` | int | int | int | int | int | int | number |
| `long` | int | long | long long | long long | long | int64 | number |
| `string` | str | String | string | char* | string | string | string |
| `int[]` | list[int] | int[] | vector&lt;int&gt;& | int* + size | int[] | []int | number[] |
| `int[][]` | list[list[int]] | int[][] | vector&lt;vector&lt;int&gt;&gt;& | int** + size + col sizes | int[][] | [][]int | number[][] |

C follows LeetCode conventions: array params carry explicit sizes, array returns use `int* returnSize` (and `int** returnColumnSizes` for 2D) and must be `malloc`ed.

The types beyond `ListNode` and `TreeNode` are emitted only for a signature that uses them: the source adapters (`adapters.js`) and the native harness code (`src/js/engine/programs/extra-types.js`, which `build.js` calls; Java has `programs/java/RandomListNode.java` and `NestedInteger.java`). Native harnesses read them as tokens: `ListNode@cycle` as `<n> values <pos>`, `RandomListNode` as `<n>` then `<val> <random>` per node (`-1` = null), `NestedInteger[]` as `<n>` then `i <val>` or `l` and a nested list per item.

**Copies.** A correct copy of a `RandomListNode` list serializes to its input, so equality alone cannot catch a solution that returns the original. Every harness remembers the input nodes by identity and, when the returned list reuses one (as a node or as a `random` target) or a `random` pointer leaves the returned list, outputs a marker string instead of the list (`COPY_MARKERS` in `adapters.js`, same text in every language). The marker never equals an expected list, so the case is a wrong answer and a visible case shows why.

**Iterators.** An iterator is a design class (Nested Flattener: `NestedIterator(nestedList)`, `next()`, `hasNext()`), so a test is an operation sequence like any class. That lets hidden tests call `hasNext` several times in a row, which LeetCode's drain loop (`while hasNext: next`) never does; the custom input takes just the list and builds that drain loop.

Not supported yet: graphs as node objects (Clone Graph). Add them to codegen, adapters and harnesses before authoring problems that need them. SQL problems have their own format, below.

## SQL problems

Design and dialect: [ADR 0003](adr/0003-sql-problems.md). Reference: `src/js/problems/address-lookup/` (two tables, LEFT JOIN, NULLs).

```
src/js/problems/<id>/
  problem.js          statement, schema signature, tests (reference + seeded generators), hints
  solutions/
    solution.sql      the one shipped solution (SQLite dialect)
```

A SQL problem ships **exactly one** solution, `solution.sql`, and offers only SQL in the language picker. The 8-language rule applies to algorithm problems. Everything else in the table above applies, except that `argNames`, starter code and the worker setup are derived from the schema.

```js
signature: {
  kind: 'sql',
  tables: [
    { name: 'Person', columns: [
      { name: 'personId', type: 'int', primaryKey: true },
      { name: 'city', type: 'string', nullable: true },
      { name: 'low_fats', type: 'string', values: ['Y', 'N'] }, // ENUM
    ] },
  ],
  result: { columns: ['firstName', 'city'], ordered: false },
},
```

- Column types: `int`, `double`, `string`, `date` (`'YYYY-MM-DD'` text). Columns are `NOT NULL` unless `nullable`; at most one `primaryKey` per table (unique, not null). Test rows are checked against all of this.
- A case's `args` holds one array of rows per table, in `tables` order; a row is an array in column order: `args: [[[1, 'Wang', 'Allen']], [[1, 2, 'NYC', 'NY']]]`.
- `expected` is a result set `{ columns, rows }` with `columns` equal to `result.columns`. Compute it with the JS `reference(...args)`.
- `result.ordered: false` when the statement says "any order": rows are judged as a multiset (duplicates count). `true` only when the statement fixes an `ORDER BY`; then rows must match in order.
- `parseCustomInput` uses `parseTablesInput(signature, raw)` from `src/js/engine/sql.js` (a JSON object `{"Person": [[...]], ...}`), plus any problem constraint the schema cannot express.
- The statement says the exact output column names, the row order rule, and "Dialect: SQLite" in the constraints. Avoid problems whose canonical solution needs MySQL-only functions.
- Tests in `tests/<id>.test.js` use `sqlProblemTests` from `tests/helpers/sql-problem.js`: reference vs `solution.sql` on seeded random tables, plus the classic wrong queries, each of which must fail one of the 15 cases. Hidden tests include an empty table and at least two tables with thousands of rows.
- `tests/solutions.test.js` runs `solution.sql` on the 15 cases with the same sql.js build and case runner as the browser (`scripts/verify/sql.mjs`).

## Judge modes

By default a case passes when the output equals `expected` exactly (`deepEqual`, JSON-canonical). A problem whose answer is legitimately random sets `judge: '<mode>'` in `problem.js`; `comparatorFor(problem)` in `src/js/engine/harness.js` returns the mode's function `(actual, expected, tc) => boolean`, and both the workspace and `tests/solutions.test.js` judge with it. Modes run on the main thread after the worker has finished, so `expected` still never reaches a worker, and `judge()` still strips hidden cases before rendering.

| Mode | Used by | Rule |
|---|---|---|
| `exact` | default | `deepEqual(actual, expected)` |
| `randomized-set` | Random Pool | design class with `insert(val) -> bool`, `remove(val) -> bool`, `getRandom() -> int`. insert and remove must equal `expected`; `expected` holds `null` at `getRandom` positions, and the mode replays the calls to check each pick is a current member. Every run of picks on an unchanged set with at least 100 expected picks per member must also look uniform: each member's count within 6.5 binomial standard deviations of the mean (a fair picker fails a submission by chance less than once in 10^8) |

A new mode needs unit tests in `tests/judge-modes.test.js`, including a check that a correct solution passes every shipped case repeatedly.

## Growth estimate

After an Accepted submit in JavaScript or Python, the workspace times the code on growing inputs and says whether its growth matches the problem's target ([ADR 0004](adr/0004-complexity-feedback.md)). A problem opts in with `growth`:

```js
growth: {
  target: 'n',                 // '1', 'log n', 'n', 'n log n', 'n^2', 'n^2 log n', 'n^3', '2^n'
  n: 'nums.length',            // what n counts, shown in the console note
  sizes: [2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
  input: (n, seed) => uniquePair(seed, n, n - 2, n - 1), // full argument list
  // inconclusiveOk: true,     // only if CI cannot measure it reliably; say why in a comment
},
```

Pilot problems: Pair Sum Target, Longest Streak, Top K Frequent, Zero Triplets (`n^2`), Warmer Days, Subarray Sum K, Island Count (grid, n = cells), Level Order (TreeNode), Median Stream (design, n = calls), Rising Chain (`n log n`). Examples per input shape since F3: Rain Trap and Window Maximums (int array), Bracket Check and First Match Index (string), Edit Steps (`n^2`, two strings), Rot Spread (grid), Merge Ranges and Meeting Room Minimizer (intervals), Course Order (edge list), Tree Height and BST Check (tree), Reverse List and Merge Many Lists (linked lists), Recent Cache (design).

The estimate is coarse: `n` and `n log n` both read as linear, `n^2` and `n^2 log n` as quadratic. Pick the target from the statement's "Target complexity" line.

### Coverage and exclusions

Every problem is in exactly one state, and `tests/growth-coverage.test.js` fails otherwise:

- **covered**: it has a valid `growth` spec;
- **excluded**: it is listed in `scripts/content/growth-exclusions.mjs` (`GROWTH_EXCLUSIONS`) with a reason and a one-line why, or excluded by kind (SQL);
- **pending**: it is on `GROWTH_PENDING`, the F3 backlog. The list may only shrink: the test holds a ceiling, and a pending problem that gains `growth` must leave the list (lower the ceiling in the same change). New problems ship covered or excluded, never pending.

Exclusion reasons (the whole policy, one place):

| Reason | When | Examples |
|---|---|---|
| `sql` | SQL problems: the query runs in sql.js, ADR 0004 times functions and classes | all SQL problems, by kind |
| `fixed-size` | the input cannot grow: one machine integer, a fixed board, a fixed state space | Bit Count, Digit Flip, Sudoku Check, Lock Steps |
| `output-bound` | the answer lists every combination, so the output size decides the time | Subset Builder, All Orderings, Keypad Words, Balanced Pairs |
| `backtracking` | exponential search on a tiny n, or time that depends on the contents more than the size | Grid Word, Board Words, Visit All Nodes |
| `sublinear` | the target is O(log n): one call takes microseconds, under the 1 ms the estimator needs | Rotated Search, Target Range, Mountain Peak |
| `too-fast` | a linear pass of a few ns per element over an input that is costly to build (one small array per element): every size a browser can build in its 5 s budget runs under the 1 ms the estimator needs on CI | Sparse Dot |

Design problems are in scope (n = calls), and so are problems whose n is a value (Prime Count), as long as the value can grow to measurable times within its constraint.

`node scripts/content/growth-coverage.mjs` lists the pending problems grouped by input shape, with our target, the best known complexity (`src/js/data/problem-meta.json`) and a suggested target, so a spec starts from data. `--all` adds covered and excluded problems, `--markdown` prints the grouped list for docs/PLAN.md, and ids limit the report. It never writes problem files: the author confirms the target with the verifier.

### Input helpers

`src/js/engine/growth-inputs.js` builds the common shapes in O(n) from `mulberry32(seed)`, in the judge's JSON forms. Each takes the size first and the generator second, and options carry the problem's rules:

| Helper | Builds |
|---|---|
| `intArray(n, rng, { min, max, distinct, sorted })` | n integers; `distinct` draws without replacement, `sorted` ascending |
| `charString(n, rng, { alphabet })` | a string of n characters |
| `stringList(n, rng, { minLen, maxLen, alphabet, distinct })` | n strings |
| `grid(n, rng, { rows, cols, cells, weights, as })`, `intGrid(n, rng, { min, max })` | about n cells, square unless rows or cols is given; `as: 'strings'` joins rows |
| `levelTree(n, rng, { shape, maxHeight, min, max, bst })` | a level-order tree with nulls; `complete`, or `random` (height about 4.3 ln n, capped by `maxHeight`); `bst` assigns distinct values in in-order order |
| `linkedList(n, rng, opts)` | a list's values, head first (same options as `intArray`) |
| `intervals(n, rng, { min, max, minLength, maxLength, sorted, disjoint })` | n `[start, end]` pairs |
| `edgeList(nodes, edges, rng, { directed, acyclic, connected, weights, oneBased })` | no self loops or duplicates; `acyclic` is a DAG, `connected` starts from a spanning tree |
| `randInt`, `shuffle`, `gridShape` | small building blocks |

Use them when the shape is generic; keep the problem's own generator when it encodes a rule the helpers do not know (Product Except Self keeps every product in 32 bits, Rot Spread's snake makes the answer about n / 2 minutes, Recent Cache's session fills the cache first).

### Writing a good generator

- **Deterministic.** Use `mulberry32(seed)` only; the runner passes `growthSeed(n)`. Never `Math.random()`.
- **Worst case for the target, no early exits.** The answer must not be found early: put the pair at the end (Pair Sum Target), make no triplet sum to zero (Zero Triplets: odd values only), make no day warmer (Warmer Days: non-increasing). A generator that lets a solution stop early measures the early exit, not the algorithm.
- **Bounded output.** Keep the output small or linear. If the answer can grow faster than the work (all triplets), the output dominates the timing.
- **Shaped to expose the naive solution.** Whatever makes the classic wrong approach quadratic should grow with n: distinct values that grow with n for Top K Frequent, one shuffled run for Longest Streak, many small islands for Island Count.
- **Values inside the constraints; length may exceed them.** A linear pass needs about 10^6 elements to take measurable milliseconds, so sizes can pass the statement's n limit. Values, value ranges and structural rules (one valid pair, rows of equal length) must still hold: the verifier checks that the shipped solution agrees with `solveReference` on the smallest growth input. If the value range caps n (Top K Frequent: about 2 * 10^4 distinct values), stop the sizes there.
- **Cheap to build.** `input` runs on the main thread in the browser and counts against the 5 s budget: no sorting-heavy or quadratic generators, no BST insertion for 10^6 nodes (Level Order uses a complete tree).
- **n for grids and designs.** A grid takes n cells (`side = round(sqrt(n))`); a design takes an operation sequence of about n calls.

### Choosing sizes

- A doubling ladder, strictly ascending, at least 4 sizes spanning at least 8x. Start low enough that a naive solution one class above the target still gets 3 or 4 sizes before it is stopped at about 1 s per call (Zero Triplets starts at 250 so a cubic solution is measured), and end where the shipped JavaScript solution takes roughly 5 to 200 ms.
- Only sizes whose median takes at least 1 ms count, and the slope is read on the largest 4 of them.
- Code that allocates an object per element (pairs, small arrays) reads steeper than linear once a call's allocations outgrow the young generation, around 3 * 10^4 to 10^5 objects in Node: Merge Ranges copies and sorts n pairs and read 1.45 at 10^5 to 2.5 * 10^5, so its ladder stops at 64000. If even the sizes under that step are too fast to time (Column Sweep), leave the problem pending and say so in docs/PLAN.md rather than loosening anything.
- Measure with the verifier while you tune: `VERIFY_LANGUAGES=javascript node --test tests/growth-solutions.test.js` prints each size's median and the slope.

### Checklist for adding `growth` to a problem


Judge the ladder against an idiomatic solution too, not only the shipped one: if a plain comparator sort over pair objects or a Map per element bends where a tuned shipped solution does not, cap the ladder below that bend, so a correct user solution never reads `slower than target`.
1. Read the statement's "Target complexity" and pick the `target` string (`node scripts/content/growth-coverage.mjs <id>` suggests one); write `n` as the user would name it.
2. Write `input(n, seed)` from the guidelines above, with the input helpers or the problem's own seeded generators; add a comment saying why the input is a worst case.
3. Choose `sizes` (doubling, 5 to 200 ms for the shipped JS solution at the top).
4. Run `VERIFY_LANGUAGES=javascript node --test tests/growth-solutions.test.js`: spec valid, input deterministic and judged like a real case, shipped solution `matches`. Each problem runs in its own worker thread that loads only that problem, as in the browser. If it reads inconclusive, look at the printed medians: a dip or jump at one size is JIT or GC noise (rerun), a curve that bends up at the top is memory growth (lower the top size), times under 1 ms need larger sizes. Never loosen the target to make it pass; if the shipped solution is slower than its target, that is a finding.
5. Optional but recommended: time a deliberately naive solution and confirm it reads `slower than target`.
6. Remove the id from `GROWTH_PENDING` and lower `PENDING_CEILING` in `tests/growth-coverage.test.js`.
7. `npm test` and, if the problem is in the e2e test, `npm run test:e2e`.

## Test design checklist

Hidden tests must target the classic wrong answers, not just "more of the same":

- [ ] smallest input (n = 1) and the empty-ish edge the constraints allow
- [ ] the "looks right but isn't" case (for SBS: period that does not divide n)
- [ ] near-miss: valid structure broken by the last element
- [ ] at least 2 inputs at max constraint size, so O(n^2) times out at `timeLimitMs`
- [ ] generated inputs use `mulberry32(seed)`, never `Math.random()`
- [ ] every `expected` computed by `reference`, and `reference` verified against a brute force in `tests/`

## Registering and verifying

1. Run `node scripts/content/build-catalog.mjs`. It regenerates `src/js/problems/catalog.js`, the list the dashboard, learning path and modes read without loading problem modules (ADR 0008), appends the new problem and drops its `planned` entry (kept in the script) if one exists. Rerun it whenever a title, difficulty, topic or signature kind changes; `tests/catalog.test.js` fails on a stale catalog. Nothing is imported by hand: `problems/index.js` loads a module with `loadProblem(id)` when the problem opens.
2. If the change was deliberate and touches existing tests (a shared generator, a fixed expected value), regenerate the suite snapshot with `node scripts/content/suite-hashes.mjs --write`; `tests/suite-snapshot.test.js` otherwise fails. A new problem needs it too, since the snapshot lists every directory.
3. Add `tests/<id>.test.js`: reference vs brute force on random inputs, visible expectations agree with reference, parser accepts/rejects correctly.
4. `npm run check`. `tests/solutions.test.js` compiles and runs all 8 solutions against the 15 cases and checks that the generated starter code compiles in every language. It also times each language's run (process startup included) and fails it if all 15 cases take longer than one case's `timeLimitMs`, so max-size tests must actually separate the target complexity from a naive one. `LFB_TIME_FACTOR` scales the budget on a slow machine (0 disables it); `LFB_TIMINGS=<file>` records the times. `VERIFY_LANGUAGES=java,go` (or `sql`, or `none`) limits which solutions run; CI runs one job per language. Locally a missing toolchain skips that language; CI sets `REQUIRE_ALL_LANGUAGES=1` and installs all of them, so nothing ships unverified.

Harnesses live in `src/js/engine/programs/` (browser-safe, shared with the remote runner, ADR 0005): `build.js` generates a test program per language from the signature (C, C++, Go and C# read a flat token stream, the others JSON), `java/Harness.java` runs Java by reflection. Java, C, C++, Go and C# programs follow the case protocol in `output.js`: a mark on stderr before each case and each result on its own line behind a mark on stdout, flushed per case, so the user's prints, a crash and a timeout are attributed to the right case. `scripts/verify/harnesses.mjs` re-exports them for the verifier.
