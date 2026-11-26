/**
 * The daily quiz card on the Problems page: today's quiz number, the quiz streak, and either a
 * Play button or today's five results as squares with a link to the leaderboard. Built only from
 * local data (state/quiz-progress.js), so it draws at once and works signed out.
 */
import { h, tp } from './dom.js';
import { loadQuizProgress, dailyQuizStreak } from '../state/quiz-progress.js';
import { dailyQuizNumber, DAILY_QUIZ_SIZE, dailyQuizAccess } from '../modes/quiz.js';
import { dayKey } from '../state/progress.js';
import { services } from '../auth/services.js';

/** Said next to every Play button of the daily quiz while signed out, so the sign-in step is no surprise. */
export const SIGN_IN_NOTE = 'Sign in to play.';

/**
 * SIGN_IN_NOTE in the page language (the constant stays English for the pages not translated yet).
 * @returns {string}
 */
export function signInNote() {
  return tp(SIGN_IN_NOTE, 'צריך להתחבר כדי לשחק.');
}

/**
 * Whether today's daily quiz would ask this visitor to sign in first. False while a stored session
 * is still being checked, so a returning player never sees the note flash.
 * @returns {boolean}
 */
export function dailyQuizNeedsSignIn() {
  const account = services.account;
  return dailyQuizAccess({ accounts: Boolean(account?.config?.enabled), status: account?.get?.().status }) === 'sign-in';
}

/**
 * @param {{ now: Date, restDay?: number|null }} opts `restDay`: the player's (state/progress.js restDayOf)
 * @returns {HTMLElement}
 */
export function quizCard({ now, restDay = null }) {
  const progress = loadQuizProgress();
  const today = dayKey(now);
  const done = progress.daily[today];
  const streak = dailyQuizStreak(progress, now, restDay);
  const squares = done?.results ?? null;
  return h(
    `section.today-card.today-quiz${done ? '.is-done' : ''}`,
    { 'aria-labelledby': 'quiz-card-title' },
    h(
      'div.today-quiz-copy',
      {},
      h('div.today-kicker', {}, tp(`Daily quiz · No. ${dailyQuizNumber(today)}`, `החידון היומי · מס׳ ${dailyQuizNumber(today)}`)),
      h(
        'h2.today-quiz-title#quiz-card-title',
        {},
        done
          ? tp(`${done.correct} / ${done.total} today`, `${done.correct} / ${done.total} היום`)
          : tp(`${DAILY_QUIZ_SIZE} questions, about two minutes`, `${DAILY_QUIZ_SIZE} שאלות, בערך 2 דקות`),
      ),
      h(
        'p.hint-text',
        {},
        done
          ? tp('Same questions for everyone. See where you stand, or share your squares.', 'אותן שאלות לכולם. אפשר לבדוק את המקום בטבלה או לשתף את הריבועים.')
          : tp('Interview ideas from 5 topics, the same for everyone today. English or Hebrew.', 'שאלות מראיונות עבודה ב-5 נושאים, זהות לכולם היום. בעברית או באנגלית.'),
      ),
      !done && dailyQuizNeedsSignIn() ? h('p.quiz-signin-note', {}, signInNote()) : null,
    ),
    squares
      ? h(
          'ol.quiz-squares',
          { 'aria-label': tp(`${done.correct} of ${done.total} correct`, `${done.correct} מתוך ${done.total} נכונות`) },
          squares.map((ok, i) =>
            h(`li.quiz-square${ok ? '.is-correct' : '.is-wrong'}`, { title: tp(`Question ${i + 1}: ${ok ? 'correct' : 'wrong'}`, `שאלה ${i + 1}: ${ok ? 'נכונה' : 'שגויה'}`) }),
          ),
        )
      : null,
    h(
      'div.today-quiz-side',
      {},
      streak
        ? h(
            'span.quiz-streak-badge',
            { title: tp('Days in a row with the daily quiz', 'ימים ברצף עם החידון היומי') },
            tp(`${streak}-day streak`, streak === 1 ? 'יום אחד ברצף' : `${streak} ימים ברצף`),
          )
        : null,
      done
        ? h('a.btn.btn-secondary.btn-sm', { href: '#/quiz/board' }, tp('Leaderboard', 'לטבלת המובילים'))
        : h('a.btn.btn-secondary.btn-sm.today-quiz-cta', { href: '#/quiz/daily' }, tp("Play today's quiz", 'לשחק בחידון של היום')),
    ),
  );
}
