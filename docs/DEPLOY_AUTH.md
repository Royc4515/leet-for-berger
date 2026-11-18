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
