import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress } from '../src/js/state/sync.js';
import { emptyState, recordSubmission, markRevealed, HISTORY_LIMIT } from '../src/js/state/progress.js';

const at = (iso) => new Date(iso);
const detail = (verdict, code) => ({ language: 'python', verdict, passed: verdict === 'Accepted' ? 15 : 2, total: 15, code });

function laptop() {
  let s = emptyState();
  s = recordSubmission(s, { problemId: 'a', accepted: false, now: at('2026-11-10T10:00:00Z'), detail: detail('Wrong Answer', 'a1') });
  s = recordSubmission(s, { problemId: 'a', accepted: true, now: at('2026-11-10T10:05:00Z'), detail: detail('Accepted', 'a2') });
  return s;
}
function phone() {
  let s = emptyState();
  s = recordSubmission(s, { problemId: 'a', accepted: false, now: at('2026-11-12T08:00:00Z'), detail: detail('Wrong Answer', 'a3') });
  s = recordSubmission(s, { problemId: 'b', accepted: true, now: at('2026-11-12T08:10:00Z'), detail: detail('Accepted', 'b1') });
  s = markRevealed(s, 'b');
  return s;
}

test('merge keeps the best of both devices', () => {
  const m = mergeProgress(laptop(), phone());
  assert.equal(m.problems.a.status, 'solved', 'solved on one device is solved');
  assert.equal(m.problems.b.revealed, true, 'assisted anywhere is assisted');
  assert.deepEqual(m.problems.a.history.map((h) => h.code), ['a3', 'a2', 'a1'], 'histories interleave newest first');
  assert.deepEqual(m.activeDays, ['2026-11-10', '2026-11-12']);
  assert.equal(m.problems.a.submissions, 3, 'two submits on the laptop and one on the phone');
  assert.equal(m.totals.submissions, 4);
  assert.equal(m.totals.accepted, 2);
});

test('merge is idempotent and order-independent for progress', () => {
  const a = laptop();
  const b = phone();
  assert.deepEqual(mergeProgress(a, a), a);
  const ab = mergeProgress(a, b);
  const ba = mergeProgress(b, a);
  assert.deepEqual({ ...ab, drafts: null }, { ...ba, drafts: null });
  assert.deepEqual(mergeProgress(ab, b), ab, 'merging again changes nothing');
});

test('merged history is deduplicated and capped', () => {
  let s = emptyState();
  for (let i = 0; i < HISTORY_LIMIT; i++) s = recordSubmission(s, { problemId: 'p', accepted: false, now: at(`2026-11-01T00:0${i}:00Z`), detail: detail('Wrong Answer', String(i)) });
  let t = emptyState();
  t = recordSubmission(t, { problemId: 'p', accepted: true, now: at('2026-11-02T00:00:00Z'), detail: detail('Accepted', 'new') });
  const m = mergeProgress(s, t);
  assert.equal(m.problems.p.history.length, HISTORY_LIMIT);
  assert.equal(m.problems.p.history[0].code, 'new');
  assert.equal(mergeProgress(s, s).problems.p.history.length, HISTORY_LIMIT);
});

test('a missing or foreign remote never loses local progress', () => {
  const a = laptop();
  assert.deepEqual(mergeProgress(a, null), a);
  assert.deepEqual(mergeProgress(a, { version: 99, problems: { z: {} } }), a);
  assert.deepEqual(mergeProgress(a, emptyState()), a);
});
