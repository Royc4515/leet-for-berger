import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, recordSubmission, HISTORY_LIMIT, HISTORY_CODE_LIMIT } from '../src/js/state/progress.js';

const detail = (verdict, code = 'x') => ({ language: 'python', verdict, passed: verdict === 'Accepted' ? 15 : 3, total: 15, code });

test('history keeps submissions newest first with time, language, verdict and code', () => {
  let s = emptyState();
  s = recordSubmission(s, { problemId: 'p', accepted: false, now: new Date('2026-11-18T10:00:00Z'), detail: detail('Wrong Answer', 'a') });
  s = recordSubmission(s, { problemId: 'p', accepted: true, now: new Date('2026-11-18T10:05:00Z'), detail: detail('Accepted', 'b') });
  const h = s.problems.p.history;
  assert.equal(h.length, 2);
  assert.deepEqual(h[0], { at: '2026-11-18T10:05:00.000Z', language: 'python', verdict: 'Accepted', passed: 15, total: 15, code: 'b' });
  assert.equal(h[1].verdict, 'Wrong Answer');
  assert.equal(s.problems.p.status, 'solved');
});

test('history is capped and oversized code is dropped, not the record', () => {
  let s = emptyState();
  for (let i = 0; i < HISTORY_LIMIT + 5; i++) s = recordSubmission(s, { problemId: 'p', accepted: false, detail: detail('Wrong Answer', String(i)) });
  assert.equal(s.problems.p.history.length, HISTORY_LIMIT);
  assert.equal(s.problems.p.history[0].code, String(HISTORY_LIMIT + 4));
  s = recordSubmission(s, { problemId: 'q', accepted: false, detail: detail('Wrong Answer', 'y'.repeat(HISTORY_CODE_LIMIT + 1)) });
  assert.equal(s.problems.q.history[0].code, null);
  assert.equal(s.problems.q.history[0].verdict, 'Wrong Answer');
});

test('without detail no history is written (old callers keep working)', () => {
  const s = recordSubmission(emptyState(), { problemId: 'p', accepted: true });
  assert.equal(s.problems.p.history, undefined);
});
