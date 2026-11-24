# Quiz bank plan (draft for owner approval)

> Research and plan behind the quiz bank (2026-11-23). Concept maps per topic, traps used as wrong options, exclusions, sources and licenses. Final counts differ: the shipped bank has 526 questions (see content/quiz).

Status: planning only. Nothing here is in the site yet. Research files next to this one:
`oop-languages.md`, `ds-algo-c.md`, `os-net-db.md`, `practices-landscape.md` (concept maps, traps, exclusions, sources).

## 1. Goal and audience

A multiple-choice bank for candidates for a **student software position or a first software engineer job**
(junior / new grad), with Israel's market in mind. Every question tests **understanding of an idea an
interviewer probes**: "why", "what happens if", "which fits here", or short code that exposes a principle.

In: concepts, trade-offs, cause and effect, classic misconceptions.
Out: dates and versions, exact constants (Integer cache range, HashMap load factor), flag or API-name recall,
senior-only depth (distributed consensus, Kubernetes, BCNF and up, red-black rotations, template
metaprogramming), "all/none of the above", negatively worded stems except rarely.

## 2. What the research found (short)

- Core for everyone: OOP, data structures, algorithms and Big-O, SQL, threads and deadlock.
- Israeli hardware and chip roles (Intel, Nvidia, Mobileye, Apple IL, Qualcomm) and security companies
  (Check Point) lean on C/C++, pointers, memory, bits, OS and concurrency. Spot-checked: Intel student
  reports mention pointer exercises, stack vs heap, virtual memory, strlen; Check Point's first gate is a
  Codility coding test (3 tasks).
- Product companies (Wix, monday.com, Microsoft IL, Amdocs) lean on DS, algorithms, OOP, web and SQL.
- Screening tests at product companies are mostly coding; concept questions come up in the interview itself.
  The quiz prepares for that conversation, it does not replace coding practice.
- Evidence limits: Reddit could not be fetched, Glassdoor mostly via search snippets, few reports for
  Wix / monday / Nvidia / Amdocs. Weights are informed judgment, not measurements.

## 3. Working topic list and target counts (first round, about 500)

Trimmed on 2026-11-23 to student / first-job depth. Counts are targets, not quotas: a subtopic with
nothing junior-relevant left to ask stops early. The final grouping is decided after the questions
exist, using the concept tags on every question.

| # | Topic | Target | In (junior depth) | Cut as too deep |
|---|---|---|---|---|
| 1 | OOP | 50 | polymorphism and dispatch, overload vs override, abstract class vs interface, composition vs inheritance, encapsulation, constructors and static, identity vs equality | large OOD design rounds |
| 2 | Data structures | 60 | operation costs, hash tables (collisions, why O(1) on average), arrays vs linked lists, stacks/queues, BST, heaps, graph representation, choose-the-structure | balanced-tree internals, tries beyond basics |
| 3 | Algorithms and Big-O | 60 | code-to-complexity, recursion and stack depth, sorting properties, binary search, BFS vs DFS, greedy vs DP intuition, memoization | amortized proofs, advanced graph algorithms |
| 4 | Databases and SQL | 40 | joins and row counts, GROUP BY / HAVING, NULL, indexes and their cost, transactions and ACID, keys and normalization (to 3NF), SQL vs NoSQL | isolation-level anomaly matrix, window functions, engine specifics |
| 5 | Concurrency | 30 | race conditions, atomicity, mutex vs semaphore, deadlock (4 conditions, lock ordering), thread safety | condition-variable details, memory models, lock-free |
| 6 | Operating systems | 30 | process vs thread, stack vs heap, virtual memory and paging (idea level), context switch, user vs kernel mode, scheduling basics | TLB details, zombie/orphan, scheduler internals |
| 7 | Networking and the web | 30 | URL journey, TCP vs UDP, DNS, HTTP methods and status codes, REST, cookies and sessions, HTTPS basics | TLS internals, CORS edge cases, JWT internals, subnetting |
| 8 | SOLID and clean code | 15 | each principle as a scenario, coupling and cohesion | |
| 9 | Design patterns | 12 | Singleton, Factory, Strategy, Observer, plus one of Adapter / Decorator | the other GoF patterns |
| 10 | Testing | 15 | unit vs integration vs e2e, mocks and stubs, what makes a good test, edge cases | TDD dogma, test-pyramid debates |
| 11 | Git | 15 | commit/branch model, merge vs rebase, conflicts, revert vs reset, pull requests | plumbing commands, flags |
| 12 | Security basics | 15 | SQL injection, XSS, hashing vs encryption, salts, authN vs authZ, never trust the client | CSRF token schemes, crypto internals |
| 13 | System design (junior) | 10 | scaling up vs out, load balancer, cache, CDN, queue, stateless services | sharding, consensus, CAP proofs |
| 14 | Java | 30 | equals/hashCode, pass-by-value, String immutability, collections choice, exceptions | JVM tuning, GC algorithms, generics erasure tricks |
| 15 | Python | 30 | mutability and references, default args, closures, dict/set hashability, generators, list vs tuple | metaclasses, descriptors, GIL internals |
| 16 | JavaScript | 30 | scope and hoisting, closures, this, event loop order, promises/async, == vs === | TypeScript type gymnastics (TS is out for now) |
| 17 | C and C++ | 40 | pointers vs arrays, stack vs heap, malloc/free and leaks, undefined behavior basics, const/static, sizeof and padding, virtual functions and virtual destructor | templates, RAII depth beyond basics, move semantics |
| 18 | Bits and numbers | 20 | binary/hex, two's complement, masks (set/clear/test a bit), shifts, overflow, why 0.1 + 0.2 != 0.3 | IEEE 754 encoding drills, endianness beyond the idea |

Core (1-13): 382. Languages and low-level (14-18): 150. Total about 530.
Difficulty mix: about 45% easy, 45% medium, 10% hard. "Hard" still means junior-hard (two ideas together),
never senior depth.

## 4. Question format (data)

Fields per question:
- `id` (kebab-case, topic prefix), `topic`, `subtopic`, `concepts[]` (tags used for regrouping and weak spots)
- `level`: easy | medium | hard
- `q`: the stem, scenario-first; `code` (optional, plain text, 5 to 12 lines) with `lang`
- `options` (4), `answer` (one index)
- `why`: why the answer is right
- `wrong[]`: one short line per wrong option, why it is wrong (each maps to a named misconception)
- `ref` (optional): one link to an authoritative source (official docs, OWASP, Pro Git, MDN)
- `source`: `original` by default; `adapted` with name, URL and license only for MIT / CC BY / CC0 text
- `status`: draft | reviewed (only reviewed ships)

Single-answer only in the first round (the engine supports one answer; multi-select is a later decision).
Code is shown as plain text (no highlighter in the quiz screen).

## 5. Sources policy (licenses checked against the LICENSE files)

- Ideas and coverage from anywhere. Question text is ours.
- Adaptable with attribution: Tech Interview Handbook, Lydia Hallie javascript-questions, h5bp,
  java-design-patterns (MIT); System Design Primer (CC BY 4.0); what-happens-when (CC0).
- Link only, do not adapt text: OWASP (CC BY-SA 4.0), Coding Interview University (CC BY-SA 4.0),
  Software Engineering at Google (CC BY-NC-ND 4.0), Fowler, OSTEP, Use The Index Luke.
- Do not use: LinkedIn Skill Assessments repo (AGPL-3.0, and many wrong-answer reports),
  sudheerj (no license), all commercial sites (GeeksforGeeks, InterviewBit, Sanfoundry, W3Schools, TestDome,
  HackerRank, Codility, Mettl, iMocha, Indeed).

## 6. Writing and checking process

Per topic, in batches of 10, from that topic's concept map:
1. Write: scenario stems, distractors taken from the named misconceptions, `why` and `wrong[]`.
2. Independent solver (a separate agent) answers without seeing the key; every mismatch is resolved.
3. Facts checked against official docs; every "what does this print" snippet is actually run
   (Node, Python, Java, gcc/g++, SQLite) and its output compared with the key.
4. Automated checks: format, house voice, answer-position balance, near-duplicate stems,
   "correct option is the longest" warning, coverage per subtopic.
5. Relevance check by the reviewer: understanding, not recall; junior/student level.
6. Owner sample: about 5 questions per topic.
The existing 150 questions (PR #51) go through the same gates; what fails is cut or rewritten.

## 7. Later (not now)

Final topic grouping, engine and screen changes for the new format, tracks by target (hardware vs product
company), weak spots from `concepts`, multi-select, progress sync across devices, decision on PR #51.

## 8. Decisions for the owner

1. Approved by the owner on 2026-11-23 after trimming: about 530, student / first-job depth.
2. Include C/C++ and bits as a low-level track (strong for Israeli hardware student roles), yes or no.
3. Per-option explanations (`wrong[]`) for every question: more writing, more teaching value. Recommended.
4. Single-answer only in the first round.
5. Which topic to write first as a pilot batch (recommended: OOP, 20 questions, so you can review the style).
