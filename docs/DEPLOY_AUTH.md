# Accounts: owner setup

Sign-in with Google and GitHub, and progress synced across devices (ADR 0006). About 20 minutes,
$0. Until step 5 is done the site shows no sign-in button and works as before.

You paste OAuth **client secrets** only into the Supabase dashboard, never into the repository or
a chat. The Supabase **project URL** and **anon (publishable) key** are public by design.

## 1. Create the Supabase project

1. https://supabase.com/dashboard/new : sign in (GitHub works), **New project**, Free plan, region
   close to you (for Israel: Frankfurt, `eu-central-1`). Save the database password in a password
   manager; the site never needs it.
2. When it is ready, note the **project ref** (the `abcdefgh` in `https://abcdefgh.supabase.co`).

## 2. Create the tables

**SQL Editor** (left bar) > **New query**, paste the whole of `db/schema.sql` from the repository,
**Run**. It creates the content tables (filled later by the sync job) and `user_state` with its
policy.

## 3. Allowed addresses

**Authentication > URL Configuration**:

- **Site URL**: `https://royc4515.github.io/leet-for-berger/`
- **Redirect URLs**: add `https://royc4515.github.io/leet-for-berger/` and `http://localhost:5173/`

## 4. Sign-in providers

The callback address for both providers is `https://<project-ref>.supabase.co/auth/v1/callback`.

**Google**

1. https://console.cloud.google.com/projectcreate : create a project (any name).
2. https://console.cloud.google.com/auth/branding : fill the consent screen (app name, your email,
   **Privacy policy link** `https://royc4515.github.io/leet-for-berger/privacy.html`, which Google
   requires before publishing), audience **External**, then **Publish app** so anyone can sign in.
3. https://console.cloud.google.com/auth/clients : **Create client**, type **Web application**,
   **Authorized redirect URIs**: the callback address above, and the site's own addresses
   `https://royc4515.github.io/leet-for-berger/` and `http://localhost:5173/` (see "Google's
   screen names the site" below). Copy the client ID and secret.
4. Supabase: **Authentication > Sign In / Providers > Google**: enable, paste both, save.

**Google's screen names the site, not the Supabase project**

Through Supabase alone, Google's account screen says "Choose an account to continue to
`<project-ref>.supabase.co`": Google names the address it returns to, and that is the Supabase
callback. The site therefore asks Google itself (ADR 0006, amendment 1) and returns to its own
address, so the screen says `royc4515.github.io`. Two settings, about two minutes:

1. https://console.cloud.google.com/auth/branding : **Authorized domains**, add
   `royc4515.github.io`, **Save** (Google refuses a redirect URI on a domain not listed here).
2. https://console.cloud.google.com/auth/clients : open the web client, **Authorized redirect
   URIs**, add `https://royc4515.github.io/leet-for-berger/` and `http://localhost:5173/` exactly
   (with the final `/`), keep the Supabase callback, **Save**.
3. `src/js/config.js` holds the client ID (public) in `AUTH.googleClientId` and those two addresses
   in `AUTH.googleRedirectUris`. A page address not on that list (a preview, another port) signs in
   through Supabase as before, so it never meets Google's `redirect_uri_mismatch` error.

Check: on the live site, **Sign in > Continue with Google**; the address bar shows
`accounts.google.com` and the screen says "to continue to royc4515.github.io".

To show the app name and logo instead of the address, submit the brand for verification
(**Branding** page, then **Verification Center**; a few business days). Google verifies only
domains you own, so first verify `royc4515.github.io` in Search Console (an HTML file at the root of
a `royc4515.github.io` repository). Expect Google to ask about `supabase.co` too, a domain only
Supabase can verify; removing the Supabase callback from the client takes it off the list, at the
cost of Google sign-in on addresses not listed in `config.js` (previews, other ports). GitHub
sign-in is not affected; it uses its own OAuth app.

**GitHub**

1. https://github.com/settings/applications/new : name `Leet-For-Berger`, homepage
   `https://royc4515.github.io/leet-for-berger/`, **Authorization callback URL**: the callback
   address above. Register, then **Generate a new client secret**.
2. Supabase: **Authentication > Sign In / Providers > GitHub**: enable, paste the client ID and
   secret, save.

## 5. Point the site at the project

**Project Settings > API Keys**: copy the project URL and the **anon** (or **publishable**) key.
Put them in `src/js/config.js`:

```js
export const AUTH = {
  supabaseUrl: 'https://<project-ref>.supabase.co',
  supabaseAnonKey: '<anon or publishable key>',
};
```

(Or send both to Claude in the chat, they are public; never the database password, the
`service_role` key or a client secret.) Merge, and the site shows **Sign in**.

## 6. Verify

1. Open the site, **Sign in > Continue with Google**, consent, and you are back on the site with
   your name in the header.
2. Solve a problem; the header shows **Progress synced**.
3. **Table Editor > user_state** in Supabase has one row, yours.
4. Sign in on another browser: the solve is there.

## 7. Daily quiz leaderboard

The daily quiz board and the synced quiz streak need one table and one Edge Function. About five
minutes, after the steps above.

1. **SQL Editor > New query**: paste `deploy/supabase/migrations/20261124_quiz_daily_results.sql`
   and **Run**. It creates `quiz_daily_results` with row level security (players read only their
   own rows; only the function writes).
2. Deploy the function from `deploy/supabase`, with JWT verification off so signed-out visitors
   can read the board (the function checks the session itself before it records a play):

   ```
   npx supabase login
   npx supabase functions deploy daily-quiz --use-api --no-verify-jwt --project-ref <your project ref>
   ```

   It reads the `SITE_URL` secret (already set for GitHub sync; otherwise add it under
   **Edge Functions > Secrets** as `https://royc4515.github.io/leet-for-berger/`).
3. Verify: open the site signed in, play today's daily quiz, and the board under the result shows
   your name. **Table Editor > quiz_daily_results** has your row. Play it again: the board says
   only the first play counts, and the table still has one row.
4. **Nicknames**: run `deploy/supabase/migrations/20261124_profiles_display_name_len.sql` too. It
   bounds `profiles.display_name` to 2 to 24 characters, the nickname a player can set under the
   board (**Change name**). With no nickname the board shows the name from Google or GitHub.

After any change to the question bank, `node scripts/content/build-quiz.mjs` rebuilds
`deploy/supabase/functions/daily-quiz/bank.js`; deploy the function again so the server's
answers match the site. New questions join the daily quiz two days after that build
(`content/quiz/daily-pool.json`), so the function only has to be deployed before then; a change
to an existing question's answer must be deployed with the site.
