import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveDraft, loadDraft, clearDraft, listDraftEdits, DRAFT_PREFIX, DRAFT_AT_PREFIX } from '../src/js/state/drafts.js';

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

const t1 = new Date('2026-11-20T10:00:00Z');
const t2 = new Date('2026-11-22T10:00:00Z');

test('saveDraft keeps the code and when it changed', () => {
  const st = fakeStorage();
  saveDraft('two-sum', 'python', 'x = 1', { starter: 'pass', now: t1, storage: st });
  assert.equal(loadDraft('two-sum', 'python', st), 'x = 1');
  assert.equal(st.getItem(`${DRAFT_AT_PREFIX}two-sum:python`), t1.toISOString());
});

test('saving the same code again (closing the editor) does not move the edit time', () => {
  const st = fakeStorage();
  saveDraft('two-sum', 'python', 'x = 1', { now: t1, storage: st });
  saveDraft('two-sum', 'python', 'x = 1', { now: t2, storage: st });
  assert.equal(st.getItem(`${DRAFT_AT_PREFIX}two-sum:python`), t1.toISOString());
  saveDraft('two-sum', 'python', 'x = 2', { now: t2, storage: st });
  assert.equal(st.getItem(`${DRAFT_AT_PREFIX}two-sum:python`), t2.toISOString());
});

test('code equal to the starter is no draft: opening and leaving a problem stores nothing', () => {
  const st = fakeStorage();
  saveDraft('two-sum', 'js', 'function f() {}', { starter: 'function f() {}', now: t1, storage: st });
  assert.deepEqual(st.keys(), []);
  // Reset to the starter after real work removes the draft and its time.
  saveDraft('two-sum', 'js', 'return 1', { starter: 'function f() {}', now: t1, storage: st });
  saveDraft('two-sum', 'js', 'function f() {}', { starter: 'function f() {}', now: t2, storage: st });
  assert.deepEqual(st.keys(), []);
});

test('clearDraft removes the draft and its edit time', () => {
  const st = fakeStorage();
  saveDraft('two-sum', 'go', 'package main', { now: t1, storage: st });
  clearDraft('two-sum', 'go', st);
  assert.deepEqual(st.keys(), []);
});

test('listDraftEdits reports drafts with a time, and skips orphans, old drafts and bad times', () => {
  const st = fakeStorage({
    [`${DRAFT_PREFIX}pair-sum-target:python`]: 'a',
    [`${DRAFT_AT_PREFIX}pair-sum-target:python`]: t1.toISOString(),
    [`${DRAFT_PREFIX}old-draft:js`]: 'from before edit times',
    [`${DRAFT_AT_PREFIX}gone:js`]: t1.toISOString(),
    [`${DRAFT_PREFIX}bad-time:go`]: 'c',
    [`${DRAFT_AT_PREFIX}bad-time:go`]: 'not a date',
    [`${DRAFT_AT_PREFIX}nocolon`]: t1.toISOString(),
    'lfb:lang': 'python',
  });
  assert.deepEqual(listDraftEdits(st), [{ problemId: 'pair-sum-target', lang: 'python', at: t1.toISOString() }]);
});

test('drafts tolerate a throwing storage', () => {
  const broken = {
    get length() {
      throw new Error('blocked');
    },
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(loadDraft('a', 'js', broken), null);
  assert.doesNotThrow(() => saveDraft('a', 'js', 'x', { storage: broken }));
  assert.doesNotThrow(() => clearDraft('a', 'js', broken));
  assert.deepEqual(listDraftEdits(broken), []);
});
