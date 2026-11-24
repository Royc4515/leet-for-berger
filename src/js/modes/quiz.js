/**
 * Quiz mode: multiple-choice sessions over the question bank (content/quiz, built into
 * per-topic, per-language files by scripts/content/build-quiz.mjs). Three ways to play
 * (practice, sprint, survival), any mix of topics, and a daily quiz that is the same for
 * everyone on a given day, in either language.
 *
 * Sessions are planned from the small index (id, topic, level) before any question text loads:
 * pickIds chooses the ids, the view fetches only the topics those ids need, and buildQuiz turns
 * the loaded questions into a session. Picks never depend on the language, so the English and
 * Hebrew daily quiz are the same questions with the options in the same order.
 *
 * Pure: no DOM, no storage. Randomness comes from a seed and time from a `now` parameter, so a
 * session replays exactly in tests.
 */
import { mulberry32 } from '../engine/rng.js';
import { hashString } from '../data/recommend.js';
import { daysBetween } from '../data/daily.js';

/**
 * @typedef {{ id: string, topic: string }} IndexEntry
 * @typedef {{ id: string, topic: string, subtopic?: string, level: string, q: string, code?: string, lang?: string, options: string[], answer: number, why: string, wrong?: (string|null)[], ref?: string }} QuizQuestion
 * @typedef {{ id: string, title: { en: string, he: string } }} QuizTopic
 * @typedef {{ id: string, label: string, note: string, count: number, lives: number|null, seconds: number|null }} QuizMode
 * @typedef {QuizQuestion & { order?: number[] }} PlayedQuestion
 * @typedef {{ id: string, choice: number, correct: boolean, ms: number }} QuizAnswer
 * @typedef {{ mode: string, topics: string[], questions: PlayedQuestion[], answers: QuizAnswer[], lives: number|null, startedAt: number, deadline: number|null, shownAt: number, endedAt: number|null, daily: string|null }} QuizSession
 */

/**
 * Survival plays until the third miss, but loads at most this many questions: a run that long
 * is rare, and the cap keeps a mixed survival run from downloading the whole bank.
 */
export const SURVIVAL_CAP = 50;

/** @type {QuizMode[]} */
export const QUIZ_MODES = [
  { id: 'practice', label: 'Practice', note: '10 questions, no clock, an explanation after each', count: 10, lives: null, seconds: null },
  { id: 'sprint', label: 'Sprint', note: '10 questions against a 2 minute clock', count: 10, lives: null, seconds: 120 },
  { id: 'survival', label: 'Survival', note: 'Keep going until your third wrong answer', count: SURVIVAL_CAP, lives: 3, seconds: null },
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
 * A question as played: options shuffled by the seed, `answer` and the per-option `wrong`
 * explanations remapped to the new positions. Shuffling stops players from learning "it's
 * always B" when they replay.
 * @param {QuizQuestion} question
 * @param {() => number} rand
 * @returns {PlayedQuestion}
 */
export function shuffleOptions(question, rand) {
  const order = shuffled(question.options.map((_, i) => i), rand);
  // `order` maps a shown position back to the authored one: the daily-quiz server scores choices
  // in authored order, so it never has to repeat the shuffle.
  const played = { ...question, options: order.map((i) => question.options[i]), answer: order.indexOf(question.answer), order };
  if (Array.isArray(question.wrong)) played.wrong = order.map((i) => question.wrong[i] ?? null);
  return played;
}

/**
 * Chooses the question ids for a session from the index. Within the chosen topics, questions
 * the player has not yet answered correctly come first (in seeded random order), then the rest,
 * so practice keeps moving to new material instead of repeating what is already known.
 *
 * @param {{ index: IndexEntry[], topics?: string[], count?: number|null, seed: number, mastered?: Set<string>, only?: string[]|null }} opts
 *   topics: empty or missing means every topic. only: play exactly these ids (retry missed).
 * @returns {string[]}
 */
export function pickIds({ index, topics = [], count = null, seed, mastered = new Set(), only = null }) {
  const rand = mulberry32(seed);
  const wanted = new Set(topics);
  const keep = only ? new Set(only) : null;
  // Sorted first: the pick must not depend on the order the index happens to be in.
  const pool = [...index].filter((e) => (keep ? keep.has(e.id) : !wanted.size || wanted.has(e.topic))).sort((a, b) => (a.id < b.id ? -1 : 1));
  const mixed = shuffled(pool, rand);
  const ordered = [...mixed.filter((e) => !mastered.has(e.id)), ...mixed.filter((e) => mastered.has(e.id))];
  return (count == null ? ordered : ordered.slice(0, count)).map((e) => e.id);
}

/**
 * Builds a session from picked ids and the loaded questions. Ids whose question is missing
 * (a stale progress record, a failed load) are skipped rather than shown blank.
 * @param {{ questions: QuizQuestion[], ids: string[], mode: string, topics?: string[], seed: number, now: number, daily?: string|null }} opts
 * @returns {QuizSession}
 */
export function buildQuiz({ questions, ids, mode, topics = [], seed, now, daily = null }) {
  const m = quizMode(mode);
  const byId = new Map(questions.map((q) => [q.id, q]));
  // A separate stream for options, so the option order does not shift when the pick changes.
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const played = ids.filter((id) => byId.has(id)).map((id) => shuffleOptions(byId.get(id), rand));
  return {
    mode: m.id,
    topics: [...topics],
    questions: played,
    answers: [],
    lives: m.lives,
    startedAt: now,
    deadline: m.seconds ? now + m.seconds * 1000 : null,
    shownAt: now,
    endedAt: played.length ? null : now,
    daily,
  };
}

/**
 * Picks and builds in one step when every question is already loaded (tests, small banks).
 * @param {{ bank: QuizQuestion[], mode: string, topics?: string[], seed: number, now: number, mastered?: Set<string>, only?: string[]|null }} opts
 * @returns {QuizSession}
 */
export function startQuiz({ bank, mode, topics = [], seed, now, mastered, only = null }) {
  const ids = pickIds({ index: bank, topics, count: only ? null : quizMode(mode).count, seed, mastered, only });
  return buildQuiz({ questions: bank, ids, mode, topics, seed, now });
}

/**
 * The daily quiz for `day`: the ids come from dailyQuizIds over the full index, so the quiz is
 * the same whichever language or topic files are loaded. Practice rules (no clock, no lives).
 * @param {{ index: IndexEntry[], questions: QuizQuestion[], day: string, now: number }} opts
 * @returns {QuizSession}
 */
export function startDailyQuiz({ index, questions, day, now }) {
  return buildQuiz({ questions, ids: dailyQuizIds(index, day), mode: 'practice', seed: hashString(`quiz-options:${day}`), now, daily: day });
}

/**
 * Question ids of the daily quiz for `day`: one per topic from a seeded shuffle of the topics,
 * so five questions cover five subjects. Depends only on the index and the day.
 * @param {IndexEntry[]} index
 * @param {string} day "YYYY-MM-DD"
 * @returns {string[]}
 */
export function dailyQuizIds(index, day) {
  const rand = mulberry32(hashString(`quiz:${day}`));
  // Sorted first: the pick must not depend on the order questions were written in the file.
  const sorted = [...index].sort((a, b) => (a.id < b.id ? -1 : 1));
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
 * A finished session's choices in authored option order, for the daily-quiz server.
 * @param {QuizSession} s
 * @returns {{ id: string, choice: number }[]}
 */
export function authoredChoices(s) {
  const byId = new Map(s.questions.map((q) => [q.id, q]));
  return s.answers.map((a) => ({ id: a.id, choice: byId.get(a.id)?.order?.[a.choice] ?? a.choice }));
}

/**
 * The topics an id list needs loaded, from the index.
 * @param {IndexEntry[]} index
 * @param {string[]} ids
 * @returns {string[]}
 */
export function topicsFor(index, ids) {
  const want = new Set(ids);
  return [...new Set(index.filter((e) => want.has(e.id)).map((e) => e.topic))];
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
 * @param {(topicId: string) => string} [titleOf] topic title for the breakdown (language-aware)
 * @returns {{ correct: number, answered: number, total: number, accuracy: number, ms: number, byTopic: { topic: string, title: string, correct: number, answered: number }[], missed: PlayedQuestion[] }}
 */
export function quizSummary(s, titleOf = (t) => t) {
  const byId = new Map(s.questions.map((q) => [q.id, q]));
  const correct = s.answers.filter((a) => a.correct).length;
  const answered = s.answers.length;
  const groups = new Map();
  for (const a of s.answers) {
    const t = byId.get(a.id).topic;
    const g = groups.get(t) ?? { topic: t, title: titleOf(t), correct: 0, answered: 0 };
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

/** Prose limits; the bank test holds every question to them. Hebrew gets more room: the same
 * idea with English terms mixed in runs longer. */
export const QUIZ_LIMITS = { q: 220, option: 120, why: 320, blurb: 70, minOptions: 2, maxOptions: 5, heFactor: 1.6 };

const LEVELS = ['easy', 'medium', 'hard'];
const LONG_DASH = /[–—]/;
const BIDI_MARK = /[‎‏]/;
const HEBREW = /[֐-׿]/;

/**
 * Checks the bank: topics exist, ids are unique, options, answers and per-option explanations
 * are well formed in both languages, and the house voice holds (no em or en dashes, no
 * exclamation marks in prose).
 * @param {{ topics: { id: string, title: { en: string, he: string }, blurb: { en: string, he: string } }[], questions: (QuizQuestion & { he?: { q: string, options: string[], why: string, wrong: (string|null)[] } })[] }} bank
 * @returns {string[]} problems, empty when the bank is fine
 */
export function validateBank({ topics, questions }) {
  const problems = [];
  const topicIds = new Set(topics.map((t) => t.id));
  if (topicIds.size !== topics.length) problems.push('duplicate topic id');
  for (const t of topics) {
    for (const lang of ['en', 'he']) {
      if (!t.title?.[lang] || !t.blurb?.[lang]) problems.push(`${t.id}: ${lang} title and blurb are required`);
      if ((t.blurb?.[lang] ?? '').length > QUIZ_LIMITS.blurb) problems.push(`${t.id}: ${lang} blurb longer than ${QUIZ_LIMITS.blurb}`);
      if (/!/.test(`${t.title?.[lang]} ${t.blurb?.[lang]}`) || LONG_DASH.test(`${t.title?.[lang]} ${t.blurb?.[lang]}`)) problems.push(`${t.id}: no exclamation marks or long dashes`);
    }
  }
  const seen = new Set();
  for (const q of questions) {
    const at = q.id ?? '(no id)';
    if (!q.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id)) problems.push(`${at}: id must be kebab-case`);
    if (seen.has(q.id)) problems.push(`${at}: duplicate id`);
    seen.add(q.id);
    if (!topicIds.has(q.topic)) problems.push(`${at}: unknown topic ${q.topic}`);
    if (!q.id?.startsWith(`${q.topic}-`)) problems.push(`${at}: id must start with its topic`);
    if (!q.subtopic) problems.push(`${at}: subtopic is required`);
    if (!LEVELS.includes(q.level)) problems.push(`${at}: level must be easy, medium or hard`);
    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < QUIZ_LIMITS.minOptions || opts.length > QUIZ_LIMITS.maxOptions) problems.push(`${at}: ${opts.length} options, keep ${QUIZ_LIMITS.minOptions} to ${QUIZ_LIMITS.maxOptions}`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= opts.length) problems.push(`${at}: answer must index an option`);
    if (q.code !== undefined && (typeof q.code !== 'string' || LONG_DASH.test(q.code))) problems.push(`${at}: code must be plain text without long dashes`);
    const langs = [['en', q], ['he', q.he]];
    for (const [lang, t] of langs) {
      const k = lang === 'he' ? QUIZ_LIMITS.heFactor : 1;
      if (!t) {
        problems.push(`${at}: missing ${lang} text`);
        continue;
      }
      const o = Array.isArray(t.options) ? t.options : [];
      if (!t.q || !t.why) problems.push(`${at}: ${lang} question and explanation are required`);
      if ((t.q ?? '').length > QUIZ_LIMITS.q * k) problems.push(`${at}: ${lang} question too long`);
      if ((t.why ?? '').length > QUIZ_LIMITS.why * k) problems.push(`${at}: ${lang} explanation too long`);
      if (o.length !== opts.length) problems.push(`${at}: ${lang} has ${o.length} options, expected ${opts.length}`);
      if (new Set(o).size !== o.length) problems.push(`${at}: ${lang} options must be distinct`);
      if (o.some((x) => typeof x !== 'string' || !x.trim() || x.length > QUIZ_LIMITS.option * k)) problems.push(`${at}: ${lang} options must be short text`);
      // Options are shuffled, so wording that points at a position is wrong after the shuffle.
      if (o.some((x) => /^(all|none|both) of the (above|these)/i.test(x))) problems.push(`${at}: no "all/none of the above" options`);
      const w = Array.isArray(t.wrong) ? t.wrong : [];
      const nulls = w.map((x, i) => (x == null ? i : -1)).filter((i) => i >= 0);
      if (w.length !== opts.length || nulls.length !== 1 || nulls[0] !== q.answer) problems.push(`${at}: ${lang} wrong[] needs one line per wrong option and null at the answer`);
      const prose = `${t.q ?? ''} ${o.join(' ')} ${t.why ?? ''} ${w.filter(Boolean).join(' ')}`;
      if (prose.includes('!')) problems.push(`${at}: ${lang} has an exclamation mark in prose`);
      if (LONG_DASH.test(prose) || BIDI_MARK.test(prose)) problems.push(`${at}: ${lang} has a long dash or a direction mark`);
      if (lang === 'he' && !HEBREW.test(t.q ?? '')) problems.push(`${at}: he question has no Hebrew`);
    }
  }
  return problems;
}
