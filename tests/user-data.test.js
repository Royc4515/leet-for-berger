import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { USER_KEYS, USER_KEY_PREFIXES, isUserKey, clearUserData } from '../src/js/state/user-data.js';
import { createStore, emptyState, recordSubmission } from '../src/js/state/progress.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  };
}

test('clearUserData removes progress, last sessions and every draft, and nothing else', () => {
  const st = fakeStorage({
    'lfb:progress:v1': '{}',
    'lfb:last-sessions:v1': '{"interview":null,"battle":null}',
    'lfb:draft:v1:two-sum:js': 'a',
    'lfb:draft:v1:two-sum:python': 'b',
    'lfb:draft:v1:other:go': 'c',
    'lfb:lang': 'python',
    'lfb:split:x': '0.4',
    unrelated: '1',
  });
  const removed = clearUserData(st);
  assert.equal(removed.length, 5);
  assert.deepEqual(st.keys().sort(), ['lfb:lang', 'lfb:split:x', 'unrelated']);
});

test('clearUserData tolerates a missing or throwing storage', () => {
  assert.deepEqual(clearUserData(null), []);
  assert.deepEqual(
    clearUserData({
      get length() {
        throw new Error('blocked');
      },
    }),
    [],
  );
});

test('store.reset returns to an empty guest state and notifies subscribers', () => {
  const store = createStore(recordSubmission(emptyState(), { problemId: 'p', accepted: true, now: new Date('2026-01-01T00:00:00Z') }));
  let seen = null;
  store.subscribe((s) => (seen = s));
  store.reset();
  assert.deepEqual(store.get(), emptyState());
  assert.deepEqual(seen, emptyState());
});

// Guard against a forgotten store: every localStorage key literal in src/js must be either listed
// as user data or named here as a device preference.
test('every persisted lfb: key is user data or a known device preference', () => {
  // lfb:tours:v1 records which guided tours this device has shown (state/tours.js).
  // lfb:quiz-lang is the language the quiz is shown in; lfb:theme and lfb:code-theme are the site and
  // code themes (theme-boot.js, ui/theme.js).
  // lfb:map-view (Map or List) is a layout choice; lfb:seen-solved is a sessionStorage number the
  // Problems page ticks up from, gone when the tab closes and reset to the guest's 0 after sign-out.
  // lfb:return-to is the route a sign-in started from, read once when the provider sends the user back.
  const DEVICE_PREFS = ['lfb:lang', 'lfb:theme', 'lfb:code-theme', 'lfb:split:x', 'lfb:split:y', 'lfb:about-open', 'lfb:map-view', 'lfb:seen-solved', 'lfb:tours:v1', 'lfb:quiz-lang', 'lfb:return-to'];
  const files = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (f === 'problems') continue; // problem content, no storage
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  };
  walk('src/js');
  const found = new Set();
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/['"`](lfb:[\w:.-]*)/g)) found.add(m[1]);
  assert.ok(found.size >= 4, 'scan found the known keys');
  for (const k of found) {
    const ok = DEVICE_PREFS.includes(k) || USER_KEYS.includes(k) || USER_KEY_PREFIXES.some((p) => k.startsWith(p) || p.startsWith(k));
    assert.ok(ok, `${k} is persisted but not in state/user-data.js (add it there, or to DEVICE_PREFS if it is not about the user)`);
  }
  assert.ok(isUserKey('lfb:progress:v1') && isUserKey('lfb:draft:v1:a:b') && !isUserKey('lfb:lang'));
});
