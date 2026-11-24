/**
 * Quiz progress: which questions the player has answered (and got right), daily quiz results,
 * and best scores per mode. Kept in the browser; for a signed-in player it also rides in the
 * account's progress record (auth/account.js, merged by mergeQuizProgress), so it follows them
 * across devices and survives signing out. Listed in state/user-data.js, so sign-out clears it
 * from the device with the rest of the user's data.
 *
 * The reducers are pure (no storage, `day` passed in); load/save are the only I/O.
 */
import { computeStreak } from './progress.js';
import { QUIZ_STORAGE_KEY, QUIZ_SAVED_EVENT } from './user-data.js';

export { QUIZ_STORAGE_KEY, QUIZ_SAVED_EVENT };

/**
 * @typedef {{ seen: number, correct: number, last: boolean }} QuestionStat
 * @typedef {{ correct: number, total: number, results?: boolean[], play?: { answers: { id: string, choice: number }[], ms: number } }} DailyResult
 *   `play` is the first play's choices (authored order) and time, kept so the leaderboard can
 *   still receive it after the player signs in or a send fails.
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !d || !Number.isFinite(d.correct) || !Number.isFinite(d.total)) continue;
    out.daily[day] = { correct: d.correct, total: d.total };
    if (Array.isArray(d.results) && d.results.every((r) => typeof r === 'boolean')) out.daily[day].results = d.results;
    const play = d.play;
    if (play && Number.isFinite(play.ms) && Array.isArray(play.answers) && play.answers.every((a) => a && typeof a.id === 'string' && Number.isInteger(a.choice))) {
      out.daily[day].play = { answers: play.answers.map((a) => ({ id: a.id, choice: a.choice })), ms: play.ms };
    }
  }
  for (const [mode, v] of Object.entries(raw.best ?? {})) if (Number.isFinite(v)) out.best[mode] = v;
  return out;
}

/**
 * Records every answer of a finished session, plus the daily result and the mode's best score.
 * A daily quiz counts once per day: replaying it does not overwrite the first result.
 * @param {QuizProgress} p
 * @param {{ mode: string, daily: string|null, answers: { id: string, correct: boolean }[] }} session
 * @param {{ answers: { id: string, choice: number }[], ms: number }|null} [play] the daily play as the
 *   leaderboard takes it; stored with the first play only
 * @returns {QuizProgress}
 */
export function recordSession(p, session, play = null) {
  const questions = { ...p.questions };
  for (const a of session.answers) {
    const prev = questions[a.id] ?? { seen: 0, correct: 0, last: false };
    questions[a.id] = { seen: prev.seen + 1, correct: prev.correct + (a.correct ? 1 : 0), last: a.correct };
  }
  const score = session.answers.filter((a) => a.correct).length;
  const daily = { ...p.daily };
  // The squares in order, so the share text can be rebuilt when the player comes back later.
  if (session.daily && !daily[session.daily]) {
    daily[session.daily] = { correct: score, total: session.answers.length, results: session.answers.map((a) => a.correct), ...(play ? { play } : {}) };
  }
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

/**
 * @param {QuizProgress} p
 * @param {{ source?: 'local'|'sync' }} [opts] 'sync' when account sync writes a merge, so it does
 *   not schedule another sync for its own write
 */
export function saveQuizProgress(p, { source = 'local' } = {}) {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked: the session still shows its result */
  }
  globalThis.dispatchEvent?.(new CustomEvent(QUIZ_SAVED_EVENT, { detail: { source } }));
}

/**
 * Merges this device's quiz progress with the account's copy (owner's request: quiz progress
 * follows the player across devices and survives signing out). Per question the larger counts,
 * the way problem progress merges (summing would count a merged session twice); per mode the
 * better best. A day both copies played keeps the account's: it reached the server first, and
 * the leaderboard counts the first play. Remote junk is normalized away.
 *
 * Idempotent (merge(a, a) = a); for days played on both sides the account wins.
 * @param {QuizProgress} local
 * @param {any} remote the account's copy; null when it has none
 * @returns {QuizProgress}
 */
export function mergeQuizProgress(local, remote) {
  const a = normalizeQuizProgress(local);
  if (!remote) return a;
  const b = normalizeQuizProgress(remote);
  const questions = { ...a.questions };
  for (const [id, r] of Object.entries(b.questions)) {
    const l = questions[id];
    if (!l) {
      questions[id] = r;
      continue;
    }
    // "Last answer right" follows the copy that saw the question more often; a tie keeps either's yes.
    const last = l.seen === r.seen ? l.last || r.last : l.seen > r.seen ? l.last : r.last;
    questions[id] = { seen: Math.max(l.seen, r.seen), correct: Math.max(l.correct, r.correct), last };
  }
  const best = { ...a.best };
  for (const [mode, v] of Object.entries(b.best)) best[mode] = Math.max(best[mode] ?? 0, v);
  return { questions, daily: { ...a.daily, ...b.daily }, best };
}
