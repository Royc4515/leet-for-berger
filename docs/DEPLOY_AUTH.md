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
   **Authorized redirect URIs**: the callback address above. Copy the client ID and secret.
4. Supabase: **Authentication > Sign In / Providers > Google**: enable, paste both, save.

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

## 8. Web Push reminders

Pushes at the user's send hours (ADR 0011) need four tables, an hourly job and one Edge Function.
No secret is typed in by hand: the function makes its VAPID key pair on first use and keeps it in a
table only the service role reads, and the migration makes the job's secret inside Vault. About
five minutes, after the steps above.

1. **SQL Editor**: store the job's address in Vault (once per project; it is not a secret):

   ```
   select vault.create_secret('https://<your project ref>.supabase.co/functions/v1/push/run', 'push_run_url');
   ```

   Then paste `deploy/supabase/migrations/20261125_push.sql` and **Run**: the tables with row level
   security (`push_keys` has no policy at all), the job's secret in Vault with `push_cron_secret()`
   to read it (service role only), and the `push-run` job at minute 0 of every hour (pg_cron, pg_net).
2. Deploy the function, with JWT verification off (the hourly job sends its own secret; the other
   routes check the session). It reads `SITE_URL`, already set for the other functions:

   ```
   npx supabase functions deploy push --use-api --no-verify-jwt --project-ref <your project ref>
   ```

3. Verify: `https://<ref>.supabase.co/functions/v1/push/key` answers `{"publicKey":"B..."}` (the
   first call makes the key pair; **Table Editor > push_keys** then has one row, and the key stays
   the same on every later call). `POST .../push/run` without the secret answers `401`. After the
   next full hour, **Integrations > Cron > push-run** shows a successful run, and
   `select status_code, content from net._http_response order by created desc limit 1;` shows
   `200` and `{"checked":0,"sent":0,"dropped":0}` until someone turns reminders on.
4. **Reminder language (Hebrew stage 4)**: run `deploy/supabase/migrations/20261126_push_lang.sql`
   in the **SQL Editor** first (adds `push_settings.lang`, defaulting existing rows to `'en'`),
   then redeploy the function from `deploy/supabase`:

   ```
   npx supabase functions deploy push --use-api --no-verify-jwt --project-ref <your project ref>
   ```

   Verify: open `#/me` in Hebrew while signed in with notifications on; **Table Editor >
   push_settings** now shows `lang = 'he'` for your row, and **לשלוח בדיקה** delivers the Hebrew
   test notification ("בדיקת קשר: שומעים חזק וברור").

Never delete the `push_keys` row: a new key pair cuts off every device subscribed with the old one.

After a change to the reminder rules (`src/js/data/notifications.js`, `push-plan.js`, `daily.js`,
`state/progress.js`) or to a problem title, `node scripts/content/build-push.mjs` rebuilds
`deploy/supabase/functions/push/lib/`; deploy the function again so the phone and the bell agree
(`tests/push-server.test.js` fails until the copies match).
