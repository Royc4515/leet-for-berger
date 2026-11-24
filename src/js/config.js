/**
 * Site configuration. Everything here ships to every visitor, so it holds public values only
 * (invariant 10): URLs and public keys, never a secret.
 */

/**
 * The remote runner for Java, C++, C, C# and Go (docs/adr/0005-remote-runner.md).
 * `url` is the Cloudflare Worker's address, e.g. 'https://lfb-runner.example.workers.dev'
 * (docs/DEPLOY_RUNNER.md, step "Point the site at the Worker"). Empty means those languages
 * stay editor-only with the honest "not supported yet" verdict.
 */
export const REMOTE_RUNNER = {
  url: 'https://lfb-runner.roy-lfb.workers.dev',
  // Cloudflare Turnstile site key (public). Set only when the Worker has TURNSTILE_SECRET.
  turnstileSiteKey: '',
};

/**
 * Where the public site lives. Shared links point here (each to its own preview page, built on
 * deploy by scripts/share/build-share-pages.mjs), whichever copy of the site they were shared from.
 */
export const SITE_URL = 'https://royc4515.github.io/leet-for-berger/';

/**
 * The effective remote runner settings: `window.LFB_REMOTE_RUNNER_URL` (and
 * `window.LFB_TURNSTILE_SITE_KEY`) override this file, so a local test or a fork can point the
 * site at another Worker without editing it.
 * @param {object} [scope] where the overrides are read from (globalThis in the browser)
 * @returns {{ url: string, turnstileSiteKey: string }}
 */
export function remoteRunnerConfig(scope = globalThis) {
  const url = String(scope.LFB_REMOTE_RUNNER_URL ?? REMOTE_RUNNER.url ?? '').trim().replace(/\/+$/, '');
  const turnstileSiteKey = String(scope.LFB_TURNSTILE_SITE_KEY ?? REMOTE_RUNNER.turnstileSiteKey ?? '').trim();
  return { url, turnstileSiteKey };
}

/**
 * Accounts and synced progress (docs/adr/0006-accounts-and-sync.md, owner steps in
 * docs/DEPLOY_AUTH.md). Supabase's project URL and its anon key are public by design: Row Level
 * Security, not the key, keeps each user's data private. Empty means no sign-in button; progress
 * stays in this browser only.
 */
export const AUTH = {
  supabaseUrl: 'https://jjfwrtsoyunlqtcfvpjn.supabase.co',
  // Publishable (anon) key: public by design, Row Level Security guards the data.
  supabaseAnonKey: 'sb_publishable_hii7pCgK8dn-21j6ltZqLQ_eYAp18fo',
  // The GitHub App users install to sync solutions (ADR 0007, docs/DEPLOY_GITHUB_SYNC.md).
  // Empty hides GitHub sync.
  githubAppSlug: 'leet-for-berger-sync',
  // Google sign-in straight from this site (ADR 0006, amendment 1): Google's account screen then
  // names this site instead of the Supabase project address. The OAuth client ID is public. Each
  // address below must be an Authorized redirect URI of that client (docs/DEPLOY_AUTH.md, step 4);
  // on any other address, or with no ID, Google sign-in goes through Supabase as before.
  googleClientId: '273363501283-uph4v8c87gknlf982lo71468ruvg3gns.apps.googleusercontent.com',
  googleRedirectUris: ['https://royc4515.github.io/leet-for-berger/', 'http://localhost:5173/'],
};

/**
 * Effective auth settings; `window.LFB_SUPABASE_URL`, `window.LFB_SUPABASE_ANON_KEY`,
 * `window.LFB_GOOGLE_CLIENT_ID` and `window.LFB_GOOGLE_REDIRECT_URIS` override this file (tests, forks).
 * @param {object} [scope]
 * @returns {{ supabaseUrl: string, supabaseAnonKey: string, githubAppSlug: string, googleClientId: string, googleRedirectUris: string[], enabled: boolean }}
 */
export function authConfig(scope = globalThis) {
  const supabaseUrl = String(scope.LFB_SUPABASE_URL ?? AUTH.supabaseUrl ?? '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(scope.LFB_SUPABASE_ANON_KEY ?? AUTH.supabaseAnonKey ?? '').trim();
  const githubAppSlug = String(scope.LFB_GITHUB_APP_SLUG ?? AUTH.githubAppSlug ?? '').trim();
  const googleClientId = String(scope.LFB_GOOGLE_CLIENT_ID ?? AUTH.googleClientId ?? '').trim();
  const uris = scope.LFB_GOOGLE_REDIRECT_URIS ?? AUTH.googleRedirectUris;
  const googleRedirectUris = (Array.isArray(uris) ? uris : []).map((u) => String(u).trim()).filter(Boolean);
  return { supabaseUrl, supabaseAnonKey, githubAppSlug, googleClientId, googleRedirectUris, enabled: Boolean(supabaseUrl && supabaseAnonKey) };
}
