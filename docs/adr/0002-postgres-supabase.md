# ADR 0002: PostgreSQL on Supabase, git as the source of truth for content

- Status: accepted
- Date: 2026-11-17
- Resolves the open decision in `docs/ROADMAP.md` ("Supabase + edge functions vs. small Node service")

## Context

Today there is no database:

- Problem metadata (3,517 problems, 680 companies, families, ladders) lives in JSON files under `content/`.
- Problem content (statement, tests, solutions in 8 languages) lives in `src/js/problems/<id>/` and ships to the browser.
- User progress lives in `localStorage`.

That is enough for a static practice site and not enough for the product:

- Hidden tests and solutions reach the client, so a determined user can read them (CLAUDE.md, Known limits).
- There are no accounts, so progress does not follow the user across devices.
- Company-targeted practice, weak-spot drills and mock OAs are relational queries (problem x company x topic x family x the user's history) that do not belong in a 3.5 MB JSON file in the browser.
- Java, C++, C, C# and Go need a server-side judge, and the judge needs a trusted place to read hidden cases and write verdicts.

## Decision

1. **Git stays the source of truth for content.** Problems, tests, solutions, taxonomy, families and the index are files, reviewed in PRs and verified in CI (8-language solution verifier, index validators, audit). Content is never edited in the database.
2. **PostgreSQL is the runtime store**, hosted on **Supabase** (Postgres, Auth, Row Level Security, Edge Functions). The schema is `db/schema.sql`.
3. **A sync job projects git into the database** on every merge to `main`: `scripts/db/export-sql.mjs` emits one transaction that stages what git has, deletes content git dropped (leaves first), and upserts the rest (roots first). It never truncates, so user data is never touched; if git drops a problem users submitted to, a foreign key fails the whole transaction.
4. **The judge is a separate service** (Judge0 or Piston, self-hosted). It reads hidden cases and writes submissions and solves with the service role. Clients never write verdicts.

## Schema

```
topics ─< subtopics            topic_prereqs (topic -> prereq)
   │
problems ─< problem_secondary_topics
   │  ├─< company_problems >─ companies   (frequency, recency, source for reports)
   │  ├─< list_problems >─ lists          (blind75, neetcode150, top-interview-150, codility-lessons...)
   │  ├── family_members >─ families      (one family per problem, ordered versions with a twist)
   │  └── problem_content ─< test_cases   (1-5 visible, 6-15 hidden)
   │                       ─< solutions >─ languages (8)
profiles ─< submissions, solves            (auth.users; target company, preferred language)
```

Rules the build validators enforce are also database constraints: a selected problem has a wave and a subtopic, one essential problem per subtopic (partial unique index), exactly the visible/hidden split by position, reported company links carry a source.

## Security (Row Level Security)

| Data | anon / authenticated | judge, sync (service role) |
|---|---|---|
| Catalog: topics, problems, companies, families, lists, statements | read | write |
| Test cases 1-5 | read | write |
| Test cases 6-15 | **none** | read, write |
| Solutions | **none**; only through `reveal_solution()`, signed in, which marks the problem assisted | write |
| Profiles | own row | read, write |
| Submissions, solves | read own | write |

## Verified

`bash scripts/db/check-schema.sh` (`npm run check:db`, also in CI) starts a throwaway PostgreSQL and checks:

1. The schema applies and a sync of the real content passes every constraint (3,517 problems, all test cases, 16 solutions).
2. A second sync keeps user data.
3. Dropping a problem that has submissions fails and changes nothing.
4. RLS: clients see visible test cases, never hidden ones or solutions.
5. `reveal_solution` refuses anonymous callers and marks the problem assisted.

## Alternatives considered

- **Small Node service + self-hosted Postgres.** Same data model, but auth, RLS, backups and an API layer become ours to build and run. Revisit if Supabase limits or pricing bite.
- **MongoDB / Firestore.** The data is relational (many-to-many everywhere) and the key queries are joins and aggregates (company coverage, weak subtopics, distinct problems). A document store would push those into application code and lose the constraints that mirror our validators.
- **Database as the content source (admin UI edits).** Loses review, history and CI verification; a broken problem would reach users without anyone seeing it. Content changes are rare and benefit from PRs.
- **Keep everything static.** Cannot hide tests or solutions, cannot judge compiled languages, no accounts.

## Consequences

- The static site keeps working on its own until the backend exists; the database is additive.
- `scripts/db/export-sql.mjs` must change whenever a content field is added; `check-schema.sh` catches drift because the sync runs against the real content.
- The judge service is the next infrastructure piece (Phase 2): it needs the schema in place and a service-role key, which lives in Supabase and CI secrets only (CLAUDE.md invariant 10).
- Hidden cases for authored problems are generated by seeded generators and can be large (Notify Recipients: up to 10^5 users per case); they are stored as `jsonb`. If storage grows uncomfortable, store generator seeds instead and let the judge regenerate.

## Revisit when

- Supabase limits (connections, row count, function runtime) are hit.
- Content edits need non-developer authors (then: an authoring UI that writes PRs, not rows).
