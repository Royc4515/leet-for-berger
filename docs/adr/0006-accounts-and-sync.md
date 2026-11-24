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

## Amendment: sign-out clears the device (2026-11-19)

Sign-out used to end the session only, so the next visitor on the same browser saw the previous
user's progress, drafts and submissions. Now `signOut()` (`auth/account.js`) first calls the sync
controller's `pushNow()`, which cancels the debounce and merges and writes immediately. If that fails
nothing is cleared and the user stays signed in, so unsynced work is never lost. On success it stops
syncing (`setUser(null)`, so the reset is never uploaded as empty progress), resets the store and
removes every per-user localStorage key, then `main.js` re-mounts the view as a guest. A `SIGNED_OUT`
event from another tab does the same without the push (the session is already gone).
The keys that belong to a user are listed once in `state/user-data.js` (progress, drafts); layout
and language preferences are about the device and stay. `tests/user-data.test.js` scans the source
for `lfb:` keys so a new store cannot be forgotten. The sign-in merge is unchanged: guest progress
made before sign-in still merges into the account. The UI asks for confirmation before signing out.

## Amendment: quiz progress joins the record (2026-11-24)

Quiz progress (`state/quiz-progress.js`: questions answered, best per mode, daily results with the
first play's choices) was kept per browser, so signing out deleted it and a second device started
at zero. It now rides in the same `user_state` row under `quiz`; no schema change, the column is
JSON. The sync controller takes `extras`: parts kept outside the store, each with an async read,
merge and write, synced in the same read-merge-write as progress. The quiz extra lives in
`auth/account.js` and imports its module on the first sync, so the quiz stays out of the startup
graph (ADR 0008). Merge (`mergeQuizProgress`, pure): per question the larger counts, per mode the
better best, and a day both copies played keeps the account's, the play that reached the server
first, as the leaderboard counts it. Saving quiz progress sends a `quiz:saved` window event; a
local save schedules a sync (`touch()`), the sync's own write is marked `source: 'sync'` and does
not. Top-level keys a client does not know are carried through on save, so an older open tab
cannot wipe a part a newer version syncs. The Privacy Policy lists the quiz data.

## Amendment 1: Google sign-in returns to the site (2026-11-24)

Through Supabase's OAuth flow, Google's account screen said "continue to
`jjfwrtsoyunlqtcfvpjn.supabase.co`": Google names the redirect host, and an unknown address on a
sign-in screen looks like phishing (owner's report). Supabase's fixes are a custom domain (a paid
plan plus a paid add-on, against the $0 rule) or Google brand verification, which asks the owner
to verify every authorized domain, and the owner cannot verify `supabase.co`.

Decision: Google sign-in goes to Google directly with OpenID Connect `response_type=id_token`
and returns to the site's own address; the page hands the ID token to Supabase
(`auth.signInWithIdToken`), which checks its signature, audience and nonce and issues the same
session as before (same user, same `google` identity). Google's screen then names
`royc4515.github.io`, and brand verification becomes possible later because every authorized
domain is the owner's.

- **Nonce:** 32 random bytes, kept in localStorage with the state and the route; only its SHA-256
  goes to Google, the raw value only to Supabase, which compares the hashes. A token copied from
  the address bar or history cannot be replayed without it.
- **State:** checked on return (login CSRF) together with a 15 minute age limit; the entry is
  removed on the first return, used or not.
- **The token leaves the address bar** in `restoreReturnRoute`, before the first route renders:
  `history.replaceState` puts back the route the sign-in started from.
- **Fallback:** the direct flow runs only on page addresses listed in `AUTH.googleRedirectUris`
  (registered with Google), with storage and WebCrypto available. Anywhere else Google sign-in
  uses Supabase's PKCE flow as before, so Google's `redirect_uri_mismatch` never shows.
- **Why not Google Identity Services (the "Sign in with Google" button and One Tap):** it also
  names the site, but it loads an unversioned Google script (invariant 8 pins every external
  script) and draws Google's own button in an iframe, which breaks the account panel's keyboard
  model and the Atlas buttons. The redirect keeps our buttons and adds no script.
- **Implicit flow:** OAuth guidance warns against the implicit flow for access tokens; here the
  response is an ID token only, bound to a nonce, read once and removed from the URL, which is the
  case OpenID Connect designs it for. GitHub sign-in is unchanged (Supabase PKCE).

