# GitHub sync: owner setup

Accepted solutions committed to a repository each user chooses (ADR 0007). About 15 minutes,
$0. Needs accounts working (`docs/DEPLOY_AUTH.md`). Until step 4 is done, the site shows no GitHub
sync controls.

The App's **private key** goes only into the Supabase secrets screen, never into the repository
or a chat.

## 1. Create the GitHub App

https://github.com/settings/apps/new

- **GitHub App name**: `Leet-For-Berger Sync` (users see it). The page then shows its **slug**,
  e.g. `leet-for-berger-sync`.
- **Homepage URL**: `https://royc4515.github.io/leet-for-berger/`
- **Callback URL**: leave empty. Uncheck **Expire user authorization tokens** and leave
  **Request user authorization (OAuth) during installation** unchecked.
- **Setup URL**: `https://royc4515.github.io/leet-for-berger/` and check **Redirect on update**.
- **Webhook**: uncheck **Active**.
- **Repository permissions > Contents**: **Read and write**. Nothing else.
- **Where can this GitHub App be installed?**: **Any account**.

**Create GitHub App**. On the app's page note the **App ID**, then **Generate a private key**: a
`.pem` file downloads.

## 2. Store the secrets in Supabase

https://supabase.com/dashboard/project/jezwwmnczliubfmqgutc/functions/secrets

| Name | Value |
|---|---|
| `GITHUB_APP_ID` | the App ID |
| `GITHUB_APP_PRIVATE_KEY` | the whole content of the `.pem` file, including the BEGIN and END lines |
| `SITE_URL` | `https://royc4515.github.io/leet-for-berger/` |

Then delete the downloaded `.pem` file (GitHub can generate a new one any time).

## 3. Create the table and deploy the function

Claude can do this with the Supabase connector (apply the `github_links` part of `db/schema.sql`,
deploy `deploy/supabase/functions/github-sync` as `github-sync`), or by hand:

```bash
npx supabase login
npx supabase link --project-ref jezwwmnczliubfmqgutc
npx supabase functions deploy github-sync --use-api   # from deploy/supabase
```

## 4. Turn it on in the site

Set `githubAppSlug` in `src/js/config.js` to the app's slug (public), merge, and the account
menu shows **GitHub sync**.

## 5. Verify

1. Sign in with GitHub, open the account menu, **Connect a repository**, install on one new
   repository (e.g. `leetcode-solutions`), and you are back on the site with "Connected".
2. Solve a problem without revealing it: a toast says "Saved to GitHub", and the repository has
   `problems/<id>/solution.<ext>` and a README in one commit.
