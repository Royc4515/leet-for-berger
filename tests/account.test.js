import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authConfig } from '../src/js/config.js';
import {
  createAccount,
  returnRoute,
  userInitials,
  googleRedirectUri,
  googleAuthorizeUrl,
  parseGoogleReturn,
  checkGoogleReturn,
  sha256Hex,
  GOOGLE_MAX_AGE_MS,
} from '../src/js/auth/account.js';
import { emptyState } from '../src/js/state/progress.js';

const store = () => {
  let s = emptyState();
  const ls = new Set();
  return { get: () => s, update: (f) => { s = f(s); ls.forEach((l) => l(s)); }, subscribe: (l) => (ls.add(l), () => ls.delete(l)) };
};

test('authConfig: off by default, on with both values, overrides win', () => {
  assert.equal(authConfig({ LFB_SUPABASE_URL: '', LFB_SUPABASE_ANON_KEY: '' }).enabled, false, 'overrides can switch it off');
  // The shipped config names the live project with a publishable key (never a secret one).
  const shipped = authConfig({});
  assert.equal(shipped.enabled, true);
  assert.match(shipped.supabaseUrl, /^https:\/\/[a-z0-9]+\.supabase\.co$/);
  assert.match(shipped.supabaseAnonKey, /^(sb_publishable_|eyJ)/);
  assert.doesNotMatch(shipped.supabaseAnonKey, /secret|service_role/);
  const c = authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co/', LFB_SUPABASE_ANON_KEY: 'k' });
  assert.equal(c.enabled, true);
  assert.equal(c.supabaseUrl, 'https://x.supabase.co');
  assert.equal(authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: '' }).enabled, false, 'a URL without a key is off');
});

test('not configured: no client is ever loaded', async () => {
  let loaded = false;
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: '', LFB_SUPABASE_ANON_KEY: '' }), loadClient: async () => (loaded = true) });
  await acc.start();
  assert.equal(acc.get().status, 'off');
  assert.equal(loaded, false);
});

test('signed-in session: user is exposed and progress is pulled from user_state', async () => {
  const queries = [];
  const fakeClient = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@example.com', user_metadata: { full_name: 'Ada' } } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from(table) {
      const q = { table, ops: [] };
      queries.push(q);
      const chain = {
        select: (...a) => (q.ops.push(['select', ...a]), chain),
        eq: (...a) => (q.ops.push(['eq', ...a]), chain),
        maybeSingle: async () => ({ data: null, error: null }),
        upsert: async (row) => (q.ops.push(['upsert', row.user_id]), { error: null }),
      };
      return chain;
    },
  };
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => fakeClient });
  await acc.start();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(acc.get().status, 'signed-in');
  assert.equal(acc.get().user.name, 'Ada');
  assert.ok(queries.every((q) => q.table === 'user_state'));
  assert.ok(queries.some((q) => q.ops.some((o) => o[0] === 'eq' && o[1] === 'user_id' && o[2] === 'u1')));
  assert.ok(queries.some((q) => q.ops.some((o) => o[0] === 'upsert' && o[1] === 'u1')));
});

test('sign-out pushes first, then clears local progress; a failed push keeps the user signed in', async () => {
  const mk = (failSave) => {
    const st = store();
    let resets = 0;
    st.reset = () => resets++;
    const saved = [];
    const listeners = [];
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      upsert: async (row) => (failSave ? { error: { message: 'offline' } } : (saved.push(row.user_id), { error: null })),
    };
    const client = {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@example.com', user_metadata: {} } } } }),
        onAuthStateChange: (cb) => (listeners.push(cb), { data: {} }),
        signOut: async () => listeners.forEach((l) => l('SIGNED_OUT', null)),
      },
      from: () => chain,
    };
    const acc = createAccount({ store: st, config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => client });
    return { acc, saved, resets: () => resets };
  };
  const ok = mk(false);
  await ok.acc.start();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(await ok.acc.signOut(), true);
  assert.equal(ok.acc.get().status, 'signed-out');
  assert.ok(ok.resets() >= 1, 'local progress was reset');
  assert.ok(ok.saved.length >= 2, 'the latest progress was pushed again at sign-out');

  // Sync cannot succeed: the account keeps the session and the local data.
  const bad = mk(true);
  await bad.acc.start();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(await bad.acc.signOut(), false);
  assert.equal(bad.acc.get().status, 'signed-in');
  assert.equal(bad.resets(), 0);

  // The user chose "Sign out anyway": no push, and the device is cleared.
  assert.equal(await bad.acc.signOut({ force: true }), true);
  assert.equal(bad.acc.get().status, 'signed-out');
  assert.ok(bad.resets() >= 1, 'local progress was reset after a forced sign-out');
});

test('an unreachable CDN leaves sign-in unavailable but never throws', async () => {
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => { throw new Error('offline'); } });
  await acc.start();
  assert.equal(acc.get().status, 'signed-out');
  assert.match(acc.get().error, /unavailable/);
});

test('projectRefFromUrl: first host label, empty when unparsable', async () => {
  const { projectRefFromUrl } = await import('../src/js/auth/account.js');
  assert.equal(projectRefFromUrl('https://abcdef.supabase.co'), 'abcdef');
  assert.equal(projectRefFromUrl(''), '');
  assert.equal(projectRefFromUrl('not a url'), '');
});

test('shouldStartAuthEagerly: stored session, auth callback or GitHub install only', async () => {
  const { shouldStartAuthEagerly } = await import('../src/js/auth/account.js');
  const ref = 'abcdef';
  const go = (storageKeys, search = '') => shouldStartAuthEagerly({ storageKeys, search, projectRef: ref });
  assert.equal(go([]), false, 'a fresh visitor loads nothing');
  assert.equal(go(['lfb-progress', 'sb-other-auth-token']), false, 'another project\'s session does not count');
  assert.equal(go(['sb-abcdef-auth-token-code-verifier']), false, 'a code verifier alone is not a session');
  assert.equal(go(['lfb-progress', 'sb-abcdef-auth-token']), true);
  assert.equal(go(['sb-abcdef-auth-token.0']), true, 'chunked session storage');
  assert.equal(go([], '?code=abc123'), true, 'PKCE callback');
  assert.equal(go([], '?error_description=access_denied'), true);
  assert.equal(go([], '?installation_id=42&setup_action=install'), true);
  assert.equal(go([], '?utm_source=x'), false);
  assert.equal(shouldStartAuthEagerly({ storageKeys: ['sb--auth-token'], search: '', projectRef: '' }), false, 'no ref, no guess');
});

test('startIfNeeded: lazy visitors render signed out without loading; Sign in loads the client once', async () => {
  let loads = 0;
  const client = { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}), signInWithOAuth: async () => ({ error: null }) }, from: () => ({}) };
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => (loads++, client) });
  assert.equal(acc.get().status, 'loading');
  await acc.startIfNeeded({ keys: ['lfb-progress'], search: '' });
  assert.equal(acc.get().status, 'signed-out');
  assert.equal(loads, 0, 'nothing is downloaded for a fresh visitor');
  globalThis.location = { href: 'https://site.test/#/' };
  try {
    await Promise.all([acc.signIn('google'), acc.start()]);
  } finally {
    delete globalThis.location;
  }
  assert.equal(loads, 1, 'concurrent starts share one load');
});

test('startIfNeeded: a stored session starts the client and signs in', async () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@example.com', user_metadata: {} } } } }), onAuthStateChange: () => ({}) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), upsert: async () => ({ error: null }) }),
  };
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => client });
  await acc.startIfNeeded({ keys: ['sb-x-auth-token'], search: '' });
  assert.equal(acc.get().status, 'signed-in');
});

test('start: a failed load can be retried by the next click', async () => {
  let n = 0;
  const client = { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}) }, from: () => ({}) };
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => { if (n++ === 0) throw new Error('cdn down'); return client; } });
  await acc.start();
  assert.match(acc.get().error, /unavailable/);
  await acc.start();
  assert.equal(n, 2);
  assert.equal(acc.get().status, 'signed-out');
});

test('returnRoute: back to the saved page only when the provider returns, and only to a hash route', () => {
  assert.equal(returnRoute({ search: '?code=abc', saved: '#/quiz/daily' }), '#/quiz/daily');
  assert.equal(returnRoute({ search: '?error_description=denied', saved: '#/quiz/daily' }), '#/quiz/daily', 'a refused sign-in goes back too');
  assert.equal(returnRoute({ search: '', saved: '#/quiz/daily' }), null, 'an ordinary visit is not a return');
  assert.equal(returnRoute({ search: '?installation_id=1&setup_action=install', saved: '#/quiz/daily' }), null, 'the GitHub App install return keeps its own route');
  assert.equal(returnRoute({ search: '?code=abc', saved: null }), null);
  assert.equal(returnRoute({ search: '?code=abc', saved: 'https://evil.example/' }), null, 'never a URL, only a route');
});

test('the phone header badge: initials from the name, else the email, never empty', () => {
  assert.equal(userInitials({ name: 'Roy Carmelli', email: 'roy@example.com' }), 'RC');
  assert.equal(userInitials({ name: 'Ada', email: 'ada@example.com' }), 'A');
  assert.equal(userInitials({ name: 'jean-luc picard' }), 'JP');
  assert.equal(userInitials({ name: 'רועי כרמלי' }), 'רכ');
  assert.equal(userInitials({ name: 'Mary Ann Smith' }), 'MA');
  assert.equal(userInitials({ name: null, email: 'roy@example.com' }), 'R');
  assert.equal(userInitials({ name: '  ', email: null }), '?');
  assert.equal(userInitials(null), '?');
});

test('authConfig: the Google client for direct sign-in, public values only, overridable', () => {
  const shipped = authConfig({});
  // An OAuth client ID is public (it is in every Google sign-in address); the secret never ships.
  assert.match(shipped.googleClientId, /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
  assert.ok(shipped.googleRedirectUris.length > 0);
  for (const uri of shipped.googleRedirectUris) {
    assert.match(uri, /^(https:\/\/[^/]+|http:\/\/localhost:\d+)\/(.*\/)?$/, `${uri}: https (or localhost) and a page address ending in /`);
  }
  assert.ok(shipped.googleRedirectUris.includes('https://royc4515.github.io/leet-for-berger/'), 'the live site');
  const off = authConfig({ LFB_GOOGLE_CLIENT_ID: '', LFB_GOOGLE_REDIRECT_URIS: 'not a list' });
  assert.equal(off.googleClientId, '');
  assert.deepEqual(off.googleRedirectUris, []);
  assert.deepEqual(authConfig({ LFB_GOOGLE_REDIRECT_URIS: [' http://localhost:5199/ ', ''] }).googleRedirectUris, ['http://localhost:5199/']);
});

test('googleRedirectUri: this page without its route, only when registered', () => {
  const allowed = ['https://site.test/app/', 'http://localhost:5173/'];
  assert.equal(googleRedirectUri({ origin: 'https://site.test', pathname: '/app/' }, allowed), 'https://site.test/app/');
  assert.equal(googleRedirectUri({ origin: 'https://site.test', pathname: '/app/index.html' }, allowed), 'https://site.test/app/', 'index.html is the same page');
  assert.equal(googleRedirectUri({ origin: 'http://localhost:5173', pathname: '/' }, allowed), 'http://localhost:5173/');
  assert.equal(googleRedirectUri({ origin: 'http://localhost:5199', pathname: '/' }, allowed), '', 'another port: Google would refuse it');
  assert.equal(googleRedirectUri({ origin: 'https://site.test', pathname: '/app' }, allowed), '', 'exact match, as Google does');
  assert.equal(googleRedirectUri(undefined, allowed), '');
  assert.equal(googleRedirectUri({ origin: 'https://site.test', pathname: '/app/' }, undefined), '');
});

test('googleAuthorizeUrl: an OpenID Connect ID-token request back to this page', () => {
  const url = new URL(googleAuthorizeUrl({ clientId: 'cid', redirectUri: 'https://site.test/app/', state: 's1', nonceHash: 'h1' }));
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), 'cid');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://site.test/app/');
  assert.equal(url.searchParams.get('response_type'), 'id_token', 'a token for Supabase, never an access token');
  assert.equal(url.searchParams.get('scope'), 'openid email profile');
  assert.equal(url.searchParams.get('state'), 's1');
  assert.equal(url.searchParams.get('nonce'), 'h1', 'only the hash of the nonce leaves the device');
});

test('parseGoogleReturn: a token or an error with a state, never a route', () => {
  assert.deepEqual(parseGoogleReturn('#state=s1&id_token=a.b.c&authuser=0&prompt=none'), { state: 's1', idToken: 'a.b.c' });
  assert.deepEqual(parseGoogleReturn('#error=access_denied&state=s1'), { state: 's1', error: 'access_denied' });
  assert.equal(parseGoogleReturn('#/quiz/daily'), null);
  assert.equal(parseGoogleReturn('#/p/two-sum?state=x&id_token=y'), null, 'a route that happens to carry the words');
  assert.equal(parseGoogleReturn('#id_token=a.b.c'), null, 'no state, not ours');
  assert.equal(parseGoogleReturn('#state=s1'), null);
  assert.equal(parseGoogleReturn(''), null);
  assert.equal(parseGoogleReturn(undefined), null);
});

test('checkGoogleReturn: the state this device started, recent, else refused', () => {
  const pending = { state: 's1', nonce: 'n1', route: '#/quiz/daily', at: 1000 };
  const token = { state: 's1', idToken: 't' };
  assert.deepEqual(checkGoogleReturn({ ret: token, pending, now: 2000 }), { route: '#/quiz/daily', idToken: 't', nonce: 'n1' });
  assert.deepEqual(checkGoogleReturn({ ret: token, pending, now: 1000 + GOOGLE_MAX_AGE_MS }), { route: '#/quiz/daily', idToken: 't', nonce: 'n1' }, 'the last allowed moment');
  const refused = (r) => assert.ok(r.message && !r.idToken, JSON.stringify(r));
  refused(checkGoogleReturn({ ret: { state: 'other', idToken: 't' }, pending, now: 2000 }));
  refused(checkGoogleReturn({ ret: token, pending, now: 1001 + GOOGLE_MAX_AGE_MS }));
  refused(checkGoogleReturn({ ret: token, pending, now: 999 }));
  refused(checkGoogleReturn({ ret: token, pending: { ...pending, nonce: '' }, now: 2000 }));
  const none = checkGoogleReturn({ ret: token, pending: null, now: 2000 });
  refused(none);
  assert.equal(none.route, '#/', 'no saved route: the home page');
  assert.equal(checkGoogleReturn({ ret: token, pending: { ...pending, route: 'https://evil.example/' }, now: 2000 }).route, '#/', 'only a hash route');
  // Cancelling on Google's screen comes back quietly; a refusal says so.
  assert.deepEqual(checkGoogleReturn({ ret: { state: 's1', error: 'access_denied' }, pending, now: 2000 }), { route: '#/quiz/daily', message: null });
  assert.match(checkGoogleReturn({ ret: { state: 's1', error: 'server_error' }, pending, now: 2000 }).message, /failed/);
});

test('sha256Hex: lowercase hex, the nonce form Supabase compares', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

/** A browser stand-in for a direct Google sign-in: one page address, storage and a recorded navigation. */
function googleEnv({ origin = 'https://site.test', pathname = '/app/', hash = '#/quiz/daily' } = {}) {
  const items = new Map();
  const env = {
    location: { origin, pathname, hash },
    storage: { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, String(v)), removeItem: (k) => items.delete(k) },
    navigate: (url) => (env.went = url),
    now: () => 5000,
    went: null,
    items,
  };
  return env;
}
const googleConfig = (uris = ['https://site.test/app/']) =>
  authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k', LFB_GOOGLE_CLIENT_ID: 'cid', LFB_GOOGLE_REDIRECT_URIS: uris });

test('signIn google: straight to Google from a registered page, nonce and state kept on the device', async () => {
  let loads = 0;
  const env = googleEnv();
  const acc = createAccount({ store: store(), config: googleConfig(), env, loadClient: async () => (loads++, {}) });
  await acc.signIn('google');
  assert.equal(loads, 0, 'supabase-js is not needed to leave for Google');
  const url = new URL(env.went);
  assert.equal(url.hostname, 'accounts.google.com');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://site.test/app/');
  const pending = JSON.parse(env.items.get('lfb:google-sign-in'));
  assert.equal(pending.state, url.searchParams.get('state'));
  assert.match(pending.nonce, /^[0-9a-f]{64}$/);
  assert.equal(await sha256Hex(pending.nonce), url.searchParams.get('nonce'));
  assert.notEqual(pending.nonce, url.searchParams.get('nonce'), 'the raw nonce never goes to Google');
  assert.equal(pending.route, '#/quiz/daily');
  assert.equal(pending.at, 5000);
});

test('signIn: Supabase flow for GitHub, an unregistered page, or blocked storage', async () => {
  const run = async (provider, env, uris) => {
    const calls = [];
    const client = { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}), signInWithOAuth: async (o) => (calls.push(o.provider), { error: null }) }, from: () => ({}) };
    const acc = createAccount({ store: store(), config: googleConfig(uris), env, loadClient: async () => client });
    globalThis.location = { origin: 'https://other.test', pathname: '/', hash: '' };
    try {
      await acc.signIn(provider);
    } finally {
      delete globalThis.location;
    }
    return { calls, went: env.went };
  };
  assert.deepEqual(await run('github', googleEnv()), { calls: ['github'], went: null });
  assert.deepEqual(await run('google', googleEnv({ origin: 'https://preview.test' })), { calls: ['google'], went: null }, 'a preview address is not registered with Google');
  assert.deepEqual(await run('google', { ...googleEnv(), storage: null }), { calls: ['google'], went: null }, 'nowhere to keep the nonce');
  assert.deepEqual(await run('google', googleEnv(), []), { calls: ['google'], went: null });
});

test('a direct Google return: the client starts at once and trades the token for a session', async () => {
  const exchanged = [];
  const listeners = [];
  const user = { id: 'g1', email: 'ada@example.com', user_metadata: { full_name: 'Ada' } };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (fn) => (listeners.push(fn), {}),
      signInWithIdToken: async (o) => {
        exchanged.push(o);
        listeners.forEach((l) => l('SIGNED_IN', { user }));
        return { data: { session: { user } }, error: null };
      },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), upsert: async () => ({ error: null }) }),
  };
  const acc = createAccount({ store: store(), config: googleConfig(), env: googleEnv(), loadClient: async () => client, googleReturn: { route: '#/', idToken: 'a.b.c', nonce: 'n1' } });
  const seen = [];
  acc.subscribe((s) => seen.push(s.status));
  await acc.startIfNeeded({ keys: [], search: '' });
  assert.deepEqual(exchanged, [{ provider: 'google', token: 'a.b.c', nonce: 'n1' }]);
  assert.equal(acc.get().status, 'signed-in');
  assert.equal(acc.get().user.name, 'Ada');
  assert.ok(!seen.includes('signed-out'), `no Sign in flash before the name: ${seen}`);
});

test('a direct Google return that fails or was cancelled says so (or nothing), signed out', async () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({}), signInWithIdToken: async () => ({ data: null, error: { message: 'Invalid nonce' } }) },
    from: () => ({}),
  };
  const failed = createAccount({ store: store(), config: googleConfig(), env: googleEnv(), loadClient: async () => client, googleReturn: { route: '#/', idToken: 't', nonce: 'n' } });
  await failed.startIfNeeded({ keys: [], search: '' });
  assert.equal(failed.get().status, 'signed-out');
  assert.match(failed.get().error, /Google sign-in failed/);

  let loads = 0;
  const cancelled = createAccount({ store: store(), config: googleConfig(), env: googleEnv(), loadClient: async () => (loads++, client), googleReturn: { route: '#/', message: null } });
  await cancelled.startIfNeeded({ keys: [], search: '' });
  assert.equal(cancelled.get().status, 'signed-out');
  assert.equal(cancelled.get().error, null);
  assert.equal(loads, 0, 'nothing to finish, nothing loaded');

  const stale = createAccount({ store: store(), config: googleConfig(), env: googleEnv(), loadClient: async () => client, googleReturn: { route: '#/', message: 'Google sign-in did not finish. Try again.' } });
  assert.match(stale.get().error, /did not finish/);
});
