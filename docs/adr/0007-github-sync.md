# ADR 0007: Syncing solutions to the user's GitHub

Status: accepted (2026-11-19)

## Context

Stage C of `docs/PLAN.md`: every Accepted solution is committed to a GitHub repository the user
chooses, one folder per problem with the code and a README, as a portfolio. The decision log
already fixed the shape: opt in once, then automatic on every Accepted; assisted solves (the
solution was revealed) only by hand and marked; through a GitHub App limited to one repository,
the token on the server, never in the browser. The site is static (ADR 0001) and has no secrets
(invariant 10); Supabase already runs auth and the database (ADR 0006).

## Decision

1. **A GitHub App**, created once by the owner, with one permission: Repository contents, read
   and write. A user installs it on **one** repository of theirs (GitHub's install screen lets them
   pick); the app can touch nothing else.
2. **A Supabase Edge Function** (`deploy/supabase/functions/github-sync`) holds the App's private
   key as a secret. Per request it signs an App JWT (RS256, 9 minutes), exchanges it for a
   one-hour installation token, and writes with that. No GitHub token is stored, and none reaches
   the browser.
3. **Linking is verified on the server.** GitHub sends the user back with `?installation_id=...`,
   which anyone could edit, so the function checks that the installation's account is the GitHub
   account the user signed in with, and that it grants exactly one repository. Users who signed in
   with Google only see "Sign in with GitHub to sync".
4. **One commit per push** through the Git data API: `problems/<id>/solution.<ext>` and
   `problems/<id>/README.md` (title, difficulty, language, verdict, tests passed, date, assisted
   when it was, a link back). An empty repository gets its first commit and branch.
5. **`github_links`** (user, installation, repository, auto on/off) is written only by the function
   with the service role; a user may only read their own row (checked in `check-schema.sh`).
6. **Client**: auto push after an Accepted submit in practice mode when the link is on and the
   problem is not assisted (`shouldAutoSync`, pure); a "Push to GitHub" button on accepted entries
   in Submissions; controls in the account menu. Hidden until `githubAppSlug` is set in
   `src/js/config.js`.

## Alternatives considered

- **OAuth token with the `repo` scope** (from the GitHub sign-in): write access to every
  repository the user has, kept in the browser or the database. Far more power than needed.
- **A fine-grained personal access token pasted by the user**: secret handling on the user's side,
  expiry, and a token in our database.
- **GitHub Actions in the user's repository pulling from us**: needs our API and their setup.

## Consequences

- The owner creates the GitHub App and sets three Edge Function secrets
  (`docs/DEPLOY_GITHUB_SYNC.md`); the private key never enters the repository or a chat.
- Commits are authored by the app ("leet-for-berger[bot]"), not the user; the repository is
  theirs and they can rewrite it.
- The code pushed is what the browser reports. That is fine: it lands in the user's own
  repository and nothing shared trusts it.
