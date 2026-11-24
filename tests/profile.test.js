// The profile page's numbers and the nickname rule it shares with the leaderboard (data/profile.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileNumbers, normalizeNickname } from '../src/js/data/profile.js';
import { emptyState } from '../src/js/state/progress.js';
import { emptyQuizProgress } from '../src/js/state/quiz-progress.js';

test('a new visitor: zeros, and no accuracy before a submit', () => {
  const n = profileNumbers({ progress: emptyState(), quiz: emptyQuizProgress(), now: new Date('2026-11-24T12:00:00') });
  assert.deepEqual(n, { solved: 0, streak: 0, accuracy: null, submissions: 0, quizStreak: 0, quizDays: 0, quizAnswered: 0 });
});

test('progress and the quiz are counted together', () => {
  const progress = { ...emptyState(), problems: { a: { status: 'solved' }, b: { status: 'attempted' } }, activeDays: ['2026-11-24', '2026-11-23'], totals: { submissions: 4, accepted: 3 } };
  const quiz = { ...emptyQuizProgress(), questions: { q1: { seen: 1, correct: 1, last: true }, q2: { seen: 2, correct: 0, last: false } }, daily: { '2026-11-24': { correct: 4, total: 5 }, '2026-11-23': { correct: 3, total: 5 }, '2026-11-20': { correct: 5, total: 5 } } };
  const n = profileNumbers({ progress, quiz, now: new Date('2026-11-24T12:00:00') });
  assert.equal(n.solved, 1);
  assert.equal(n.streak, 2);
  assert.equal(n.accuracy, 75);
  assert.equal(n.quizStreak, 2);
  assert.equal(n.quizDays, 3);
  assert.equal(n.quizAnswered, 2);
});

test('a nickname: spaces collapsed, 2 to 24 characters, empty means the account name', () => {
  assert.deepEqual(normalizeNickname('  Ada   Lovelace '), { name: 'Ada Lovelace', ok: true });
  assert.deepEqual(normalizeNickname(''), { name: '', ok: true });
  assert.deepEqual(normalizeNickname('   '), { name: '', ok: true });
  assert.equal(normalizeNickname('x').ok, false);
  assert.equal(normalizeNickname('a'.repeat(24)).ok, true);
  assert.equal(normalizeNickname('a'.repeat(25)).ok, false);
  // Characters, not UTF-16 units: an emoji counts once.
  assert.equal(normalizeNickname('🔥🔥').ok, true);
  assert.equal(normalizeNickname('רועי').ok, true);
});
