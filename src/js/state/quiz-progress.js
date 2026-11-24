/**
 * Quiz progress: which questions the player has answered (and got right), daily quiz results,
 * and best scores per mode. Local to this browser for now; it is listed in state/user-data.js so
 * sign-out clears it with the rest of the user's data.
 *
 * The reducers are pure (no storage, `day` passed in); load/save are the only I/O.
 */
import { computeStreak } from './progress.js';
import { QUIZ_STORAGE_KEY } from './user-data.js';

export { QUIZ_STORAGE_KEY };

/**
 * @typedef {{ seen: number, correct: number, last: boolean }} QuestionStat
 * @typedef {{ correct: number, total: number }} DailyResult
 * @typedef {{ questions: Record<string, QuestionStat>, daily: Record<string, DailyResult>, best: Record<string, number> }} QuizProgress
 */

/** @returns {QuizProgress} */
export function emptyQuizProgress() {
  return { questions: {}, daily: {}, best: {} };
}

/**
 * Accepts anything (old, partial or corrupt JSON) and returns a well-formed progress object.
 * @param {any} raw
 * @returns {QuizProgress}
 */
export function normalizeQuizProgress(raw) {
  const out = emptyQuizProgress();
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, s] of Object.entries(raw.questions ?? {})) {
    if (s && Number.isFinite(s.seen) && Number.isFinite(s.correct)) out.questions[id] = { seen: s.seen, correct: s.correct, last: Boolean(s.last) };
  }
  for (const [day, d] of Object.entries(raw.daily ?? {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && d && Number.isFinite(d.correct) && Number.isFinite(d.total)) out.daily[day] = { correct: d.correct, total: d.total };
  }
  for (const [mode, v] of Object.entries(raw.best ?? {})) if (Number.isFinite(v)) out.best[mode] = v;
  return out;
}

/**
 * Records every answer of a finished session, plus the daily result and the mode's best score.
 * A daily quiz counts once per day: replaying it does not overwrite the first result.
 * @param {QuizProgress} p
 * @param {{ mode: string, daily: string|null, answers: { id: string, correct: boolean }[] }} session
 * @returns {QuizProgress}
 */
export function recordSession(p, session) {
  const questions = { ...p.questions };
  for (const a of session.answers) {
    const prev = questions[a.id] ?? { seen: 0, correct: 0, last: false };
    questions[a.id] = { seen: prev.seen + 1, correct: prev.correct + (a.correct ? 1 : 0), last: a.correct };
  }
  const score = session.answers.filter((a) => a.correct).length;
  const daily = { ...p.daily };
  if (session.daily && !daily[session.daily]) daily[session.daily] = { correct: score, total: session.answers.length };
  const best = { ...p.best };
  // Daily is not a mode with a leaderboard of one; only free play sets a best.
  if (!session.daily) best[session.mode] = Math.max(best[session.mode] ?? 0, score);
  return { questions, daily, best };
}

/**
 * Ids answered correctly the last time they were played: practice moves past these first.
 * @param {QuizProgress} p
 * @returns {Set<string>}
 */
export function masteredIds(p) {
  return new Set(Object.entries(p.questions).filter(([, s]) => s.last).map(([id]) => id));
}

/**
 * Per-topic progress for the hub: how many of a topic's questions were ever answered correctly.
 * @param {QuizProgress} p
 * @param {{ id: string, topic: string }[]} bank
 * @returns {Map<string, { total: number, known: number, seen: number }>}
 */
export function topicProgress(p, bank) {
  const out = new Map();
  for (const q of bank) {
    const t = out.get(q.topic) ?? { total: 0, known: 0, seen: 0 };
    const s = p.questions[q.id];
    t.total++;
    if (s?.seen) t.seen++;
    if (s?.correct) t.known++;
    out.set(q.topic, t);
  }
  return out;
}

/**
 * Consecutive days with a finished daily quiz, ending today (or yesterday, while today's is
 * still open), the same rule as the solve streak.
 * @param {QuizProgress} p
 * @param {Date} now
 * @returns {number}
 */
export function dailyQuizStreak(p, now) {
  return computeStreak(Object.keys(p.daily), now);
}

/** @returns {QuizProgress} */
export function loadQuizProgress() {
  try {
    return normalizeQuizProgress(JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) ?? 'null'));
  } catch {
    return emptyQuizProgress();
  }
}

/** @param {QuizProgress} p */
export function saveQuizProgress(p) {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked: the session still shows its result */
  }
}
