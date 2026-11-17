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
| `milestone` | 1-4 | learning path placement (v0.1 UI) |
| `timeLimitMs` | number | **per case** wall clock |
| `argNames` | string[] | used to print `s = "..."` in the console |
| `statementHtml` | string | trusted author HTML only |
| `constraints` | string[] | |
| `examples` | `{input, output, explanation?}[]` | usually the first 2-3 visible tests |
| `hints` | string[] | Socratic ladder for the mentor, 3-5 items, questions not answers |
| `signature` | `{ name, params: {name, type}[], returns }` | neutral types, see below |
| `visibleTests` | exactly 5 `{args, expected}` | detailed feedback |
| `hiddenTests` | exactly 10 `{args, expected}` | pass/fail only |
| `parseCustomInput(raw)` | fn | returns `{ok:true,args}` or `{ok:false,error}`; enforce constraints |
| `solveReference(args)` | fn | computes expected for custom input |
| `judge` | string, optional | judge mode when exact equality cannot judge the answer (see Judge modes); default `'exact'` |

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

`src/js/engine/adapters.js` generates source placed before and after the user's code for JavaScript, TypeScript and Python. It provides ListNode and TreeNode, converts JSON to objects and back, and dispatches design operations. The browser workers and the CI verifier run the same adapter. C, C++, Go, C# and Java harnesses in `scripts/verify/` do the same natively.

| Neutral | Python | Java | C++ | C | C# | Go | TS / JS |
|---|---|---|---|---|---|---|---|
| `int` | int | int | int | int | int | int | number |
| `long` | int | long | long long | long long | long | int64 | number |
| `string` | str | String | string | char* | string | string | string |
| `int[]` | list[int] | int[] | vector&lt;int&gt;& | int* + size | int[] | []int | number[] |
| `int[][]` | list[list[int]] | int[][] | vector&lt;vector&lt;int&gt;&gt;& | int** + size + col sizes | int[][] | [][]int | number[][] |

C follows LeetCode conventions: array params carry explicit sizes, array returns use `int* returnSize` (and `int** returnColumnSizes` for 2D) and must be `malloc`ed.

The types beyond `ListNode` and `TreeNode` are emitted only for a signature that uses them: the source adapters (`adapters.js`) and the native harness code (`scripts/verify/extra-types.mjs`, which `harnesses.mjs` calls; Java has `RandomListNode.java` and `NestedInteger.java`). Native harnesses read them as tokens: `ListNode@cycle` as `<n> values <pos>`, `RandomListNode` as `<n>` then `<val> <random>` per node (`-1` = null), `NestedInteger[]` as `<n>` then `i <val>` or `l` and a nested list per item.

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

## Test design checklist

Hidden tests must target the classic wrong answers, not just "more of the same":

- [ ] smallest input (n = 1) and the empty-ish edge the constraints allow
- [ ] the "looks right but isn't" case (for SBS: period that does not divide n)
- [ ] near-miss: valid structure broken by the last element
- [ ] at least 2 inputs at max constraint size, so O(n^2) times out at `timeLimitMs`
- [ ] generated inputs use `mulberry32(seed)`, never `Math.random()`
- [ ] every `expected` computed by `reference`, and `reference` verified against a brute force in `tests/`

## Registering and verifying

1. Import it in `src/js/problems/index.js` and add it to the `implemented` list.
2. Remove its `planned` entry if one exists.
3. Add `tests/<id>.test.js`: reference vs brute force on random inputs, visible expectations agree with reference, parser accepts/rejects correctly.
4. `npm run check`. `tests/solutions.test.js` compiles and runs all 8 solutions against the 15 cases and checks that the generated starter code compiles in every language. It also times each language's run (process startup included) and fails it if all 15 cases take longer than one case's `timeLimitMs`, so max-size tests must actually separate the target complexity from a naive one. `LFB_TIME_FACTOR` scales the budget on a slow machine (0 disables it); `LFB_TIMINGS=<file>` records the times. Locally a missing toolchain skips that language; CI sets `REQUIRE_ALL_LANGUAGES=1` and installs all of them, so nothing ships unverified.

Harnesses live in `scripts/verify/`: `harnesses.mjs` generates a test program per language from the signature (C, C++, Go and C# read a flat token stream, the others JSON), `Harness.java` runs Java by reflection.
