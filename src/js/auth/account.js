/**
 * Sign-in with Google or GitHub through Supabase Auth, and progress sync for signed-in users
 * (ADR 0006). Inert when src/js/config.js has no Supabase project: nothing is downloaded and no
 * button shows.
 */
import { authConfig } from '../config.js';
import { createSyncController } from './sync-controller.js';

// don't touch / pinned like every CDN dependency (CLAUDE.md invariant 8); upgrading is a deliberate task.
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

/**
 * @typedef {{ status: 'off'|'loading'|'signed-out'|'signed-in', user: { id: string, email: string|null, name: string|null }|null, sync: 'idle'|'syncing'|'synced'|'error', error: string|null }} AccountState
 */

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

  async function start() {
    if (!config.enabled) return;
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
    const apply = (session) => {
      const u = session?.user ?? null;
      set({
        status: u ? 'signed-in' : 'signed-out',
        user: u ? { id: u.id, email: u.email ?? null, name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null } : null,
      });
      sync.setUser(u?.id ?? null);
    };
    const { data } = await client.auth.getSession();
    apply(data.session);
    client.auth.onAuthStateChange((_event, session) => apply(session));
  }

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start,
    /** @param {'google'|'github'} provider */
    async signIn(provider) {
      if (!client) return;
      // Back to this exact page (path and hash route) after the provider's consent screen.
      const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: location.href.split('#')[0] } });
      if (error) set({ error: error.message });
    },
    async signOut() {
      if (!client) return;
      await sync?.flush();
      await client.auth.signOut();
    },
  };
}

async function defaultClient(url, key) {
  const { createClient } = await import(SUPABASE_JS);
  // PKCE: the provider returns a one-time code, never a token in the URL.
  return createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });
}
