import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSyncController, stripLocalOnly } from '../src/js/auth/sync-controller.js';
import { emptyState, recordSubmission } from '../src/js/state/progress.js';

function memoryStore(initial = emptyState()) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    update(fn) {
      state = fn(state);
      listeners.forEach((l) => l(state));
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
function fakeBackend(rows = {}) {
  const calls = [];
  return {
    rows,
    calls,
    async load(id) {
      calls.push(['load', id]);
      return rows[id] ?? null;
    },
    async save(id, state) {
      calls.push(['save', id]);
      rows[id] = JSON.parse(JSON.stringify(state));
    },
  };
}
const manualTimers = () => {
  const pending = new Map();
  let n = 0;
  return { set: (fn) => (pending.set(++n, fn), n), clear: (id) => pending.delete(id), fire: () => {
      const fns = [...pending.values()];
      pending.clear();
      fns.forEach((f) => f());
    },
    pending,
  };
};

test('sign-in merges server progress into local and saves the merge back, without drafts', async () => {
  const local = recordSubmission({ ...emptyState(), drafts: { 'a:python': 'x' } }, { problemId: 'a', accepted: true });
  const server = recordSubmission(emptyState(), { problemId: 'b', accepted: false });
  const store = memoryStore(local);
  const backend = fakeBackend({ u1: server });
  const sync = createSyncController({ store, backend });
  await sync.setUser('u1');
  assert.deepEqual(Object.keys(store.get().problems).sort(), ['a', 'b']);
  assert.deepEqual(Object.keys(backend.rows.u1.problems).sort(), ['a', 'b']);
  assert.equal('drafts' in backend.rows.u1, false, 'drafts never leave the device');
  assert.equal(store.get().drafts['a:python'], 'x');
  sync.dispose();
});

test('local changes are debounced into one read-merge-write; nothing syncs while signed out', async () => {
  const store = memoryStore();
  const backend = fakeBackend();
  const timers = manualTimers();
  const sync = createSyncController({ store, backend, timers });
  store.update((s) => recordSubmission(s, { problemId: 'a', accepted: false }));
  assert.equal(timers.pending.size, 0, 'signed out: nothing scheduled');
  await sync.setUser('u1');
  const saves = () => backend.calls.filter(([k]) => k === 'save').length;
  const before = saves();
  store.update((s) => recordSubmission(s, { problemId: 'a', accepted: false }));
  store.update((s) => recordSubmission(s, { problemId: 'a', accepted: true }));
  assert.equal(timers.pending.size, 1, 'two quick changes, one pending sync');
  timers.fire();
  await sync.flush();
  assert.equal(saves(), before + 1);
  assert.equal(backend.rows.u1.problems.a.status, 'solved');
  sync.setUser(null);
  store.update((s) => recordSubmission(s, { problemId: 'z', accepted: true }));
  assert.equal(timers.pending.size, 0, 'signed out again: nothing scheduled');
  sync.dispose();
});

test('a change made on another device in the meantime is merged, not overwritten', async () => {
  const store = memoryStore();
  const backend = fakeBackend();
  const timers = manualTimers();
  const sync = createSyncController({ store, backend, timers });
  await sync.setUser('u1');
  // Another device writes problem b.
  backend.rows.u1 = recordSubmission(backend.rows.u1, { problemId: 'b', accepted: true });
  store.update((s) => recordSubmission(s, { problemId: 'a', accepted: true }));
  timers.fire();
  await sync.flush();
  assert.deepEqual(Object.keys(backend.rows.u1.problems).sort(), ['a', 'b']);
  assert.deepEqual(Object.keys(store.get().problems).sort(), ['a', 'b']);
  sync.dispose();
});

test('a failing backend reports an error and keeps local progress', async () => {
  const store = memoryStore(recordSubmission(emptyState(), { problemId: 'a', accepted: true }));
  const statuses = [];
  const sync = createSyncController({ store, backend: { load: async () => { throw new Error('offline'); }, save: async () => {} }, onStatus: (s, d) => statuses.push([s, d]) });
  await sync.setUser('u1');
  assert.deepEqual(statuses.at(-1), ['error', 'offline']);
  assert.equal(store.get().problems.a.status, 'solved');
  assert.deepEqual(stripLocalOnly({ drafts: {}, a: 1 }), { a: 1 });
  sync.dispose();
});
