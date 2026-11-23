/**
 * Quiz mode: multiple-choice sessions over the question bank (data/quiz-bank.js). Three ways to
 * play (practice, sprint, survival), any mix of topics, and a daily quiz that is the same for
 * everyone on a given day.
 *
 * Pure: no DOM, no storage. Randomness comes from a seed and time from a `now` parameter, so a
 * session replays exactly in tests.
 */
import { mulberry32 } from '../engine/rng.js';
import { hashString } from '../data/recommend.js';
import { daysBetween } from '../data/daily.js';

/**
 * @typedef {import('../data/quiz-bank.js').QuizQuestion} QuizQuestion
 * @typedef {import('../data/quiz-bank.js').QuizTopic} QuizTopic
 * @typedef {{ id: string, label: string, note: string, count: number|null, lives: number|null, seconds: number|null }} QuizMode
 * @typedef {{ id: string, topic: string, level: string, q: string, code?: string, options: string[], answer: number, why: string }} PlayedQuestion
 * @typedef {{ id: string, choice: number, correct: boolean, ms: number }} QuizAnswer
 * @typedef {{ mode: string, topics: string[], questions: PlayedQuestion[], answers: QuizAnswer[], lives: number|null, startedAt: number, deadline: number|null, shownAt: number, endedAt: number|null, daily: string|null }} QuizSession
 */

/** @type {QuizMode[]} */
export const QUIZ_MODES = [
  { id: 'practice', label: 'Practice', note: '10 questions, no clock, an explanation after each', count: 10, lives: null, seconds: null },
  { id: 'sprint', label: 'Sprint', note: '10 questions against a 2 minute clock', count: 10, lives: null, seconds: 120 },
  { id: 'survival', label: 'Survival', note: 'Keep going until your third wrong answer', count: null, lives: 3, seconds: null },
];

/** Questions in the daily quiz. */
export const DAILY_QUIZ_SIZE = 5;

/** Days before this one have no daily quiz (the feature did not exist yet). */
export const DAILY_QUIZ_EPOCH = '2026-11-23';

/**
 * The daily quiz's public number: 1 on its first day.
 * @param {string} day "YYYY-MM-DD"
 * @returns {number}
 */
export function dailyQuizNumber(day) {
  return daysBetween(DAILY_QUIZ_EPOCH, day) + 1;
}

/**
 * @param {string} id
 * @returns {QuizMode}
 */
export function quizMode(id) {
  return QUIZ_MODES.find((m) => m.id === id) ?? QUIZ_MODES[0];
}

/**
 * Fisher-Yates with a seeded generator. Returns a new array.
 * @template T
 * @param {T[]} list
 * @param {() => number} rand
 * @returns {T[]}
 */
export function shuffled(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A question as played: options shuffled by the seed, `answer` remapped to the new position.
 * Shuffling stops players from learning "it's always B" when they replay.
 * @param {QuizQuestion} question
 * @param {() => number} rand
 * @returns {PlayedQuestion}
 */
export function shuffleOptions(question, rand) {
  const order = shuffled(question.options.map((_, i) => i), rand);
  return { ...question, options: order.map((i) => question.options[i]), answer: order.indexOf(question.answer) };
}

/**
 * Picks the questions for a session. Within the chosen topics, questions the player has not yet
 * answered correctly come first (in seeded random order), then the rest, so practice keeps moving
 * to new material instead of repeating what is already known.
 *
 * @param {{ bank: QuizQuestion[], topics?: string[], count?: number|null, seed: number, mastered?: Set<string>, only?: string[] }} opts
 *   topics: empty or missing means every topic. only: play exactly these question ids (retry missed).
 * @returns {PlayedQuestion[]}
 */
export function pickQuestions({ bank, topics = [], count = null, seed, mastered = new Set(), only = null }) {
  const rand = mulberry32(seed);
  const wanted = new Set(topics);
  const pool = only ? bank.filter((q) => only.includes(q.id)) : bank.filter((q) => !wanted.size || wanted.has(q.topic));
  const mixed = shuffled(pool, rand);
  const ordered = [...mixed.filter((q) => !mastered.has(q.id)), ...mixed.filter((q) => mastered.has(q.id))];
  const picked = count == null ? ordered : ordered.slice(0, count);
  return picked.map((q) => shuffleOptions(q, rand));
}

/**
 * Starts a session.
 * @param {{ bank: QuizQuestion[], mode: string, topics?: string[], seed: number, now: number, mastered?: Set<string>, only?: string[]|null }} opts
 * @returns {QuizSession}
 */
export function startQuiz({ bank, mode, topics = [], seed, now, mastered, only = null }) {
  const m = quizMode(mode);
  const questions = pickQuestions({ bank, topics, count: only ? null : m.count, seed, mastered, only });
  return {
    mode: m.id,
    topics: [...topics],
    questions,
    answers: [],
    lives: m.lives,
    startedAt: now,
    deadline: m.seconds ? now + m.seconds * 1000 : null,
    shownAt: now,
    endedAt: questions.length ? null : now,
    daily: null,
  };
}

/**
 * The daily quiz: DAILY_QUIZ_SIZE questions, the same for everyone on `day`, from as many
 * different topics as possible. Practice rules (no clock, no lives).
 * @param {{ bank: QuizQuestion[], day: string, now: number }} opts
 * @returns {QuizSession}
 */
export function startDailyQuiz({ bank, day, now }) {
  const ids = dailyQuizIds(bank, day);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const rand = mulberry32(hashString(`quiz-options:${day}`));
  const questions = ids.map((id) => shuffleOptions(byId.get(id), rand));
  return { mode: 'practice', topics: [], questions, answers: [], lives: null, startedAt: now, deadline: null, shownAt: now, endedAt: questions.length ? null : now, daily: day };
}

/**
 * Question ids of the daily quiz for `day`: one per topic from a seeded shuffle of the topics,
 * so five questions cover five subjects. Depends only on the bank and the day.
 * @param {QuizQuestion[]} bank
 * @param {string} day "YYYY-MM-DD"
 * @returns {string[]}
 */
export function dailyQuizIds(bank, day) {
  const rand = mulberry32(hashString(`quiz:${day}`));
  // Sorted first: the pick must not depend on the order questions were written in the file.
  const sorted = [...bank].sort((a, b) => (a.id < b.id ? -1 : 1));
  const topics = shuffled([...new Set(sorted.map((q) => q.topic))].sort(), rand);
  const picks = [];
  for (const t of topics) {
    if (picks.length === DAILY_QUIZ_SIZE) break;
    const inTopic = sorted.filter((q) => q.topic === t);
    picks.push(inTopic[Math.floor(rand() * inTopic.length)].id);
  }
  // Fewer topics than slots: fill from the remaining questions.
  const rest = shuffled(sorted.filter((q) => !picks.includes(q.id)), rand);
  while (picks.length < DAILY_QUIZ_SIZE && rest.length) picks.push(rest.shift().id);
  return picks;
}

/**
 * The question on screen, or null when the session is over.
 * @param {QuizSession} s
 * @returns {PlayedQuestion|null}
 */
export function currentQuestion(s) {
  return s.endedAt == null ? (s.questions[s.answers.length] ?? null) : null;
}

/**
 * True once the clock ran out, the lives are gone, or every question is answered.
 * @param {QuizSession} s
 * @param {number} now
 * @returns {boolean}
 */
export function isOver(s, now) {
  if (s.endedAt != null) return true;
  if (s.deadline != null && now >= s.deadline) return true;
  if (s.lives != null && s.lives <= 0) return true;
  return s.answers.length >= s.questions.length;
}

/**
 * Records an answer to the current question. Ignored when the session is over or the choice is
 * not an option. Ends the session when that answer finishes it.
 * @param {QuizSession} s
 * @param {number} choice option index as shown
 * @param {number} now
 * @returns {QuizSession}
 */
export function answerQuestion(s, choice, now) {
  if (isOver(s, now)) return s.endedAt == null ? { ...s, endedAt: Math.min(now, s.deadline ?? now) } : s;
  const q = currentQuestion(s);
  if (!q || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return s;
  const correct = choice === q.answer;
  const next = {
    ...s,
    answers: [...s.answers, { id: q.id, choice, correct, ms: Math.max(0, now - s.shownAt) }],
    lives: s.lives != null && !correct ? s.lives - 1 : s.lives,
  };
  return isOver(next, now) ? { ...next, endedAt: now } : next;
}

/**
 * Moves on to the next question: restarts its answer timer. The answer itself was recorded by
 * answerQuestion; this only marks when the next question appeared.
 * @param {QuizSession} s
 * @param {number} now
 * @returns {QuizSession}
 */
export function showNext(s, now) {
  return s.endedAt == null ? { ...s, shownAt: now } : s;
}

/**
 * Ends the session (time up, or the player stopped).
 * @param {QuizSession} s
 * @param {number} now
 * @returns {QuizSession}
 */
export function endQuiz(s, now) {
  return s.endedAt == null ? { ...s, endedAt: s.deadline != null ? Math.min(now, s.deadline) : now } : s;
}

/**
 * Milliseconds left on a sprint clock, or null without one.
 * @param {QuizSession} s
 * @param {number} now
 * @returns {number|null}
 */
export function timeLeft(s, now) {
  return s.deadline == null ? null : Math.max(0, s.deadline - (s.endedAt ?? now));
}

/**
 * The scoreboard of a finished (or running) session.
 * @param {QuizSession} s
 * @param {QuizTopic[]} [topics] for topic titles in the breakdown
 * @returns {{ correct: number, answered: number, total: number, accuracy: number, ms: number, byTopic: { topic: string, title: string, correct: number, answered: number }[], missed: PlayedQuestion[] }}
 */
export function quizSummary(s, topics = []) {
  const byId = new Map(s.questions.map((q) => [q.id, q]));
  const correct = s.answers.filter((a) => a.correct).length;
  const answered = s.answers.length;
  const groups = new Map();
  for (const a of s.answers) {
    const t = byId.get(a.id).topic;
    const g = groups.get(t) ?? { topic: t, title: topics.find((x) => x.id === t)?.title ?? t, correct: 0, answered: 0 };
    g.answered++;
    if (a.correct) g.correct++;
    groups.set(t, g);
  }
  return {
    correct,
    answered,
    // Survival plays the whole pool; its "total" is what was reached, not the pool size.
    total: s.mode === 'survival' ? answered : s.questions.length,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    ms: Math.max(0, (s.endedAt ?? s.startedAt) - s.startedAt),
    byTopic: [...groups.values()].sort((a, b) => a.correct / a.answered - b.correct / b.answered || a.title.localeCompare(b.title)),
    missed: s.answers.filter((a) => !a.correct).map((a) => byId.get(a.id)),
  };
}

/** Prose limits; the bank test holds every question to them. */
export const QUIZ_LIMITS = { q: 220, option: 120, why: 320, blurb: 70, minOptions: 2, maxOptions: 5 };

/**
 * Checks the bank: topics exist, ids are unique, options and answers are well formed, and the
 * house voice holds (no em or en dashes, no exclamation marks in prose).
 * @param {{ topics: QuizTopic[], questions: QuizQuestion[] }} bank
 * @returns {string[]} problems, empty when the bank is fine
 */
export function validateBank({ topics, questions }) {
  const problems = [];
  const topicIds = new Set(topics.map((t) => t.id));
  if (topicIds.size !== topics.length) problems.push('duplicate topic id');
  for (const t of topics) {
    if (!t.title || !t.blurb) problems.push(`${t.id}: title and blurb are required`);
    if ((t.blurb ?? '').length > QUIZ_LIMITS.blurb) problems.push(`${t.id}: blurb longer than ${QUIZ_LIMITS.blurb}`);
    if (/[!–—]/.test(`${t.title} ${t.blurb}`)) problems.push(`${t.id}: no exclamation marks or long dashes`);
  }
  const seen = new Set();
  for (const q of questions) {
    const at = q.id ?? '(no id)';
    if (!q.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id)) problems.push(`${at}: id must be kebab-case`);
    if (seen.has(q.id)) problems.push(`${at}: duplicate id`);
    seen.add(q.id);
    if (!topicIds.has(q.topic)) problems.push(`${at}: unknown topic ${q.topic}`);
    if (!q.id?.startsWith(`${q.topic}-`)) problems.push(`${at}: id must start with its topic`);
    if (!['easy', 'medium', 'hard'].includes(q.level)) problems.push(`${at}: level must be easy, medium or hard`);
    if (!q.q || !q.why) problems.push(`${at}: question and explanation are required`);
    if ((q.q ?? '').length > QUIZ_LIMITS.q) problems.push(`${at}: question longer than ${QUIZ_LIMITS.q}`);
    if ((q.why ?? '').length > QUIZ_LIMITS.why) problems.push(`${at}: explanation longer than ${QUIZ_LIMITS.why}`);
    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < QUIZ_LIMITS.minOptions || opts.length > QUIZ_LIMITS.maxOptions) problems.push(`${at}: ${opts.length} options, keep ${QUIZ_LIMITS.minOptions} to ${QUIZ_LIMITS.maxOptions}`);
    if (new Set(opts).size !== opts.length) problems.push(`${at}: options must be distinct`);
    if (opts.some((o) => typeof o !== 'string' || !o.trim() || o.length > QUIZ_LIMITS.option)) problems.push(`${at}: every option is text up to ${QUIZ_LIMITS.option} characters`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= opts.length) problems.push(`${at}: answer must index an option`);
    // Options are shuffled, so wording that points at a position is wrong after the shuffle.
    if (opts.some((o) => /^(all|none|both) of the (above|these)/i.test(o))) problems.push(`${at}: no "all/none of the above" options`);
    const prose = `${q.q ?? ''} ${opts.join(' ')} ${q.why ?? ''}`;
    if (prose.includes('!')) problems.push(`${at}: no exclamation marks in prose`);
    if (/[–—]/.test(`${prose} ${q.code ?? ''}`)) problems.push(`${at}: no em or en dashes`);
  }
  return problems;
}
