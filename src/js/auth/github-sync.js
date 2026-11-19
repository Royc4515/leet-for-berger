/**
 * GitHub sync, browser side (ADR 0007): talks to the github-sync Edge Function with the user's
 * session. The GitHub token never reaches the browser; the function holds the App key.
 */

/**
 * Should an Accepted submit be pushed automatically? Assisted solves (the solution was revealed)
 * are pushed only by hand, so the portfolio stays honest (docs/PLAN.md decision log).
 * @param {{ accepted: boolean, revealed: boolean, link: { linked: boolean, autoSync?: boolean }|null, practice: boolean }} p
 * @returns {boolean}
 */
export function shouldAutoSync({ accepted, revealed, link, practice }) {
  return Boolean(practice && accepted && !revealed && link?.linked && link.autoSync);
}

/**
 * Reads ?installation_id=...&setup_action=install that GitHub appends when it sends the user back
 * after installing the app.
 * @param {string} search location.search
 * @returns {number|null}
 */
export function installationFromUrl(search) {
  const q = new URLSearchParams(search);
  const id = Number(q.get('installation_id'));
  return q.get('setup_action') && Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * @param {{ account: ReturnType<import('./account.js').createAccount>, fetchImpl?: typeof fetch }} opts
 */
export function createGitHubSync({ account, fetchImpl = (...a) => fetch(...a) }) {
  const { supabaseUrl, supabaseAnonKey, githubAppSlug } = account.config;
  let link = null;
  const listeners = new Set();
  const set = (v) => {
    link = v;
    listeners.forEach((l) => l(link));
  };

  async function call(route, body) {
    const token = await account.accessToken();
    if (!token) throw new Error('Sign in first');
    const res = await fetchImpl(`${supabaseUrl}/functions/v1/github-sync${route}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `GitHub sync failed (${res.status})`);
    return data;
  }

  return {
    available: Boolean(githubAppSlug && account.config.enabled),
    installUrl: githubAppSlug ? `https://github.com/apps/${githubAppSlug}/installations/new` : null,
    get: () => link,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async refresh() {
      set(await call('/status'));
      return link;
    },
    async connect(installationId) {
      set(await call('/link', { installationId }));
      return link;
    },
    async setAutoSync(on) {
      set(await call('/settings', { autoSync: on }));
    },
    async disconnect() {
      set(await call('/unlink', {}));
    },
    /** @param {{ problemId: string, title: string, difficulty: string, language: string, code: string, verdict: string, passed: number, total: number, assisted: boolean }} s */
    push: (s) => call('/push', s),
    clear: () => set(null),
  };
}
