/**
 * Daily challenge (#/daily): today's problem, the streak, a rolling 30-day count, a 16-week hex
 * calendar that opens on this week, and the last seven dailies. Everything is computed from the
 * user's own progress and the deterministic daily pick; nothing is invented (no leaderboards).
 */
import { shareButton } from '../share.js';
import { dailyShare } from '../../data/share.js';
import { h, mount, difficulty, stateBlock, loadingState, hexMark } from '../dom.js';
import { siteFooter } from '../footer.js';
import { catalogEntry } from '../../problems/index.js';
import { dailyProblem, dailyCandidates } from '../../data/recommend.js';
import { calendarWeeks, bestStreak, activeInWindow, shiftDay, dailyNumber, parseDay, msUntilNextDaily, formatCountdown } from '../../data/daily.js';
import { dayKey, computeStreak, restDayOf } from '../../state/progress.js';
import { loadPath } from '../../data/path-loader.js';
import { dailyCard, pathTopicOf } from '../daily-card.js';
import { DAILY_QUIZ_SIZE, dailyQuizNumber } from '../../modes/quiz.js';
import { loadQuizProgress, dailyQuizStreak } from '../../state/quiz-progress.js';

const LONG = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const SHORT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** By getDay(), for the rest day line. */
const REST_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderDaily(root, { store }) {
  let disposed = false;
  let path = null;
  let timer = 0;
  mount(root, h('div.page', {}, loadingState({ label: 'Loading the daily challenge...' })));

  function render() {
    const state = store.get();
    const now = new Date();
    const today = dayKey(now);
    const candidates = dailyCandidates(path);
    const dailyFor = (d) => dailyProblem(candidates, d);
    const isSolved = (id) => state.problems[id]?.status === 'solved';
    const rest = restDayOf(state);
    const weeks = calendarWeeks({ today, weeks: 16, activeDays: state.activeDays, dailyFor, isSolved, restDay: rest });
    const streak = computeStreak(state.activeDays, now, rest);
    const best = bestStreak(state.activeDays, rest);
    const last30 = activeInWindow(state.activeDays, today, 30);
    const past = Array.from({ length: 7 }, (_, i) => shiftDay(today, i + 1));
    const dailiesSolved = [today, ...past].filter((d) => isSolved(dailyFor(d))).length;

    const months = weeks.map((w, i) => {
      const first = parseDay(w[0].day);
      const prev = i ? parseDay(weeks[i - 1][0].day) : null;
      return !prev || prev.getMonth() !== first.getMonth() ? MONTH.format(first) : '';
    });

    const cal = h(
      'div.cal',
      { role: 'grid', 'aria-label': '16 weeks of practice, this week last', 'aria-readonly': 'true' },
      h('div.cal-months', { role: 'row', 'aria-hidden': 'true' }, h('span.cal-corner'), months.map((m) => h('span.cal-month', {}, m))),
      WEEKDAYS.map((wd, row) =>
        h(
          'div.cal-row',
          { role: 'row' },
          h('span.cal-wd', { role: 'rowheader' }, row % 2 === 0 ? wd : h('span.sr-only', {}, wd)),
          weeks.map((w) => {
            const d = w[row];
            const title = catalogEntry(d.dailyId ?? '')?.title;
            const restNote = d.rest ? ', rest day' : '';
            const label = d.future
              ? `${SHORT.format(parseDay(d.day))}${restNote}: still to come`
              : `${SHORT.format(parseDay(d.day))}${restNote}: ${d.active ? 'solved something' : d.rest ? 'your streak rests' : 'no solve'}${title ? `. Daily: ${title}, ${d.dailySolved ? 'solved' : 'not solved yet'}` : ''}`;
            return h(
              `span.cal-day${d.active ? '.is-active' : ''}${d.dailySolved ? '.is-daily' : ''}${d.today ? '.is-today' : ''}${d.future ? '.is-future' : ''}${d.rest ? '.is-rest' : ''}`,
              // --d: the cell's diagonal, so the calendar fills in as a wave from the top left.
              { role: 'gridcell', title: label, style: { '--d': String(weeks.indexOf(w) + row) } },
              h('span.sr-only', {}, label),
            );
          }),
        ),
      ),
    );

    mount(
      root,
      h(
        'div.page.daily-page',
        {},
        h(
          'header.page-head',
          {},
          h('div', {}, h('span.eyebrow', {}, LONG.format(now)), h('h1', {}, 'Daily challenge'), h('p.page-sub', {}, 'One problem a day, the same for everyone, picked from the learning path. A new one at midnight, your time.')),
          dailyFor(today)
            ? shareButton({
                name: "Share today's daily challenge",
                get: (lang) => dailyShare({ number: dailyNumber(today), title: catalogEntry(dailyFor(today))?.title ?? dailyFor(today), solved: isSolved(dailyFor(today)), streak, lang }),
              })
            : null,
        ),
        dailyCard({ path, state, now, headingId: 'daily-today' }),
        h(
          'section.daily-facts',
          { 'aria-label': 'Your streak' },
          fact(`${streak}`, 'day streak', `${streak ? 'Solve one problem a day to keep it.' : 'Solve any problem today to start one.'}${rest === null ? '' : ` ${REST_NAMES[rest]} is your rest day.`}`),
          fact(`${best}`, 'best streak', 'Your longest run.'),
          fact(`${last30}`, 'of the last 30 days', 'Days with an accepted solve. A missed day does not reset this.'),
          fact(`${dailiesSolved} / 8`, 'dailies this week', 'Today and the 7 days before it.'),
        ),
        quizCard(today, now),
        h(
          'section.daily-cal-card',
          { 'aria-labelledby': 'cal-title' },
          h('div.daily-cal-head', {}, h('h2.section-title', { id: 'cal-title' }, 'Last 16 weeks'), h('ul.cal-legend', { 'aria-label': 'Legend' }, h('li', {}, h('span.cal-day.is-active', { 'aria-hidden': 'true' }), 'Solved something'), h('li', {}, h('span.cal-day.is-active.is-daily', { 'aria-hidden': 'true' }), 'Solved that day\'s daily'), h('li', {}, h('span.cal-day', { 'aria-hidden': 'true' }), 'No solve'), rest === null ? null : h('li', {}, h('span.cal-day.is-rest', { 'aria-hidden': 'true' }), 'Rest day'))),
          h('div.cal-scroll', {}, cal),
          h('p.hint-text', {}, `${state.activeDays.filter((d) => d >= weeks[0][0].day).length} active days in these 16 weeks.`),
        ),
        h(
          'section.daily-past',
          { 'aria-labelledby': 'past-title' },
          h('h2.section-title', { id: 'past-title' }, 'Earlier this week'),
          h(
            'ol.past-list',
            {},
            past.map((d) => {
              const id = dailyFor(d);
              const e = id ? catalogEntry(id) : null;
              if (!e) return null;
              const solved = isSolved(id);
              return h(
                'li.past-row',
                {},
                hexMark(solved ? 'solved' : state.problems[id] ? 'attempted' : 'new'),
                h('span.past-no', {}, `No. ${dailyNumber(d)}`),
                h('span.past-date', {}, SHORT.format(parseDay(d))),
                h('a.past-title', { href: `#/problem/${id}` }, e.title, h('span.sr-only', {}, solved ? ', solved' : ', not solved')),
                h('span.past-topic', {}, pathTopicOf(path, id) ?? ''),
                difficulty(e.difficulty),
              );
            }),
          ),
        ),
        siteFooter(),
      ),
    );
  }

  // The daily quiz sits under the daily problem: same day, same countdown, its own streak.
  const quizCard = (today, now) => {
    const quiz = loadQuizProgress();
    const done = quiz.daily[today];
    const streak = dailyQuizStreak(quiz, now, restDayOf(store.get()));
    return h(
      'section.daily-quiz-card',
      { 'aria-labelledby': 'daily-quiz-title' },
      h(
        'div.daily-quiz-copy',
        {},
        h('span.eyebrow', {}, `Quiz No. ${dailyQuizNumber(today)}`),
        h('h2.section-title#daily-quiz-title', {}, 'Daily quiz'),
        h('p.hint-text', {}, done ? `Done: ${done.correct} / ${done.total} correct. ${streak}-day quiz streak.` : `${DAILY_QUIZ_SIZE} multiple-choice questions from ${DAILY_QUIZ_SIZE} topics, about two minutes.${streak ? ` ${streak}-day quiz streak, keep it going.` : ''}`),
      ),
      h(`a.btn.btn-sm${done ? '.btn-ghost' : '.btn-secondary'}`, { href: '#/quiz/daily' }, done ? 'See result' : 'Play the quiz'),
    );
  };

  const fact = (value, label, note) => h('div.daily-fact', {}, h('div.daily-fact-value', {}, value), h('div.daily-fact-label', {}, label), h('p.hint-text', {}, note));

  loadPath().then((p) => {
    if (disposed) return;
    if (!p) {
      mount(root, h('div.page.page-narrow', {}, stateBlock({ title: 'Could not load the daily challenge', body: 'Check your connection and reload.', kind: 'error', headingTag: 'h1', action: { label: 'Reload', onClick: () => location.reload() } }), siteFooter()));
      return;
    }
    path = p;
    render();
    // The countdown shows minutes, so a minute tick is enough. Only its text changes (a full
    // re-render would steal keyboard focus), unless the day rolled over at midnight.
    let shownDay = dayKey(new Date());
    timer = setInterval(() => {
      const now = new Date();
      if (dayKey(now) !== shownDay) {
        shownDay = dayKey(now);
        render();
        return;
      }
      const el = root.querySelector('.today-countdown');
      if (el) el.textContent = `Next in ${formatCountdown(msUntilNextDaily(now))}`;
    }, 60000);
  });
  const unsub = store.subscribe(() => path && !disposed && render());
  return () => {
    disposed = true;
    clearInterval(timer);
    unsub();
  };
}
