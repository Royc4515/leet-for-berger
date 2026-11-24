import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authConfig } from '../src/js/config.js';
import { createAccount, returnRoute, userInitials } from '../src/js/auth/account.js';
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
