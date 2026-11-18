import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authConfig } from '../src/js/config.js';
import { createAccount } from '../src/js/auth/account.js';
import { emptyState } from '../src/js/state/progress.js';

const store = () => {
  let s = emptyState();
  const ls = new Set();
  return { get: () => s, update: (f) => { s = f(s); ls.forEach((l) => l(s)); }, subscribe: (l) => (ls.add(l), () => ls.delete(l)) };
};

test('authConfig: off by default, on with both values, overrides win', () => {
  assert.equal(authConfig({}).enabled, false);
  const c = authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co/', LFB_SUPABASE_ANON_KEY: 'k' });
  assert.equal(c.enabled, true);
  assert.equal(c.supabaseUrl, 'https://x.supabase.co');
  assert.equal(authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co' }).enabled, false, 'a URL without a key is off');
});

test('not configured: no client is ever loaded', async () => {
  let loaded = false;
  const acc = createAccount({ store: store(), config: authConfig({}), loadClient: async () => (loaded = true) });
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

test('an unreachable CDN leaves sign-in unavailable but never throws', async () => {
  const acc = createAccount({ store: store(), config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => { throw new Error('offline'); } });
  await acc.start();
  assert.equal(acc.get().status, 'signed-out');
  assert.match(acc.get().error, /unavailable/);
});
