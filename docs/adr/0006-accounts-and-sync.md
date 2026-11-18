# ADR 0006: Accounts and synced progress

Status: accepted (2026-11-18)

## Context

Progress lives in `localStorage`: it is lost with the browser and does not follow the user to
another device. Stage C of `docs/PLAN.md` adds accounts (sign-in with Google, and GitHub), then a
sync of solutions to a personal GitHub repository. The site is static (ADR 0001) and must stay at
$0 with no secrets in the client (invariant 10). ADR 0002 already chose Supabase (Postgres, Auth,
Row Level Security) as the backend.

## Decision

1. **Supabase Auth** with the Google and GitHub providers, through `supabase-js` loaded from a
   pinned CDN URL (2.118.0) and only when `src/js/config.js` names a project. OAuth uses PKCE: the
   provider returns a one-time code, never a token in the URL. The project URL and anon key are
   public by design; Row Level Security is what keeps data private.
2. **Progress is stored as one JSON row per user** (`user_state`: the same object
   `state/progress.js` keeps in the browser, minus drafts). Policy `own_state`: a user reads and
   writes only their own row; anon reads nothing (checked in `scripts/db/check-schema.sh`).
3. **Merge, never overwrite** (`state/sync.js`, pure): a solve or a reveal on any device counts,
   counts are the larger of the two raised to what the merged history proves, histories interleave
   newest first (capped at 10 per problem), active days are the union. The merge is idempotent and
   order-independent. On sign-in the server copy is merged into local progress; after each change
   a debounced read-merge-write keeps devices in step (`auth/sync-controller.js`).
4. **Client-reported, so personal only.** A user can only fake their own progress, so nothing
   shared or scored reads `user_state`. Leaderboards, peer battles and verified badges will read the
   judge-written `submissions` and `solves` tables (ADR 0002), which clients cannot write.
5. **Inert until configured.** With no project in `config.js`, no script is downloaded and no
   button shows; the site behaves exactly as before.

## Alternatives considered

- **Write `submissions`/`solves` from the client.** Rejected: those tables are the trusted record
  for future competitive features and must stay judge-written.
- **One row per submission.** More queries, more policies, and the browser already holds the whole
  state; one JSON row keeps sync to a read and an upsert.
- **Firebase or Auth0.** Another vendor beside Supabase, which already hosts the database.
- **Hand-written OAuth against the Auth REST API.** PKCE, token refresh and storage are easy to get
  subtly wrong; the official client handles them.

## Consequences

- The owner creates the Supabase project and the two OAuth apps (`docs/DEPLOY_AUTH.md`); the
  client secrets live in the Supabase dashboard only.
- Free plan limits: 50,000 monthly active users and 500 MB of database, far above this site's use.
- Next in stage C: syncing accepted solutions to the user's GitHub repository needs a server-side
  token, so it runs in a Supabase Edge Function behind a GitHub App limited to one repository.
