// Quiz mode: session rules (modes/quiz.js), progress reducers (state/quiz-progress.js), the
// bilingual source bank (content/quiz) and the files built from it (scripts/content/build-quiz.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { QUIZ_TOPICS, QUIZ_LANGS } from '../src/js/data/quiz-topics.js';
import { QUIZ_INDEX } from '../src/js/data/quiz-index.js';
import { readBank, buildOutputs, forLang } from '../scripts/content/build-quiz.mjs';
import {
  QUIZ_MODES,
  SURVIVAL_CAP,
  DAILY_QUIZ_SIZE,
  dailyQuizNumber,
  shuffleOptions,
  pickIds,
  buildQuiz,
  startQuiz,
  startDailyQuiz,
  dailyQuizIds,
  topicsFor,
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

const SOURCE = readBank();
const REGEN = 'run: node scripts/content/build-quiz.mjs';

const TOPICS = [
  { id: 'a', title: { en: 'Alpha', he: 'אלפא' }, blurb: { en: 'A.', he: 'א.' } },
  { id: 'b', title: { en: 'Beta', he: 'בטא' }, blurb: { en: 'B.', he: 'ב.' } },
];
const wrongFor = (answer, n = 4) => Array.from({ length: n }, (_, i) => (i === answer ? null : `Not ${i}.`));
const q = (id, topic, answer = 0) => ({
  id, topic, subtopic: 's', level: 'easy', q: `Question ${id}?`, options: ['w', 'x', 'y', 'z'], answer, why: 'Because.', wrong: wrongFor(answer),
  he: { q: `שאלה ${id}?`, options: ['א', 'ב', 'ג', 'ד'], why: 'כי.', wrong: wrongFor(answer).map((w) => (w ? 'לא.' : null)) },
});
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

test('the shipped bank passes validation in both languages', () => {
  assert.deepEqual(validateBank({ topics: QUIZ_TOPICS, questions: SOURCE }), []);
});

test('every topic has its own source file and enough questions for a full round', () => {
  const files = readdirSync('content/quiz').filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
  assert.deepEqual(files, QUIZ_TOPICS.map((t) => t.id).sort(), 'one file per topic, nothing else');
  for (const t of QUIZ_TOPICS) {
    const n = SOURCE.filter((x) => x.topic === t.id).length;
    assert.ok(n >= 10, `${t.id} has ${n} questions, at least 10 so a single-topic practice is a full round`);
  }
});

test('correct answers are spread over positions as authored', () => {
  // Sessions shuffle anyway; this keeps the authored file honest for review.
  const counts = [0, 0, 0, 0];
  for (const x of SOURCE) if (x.options.length === 4) counts[x.answer]++;
  const total = counts.reduce((a, b) => a + b, 0);
  for (const c of counts) assert.ok(c >= total * 0.2, `answer positions ${counts}`);
});

test('the built index and per-language files match content/quiz', () => {
  assert.deepEqual(QUIZ_INDEX.map((e) => e.id), SOURCE.map((x) => x.id), `index is stale; ${REGEN}`);
  for (const [path, text] of buildOutputs(SOURCE)) {
    if (path.endsWith('.js')) continue; // the index is compared above, as data
    assert.equal(readFileSync(path, 'utf8'), text, `${path} is stale; ${REGEN}`);
  }
});

test('Hebrew keeps the code, the answer and the shape of every English question', () => {
  for (const x of SOURCE) {
    const en = forLang(x, 'en');
    const he = forLang(x, 'he');
    assert.equal(he.answer, en.answer, x.id);
    assert.equal(he.code, en.code, x.id);
    assert.equal(he.options.length, en.options.length, x.id);
    assert.notEqual(he.q, en.q, `${x.id} has an untranslated question`);
  }
});

test('validateBank catches malformed questions in either language', () => {
  const bad = [
    { ...q('a-1', 'a'), answer: 4 },
    { ...q('a-1', 'a') },
    { ...q('c-1', 'c') },
    { ...q('a-2', 'a'), options: ['x', 'x', 'y', 'z'] },
    { ...q('a-3', 'a'), q: 'Really!' },
    { ...q('a-4', 'a'), why: 'A — B' },
    { ...q('a-5', 'a'), options: ['one', 'two', 'three', 'All of the above'] },
    { ...q('b-1', 'a') },
    { ...q('a-6', 'a'), wrong: ['x', 'y', 'z', 'w'] },
    { ...q('a-7', 'a'), he: { ...q('a-7', 'a').he, options: ['א', 'ב'] } },
    { ...q('a-8', 'a'), he: { ...q('a-8', 'a').he, q: 'English only?' } },
    { ...q('a-9', 'a'), subtopic: undefined },
    { ...q('a-10', 'a'), he: undefined },
  ];
  const problems = validateBank({ topics: TOPICS, questions: bad }).join('\n');
  for (const want of ['answer must index', 'duplicate id', 'unknown topic', 'distinct', 'exclamation', 'long dash', 'above', 'start with its topic', 'null at the answer', 'he has 2 options', 'no Hebrew', 'subtopic is required', 'missing he text']) assert.match(problems, new RegExp(want));
});

/* ---------- picking and shuffling ---------- */

test('shuffleOptions keeps the answer and the wrong-option explanations with their text', () => {
  const rand = mulberry32(7);
  for (const x of SOURCE.map((s) => forLang(s, 'en'))) {
    const played = shuffleOptions(x, rand);
    assert.equal(played.options[played.answer], x.options[x.answer], x.id);
    assert.equal(played.wrong[played.answer], null, x.id);
    for (let i = 0; i < played.options.length; i++) {
      const from = x.options.indexOf(played.options[i]);
      assert.equal(played.wrong[i], x.wrong[from], `${x.id}: explanation moved with its option`);
    }
  }
});

test('pickIds is deterministic per seed, respects topics, count and no repeats', () => {
  const a = pickIds({ index: BANK, topics: ['b'], count: 5, seed: 42 });
  assert.deepEqual(a, pickIds({ index: BANK, topics: ['b'], count: 5, seed: 42 }));
  assert.equal(a.length, 5);
  assert.ok(a.every((id) => id.startsWith('b-')));
  assert.equal(new Set(a).size, 5);
  assert.equal(pickIds({ index: BANK, topics: [], count: null, seed: 1 }).length, BANK.length, 'no topics means all');
  assert.notDeepEqual(pickIds({ index: BANK, count: 8, seed: 1 }), pickIds({ index: BANK, count: 8, seed: 2 }));
  assert.deepEqual(pickIds({ index: [...BANK].reverse(), count: 8, seed: 3 }), pickIds({ index: BANK, count: 8, seed: 3 }), 'independent of index order');
});

test('pickIds plays questions not yet mastered first', () => {
  const mastered = new Set(BANK.filter((x) => x.topic === 'a').map((x) => x.id).slice(0, 6));
  assert.deepEqual(pickIds({ index: BANK, topics: ['a'], count: 2, seed: 3, mastered }).sort(), ['a-6', 'a-7']);
});

test('pickIds with only replays exactly those ids', () => {
  assert.deepEqual(pickIds({ index: BANK, only: ['b-2', 'a-5'], seed: 9 }).sort(), ['a-5', 'b-2']);
});

test('the shipped index plans sessions and names the topics to load', () => {
  const ids = pickIds({ index: QUIZ_INDEX, topics: ['oop', 'git'], count: 10, seed: 11 });
  assert.equal(ids.length, 10);
  const topics = topicsFor(QUIZ_INDEX, ids);
  assert.ok(topics.every((t) => ['oop', 'git'].includes(t)));
  const mixed = pickIds({ index: QUIZ_INDEX, count: 10, seed: 11 });
  assert.ok(topicsFor(QUIZ_INDEX, mixed).length <= 10, 'a mixed round loads at most one file per question');
});

test('buildQuiz skips ids whose question did not load', () => {
  const s = buildQuiz({ questions: BANK.slice(0, 3), ids: ['a-0', 'zz-missing', 'a-2'], mode: 'practice', seed: 1, now: 0 });
  assert.deepEqual(s.questions.map((x) => x.id), ['a-0', 'a-2']);
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
  const sum = quizSummary(s, (t) => TOPICS.find((x) => x.id === t).title.en);
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
  assert.equal(s.questions.length, Math.min(BANK.length, SURVIVAL_CAP), 'survival plays the pool up to the cap');
  assert.equal(QUIZ_MODES.find((m) => m.id === 'survival').count, SURVIVAL_CAP);
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

test('daily quiz: same questions for a day, different topics, changes by day, same in both languages', () => {
  const day = '2026-11-23';
  const ids = dailyQuizIds(QUIZ_INDEX, day);
  assert.equal(ids.length, DAILY_QUIZ_SIZE);
  assert.deepEqual(dailyQuizIds([...QUIZ_INDEX].reverse(), day), ids, 'independent of file order');
  const topics = ids.map((id) => QUIZ_INDEX.find((x) => x.id === id).topic);
  assert.equal(new Set(topics).size, DAILY_QUIZ_SIZE, 'one question per topic');
  assert.notDeepEqual(dailyQuizIds(QUIZ_INDEX, '2026-11-24'), ids);
  const load = (lang) => SOURCE.filter((x) => topicsFor(QUIZ_INDEX, ids).includes(x.topic)).map((x) => forLang(x, lang));
  const en = startDailyQuiz({ index: QUIZ_INDEX, questions: load('en'), day, now: 0 });
  const he = startDailyQuiz({ index: QUIZ_INDEX, questions: load('he'), day, now: 999 });
  assert.deepEqual(en.questions.map((x) => x.id), ids);
  assert.deepEqual(he.questions.map((x) => [x.id, x.answer, x.code]), en.questions.map((x) => [x.id, x.answer, x.code]), 'same questions and option order in Hebrew');
  assert.deepEqual(startDailyQuiz({ index: QUIZ_INDEX, questions: load('en'), day, now: 5 }).questions, en.questions, 'the same for everyone');
  assert.equal(en.daily, day);
  assert.equal(en.deadline, null);
  assert.equal(en.lives, null);
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
