# Engineering practices quiz bank: concept maps and resource landscape

Audience: candidates for a first software engineer job (junior / new grad) or a student position, many in Israel.
Goal: map the concepts interviewers actually probe so we can write our own multiple-choice questions that test understanding, not trivia. Nothing here is copied question text; everything is paraphrased.

Research date: 2026-11-23. Firecrawl credits ran out partway; the rest used WebSearch/WebFetch and direct raw.githubusercontent.com fetches for LICENSE files. Sanfoundry and InterviewBit returned HTTP 403/404 to automated fetches, so their entries rely on search snippets and general knowledge (marked).

---

## Part A - Concept maps

Weight scale (for junior / student interviews and screening tests):
- **High**: asked often in phone screens, technical interviews or MCQ screening for juniors; a wrong answer is a visible gap.
- **Medium**: comes up regularly, especially at product companies or in "tell me about your project" follow-ups.
- **Low**: occasional; good for stretch questions only.

### A1. Testing

Overall weight: **Medium-High**. Juniors are rarely grilled on testing theory, but "how would you test this function?" follows many coding questions, and screening platforms (TestDome, Codility, Mettl) include QA/testing items. Israeli student roles often start in QA/automation, which raises the weight there.

| Subtopic | Weight | Understanding checked | Classic traps (distractor material) |
|---|---|---|---|
| Unit vs integration vs end-to-end | High | Scope (how much real code runs) and trade-offs: unit = fast, precise failure location, many of them; e2e = realistic, slow, flaky, few. The pyramid shape and why (Google SWE book cites roughly 80/15/5 by count). Size vs scope are different axes: a broad test with fakes can still be "small". | "Unit test = test of one class" (it is about isolating a unit of behavior); "e2e tests are always better because more realistic"; "integration test means it hits production"; inverted pyramid (ice-cream cone) presented as best practice. |
| Test doubles: dummy, stub, fake, spy, mock | High (mock vs stub), Medium (rest) | Stub = canned answers so the code under test can run (supports state verification). Mock = has expectations about calls and verifies them (behavior verification). Fake = working lightweight implementation (in-memory DB). Spy = stub that records calls. Why double: slow, nondeterministic or external dependencies (network, clock, DB, payment). | "Mock and stub are synonyms"; "mock everything for isolation" (over-mocking couples tests to implementation, makes them brittle); "use a mock to make the test faster" when a fake or real object is fine; mocking the class under test itself. |
| What makes a good test | High | One behavior per test, clear name, Arrange-Act-Assert, deterministic, independent of order, tests behavior through public API not internals, fails for one reason, readable without logic (no loops/conditionals in the test). Edge cases: empty, one element, boundaries, duplicates, negative, null, very large. | "More asserts per test is better"; "testing private methods directly is best practice"; "100% coverage means no bugs"; "a test that never fails is a good test". |
| Code coverage | Medium | Coverage measures what executed, not what was checked. High coverage with weak assertions is possible. Branch vs line coverage at a basic level. | "Coverage proves correctness"; "aim for 100% always". |
| TDD | Medium | Red-green-refactor cycle; test written first and must fail first (proves the test can fail); refactor with tests as safety net; benefits (design pressure, regression safety) and costs. | "TDD means writing all tests before any code"; "TDD replaces QA"; skipping the red step; "refactor = add features". |
| Flaky tests | Medium | Definition: passes and fails without code change. Causes: time/clock, sleeps and race conditions, test order and shared state, network, randomness without seed, dependence on environment. Fixes: hermetic tests, inject clock, seeded randomness, poll with timeout instead of fixed sleep, isolate state. Why reruns only hide the problem and erode trust. | "Just add a longer sleep"; "rerun until green is a fix"; "flaky tests are harmless because they usually pass". |
| Regression tests and bug fixing | Medium | Write a failing test that reproduces a bug before fixing it; it keeps the bug from returning. | "Add the test after the fix, only if time allows". |
| Black-box vs white-box, boundary values, equivalence classes | Medium (higher for QA student roles) | Choosing inputs: partition input space, test at and around boundaries (off-by-one). | Picking only "typical" values; testing every possible input. |
| CI basics | Low-Medium | Tests run automatically on each push/PR; a red build blocks merge; fast tests first. | "CI = deployment to production". |

Exclude (too senior or trivia): mutation testing internals, property-based testing frameworks, contract testing (Pact), specific framework APIs (`jest.fn()` signatures, Mockito annotations, JUnit 4 vs 5 annotation names), test-runner CLI flags, ISTQB vocabulary memorization (e.g. naming every test level by its official term), performance/load testing tooling, coverage tool names.

### A2. Git and teamwork

Overall weight: **High** for "do you know how to work on a team" questions (merge vs rebase is among the most repeated junior questions on Glassdoor), but individual command flags are trivia. Codility ships a ready-made Git MCQ set, so Git appears in automated screening too.

| Subtopic | Weight | Understanding checked | Classic traps |
|---|---|---|---|
| Mental model: commits, branches, HEAD | High | A commit is a snapshot with a parent pointer; a branch is a movable pointer to a commit; HEAD is where you are. Working tree vs staging area (index) vs repository. Local vs remote; `origin/main` is your last-known copy of the remote. | "A branch is a copy of all files"; "commit sends changes to GitHub"; "git add saves the file permanently". |
| merge vs rebase | High | Merge keeps true history, creates a merge commit, non-destructive. Rebase replays your commits on a new base, produces linear history, creates NEW commits (new hashes). Golden rule: do not rebase commits others already pulled (shared/public branches); rebasing a private feature branch before a PR is fine. Fast-forward merge when no divergence. Squash merge collapses a branch into one commit. | "Rebase is safer than merge"; "rebase does not change commit hashes"; "merge loses history"; "always force-push after rebasing main". |
| Merge conflicts | High | Why they happen (same lines changed on both sides, or edit vs delete); conflict markers; resolve by understanding both intentions, then test; conflicts can also arise during rebase (resolved per commit). Small, frequent merges reduce conflicts. | "Git picks the newer change automatically"; "accept mine/theirs is always correct"; "conflicts mean someone did something wrong". |
| Undoing: revert vs reset (vs restore) | High | `revert` adds a new commit that undoes one, safe on shared branches. `reset` moves the branch pointer (soft keeps changes staged, mixed keeps them in working tree, hard discards). Reset/amend of pushed commits rewrites shared history. | "reset is the safe way to undo a pushed commit"; "revert deletes the commit from history". |
| fetch vs pull, push rejected | Medium | pull = fetch + merge (or rebase); push rejected because remote has new commits: integrate first, do not force. | "pull and fetch are identical"; "solve rejected push with --force". |
| Pull requests and code review | High | Purpose: review, discussion, CI checks before merge; small focused PRs; clear description (what, why, how tested); responding to review; reviewing others politely and specifically. | "A PR is a Git command"; "bigger PRs are more efficient"; "reviews are only for juniors". |
| Branching workflows | Medium | Feature branches off main; short-lived branches; protected main; (at a high level) trunk-based vs GitFlow. | Memorizing GitFlow branch names as if mandatory. |
| What not to commit | Medium | Secrets, build output, dependencies (`node_modules`), large binaries; `.gitignore`; a committed secret is compromised even after deletion (history). | "Delete the file in the next commit and the secret is safe". |
| Commit hygiene | Medium | Small, atomic commits, meaningful messages; why history helps debugging (bisect, blame) at a conceptual level. | "One commit per day is best practice". |
| stash, cherry-pick | Low-Medium | Stash shelves uncommitted work; cherry-pick copies a commit to another branch (new hash). | - |
| Teamwork beyond Git | Medium (behavioral) | Asking for help after reasonable effort, estimating, communicating blockers, Agile/Scrum basics (sprint, standup, backlog) at a vocabulary level. | Probably better as non-scored "situational" items. |

Exclude: plumbing commands (`cat-file`, object types, packfiles), exact flag spelling questions (`--version` vs `-v`), reflog internals, submodules/subtrees, hooks internals, `git bisect` syntax, signing commits, LFS, GitHub UI specifics (button names), branch naming trivia, Git history/origin trivia (who wrote Git, in what year).

### A3. Security basics for developers

Overall weight: **Medium-High**, and higher in Israel, where cyber-security companies (Check Point, CyberArk, Wiz, Palo Alto Israel R&D, etc.) hire many students and juniors and commonly expect web-security fundamentals. Every web/backend junior should know injection, XSS and password storage.

| Subtopic | Weight | Understanding checked | Classic traps |
|---|---|---|---|
| SQL injection | High | Root cause: user input concatenated into a query so data is interpreted as code. Fix: parameterized queries / prepared statements (and ORMs that use them). Defense in depth: least-privilege DB user, input validation. | "Escaping quotes manually is enough"; "client-side validation prevents it"; "HTTPS prevents SQL injection"; "stored procedures always prevent it" (not if they build dynamic SQL). |
| XSS | High | Untrusted data rendered as HTML/JS in another user's browser. Stored vs reflected vs DOM-based. Fix: context-aware output encoding, safe DOM APIs (textContent vs innerHTML), framework auto-escaping, Content Security Policy as an extra layer, HttpOnly cookies limit token theft. | "XSS attacks the server"; "input validation alone fixes XSS"; "HTTPS prevents XSS"; confusing XSS with CSRF. |
| CSRF | Medium | Browser automatically attaches cookies to cross-site requests; attacker makes victim's browser perform a state-changing action. Fix: anti-CSRF tokens, SameSite cookies, not using GET for state changes. Why it does not apply the same way to token-in-header APIs. | "CSRF steals your cookies" (it rides them, does not read them); "CORS prevents CSRF"; "a POST request is safe". |
| Hashing vs encryption vs encoding | High | Hashing is one-way (verification); encryption is reversible with a key (confidentiality); encoding (Base64) is reversible with no key, not security. Passwords are hashed, not encrypted. | "Base64 encrypts data"; "encrypt passwords so you can email them back"; "MD5/SHA-256 are good password hashes". |
| Salting, slow hashing | High | Salt: unique random value per password, stored next to the hash, defeats precomputed (rainbow) tables and hides identical passwords. Slow, tunable algorithms (Argon2id, scrypt, bcrypt, PBKDF2) because fast hashes let GPUs try billions of guesses. Pepper as an optional secret kept outside the DB. | "Salt must be kept secret"; "one global salt is fine"; "hashing twice makes it secure"; "SHA-256 is fine because it is unbroken". |
| Authentication vs authorization | High | AuthN = who you are; AuthZ = what you may do. 401 vs 403 at a basic level. Authorization must be checked server-side on every request (IDOR: changing an id in the URL). | "Hiding a button is access control"; "if logged in, allowed"; mixing 401/403. |
| Sessions, cookies, tokens | Medium | Session id in cookie vs bearer token (e.g. JWT) at a conceptual level; cookie flags HttpOnly, Secure, SameSite; JWT is signed, not encrypted (payload readable). | "JWT payload is secret"; "localStorage is safe for tokens because it is per-site". |
| Least privilege | Medium | Give each user/service/DB account only the permissions it needs; limits blast radius. | "Admin rights for convenience in dev is harmless". |
| Never trust the client | High | All validation that matters is on the server; client checks are UX. | "Frontend validation is enough". |
| HTTPS/TLS basics | Medium | Encrypts in transit and authenticates the server; does not protect against app-level bugs (SQLi, XSS) or a compromised server. | "HTTPS makes the site secure". |
| Secrets management | Medium | No secrets in code/repo/client bundle; environment variables or secret managers; rotate leaked secrets. | "Private repo means secrets are fine". |
| Symmetric vs asymmetric crypto | Low-Medium | One shared key vs public/private pair; asymmetric used for key exchange and signatures. | "Public key decrypts what the public key encrypted". |
| OWASP Top 10 awareness | Low-Medium | Knowing it exists and naming a few categories; not memorizing the list order. | - |

Exclude: crypto math (RSA internals, elliptic curves), cipher modes (CBC vs GCM details), exact Argon2 parameters, OWASP Top 10 numbering by year, CVE trivia, OAuth 2.0 grant-type minutiae, SAML, Kerberos, penetration-testing tooling (Burp flags), CSP directive syntax, buffer overflow exploitation details (except for systems/C-focused security roles, where it may be a separate track).

### A4. System design (junior level only)

Overall weight: **Low-Medium** as a dedicated round for juniors (many companies skip it or replace it with object-oriented design), but **Medium** as vocabulary: "what is a cache / load balancer" and "how would this scale" questions appear in project discussions and in MCQ screens (Mettl, TestDome include architecture/REST items). Expectation at junior level: explain building blocks and trade-offs, answer questions well; seniors are expected to drive the design.

| Subtopic | Weight | Understanding checked | Classic traps |
|---|---|---|---|
| Client-server, HTTP basics | High | Request/response, methods (GET safe and idempotent; POST not idempotent; PUT/DELETE idempotent), status code classes (2xx, 3xx, 4xx client error, 5xx server error), statelessness of HTTP. | "GET can be used to delete since it is simpler"; "404 is a server error"; "idempotent means no side effects at all". |
| Basic API design (REST) | High | Resources as nouns, HTTP verbs as actions, correct status codes, pagination for large lists, versioning, consistent error format, validation at the boundary. | Verbs in URLs as the REST ideal; returning 200 with an error body; "REST requires JSON". |
| Vertical vs horizontal scaling | High | Vertical = bigger machine (simple, has a ceiling, single point of failure); horizontal = more machines (needs load balancing, statelessness, harder data consistency). | "Horizontal is always better"; "vertical scaling has no limit". |
| Stateless services | High | Server keeps no per-user state in memory between requests (sessions in a shared store or token), so any instance can serve any request; enables horizontal scaling and easy replacement. | "Stateless means the app has no database"; sticky sessions as the preferred solution. |
| Load balancer | High | Distributes requests across instances, removes unhealthy ones (health checks), enables scaling and availability. Simple algorithms (round robin, least connections) at awareness level. | "A load balancer makes each request faster"; "a load balancer replaces a database replica". |
| Cache | High | Keep frequently read data in fast storage (memory) to reduce latency and DB load. Cache hit/miss, TTL, eviction (LRU at concept level), invalidation and stale data as THE hard part; cache-aside pattern; what is good to cache (read-heavy, rarely changing). | "Caching always improves correctness"; "cache everything including rapidly changing balances"; "cache is the source of truth". |
| CDN | Medium | Geographically distributed caches for static content (images, JS, CSS, video) close to users; reduces latency and origin load. | "A CDN speeds up database queries"; "CDN is for dynamic per-user data". |
| Message queue | Medium | Decouples producer from consumer; async processing of slow work (emails, video encoding); absorbs spikes; retries. At-least-once delivery implies consumers should be idempotent (awareness only). | "Queues make work happen faster" (they make the request return faster); "queue guarantees processing order across all consumers". |
| Databases: SQL vs NoSQL, replication, indexes | Medium | Relational with schema and joins vs document/key-value flexibility; read replicas for read scaling; index speeds reads, slows writes. | "NoSQL is always faster"; "indexes have no cost". |
| Availability and single point of failure | Medium | Redundancy; what fails if one component dies. | - |
| Latency vs throughput, back-of-envelope | Low | Distinguish the two; order-of-magnitude intuition (memory vs disk vs network). | - |
| Object-oriented design (often the "junior design" round) | Medium | Classes, responsibilities, encapsulation, composition vs inheritance for a small domain (parking lot, library). Possibly belongs in an OOP topic instead. | - |

Exclude: consistent hashing math, sharding strategies in depth, CAP theorem proofs and PACELC, consensus (Raft/Paxos), Kafka partition/offset internals, specific cloud services (AWS product names), microservices orchestration (service mesh, sagas), capacity planning numbers, rate-limiter algorithm implementation details, write-behind failure semantics, multi-region replication, design-a-Twitter at full scale.

---

## Part B - Landscape of existing MCQ / quiz resources

License column: for GitHub repos the actual LICENSE file was fetched from raw.githubusercontent.com on 2026-11-23. Commercial sites are "not openly licensed" (all rights reserved).

| Resource | What it covers | Quality notes | Format features worth copying | License |
|---|---|---|---|---|
| **LinkedIn Skill Assessments community repo** (github.com/Ebazhanov/linkedin-skill-assessments-quizzes) | Crowd-sourced reconstructions of LinkedIn's retired skill tests: dozens of technologies incl. Git (169 questions in `git/git-quiz.md`), Java, Python, JS, SQL, AWS, also non-dev tools. LinkedIn itself retired the assessments (Dec 2023). | Mixed. Many command-recall items (e.g. which flag prints the Git version). Answers are community-voted with an open stream of "wrong answer" issues (MongoDB, Java, Git, MySQL, Linux reported); no authoritative source to verify against anymore. | Plain Markdown: `#### Qn`, checkbox options with `[x]` for the key, optional code block, optional **Explanation**, and a `[Reference]` link per question (about half the Git items have one). Easy to diff and review. | **AGPL-3.0** (LICENSE file verified). Strong copyleft; adapting into our client-served bank would pull AGPL obligations. Do not adapt; use as a coverage checklist only. |
| **Lydia Hallie, javascript-questions** (github.com/lydiahallie/javascript-questions) | About 150+ JS output-prediction questions, 20 translations. | High-quality explanations; very "gotcha" oriented (hoisting, coercion, event loop), dated 2019 per its own note. Good for language-semantics depth, not for practices topics. | Code snippet first, then 4 lettered options, collapsible answer with a long explanation. Strong model for "predict the output". | **MIT** (verified). README asks for a reference back. Adaptable with attribution, but off-topic for this bank. |
| **Tech Interview Handbook** (github.com/yangshun/tech-interview-handbook) | Interview process guide, algorithms study plan, behavioral, some front-end Q&A. | Well curated, prose not MCQ. | Topic checklists and "what to study at which level". | **MIT** (verified). |
| **h5bp Front-end Developer Interview Questions** | Open-ended question lists (HTML, CSS, JS, network, testing). | Lists only, no answers. | Useful as a concept checklist. | **MIT** (verified). |
| **sudheerj javascript-interview-questions** | Hundreds of JS Q&A plus a "coding exercise" section with options. | Broad, some shallow. | Q&A with answers. | No LICENSE file at repo root (checked LICENSE, .md, .txt): treat as all rights reserved. |
| **System Design Primer** (github.com/donnemartin/system-design-primer) | Load balancers, caching patterns (cache-aside, write-through, write-behind), CDN push vs pull, queues and back pressure, scaling, SQL vs NoSQL, plus Anki decks. | Excellent reference, but scoped beyond junior. | Anki flashcards per topic; "trade-offs" framing per component. | **CC BY 4.0** (LICENSE.txt verified). Best candidate for adapting explanations with attribution. |
| **OWASP Cheat Sheet Series** | Password storage, XSS prevention, SQL injection prevention, CSRF, authentication, session management. | Authoritative, current. | Authoritative "why" text to ground security explanations. | **CC BY-SA 4.0** (LICENSE.md verified). ShareAlike: adapted text would need the same license. Cite and link; write our own explanations rather than adapting prose. |
| **Software Engineering at Google** (abseil.io/resources/swe-book) | Testing chapters: test size vs scope, ~80/15/5 split, flaky tests (~1% flake rate erodes trust), brittle vs unclear tests, Beyonce rule; also code review, version control. | Authoritative. | Concept source for testing questions. | **CC BY-NC-ND 4.0** (notice on page). NoDerivatives: link only, no adaptation. |
| **Martin Fowler, "Mocks Aren't Stubs"** | Test double taxonomy, state vs behavior verification, classical vs mockist TDD. | Canonical reference. | Reference link for explanations. | Not openly licensed (personal site, all rights reserved). Link only. |
| **Sanfoundry** | "1000+ MCQs" per subject: software engineering, testing, DBMS, OS, networks, languages. Very academic (Indian university / GATE style). | Trivia-heavy definitional items ("which model is also called..."), terse one-line explanations; errors are commonly reported by users and the pages are widely re-uploaded (Scribd). Site blocked automated fetch (HTTP 403), so this is from search snippets and general knowledge. | "View Answer" reveal with short explanation; large volume per subtopic. | Not openly licensed (commercial site; copyright notices on re-uploads). |
| **InterviewBit MCQ pages** (e.g. Git MCQ, Software Engineering MCQ, DBMS MCQ) | Interview Q&A articles followed by an MCQ block. | Fetch blocked (403). From general knowledge: short MCQs with instant right/wrong, explanations often missing or thin; mostly recall. | Article-then-quiz pairing (learn, then check). | Not openly licensed (Scaler/InterviewBit, all rights reserved). |
| **GeeksforGeeks quizzes** | Many quizzes, 1 to ~36 questions each (e.g. MySQL 15, GATE OS memory 32), strongly GATE-exam flavored (OS, DBMS, networks, theory). | Variable; GATE items are rigorous but academic; community-written items sometimes have wrong keys or ambiguous wording. | Per-question explanation after answer on quiz pages, code snippets, topic tags. | Not openly licensed ("All rights reserved", Sanchhaya Education). |
| **W3Schools quizzes** | ~40 short quizzes (HTML, CSS, JS, SQL, Python, Java, Git, Bash, Cyber Security, AWS, etc.). | Beginner-level, syntax recall; site states it cannot warrant full correctness. | Low-friction format, "review answers when done", certificate upsell. | Not openly licensed (Copyright 1999-2026 W3Schools, all rights reserved). |
| **TestDome** | Role tests (Software Engineering, Web Developer, C#, etc.). Software Engineering test mixes REST/HTTP, OOP and design patterns, DSA and Big-O, software architecture (layered, fault tolerance, rate limiting). Public sample of 16 questions, 13 Easy / 3 Hard, 2-10 minutes each. | Work-sample oriented, fewer pure recall items; candidates report mixes of logic MCQs, coding and SQL. | Per-question time limits and difficulty labels; question types: multiple choice, multiple correct answers, fill in the blank, text answer (AI-validated), live coding, file upload; public sample questions; percentile score; certificate for top 25%. | Not openly licensed. |
| **HackerRank (for Work)** | Coding, MCQ, SQL, front-end/back-end tasks, subjective, diagram, file upload. | Company-authored plus library content. | MCQ supports single or multiple correct; per-question score and recommended time; tags; interviewer notes; bulk CSV/XLSX upload (columns: name, time, tags, description, notes, answers, score, options A..Z); partial credit for multi-answer; optional negative marking; selecting more options than correct answers scores zero/negative. | Not openly licensed. |
| **Codility** | Algorithmic coding (dominant), bug fixing, SQL, front-end/framework tasks, real-life scenarios, plus "technical knowledge" MCQ sets (Git, Java, Spring, AWS, data science). | Coding tasks well regarded; MCQ is secondary. | MCQ task = 10 questions on one subject, auto-scored, grouped by difficulty; separate "multiple response" type with negative marking floored at 0%. | Not openly licensed. Widely used by Israeli companies (e.g. Check Point student/junior home tests: three algorithmic tasks of rising difficulty). |
| **Mercer Mettl** | Junior Software Developer Assessment (0.5-2 yrs): DSA (lists, stacks, queues, arrays, trees, sorting/searching), DB concepts, networking, OS, OOP, plus programming. | Academic CS-fundamentals coverage; page is internally inconsistent (45 vs 60 min). | 30 MCQs + 1 coding simulator item (about 97% MCQ by count); MCQs span basic/intermediate/advanced; library of 100k+ questions; code-snippet and app-dev question types. | Not openly licensed. |
| **iMocha** | Skill tests across many technologies; MCQ, coding simulator (write/debug code), "AI-LogicBox" (pseudo-code logic, designed to reduce MCQ guessing), file upload, audio/video. | Vendor itself argues MCQs do not eliminate guessing or measure functional skill; G2 users ask for more question-type variety. | LogicBox idea: fill in logic rather than pick an option. | Not openly licensed. |
| **Indeed Assessments** | 150+ short skills tests attached to postings, ~10-15 minutes, ~15 MCQs (e.g. Excel); programming tests similar. | Shallow but broad. | Banded results (Expert, Highly Proficient, Proficient, Familiar, Completed) instead of raw score; retake lock of 6 months. | Not openly licensed. |
| **TestGorilla** (adjacent) | Large library of short MCQ programming tests. | Recall-leaning. | Short timed tests per skill. | Not openly licensed. |
| **Israeli screening landscape** | No Israeli company sells a dedicated developer-MCQ product that surfaced in search. Israeli firms mostly use Codility, HackerRank or home assignments, then technical interviews with team lead and group manager. Placement institutes (e.g. Machon Noam style "technical tests") give generic technical/aptitude exams (flowcharts, troubleshooting). Community Hebrew collections exist (JobHunt question pool, a large shared Google Doc of interview questions, TheWorker reviews). QA/support screening days include networking basics (IP, default gateway, server). | Anecdotal, Glassdoor-based. | Hebrew-language interview expectations: linked lists, OS/sync (locks, mutexes), C string functions (atoi), university project discussion. | Community docs: not licensed for reuse. |

### What junior / student screening tests typically contain

- **Coding dominates the first gate at product and Israeli high-tech companies.** Typical pattern: HR call, then an online test (Codility or HackerRank) with 2-3 algorithmic tasks of rising difficulty in 60-120 minutes, then technical interviews. MCQs, when present, are a side module (Codility: a 10-question block).
- **MCQ-heavy tests are typical of mass campus hiring and services firms** (Mettl junior assessment: 30 MCQ + 1 coding; Indeed: ~15 MCQ). Topics are CS fundamentals: DSA, OOP, DBMS/SQL, OS, networking, sometimes aptitude/logic.
- **Mixed-format role tests** (TestDome) blend MCQ, multi-select, fill-in, short text and work samples, each with its own time limit.
- **Practices topics (testing, Git, security, system design) rarely appear as standalone screening sections for juniors**; they come up in interviews ("how would you test this", "merge vs rebase", "how do you store passwords", "what does a cache do"). That is the gap our bank can fill: interview-style understanding questions, not screening trivia.

---

## Recommendations

### Topic weights for our audience (share of the practices bank)

| Topic | Share | Notes |
|---|---|---|
| Git and teamwork | 30% | Highest frequency of direct questions for juniors; emphasize mental model, merge vs rebase, conflicts, revert vs reset, PRs. |
| Testing | 25% | Unit/integration/e2e trade-offs, stub vs mock, good tests, flaky tests, TDD. Add a QA-flavored slice (boundary values, equivalence classes) for Israeli student QA/automation roles. |
| Security basics | 25% | SQLi, XSS, hashing vs encryption, salting and slow hashes, authN vs authZ, never trust the client. Weight up for Israeli cyber companies. CSRF and JWT as medium. |
| System design (junior) | 20% | HTTP and REST, stateless services, vertical vs horizontal, load balancer, cache (with invalidation), CDN, queue. Stop at building blocks and trade-offs. |

Within each topic aim roughly for 50% easy (concept recognition), 35% medium (apply to a scenario), 15% hard (two concepts interacting, e.g. rebase of a pushed branch plus a teammate's pull).

### Format features to adopt

1. **Scenario stems, not definition stems.** "Your teammate already pulled your feature branch; you want a linear history. What is the risk of rebasing now?" tests understanding; "What does rebase do?" tests recall.
2. **Per-option explanations** (why each distractor is wrong), not just one explanation for the key. Every distractor should map to a named misconception from the trap columns above; store that misconception id so wrong answers can drive weak-spot recommendations.
3. **Short code or command snippets** where they carry the concept (a concatenated SQL string, an `innerHTML` assignment, a test with `sleep(2000)`, a `git log --graph` picture), never for flag recall.
4. **Single-answer by default; a small number of "select all that apply"** with HackerRank-style scoring (partial credit, zero if more options selected than correct). Show "select N" to avoid guessing games.
5. **Difficulty label and topic/subtopic tags** per question (Codility, TestDome, HackerRank all do this), plus an optional recommended time.
6. **A reference link per question** (LinkedIn repo pattern) to an authoritative source: OWASP cheat sheets, Fowler, Pro Git / git-scm docs, SWE at Google, System Design Primer. Links are fine regardless of license.
7. **Plain-text, reviewable data format** (like the LinkedIn repo Markdown or HackerRank CSV columns) validated by a unit test: exactly one key for single-answer items, every option has an explanation, tags exist in the taxonomy, no duplicate stems.
8. **Banded results** (Indeed style) and per-topic breakdown rather than a single raw score.
9. **Avoid what makes competitors weak:** command-flag recall, version/history trivia, unverified community keys, "all of the above"/"none of the above" options, and negatively worded stems ("which is NOT...") except sparingly.
10. **Hebrew-friendly but English-first wording**: Israeli tests and interviews use English technical terms; keep terms in English, stems short.

### Openly licensed sources (adaptation with attribution)

- **Adaptable with attribution:** System Design Primer (CC BY 4.0) for explanation text on scaling, caching, CDN, queues; Lydia Hallie javascript-questions, Tech Interview Handbook, h5bp list (MIT) if we ever touch JS semantics or interview-process content. Keep the copyright and license notice for MIT material and attribute CC BY material with a link and "changes made" note.
- **Cite and link only (do not adapt text):** OWASP Cheat Sheet Series (CC BY-SA 4.0, ShareAlike would bind our derived text), Software Engineering at Google (CC BY-NC-ND 4.0, no derivatives), Fowler's articles (all rights reserved).
- **Do not adapt:** LinkedIn Skill Assessments repo (AGPL-3.0, plus answer-quality issues), sudheerj (no license), and all commercial sites (Sanfoundry, InterviewBit, GeeksforGeeks, W3Schools, TestDome, HackerRank, Codility, Mettl, iMocha, Indeed). Use them only to check coverage. Since our goal is original questions, the simplest policy is: write everything ourselves, link to authoritative references, and attribute only where we reuse CC BY or MIT explanation text.

---

## Sources

1. LinkedIn quiz repo and LICENSE (AGPL-3.0): https://github.com/Ebazhanov/linkedin-skill-assessments-quizzes , raw `LICENSE` and `git/git-quiz.md`
2. Repo issue tracker (wrong-answer reports): https://github.com/Ebazhanov/linkedin-skill-assessments-quizzes/issues
3. LinkedIn help, assessments retired: https://www.linkedin.com/help/linkedin/answer/94427
4. Lydia Hallie javascript-questions (MIT): https://github.com/lydiahallie/javascript-questions
5. Tech Interview Handbook (MIT): https://github.com/yangshun/tech-interview-handbook
6. h5bp Front-end Developer Interview Questions (MIT): https://github.com/h5bp/Front-end-Developer-Interview-Questions
7. System Design Primer (CC BY 4.0): https://github.com/donnemartin/system-design-primer
8. OWASP Cheat Sheet Series (CC BY-SA 4.0), Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
9. Software Engineering at Google, ch. 11 Testing Overview (CC BY-NC-ND 4.0): https://abseil.io/resources/swe-book/html/ch11.html
10. Martin Fowler, Mocks Aren't Stubs: https://martinfowler.com/articles/mocksArentStubs.html
11. Google Testing Blog, flaky tests: https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html
12. Codility MCQ tasks: https://support.codility.com/hc/en-us/articles/360043319714-Multiple-Choice-Questions and task library https://support.codility.com/hc/en-us/articles/360043827713-The-Codility-Task-Library , multiple response https://support.codility.com/hc/en-us/articles/360043827533-Multiple-Response-Questions
13. HackerRank MCQ authoring and scoring: https://support.hackerrank.com/articles/2513748038-multiple-choice-questions ; question types https://support.hackerrank.com/articles/2354192461-question-types-in-hackerrank-tests
14. TestDome Software Engineering test: https://www.testdome.com/tests/software-engineering-online-test/124
15. Mettl Junior Software Developer Assessment: https://mettl.com/test/junior-software-developer-assessment/ ; question types https://support.mettl.com/portal/en/kb/articles/type-of-questions-supported-on-mettl-platform-14-3-2023-1
16. iMocha coding simulations: https://www.imocha.io/platform/coding-simulations ; glossary https://imocha.io/glossary/what-is-coding-interview-tool
17. W3Schools quizzes: https://www.w3schools.com/quiztest/default.asp
18. GeeksforGeeks quizzes: https://www.geeksforgeeks.org/quizzes/git-quiz/
19. Sanfoundry Software Engineering MCQs (search snippet; fetch blocked): https://www.sanfoundry.com/software-engineering-questions-answers/
20. InterviewBit MCQ hub (fetch blocked): https://www.interviewbit.com/software-engineering-mcq
21. Indeed assessments (third-party description): https://blog.theinterviewguys.com/?p=20046 ; https://www.indeed.com/career-advice/interviewing/interview-test
22. Glassdoor junior questions (merge vs rebase): https://static.glassdoor.es/Interview/junior-software-engineer-interview-questions-SRCH_KO0,24_IP31.htm
23. Check Point student developer interviews (Codility home test, linked lists, OS sync): https://www.glassdoor.com/Interview/Check-Point-Software-Technologies-Software-Developer-Student-Position-Interview-Questions-EI_IE6161.0,33_KO34,69.htm
24. Israeli community collections: https://jobhunt.co.il/ (question pool), https://www.machon-noam.co.il/ (technical test sample), https://www.dialog.co.il/new-world/work-search/blogs/exams
25. Junior system design expectations: https://www.hellointerview.com/blog/the-system-design-interview-what-is-expected-at-each-level ; https://algomaster.io/learn/system-design-interviews/expectations-by-level
26. Git interview question lists (coverage check): https://www.datacamp.com/blog/git-interview-questions-and-answers ; https://www.indeed.com/career-advice/interviewing/git-interview-questions
