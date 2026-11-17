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

Also export the JS `reference` function so tests can import it.

## Signature types

`int`, `long`, `double`, `bool`, `string`, and arrays of them up to two dimensions (`int[]`, `string[][]`). Names are camelCase; each language gets its own convention (`notify_recipients` in Python, `NotifyRecipients` in C#).

Structures, written in tests as JSON in the LeetCode convention:

| Type | JSON form | Notes |
|---|---|---|
| `ListNode`, `ListNode[]` | `[1,2,3]` (head to tail), `[]` for an empty list | singly linked list of int |
| `TreeNode` | level order with `null` for a missing child, no trailing nulls: `[3,9,20,null,null,15,7]`, `[]` for an empty tree | binary tree of int; use `src/js/engine/structures.js` in references and generators |

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

Not supported yet: graphs as node objects (Clone Graph), lists with random or cycle pointers, and SQL problems. Add them to codegen, adapters and harnesses before authoring problems that need them.

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
4. `npm run check`. `tests/solutions.test.js` compiles and runs all 8 solutions against the 15 cases and checks that the generated starter code compiles in every language. Locally a missing toolchain skips that language; CI sets `REQUIRE_ALL_LANGUAGES=1` and installs all of them, so nothing ships unverified.

Harnesses live in `scripts/verify/`: `harnesses.mjs` generates a test program per language from the signature (C, C++, Go and C# read a flat token stream, the others JSON), `Harness.java` runs Java by reflection.
