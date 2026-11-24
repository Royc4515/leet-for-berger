/**
 * Sign-in with Google or GitHub through Supabase Auth, and progress sync for signed-in users
 * (ADR 0006). Inert when src/js/config.js has no Supabase project: nothing is downloaded and no
 * button shows.
 */
import { authConfig } from '../config.js';
import { createSyncController } from './sync-controller.js';
import { clearUserData } from '../state/user-data.js';

// don't touch / pinned like every CDN dependency (CLAUDE.md invariant 8); upgrading is a deliberate task.
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

/**
 * The Supabase project ref: the first label of the project host, which supabase-js uses in its
 * storage key (`sb-<ref>-auth-token`).
 * @param {string} url
 * @returns {string} '' when the URL does not parse
 */
export function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return '';
  }
}

/**
 * Whether to load supabase-js at page start. Only a returning user (stored session), or one
 * mid-redirect (OAuth code or error, GitHub App install), needs it before clicking Sign in; for
 * everyone else the menu renders signed out from config alone and the client loads on click.
 * @param {{ storageKeys: string[], search: string, projectRef: string }} opts
 * @returns {boolean}
 */
export function shouldStartAuthEagerly({ storageKeys, search, projectRef }) {
  const q = new URLSearchParams(search);
  // don't touch / the auth callback must reach supabase-js (detectSessionInUrl) while the URL still carries it.
  if (q.has('code') || q.has('error_description') || q.has('installation_id')) return true;
  if (!projectRef) return false;
  const prefix = `sb-${projectRef}-auth-token`;
  return storageKeys.some((k) => k === prefix || k.startsWith(`${prefix}.`));
}

/** sessionStorage key: the hash route a sign-in started from, for this tab only. */
const RETURN_KEY = 'lfb:return-to';

/**
 * The route to reopen when the sign-in provider sends the user back. The provider returns to the
 * site root (the redirect URL carries no hash route), so the route saved when sign-in started is
 * used, but only on that return (OAuth code or error in the URL) and only if it is a hash route.
 * @param {{ search: string, saved: string|null }} opts
 * @returns {string|null}
 */
export function returnRoute({ search, saved }) {
  const q = new URLSearchParams(search);
  if (!q.has('code') && !q.has('error_description')) return null;
  return typeof saved === 'string' && saved.startsWith('#/') ? saved : null;
}

/**
 * Back to the page a sign-in started from. Called once at startup, before the first route, so the
 * right view renders directly instead of the dashboard first.
 */
export function restoreReturnRoute() {
  let back = null;
  try {
    back = returnRoute({ search: location.search, saved: sessionStorage.getItem(RETURN_KEY) });
    if (back) sessionStorage.removeItem(RETURN_KEY);
  } catch {
    return;
  }
  // Keeps ?code=: supabase-js still has to read it, then removes it itself.
  if (back && back !== location.hash) history.replaceState(history.state, '', location.pathname + location.search + back);
}

/** localStorage keys, or [] when storage is blocked (private window, site data off). */
function storedKeys() {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

/**
 * @typedef {{ status: 'off'|'loading'|'signed-out'|'signed-in', user: { id: string, email: string|null, name: string|null }|null, sync: 'idle'|'syncing'|'synced'|'error', error: string|null }} AccountState
 */

/**
 * The letters on a signed-in user's round badge in the phone header (owner's request: the full
 * name and the sync note pushed the page title out of a phone's header). First letters of the
 * first two words of the name, else the first letter of the email.
 * @param {{ name?: string|null, email?: string|null }|null} user
 * @returns {string}
 */
export function userInitials(user) {
  const words = String(user?.name ?? '').trim().split(/\s+/).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean);
  if (words.length) return words.slice(0, 2).join('').toUpperCase();
  const first = String(user?.email ?? '').match(/[\p{L}\p{N}]/u)?.[0];
  return first ? first.toUpperCase() : '?';
}

/**
 * @param {{ store: any, config?: ReturnType<typeof authConfig>, loadClient?: (url: string, key: string) => Promise<any> }} opts
 */
export function createAccount({ store, config = authConfig(), loadClient = defaultClient }) {
  /** @type {AccountState} */
  let state = { status: config.enabled ? 'loading' : 'off', user: null, sync: 'idle', error: null };
  const listeners = new Set();
  const set = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l(state));
  };
  let client = null;
  let sync = null;
  let clearLocal = () => {};
  let apply = () => {};

  let starting = null;
  /** Loads the client once; a later call (the Sign in click) joins the same load, or retries after a failure. */
  function start() {
    if (!config.enabled) return Promise.resolve();
    starting ??= load().finally(() => {
      if (!client) starting = null;
    });
    return starting;
  }

  /** Eager at page start only when `shouldStartAuthEagerly`; otherwise signed out until the first click. */
  function startIfNeeded({ keys = storedKeys(), search = location.search } = {}) {
    if (!config.enabled) return Promise.resolve();
    if (shouldStartAuthEagerly({ storageKeys: keys, search, projectRef: projectRefFromUrl(config.supabaseUrl) })) return start();
    set({ status: 'signed-out' });
    return Promise.resolve();
  }

  async function load() {
    try {
      client = await loadClient(config.supabaseUrl, config.supabaseAnonKey);
    } catch {
      // Sign-in is optional: an unreachable CDN must not break practice.
      set({ status: 'signed-out', error: 'Sign-in is unavailable right now.' });
      return;
    }
    sync = createSyncController({
      store,
      backend: {
        async load(userId) {
          const { data, error } = await client.from('user_state').select('state').eq('user_id', userId).maybeSingle();
          if (error) throw new Error(error.message);
          return data?.state ?? null;
        },
        async save(userId, value) {
          const { error } = await client.from('user_state').upsert({ user_id: userId, state: value, updated_at: new Date().toISOString() });
          if (error) throw new Error(error.message);
        },
      },
      onStatus: (s, detail) => set({ sync: s, error: s === 'error' ? `Sync failed: ${detail}` : null }),
    });
    apply = (session) => {
      const u = session?.user ?? null;
      set({
        status: u ? 'signed-in' : 'signed-out',
        user: u ? { id: u.id, email: u.email ?? null, name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null } : null,
      });
      sync.setUser(u?.id ?? null);
    };
    clearLocal = () => {
      // Stop syncing first: the reset below must never be pushed to the account as "empty progress".
      sync.setUser(null);
      store.reset?.();
      clearUserData();
    };
    const { data } = await client.auth.getSession();
    apply(data.session);
    // SIGNED_OUT also arrives when another tab signs out; this device must forget the user too.
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && state.user) clearLocal();
      apply(session);
    });
  }

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start,
    startIfNeeded,
    /** @param {'google'|'github'} provider */
    async signIn(provider) {
      await start();
      if (!client) return;
      // Back to this page after the provider's consent screen. The hash route rides in redirectTo:
      // Supabase Auth adds ?code= and keeps the fragment, and checks the allowlist without it, so
      // it works even when the return opens in another tab. On an error return Supabase replaces
      // the fragment, so this tab's sessionStorage keeps the route too (restoreReturnRoute).
      try {
        sessionStorage.setItem(RETURN_KEY, location.hash || '#/');
      } catch {
        // Storage blocked: redirectTo still carries the route.
      }
      // No query: a stale ?code= or ?installation_id= must not ride along.
      const redirectTo = `${location.origin}${location.pathname}${location.hash}`;
      const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) set({ error: error.message });
    },
    /** The signed-in user's access token, for calling Edge Functions; null when signed out. */
    async accessToken() {
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data.session?.access_token ?? null;
    },
    config,
    /**
     * Signs out and removes this user's data from the device (ADR 0006). The latest progress is
     * pushed first; if that fails nothing is cleared and the user stays signed in, so no work is lost.
     * `force` skips the push after the user chose to sign out anyway (offline, service down), so a
     * failing sync can never trap them in an account on a shared device.
     * @param {{ force?: boolean }} [opts]
     * @returns {Promise<boolean>} true when signed out
     */
    async signOut({ force = false } = {}) {
      if (!client) return false;
      if (!force && state.user && !(await sync.pushNow())) {
        set({ error: 'Could not save your latest progress, so you are still signed in.' });
        return false;
      }
      await client.auth.signOut();
      clearLocal();
      apply({ user: null });
      return true;
    },
  };
}

async function defaultClient(url, key) {
  const { createClient } = await import(SUPABASE_JS);
  // PKCE: the provider returns a one-time code, never a token in the URL.
  return createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });
}
