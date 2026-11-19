/**
 * Keeps a signed-in user's progress in step with the server (ADR 0006). The backend is injected
 * ({ load, save }), so this runs in Node tests with a fake and in the browser with Supabase.
 *
 * On sign-in: load the server copy, merge it into local progress, save the merge back.
 * On every local change: debounce, then read-merge-write, so a change made on another device in
 * the meantime is merged instead of overwritten.
 */
import { mergeProgress } from '../state/sync.js';

/**
 * @param {{
 *   store: { get: () => any, update: (fn: (s: any) => any) => void, subscribe: (fn: () => void) => () => void },
 *   backend: { load: (userId: string) => Promise<any|null>, save: (userId: string, state: any) => Promise<void> },
 *   debounceMs?: number,
 *   timers?: { set: (fn: () => void, ms: number) => any, clear: (id: any) => void },
 *   onStatus?: (status: 'syncing'|'synced'|'error', detail?: string) => void,
 * }} opts
 */
// don't touch / wrapped: browsers throw "Illegal invocation" when setTimeout is called as a method
// of another object (timers.set(...)); Node does not, so only the e2e test catches a regression.
const DEFAULT_TIMERS = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };

export function createSyncController({ store, backend, debounceMs = 2000, timers = DEFAULT_TIMERS, onStatus = () => {} }) {
  let userId = null;
  let timer = null;
  let applying = false;
  let chain = Promise.resolve();

  /** Runs one sync at a time, so two quick changes never write out of order. */
  const enqueue = (job) => (chain = chain.then(job, job));

  async function syncNow() {
    const id = userId;
    if (!id) return false;
    onStatus('syncing');
    try {
      const remote = await backend.load(id);
      if (id !== userId) return false; // signed out (or switched user) while loading
      const merged = mergeProgress(store.get(), remote);
      if (merged !== store.get()) {
        // Our own write: do not schedule another sync for it.
        applying = true;
        try {
          store.update(() => merged);
        } finally {
          applying = false;
        }
      }
      await backend.save(id, stripLocalOnly(merged));
      onStatus('synced');
      return true;
    } catch (err) {
      onStatus('error', err?.message ?? String(err));
      return false;
    }
  }

  const unsubscribe = store.subscribe(() => {
    if (!userId || applying) return;
    if (timer) timers.clear(timer);
    timer = timers.set(() => {
      timer = null;
      enqueue(syncNow);
    }, debounceMs);
  });

  return {
    /** @param {string|null} id the signed-in user's id, or null on sign-out */
    setUser(id) {
      if (id === userId) return chain;
      userId = id;
      if (timer) timers.clear(timer);
      timer = null;
      return id ? enqueue(syncNow) : chain;
    },
    /** Waits for pending work (tests, and before sign-out). */
    flush() {
      if (timer) {
        timers.clear(timer);
        timer = null;
        enqueue(syncNow);
      }
      return chain;
    },
    /**
     * Cancels any pending debounce and syncs right now. Sign-out uses it so the latest local
     * progress is on the server before the device copy is cleared.
     * @returns {Promise<boolean>} true when the server holds the merged state
     */
    pushNow() {
      if (timer) {
        timers.clear(timer);
        timer = null;
      }
      return enqueue(syncNow);
    },
    dispose() {
      unsubscribe();
      if (timer) timers.clear(timer);
      userId = null;
    },
  };
}

/** Drafts are unsaved editor text on one device; they never leave it. */
export function stripLocalOnly(state) {
  const { drafts, ...rest } = state;
  return rest;
}
