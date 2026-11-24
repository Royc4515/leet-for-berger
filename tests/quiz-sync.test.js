// Quiz progress in the account (owner's request): it merges across devices (state/quiz-progress.js
// mergeQuizProgress), rides in the same server record as problem progress as a sync "extra"
// (auth/sync-controller.js), and a local save schedules a sync while the sync's own writes do not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyQuizProgress, mergeQuizProgress, saveQuizProgress, QUIZ_SAVED_EVENT } from '../src/js/state/quiz-progress.js';
import { createSyncController } from '../src/js/auth/sync-controller.js';
import { emptyState, recordSubmission } from '../src/js/state/progress.js';

const q = (over = {}) => ({ ...emptyQuizProgress(), ...over });

test('merge: questions take the larger counts, and "last right" follows the copy that saw more', () => {
  const local = q({ questions: { a: { seen: 3, correct: 1, last: false }, b: { seen: 1, correct: 1, last: true } } });
  const remote = q({ questions: { a: { seen: 2, correct: 2, last: true }, c: { seen: 1, correct: 0, last: false } } });
  const m = mergeQuizProgress(local, remote);
  assert.deepEqual(m.questions.a, { seen: 3, correct: 2, last: false });
  assert.deepEqual(m.questions.b, local.questions.b);
  assert.deepEqual(m.questions.c, remote.questions.c);
  // A tie on seen keeps either side's yes, so the result does not depend on which is local.
  const tie = mergeQuizProgress(q({ questions: { a: { seen: 2, correct: 1, last: false } } }), q({ questions: { a: { seen: 2, correct: 1, last: true } } }));
  assert.equal(tie.questions.a.last, true);
});

test('merge: days from both, the account copy wins a day both played; the better best per mode', () => {
  const local = q({ daily: { '2026-11-23': { correct: 3, total: 5 }, '2026-11-24': { correct: 5, total: 5 } }, best: { sprint: 7, practice: 9 } });
  const remote = q({ daily: { '2026-11-22': { correct: 4, total: 5 }, '2026-11-24': { correct: 2, total: 5, results: [true, true, false, false, false] } }, best: { sprint: 8, survival: 12 } });
  const m = mergeQuizProgress(local, remote);
  assert.deepEqual(Object.keys(m.daily).sort(), ['2026-11-22', '2026-11-23', '2026-11-24']);
  assert.deepEqual(m.daily['2026-11-24'], remote.daily['2026-11-24'], 'the play that reached the account first counts, as on the leaderboard');
  assert.deepEqual(m.best, { sprint: 8, practice: 9, survival: 12 });
});

test('merge: idempotent, no account copy keeps local, and junk from the server is dropped', () => {
  const local = q({ questions: { a: { seen: 1, correct: 1, last: true } }, daily: { '2026-11-24': { correct: 4, total: 5 } }, best: { practice: 4 } });
  assert.deepEqual(mergeQuizProgress(local, local), local);
  assert.deepEqual(mergeQuizProgress(local, null), local);
  const m = mergeQuizProgress(local, { questions: { x: 'nope', y: { seen: 'a' } }, daily: { 'not-a-day': { correct: 1, total: 1 } }, best: { sprint: 'fast' } });
  assert.deepEqual(m, local);
});

test('saving tells the page, and says whether it was a play or the sync writing a merge', () => {
  const events = [];
  const store = new Map();
  const saved = { dispatchEvent: globalThis.dispatchEvent, localStorage: globalThis.localStorage };
  globalThis.dispatchEvent = (e) => events.push([e.type, e.detail.source]);
  globalThis.localStorage = { setItem: (k, v) => store.set(k, v), getItem: (k) => store.get(k) ?? null };
  try {
    saveQuizProgress(emptyQuizProgress());
    saveQuizProgress(emptyQuizProgress(), { source: 'sync' });
  } finally {
    globalThis.dispatchEvent = saved.dispatchEvent;
    globalThis.localStorage = saved.localStorage;
  }
  assert.deepEqual(events, [[QUIZ_SAVED_EVENT, 'local'], [QUIZ_SAVED_EVENT, 'sync']]);
});

/** A sync extra backed by a plain variable, the way auth/account.js backs the quiz with localStorage. */
function quizExtra(initial) {
  const box = { value: initial, writes: 0 };
  return {
    box,
    extra: {
      key: 'quiz',
      read: async () => box.value,
      merge: async (l, r) => mergeQuizProgress(l, r),
      write: async (v) => {
        box.value = v;
        box.writes++;
      },
    },
  };
}
const memoryStore = (initial = emptyState()) => {
  let state = initial;
  const ls = new Set();
  return { get: () => state, update: (f) => { state = f(state); ls.forEach((l) => l(state)); }, subscribe: (l) => (ls.add(l), () => ls.delete(l)) };
};
const backendWith = (rows) => ({ rows, load: async (id) => rows[id] ?? null, save: async (id, s) => { rows[id] = JSON.parse(JSON.stringify(s)); } });

test('sign-in on a new device: the account\'s quiz comes down, this device\'s goes up, in one record', async () => {
  const server = { ...recordSubmission(emptyState(), { problemId: 'a', accepted: true }), quiz: q({ daily: { '2026-11-23': { correct: 5, total: 5 } }, best: { sprint: 9 } }) };
  const backend = backendWith({ u1: server });
  const { box, extra } = quizExtra(q({ daily: { '2026-11-24': { correct: 3, total: 5 } } }));
  const sync = createSyncController({ store: memoryStore(), backend, extras: [extra] });
  await sync.setUser('u1');
  assert.deepEqual(Object.keys(box.value.daily).sort(), ['2026-11-23', '2026-11-24'], 'this device now has the account\'s days');
  assert.equal(box.value.best.sprint, 9);
  assert.deepEqual(Object.keys(backend.rows.u1.quiz.daily).sort(), ['2026-11-23', '2026-11-24'], 'the account now has this device\'s day');
  assert.ok(backend.rows.u1.problems.a, 'problem progress still in the same record');
  sync.dispose();
});

test('the extra is written only when the merge changed it, and touch() schedules a sync like a store change', async () => {
  const backend = backendWith({});
  const { box, extra } = quizExtra(q({ best: { practice: 3 } }));
  const pending = [];
  const timers = { set: (fn) => (pending.push(fn), pending.length), clear: () => {} };
  const sync = createSyncController({ store: memoryStore(), backend, extras: [extra], timers });
  await sync.setUser('u1');
  assert.equal(box.writes, 0, 'nothing new from the account: no write back');
  assert.equal(backend.rows.u1.quiz.best.practice, 3);
  box.value = q({ best: { practice: 6 } });
  sync.touch();
  assert.equal(pending.length, 1, 'a quiz save schedules one sync');
  pending.shift()();
  await sync.flush();
  assert.equal(backend.rows.u1.quiz.best.practice, 6);
  sync.setUser(null);
  sync.touch();
  assert.equal(pending.length, 0, 'signed out: a quiz save schedules nothing');
  sync.dispose();
});

test('a part this version does not sync is carried through, so an older tab never wipes it', async () => {
  const server = { ...emptyState(), quiz: q({ best: { sprint: 5 } }), futurePart: { kept: true } };
  const backend = backendWith({ u1: server });
  const store = memoryStore();
  // No quiz extra here: this "older version" does not know the quiz either.
  const sync = createSyncController({ store, backend });
  await sync.setUser('u1');
  assert.deepEqual(backend.rows.u1.quiz, server.quiz);
  assert.deepEqual(backend.rows.u1.futurePart, { kept: true });
  sync.dispose();
});
