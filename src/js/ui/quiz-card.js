/**
 * The daily quiz card on the Problems page: today's quiz number, the quiz streak, and either a
 * Play button or today's five results as squares with a link to the leaderboard. Built only from
 * local data (state/quiz-progress.js), so it draws at once and works signed out.
 */
import { h } from './dom.js';
import { loadQuizProgress, dailyQuizStreak } from '../state/quiz-progress.js';
import { dailyQuizNumber, DAILY_QUIZ_SIZE } from '../modes/quiz.js';
import { dayKey } from '../state/progress.js';

/**
 * @param {{ now: Date }} opts
 * @returns {HTMLElement}
 */
export function quizCard({ now }) {
  const progress = loadQuizProgress();
  const today = dayKey(now);
  const done = progress.daily[today];
  const streak = dailyQuizStreak(progress, now);
  const squares = done?.results ?? null;
  return h(
    `section.today-card.today-quiz${done ? '.is-done' : ''}`,
    { 'aria-labelledby': 'quiz-card-title' },
    h(
      'div.today-quiz-copy',
      {},
      h('div.today-kicker', {}, `Daily quiz · No. ${dailyQuizNumber(today)}`),
      h('h2.today-quiz-title#quiz-card-title', {}, done ? `${done.correct} / ${done.total} today` : `${DAILY_QUIZ_SIZE} questions, about two minutes`),
      h(
        'p.hint-text',
        {},
        done ? 'Same questions for everyone. See where you stand, or share your squares.' : 'Interview ideas from 5 topics, the same for everyone today. English or Hebrew.',
      ),
    ),
    squares
      ? h(
          'ol.quiz-squares',
          { 'aria-label': `${done.correct} of ${done.total} correct` },
          squares.map((ok, i) => h(`li.quiz-square${ok ? '.is-correct' : '.is-wrong'}`, { title: `Question ${i + 1}: ${ok ? 'correct' : 'wrong'}` })),
        )
      : null,
    h(
      'div.today-quiz-side',
      {},
      streak ? h('span.quiz-streak-badge', { title: 'Days in a row with the daily quiz' }, `${streak}-day streak`) : null,
      done ? h('a.btn.btn-secondary.btn-sm', { href: '#/quiz/board' }, 'Leaderboard') : h('a.btn.btn-secondary.btn-sm.today-quiz-cta', { href: '#/quiz/daily' }, "Play today's quiz"),
    ),
  );
}
