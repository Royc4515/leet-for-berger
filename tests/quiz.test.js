// Quiz mode: session rules (modes/quiz.js), progress reducers (state/quiz-progress.js) and the
// shipped question bank (data/quiz-bank.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ_TOPICS, QUIZ_QUESTIONS } from '../src/js/data/quiz-bank.js';
import {
  QUIZ_MODES,
  DAILY_QUIZ_SIZE,
  dailyQuizNumber,
  shuffleOptions,
  pickQuestions,
  startQuiz,
  startDailyQuiz,
  dailyQuizIds,
  currentQuestion,
  answerQuestion,
  showNext,
  endQuiz,
  isOver,
  timeLeft,
  quizSummary,
  validateBank,
} from '../src/js/modes/quiz.js';
import { emptyQuizProgress, normalizeQuizProgress, recordSession, masteredIds, topicProgress, dailyQuizStreak } from '../src/js/state/quiz-progress.js';
import { mulberry32 } from '../src/js/engine/rng.js';

const TOPICS = [
  { id: 'a', title: 'Alpha', blurb: 'A.' },
  { id: 'b', title: 'Beta', blurb: 'B.' },
];
const q = (id, topic, answer = 0) => ({ id, topic, level: 'easy', q: `Question ${id}?`, options: ['w', 'x', 'y', 'z'], answer, why: 'Because.' });
const BANK = [...Array.from({ length: 8 }, (_, i) => q(`a-${i}`, 'a', i % 4)), ...Array.from({ length: 8 }, (_, i) => q(`b-${i}`, 'b', (i + 1) % 4))];

/** Answer every question of a session, right when `right(i)` says so. */
function playAll(s, right, t0 = 0) {
  let t = t0;
  while (!isOver(s, t)) {
    const cur = currentQuestion(s);
    const pick = right(s.answers.length) ? cur.answer : (cur.answer + 1) % cur.options.length;
    t += 1000;
    s = answerQuestion(s, pick, t);
    s = showNext(s, t);
  }
  return s;
}

/* ---------- the shipped bank ---------- */

test('the shipped bank passes validation', () => {
  assert.deepEqual(validateBank({ topics: QUIZ_TOPICS, questions: QUIZ_QUESTIONS }), []);
});

test('the bank covers every topic with enough questions for a session', () => {
  assert.ok(QUIZ_TOPICS.length >= 12, `${QUIZ_TOPICS.length} topics`);
  for (const t of QUIZ_TOPICS) {
    const n = QUIZ_QUESTIONS.filter((x) => x.topic === t.id).length;
    assert.ok(n >= 8, `${t.id} has ${n} questions, at least 8 so a single-topic practice is a full round`);
  }
});

test('correct answers are spread over positions as authored', () => {
  // Sessions shuffle anyway; this keeps the authored file honest for review.
  const counts = [0, 0, 0, 0];
  for (const x of QUIZ_QUESTIONS) if (x.options.length === 4) counts[x.answer]++;
  const total = counts.reduce((a, b) => a + b, 0);
  for (const c of counts) assert.ok(c >= total * 0.15, `answer positions ${counts}`);
});

test('validateBank catches malformed questions', () => {
  const bad = [
    { ...q('a-1', 'a'), answer: 4 },
    { ...q('a-1', 'a') },
    { ...q('c-1', 'c') },
    { ...q('a-2', 'a'), options: ['x', 'x'] },
    { ...q('a-3', 'a'), q: 'Really!' },
    { ...q('a-4', 'a'), why: 'A — B' },
    { ...q('a-5', 'a'), options: ['one', 'All of the above'] },
    { ...q('b-1', 'a') },
  ];
  const problems = validateBank({ topics: TOPICS, questions: bad }).join('\n');
  for (const want of ['answer must index', 'duplicate id', 'unknown topic', 'distinct', 'exclamation', 'dashes', 'above', 'start with its topic']) assert.match(problems, new RegExp(want));
});

/* ---------- picking and shuffling ---------- */

test('shuffleOptions keeps the right answer pointing at the same text', () => {
  const rand = mulberry32(7);
  for (const x of QUIZ_QUESTIONS) {
    const played = shuffleOptions(x, rand);
    assert.equal(played.options[played.answer], x.options[x.answer], x.id);
    assert.deepEqual([...played.options].sort(), [...x.options].sort());
  }
});

test('pickQuestions is deterministic per seed, respects topics, count and no repeats', () => {
  const a = pickQuestions({ bank: BANK, topics: ['b'], count: 5, seed: 42 });
  const b = pickQuestions({ bank: BANK, topics: ['b'], count: 5, seed: 42 });
  assert.deepEqual(a, b);
  assert.equal(a.length, 5);
  assert.ok(a.every((x) => x.topic === 'b'));
  assert.equal(new Set(a.map((x) => x.id)).size, 5);
  assert.equal(pickQuestions({ bank: BANK, topics: [], count: null, seed: 1 }).length, BANK.length, 'no topics means all');
  assert.notDeepEqual(pickQuestions({ bank: BANK, count: 8, seed: 1 }).map((x) => x.id), pickQuestions({ bank: BANK, count: 8, seed: 2 }).map((x) => x.id));
});

test('pickQuestions plays questions not yet mastered first', () => {
  const mastered = new Set(BANK.filter((x) => x.topic === 'a').map((x) => x.id).slice(0, 6));
  const picked = pickQuestions({ bank: BANK, topics: ['a'], count: 2, seed: 3, mastered });
  assert.deepEqual(picked.map((x) => x.id).sort(), ['a-6', 'a-7']);
});

test('pickQuestions with only replays exactly those ids', () => {
  const picked = pickQuestions({ bank: BANK, only: ['b-2', 'a-5'], seed: 9 });
  assert.deepEqual(picked.map((x) => x.id).sort(), ['a-5', 'b-2']);
});

/* ---------- modes ---------- */

test('practice: 10 questions, every answer recorded, ends after the last', () => {
  let s = startQuiz({ bank: BANK, mode: 'practice', seed: 5, now: 0 });
  assert.equal(s.questions.length, 10);
  assert.equal(timeLeft(s, 0), null);
  s = playAll(s, (i) => i % 2 === 0);
  assert.equal(s.answers.length, 10);
  assert.ok(s.endedAt != null);
  assert.equal(currentQuestion(s), null);
  const sum = quizSummary(s, TOPICS);
  assert.equal(sum.correct, 5);
  assert.equal(sum.total, 10);
  assert.equal(sum.accuracy, 50);
  assert.equal(sum.missed.length, 5);
  assert.equal(sum.ms, 10000);
  assert.equal(sum.byTopic.reduce((n, t) => n + t.answered, 0), 10);
});

test('answers after the end, out of range or non-integer are ignored', () => {
  let s = startQuiz({ bank: BANK, mode: 'practice', seed: 5, now: 0 });
  assert.equal(answerQuestion(s, 9, 1), s);
  assert.equal(answerQuestion(s, 1.5, 1), s);
  s = playAll(s, () => true);
  assert.equal(answerQuestion(s, 0, 99999), s);
});

test('each answer records its own time from when the question was shown', () => {
  let s = startQuiz({ bank: BANK, mode: 'practice', seed: 5, now: 1000 });
  s = answerQuestion(s, 0, 4000);
  s = showNext(s, 9000);
  s = answerQuestion(s, 0, 10000);
  assert.deepEqual(s.answers.map((a) => a.ms), [3000, 1000]);
});

test('sprint: the clock ends the session and caps its duration', () => {
  const sprint = QUIZ_MODES.find((m) => m.id === 'sprint');
  let s = startQuiz({ bank: BANK, mode: 'sprint', seed: 5, now: 0 });
  assert.equal(timeLeft(s, 0), sprint.seconds * 1000);
  s = answerQuestion(s, currentQuestion(s).answer, 1000);
  assert.ok(!isOver(s, 1000));
  const late = sprint.seconds * 1000 + 5000;
  assert.ok(isOver(s, late));
  const answeredLate = answerQuestion(s, 0, late);
  assert.equal(answeredLate.answers.length, 1, 'no answer counts after the clock');
  assert.equal(answeredLate.endedAt, sprint.seconds * 1000);
  s = endQuiz(s, late);
  assert.equal(timeLeft(s, late), 0);
  assert.equal(quizSummary(s).ms, sprint.seconds * 1000);
});

test('survival: three misses end it, the score is what was reached', () => {
  let s = startQuiz({ bank: BANK, mode: 'survival', seed: 5, now: 0 });
  assert.equal(s.questions.length, BANK.length, 'survival can play the whole pool');
  assert.equal(s.lives, 3);
  s = playAll(s, (i) => i < 4); // 4 right, then misses
  assert.equal(s.lives, 0);
  assert.equal(s.answers.length, 7);
  const sum = quizSummary(s);
  assert.equal(sum.correct, 4);
  assert.equal(sum.total, 7);
});

test('a session with no matching questions starts over', () => {
  const s = startQuiz({ bank: BANK, mode: 'practice', topics: ['none'], seed: 1, now: 5 });
  assert.equal(s.questions.length, 0);
  assert.ok(isOver(s, 5));
});

/* ---------- daily quiz ---------- */

test('daily quiz: same questions for a day, different topics, changes by day', () => {
  const day = '2026-11-23';
  const ids = dailyQuizIds(QUIZ_QUESTIONS, day);
  assert.equal(ids.length, DAILY_QUIZ_SIZE);
  assert.deepEqual(dailyQuizIds([...QUIZ_QUESTIONS].reverse(), day), ids, 'independent of file order');
  const topics = ids.map((id) => QUIZ_QUESTIONS.find((x) => x.id === id).topic);
  assert.equal(new Set(topics).size, DAILY_QUIZ_SIZE, 'one question per topic');
  assert.notDeepEqual(dailyQuizIds(QUIZ_QUESTIONS, '2026-11-24'), ids);
  const a = startDailyQuiz({ bank: QUIZ_QUESTIONS, day, now: 0 });
  const b = startDailyQuiz({ bank: QUIZ_QUESTIONS, day, now: 999 });
  assert.deepEqual(a.questions, b.questions, 'options are shuffled the same way for everyone');
  assert.equal(a.daily, day);
  assert.equal(a.deadline, null);
  assert.equal(a.lives, null);
});

test('daily quiz falls back to repeats of a topic when there are fewer topics than slots', () => {
  const ids = dailyQuizIds(BANK, '2026-11-23');
  assert.equal(ids.length, DAILY_QUIZ_SIZE);
  assert.equal(new Set(ids).size, DAILY_QUIZ_SIZE);
});

test('daily quiz numbers start at 1', () => {
  assert.equal(dailyQuizNumber('2026-11-23'), 1);
  assert.equal(dailyQuizNumber('2026-12-01'), 9);
});

/* ---------- progress ---------- */

test('recordSession counts answers, keeps the first daily result and the best per mode', () => {
  const ans = (id, correct) => ({ id, correct });
  let p = emptyQuizProgress();
  p = recordSession(p, { mode: 'practice', daily: null, answers: [ans('a-1', true), ans('a-2', false)] });
  p = recordSession(p, { mode: 'practice', daily: null, answers: [ans('a-1', false), ans('a-2', true), ans('a-3', true)] });
  assert.deepEqual(p.questions['a-1'], { seen: 2, correct: 1, last: false });
  assert.deepEqual(p.questions['a-2'], { seen: 2, correct: 1, last: true });
  assert.equal(p.best.practice, 2);
  assert.deepEqual([...masteredIds(p)].sort(), ['a-2', 'a-3']);

  p = recordSession(p, { mode: 'practice', daily: '2026-11-23', answers: [ans('b-1', true)] });
  p = recordSession(p, { mode: 'practice', daily: '2026-11-23', answers: [ans('b-1', true), ans('b-2', true)] });
  assert.deepEqual(p.daily['2026-11-23'], { correct: 1, total: 1 }, 'a replay does not overwrite the day');
  assert.equal(p.best.practice, 2, 'the daily does not set a best');
});

test('topicProgress and dailyQuizStreak', () => {
  let p = emptyQuizProgress();
  p = recordSession(p, { mode: 'sprint', daily: null, answers: [{ id: 'a-1', correct: true }, { id: 'a-2', correct: false }] });
  const tp = topicProgress(p, BANK);
  assert.deepEqual(tp.get('a'), { total: 8, known: 1, seen: 2 });
  assert.deepEqual(tp.get('b'), { total: 8, known: 0, seen: 0 });
  p.daily = { '2026-11-21': { correct: 1, total: 5 }, '2026-11-22': { correct: 1, total: 5 } };
  assert.equal(dailyQuizStreak(p, new Date(2026, 10, 23, 9)), 2, 'today still open');
  p.daily['2026-11-23'] = { correct: 5, total: 5 };
  assert.equal(dailyQuizStreak(p, new Date(2026, 10, 23, 9)), 3);
  assert.equal(dailyQuizStreak(p, new Date(2026, 10, 25, 9)), 0);
});

test('normalizeQuizProgress survives junk', () => {
  assert.deepEqual(normalizeQuizProgress(null), emptyQuizProgress());
  assert.deepEqual(normalizeQuizProgress('x'), emptyQuizProgress());
  const p = normalizeQuizProgress({ questions: { ok: { seen: 1, correct: 1, last: 1 }, bad: { seen: 'x' } }, daily: { '2026-11-23': { correct: 3, total: 5 }, nope: { correct: 1, total: 1 } }, best: { sprint: 7, survival: 'x' } });
  assert.deepEqual(p, { questions: { ok: { seen: 1, correct: 1, last: true } }, daily: { '2026-11-23': { correct: 3, total: 5 } }, best: { sprint: 7 } });
});
