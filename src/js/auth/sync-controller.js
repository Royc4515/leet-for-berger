/**
 * Keeps a signed-in user's progress in step with the server (ADR 0006). The backend is injected
 * ({ load, save }), so this runs in Node tests with a fake and in the browser with Supabase.
 *
 * On sign-in: load the server copy, merge it into local progress, save the merge back.
 * On every local change: debounce, then read-merge-write, so a change made on another device in
 * the meantime is merged instead of overwritten.
 *
 * `extras` ride in the same server record under their own key (the quiz: owner's request), each
 * kept outside the store by its own module and merged by its own rule. Their reads and writes are
 * async, so the module behind them can load on first sync instead of at page start (ADR 0008).
 */
import { mergeProgress } from '../state/sync.js';

/**
 * @param {{
 *   store: { get: () => any, update: (fn: (s: any) => any) => void, subscribe: (fn: () => void) => () => void },
 *   backend: { load: (userId: string) => Promise<any|null>, save: (userId: string, state: any) => Promise<void> },
 *   debounceMs?: number,
 *   timers?: { set: (fn: () => void, ms: number) => any, clear: (id: any) => void },
 *   onStatus?: (status: 'syncing'|'synced'|'error', detail?: string) => void,
 *   extras?: { key: string, read: () => Promise<any>, merge: (local: any, remote: any) => Promise<any>, write: (value: any) => Promise<void> }[],
 * }} opts
 */
// don't touch / wrapped: browsers throw "Illegal invocation" when setTimeout is called as a method
// of another object (timers.set(...)); Node does not, so only the e2e test catches a regression.
const DEFAULT_TIMERS = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };

export function createSyncController({ store, backend, debounceMs = 2000, timers = DEFAULT_TIMERS, onStatus = () => {}, extras = [] }) {
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
      // Keys this version does not know (a part a newer version syncs) pass through untouched,
      // so an older open tab never wipes them from the account.
      const payload = { ...carryUnknown(remote, merged, extras), ...stripLocalOnly(merged) };
      for (const x of extras) {
        const local = await x.read();
        const value = await x.merge(local, remote?.[x.key] ?? null);
        if (JSON.stringify(value) !== JSON.stringify(local)) await x.write(value);
        payload[x.key] = value;
      }
      if (id !== userId) return false;
      await backend.save(id, payload);
      onStatus('synced');
      return true;
    } catch (err) {
      onStatus('error', err?.message ?? String(err));
      return false;
    }
  }

  /** A local change: debounce, then one read-merge-write. */
  const schedule = () => {
    if (!userId || applying) return;
    if (timer) timers.clear(timer);
    timer = timers.set(() => {
      timer = null;
      enqueue(syncNow);
    }, debounceMs);
  };
  const unsubscribe = store.subscribe(schedule);

  return {
    /** An extra changed on this device (the quiz saved a session): sync it like a store change. */
    touch: schedule,
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

/**
 * The server record's top-level keys that neither the store's state nor an extra owns.
 * @param {any} remote
 * @param {any} merged
 * @param {{ key: string }[]} extras
 * @returns {Record<string, any>}
 */
function carryUnknown(remote, merged, extras) {
  if (!remote || typeof remote !== 'object') return {};
  const owned = new Set([...Object.keys(merged), ...extras.map((x) => x.key)]);
  return Object.fromEntries(Object.entries(remote).filter(([k]) => !owned.has(k)));
}

/** Drafts are unsaved editor text on one device; they never leave it. */
export function stripLocalOnly(state) {
  const { drafts, ...rest } = state;
  return rest;
}
