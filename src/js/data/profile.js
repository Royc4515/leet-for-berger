/**
 * The profile page (#/me, owner's request: one place to manage the account and see where you
 * stand). Pure: progress in, numbers out; the nickname rule the leaderboard and the profile share.
 */
import { stats, restDayOf } from '../state/progress.js';
import { dailyQuizStreak } from '../state/quiz-progress.js';

/**
 * The numbers at the top of the profile.
 * @param {{ progress: any, quiz: import('../state/quiz-progress.js').QuizProgress, now: Date }} p
 * @returns {{ solved: number, streak: number, accuracy: number|null, submissions: number, quizStreak: number, quizDays: number, quizAnswered: number }}
 */
export function profileNumbers({ progress, quiz, now }) {
  const s = stats(progress, now);
  return {
    ...s,
    quizStreak: dailyQuizStreak(quiz, now, restDayOf(progress)),
    quizDays: Object.keys(quiz.daily).length,
    quizAnswered: Object.keys(quiz.questions).length,
  };
}

/** Nickname length on the leaderboard, in characters (the server checks the same). */
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;

/**
 * A nickname as typed, made ready to save: spaces collapsed, and whether its length is allowed.
 * Empty means "use my account name again", which is always allowed.
 * @param {string} raw
 * @returns {{ name: string, ok: boolean }}
 */
export function normalizeNickname(raw) {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  const n = [...name].length;
  return { name, ok: n === 0 || (n >= NICKNAME_MIN && n <= NICKNAME_MAX) };
}
