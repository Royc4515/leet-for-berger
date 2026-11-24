/**
 * Sign-in with Google or GitHub through Supabase Auth, and progress sync for signed-in users
 * (ADR 0006). Inert when src/js/config.js has no Supabase project: nothing is downloaded and no
 * button shows.
 */
import { authConfig } from '../config.js';
import { createSyncController } from './sync-controller.js';
import { clearUserData, QUIZ_SAVED_EVENT } from '../state/user-data.js';

// Quiz progress rides in the account record next to problem progress (owner's request). Its module
// loads on the first sync, not at page start (ADR 0008: the quiz stays out of the startup graph).
const quizModule = () => import('../state/quiz-progress.js');
const QUIZ_EXTRA = {
  key: 'quiz',
  read: async () => (await quizModule()).loadQuizProgress(),
  merge: async (local, remote) => (await quizModule()).mergeQuizProgress(local, remote),
  write: async (value) => (await quizModule()).saveQuizProgress(value, { source: 'sync' }),
};

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

/** Google's OpenID Connect authorization endpoint (from accounts.google.com/.well-known/openid-configuration). */
export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/** localStorage key: the state, nonce and route of a Google sign-in in progress. */
const GOOGLE_KEY = 'lfb:google-sign-in';

/** How long a started Google sign-in may take before its return is refused. */
export const GOOGLE_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * The address Google returns to for a direct sign-in: this page without its route, when it is one
 * of the client's registered redirect URIs. Google refuses any other address outright
 * (redirect_uri_mismatch), so an unlisted page (a preview, a fork, another port) gets '' and signs
 * in through Supabase instead.
 * @param {{ origin: string, pathname: string }} here
 * @param {string[]} allowed
 * @returns {string}
 */
export function googleRedirectUri(here, allowed) {
  const page = `${here?.origin ?? ''}${String(here?.pathname ?? '').replace(/index\.html$/, '')}`;
  return Array.isArray(allowed) && allowed.includes(page) ? page : '';
}

/**
 * Google's sign-in address for an ID token returned straight to this site (OpenID Connect,
 * response_type id_token). Google's account screen names the redirect host, so it shows this
 * site's address, not the Supabase project's. Only the SHA-256 of the nonce goes to Google:
 * Supabase compares it with the hash of the raw nonce it receives (signInWithIdToken).
 * @param {{ clientId: string, redirectUri: string, state: string, nonceHash: string }} opts
 * @returns {string}
 */
export function googleAuthorizeUrl({ clientId, redirectUri, state, nonceHash }) {
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'id_token', scope: 'openid email profile', state, nonce: nonceHash });
  return `${GOOGLE_AUTHORIZE_URL}?${q}`;
}

/**
 * A Google return in the URL fragment: `#id_token=...&state=...`, or `#error=...&state=...` when the
 * user cancels or Google refuses. A `#/...` hash is a route, never a return.
 * @param {string} hash
 * @returns {{ state: string, idToken: string }|{ state: string, error: string }|null}
 */
export function parseGoogleReturn(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || hash.startsWith('#/')) return null;
  const q = new URLSearchParams(hash.slice(1));
  const state = q.get('state');
  if (!state) return null;
  if (q.get('id_token')) return { state, idToken: q.get('id_token') };
  if (q.get('error')) return { state, error: q.get('error') };
  return null;
}

/**
 * What to do with a Google return, given the sign-in this device started. The state must match
 * (a return this device did not start is refused: login CSRF) and be recent; the nonce stays on the
 * device and goes only to Supabase, so a token copied from the address bar cannot be replayed.
 * @param {{ ret: NonNullable<ReturnType<typeof parseGoogleReturn>>, pending: { state?: string, nonce?: string, route?: string, at?: number }|null, now: number }} opts
 * @returns {{ route: string, idToken?: string, nonce?: string, message?: string|null }}
 */
export function checkGoogleReturn({ ret, pending, now }) {
  const route = typeof pending?.route === 'string' && pending.route.startsWith('#/') ? pending.route : '#/';
  const age = now - Number(pending?.at);
  if (!pending?.nonce || pending.state !== ret.state || !(age >= 0 && age <= GOOGLE_MAX_AGE_MS)) {
    return { route, message: 'Google sign-in did not finish. Try again.' };
  }
  // Cancelling on Google's screen is a choice, not a failure.
  if (ret.error) return { route, message: ret.error === 'access_denied' ? null : 'Google sign-in failed. Try again.' };
  return { route, idToken: ret.idToken, nonce: pending.nonce };
}

/** 32 random bytes as hex: a nonce or a state value. */
function randomToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {string} text
 * @returns {Promise<string>} SHA-256 of the text, lowercase hex (the form Supabase expects)
 */
export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** localStorage, or null when it is blocked (private window, site data off). */
function localStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Takes a Google return off the address bar: the token leaves the URL and its history entry before
 * anything else runs, and the route the sign-in started from replaces it.
 * @param {number} now
 * @returns {ReturnType<typeof checkGoogleReturn>|null}
 */
function takeGoogleReturn(now) {
  const ret = parseGoogleReturn(location.hash);
  if (!ret) return null;
  let pending = null;
  try {
    pending = JSON.parse(localStore()?.getItem(GOOGLE_KEY) ?? 'null');
    localStore()?.removeItem(GOOGLE_KEY);
  } catch {
    pending = null;
  }
  const result = checkGoogleReturn({ ret, pending, now });
  history.replaceState(history.state, '', location.pathname + location.search + result.route);
  return result;
}

/**
 * Back to the page a sign-in started from. Called once at startup, before the first route, so the
 * right view renders directly instead of the dashboard first.
 * @param {{ now?: number }} [opts]
 * @returns {ReturnType<typeof checkGoogleReturn>|null} a direct Google return, for createAccount to finish
 */
export function restoreReturnRoute({ now = Date.now() } = {}) {
  const google = takeGoogleReturn(now);
  if (google) return google;
  let back = null;
  try {
    back = returnRoute({ search: location.search, saved: sessionStorage.getItem(RETURN_KEY) });
    if (back) sessionStorage.removeItem(RETURN_KEY);
  } catch {
    return null;
  }
  // Keeps ?code=: supabase-js still has to read it, then removes it itself.
  if (back && back !== location.hash) history.replaceState(history.state, '', location.pathname + location.search + back);
  return null;
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
 * @typedef {{ location: { origin: string, pathname: string, hash: string }, storage: Storage|null, navigate: (url: string) => void, now: () => number }} AccountEnv
 */

/** The browser's side of a direct Google sign-in; tests pass their own. */
function browserEnv() {
  return { location: globalThis.location, storage: localStore(), navigate: (url) => globalThis.location.assign(url), now: () => Date.now() };
}

/**
 * @param {{ store: any, config?: ReturnType<typeof authConfig>, loadClient?: (url: string, key: string) => Promise<any>, googleReturn?: ReturnType<typeof restoreReturnRoute>, env?: AccountEnv }} opts
 */
export function createAccount({ store, config = authConfig(), loadClient = defaultClient, googleReturn = null, env = browserEnv() }) {
  /** @type {AccountState} */
  let state = { status: config.enabled ? 'loading' : 'off', user: null, sync: 'idle', error: config.enabled ? (googleReturn?.message ?? null) : null };
  // The token from a direct Google return, finished once the client loads.
  let pendingGoogle = config.enabled && googleReturn?.idToken ? googleReturn : null;
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
    if (pendingGoogle || shouldStartAuthEagerly({ storageKeys: keys, search, projectRef: projectRefFromUrl(config.supabaseUrl) })) return start();
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
      extras: [QUIZ_EXTRA],
    });
    // A quiz played on this device syncs like a solve; the sync's own merge writes do not.
    globalThis.addEventListener?.(QUIZ_SAVED_EVENT, (e) => {
      if (e.detail?.source !== 'sync') sync?.touch();
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
    // Still 'loading' while a Google return is exchanged: no "Sign in" flash before the name.
    if (!pendingGoogle || data.session) apply(data.session);
    // SIGNED_OUT also arrives when another tab signs out; this device must forget the user too.
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && state.user) clearLocal();
      apply(session);
    });
    if (pendingGoogle) await finishGoogle(data.session);
  }

  /** Trades the ID token from a direct Google return for a Supabase session. */
  async function finishGoogle(current) {
    const { idToken, nonce } = pendingGoogle;
    pendingGoogle = null;
    let session = current;
    try {
      const { data, error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce });
      if (error) throw error;
      session = data?.session ?? current;
    } catch {
      set({ error: 'Google sign-in failed. Try again.' });
    }
    apply(session);
  }

  /**
   * Starts a direct Google sign-in (ADR 0006, amendment 1): state and nonce stay on this device,
   * the browser goes to Google, and Google returns the ID token to this page. '' when this page
   * cannot (no client ID, an unregistered address, no storage or WebCrypto): Supabase's own flow then.
   */
  async function googleSignInUrl() {
    const redirectUri = googleRedirectUri(env.location, config.googleRedirectUris);
    if (!config.googleClientId || !redirectUri || !env.storage || !globalThis.crypto?.subtle) return '';
    try {
      const nonce = randomToken();
      const stateValue = randomToken();
      const nonceHash = await sha256Hex(nonce);
      const route = String(env.location.hash || '').startsWith('#/') ? env.location.hash : '#/';
      env.storage.setItem(GOOGLE_KEY, JSON.stringify({ state: stateValue, nonce, route, at: env.now() }));
      return googleAuthorizeUrl({ clientId: config.googleClientId, redirectUri, state: stateValue, nonceHash });
    } catch {
      return '';
    }
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
      if (provider === 'google' && config.enabled) {
        const url = await googleSignInUrl();
        if (url) return env.navigate(url);
      }
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
