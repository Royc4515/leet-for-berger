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
