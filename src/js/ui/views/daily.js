/**
 * Daily challenge (#/daily): today's problem, the streak, a rolling 30-day count, a 16-week hex
 * calendar that opens on this week, and the last seven dailies. Everything is computed from the
 * user's own progress and the deterministic daily pick; nothing is invented (no leaderboards).
 */
import { shareButton } from '../share.js';
import { dailyShare } from '../../data/share.js';
import { h, mount, difficulty, stateBlock, loadingState, hexMark, tp, pageLang } from '../dom.js';
import { siteFooter } from '../footer.js';
import { catalogEntry } from '../../problems/index.js';
import { dailyProblem, dailyCandidates } from '../../data/recommend.js';
import { calendarWeeks, bestStreak, activeInWindow, shiftDay, dailyNumber, parseDay, msUntilNextDaily, formatCountdown } from '../../data/daily.js';
import { dayKey, computeStreak, restDayOf } from '../../state/progress.js';
import { loadPath } from '../../data/path-loader.js';
import { dailyCard, pathTopicOf } from '../daily-card.js';
import { DAILY_QUIZ_SIZE, dailyQuizNumber } from '../../modes/quiz.js';
import { loadQuizProgress, dailyQuizStreak } from '../../state/quiz-progress.js';

const LONG_OPTS = { weekday: 'long', day: 'numeric', month: 'long' };
const SHORT_OPTS = { weekday: 'short', day: 'numeric', month: 'short' };
const MONTH_OPTS = { month: 'short' };
// By getDay() (Sunday = 0): each calendar row is named from its own date, since Hebrew weeks start
// on Sunday and English ones on Monday.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_HE_LETTER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
/** By getDay(), for the rest day line and the calendar's row names for screen readers. */
const REST_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const REST_NAMES_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
/** "3 ימים" with its own singular. */
const heDays = (n) => (n === 1 ? 'יום אחד' : `${n} ימים`);

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderDaily(root, { store }) {
  let disposed = false;
  let path = null;
  let timer = 0;
  mount(root, h('div.page', {}, loadingState({ label: tp('Loading the daily challenge...', 'טוען את האתגר היומי…') })));

  function render() {
    const state = store.get();
    const now = new Date();
    const lang = pageLang();
    const he = lang === 'he';
    // Made per render: the page language is known only now.
    const locale = he ? 'he-IL' : 'en-GB';
    const LONG = new Intl.DateTimeFormat(locale, LONG_OPTS);
    const SHORT = new Intl.DateTimeFormat(locale, SHORT_OPTS);
    const MONTH = new Intl.DateTimeFormat(locale, MONTH_OPTS);
    const today = dayKey(now);
    const candidates = dailyCandidates(path);
    const dailyFor = (d) => dailyProblem(candidates, d);
    const isSolved = (id) => state.problems[id]?.status === 'solved';
    const rest = restDayOf(state);
    const weeks = calendarWeeks({ today, weeks: 16, activeDays: state.activeDays, dailyFor, isSolved, restDay: rest, weekStart: he ? 0 : 1 });
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
      { role: 'grid', 'aria-label': tp('16 weeks of practice, this week last', '16 שבועות של תרגול, השבוע הנוכחי בסוף'), 'aria-readonly': 'true' },
      h('div.cal-months', { role: 'row', 'aria-hidden': 'true' }, h('span.cal-corner'), months.map((m) => h('span.cal-month', {}, m))),
      weeks[0].map((first, row) => {
        const i = parseDay(first.day).getDay();
        // Hebrew prints the weekday's letter; screen readers get the full name.
        const wd = he
          ? row % 2 === 0
            ? [h('span', { 'aria-hidden': 'true' }, WEEKDAYS_HE_LETTER[i]), h('span.sr-only', {}, REST_NAMES_HE[i])]
            : h('span.sr-only', {}, REST_NAMES_HE[i])
          : row % 2 === 0
            ? WEEKDAYS[i]
            : h('span.sr-only', {}, WEEKDAYS[i]);
        return h(
          'div.cal-row',
          { role: 'row' },
          h('span.cal-wd', { role: 'rowheader' }, wd),
          weeks.map((w) => {
            const d = w[row];
            const title = catalogEntry(d.dailyId ?? '')?.title;
            const date = SHORT.format(parseDay(d.day));
            const label = he
              ? d.future
                ? `${date}${d.rest ? ', יום מנוחה' : ''}: עוד לא הגיע`
                : `${date}${d.rest ? ', יום מנוחה' : ''}: ${d.active ? 'נפתרה בעיה' : d.rest ? 'הרצף נשמר' : 'בלי פתרון'}${title ? `. האתגר היומי: ${title}, ${d.dailySolved ? 'נפתר' : 'עוד לא נפתר'}` : ''}`
              : d.future
                ? `${date}${d.rest ? ', rest day' : ''}: still to come`
                : `${date}${d.rest ? ', rest day' : ''}: ${d.active ? 'solved something' : d.rest ? 'your streak rests' : 'no solve'}${title ? `. Daily: ${title}, ${d.dailySolved ? 'solved' : 'not solved yet'}` : ''}`;
            return h(
              `span.cal-day${d.active ? '.is-active' : ''}${d.dailySolved ? '.is-daily' : ''}${d.today ? '.is-today' : ''}${d.future ? '.is-future' : ''}${d.rest ? '.is-rest' : ''}`,
              // --d: the cell's diagonal, so the calendar fills in as a wave from the top left.
              { role: 'gridcell', title: label, style: { '--d': String(weeks.indexOf(w) + row) } },
              h('span.sr-only', {}, label),
            );
          }),
        );
      }),
    );

    mount(
      root,
      h(
        'div.page.daily-page',
        {},
        h(
          'header.page-head',
          {},
          h(
            'div',
            {},
            h('span.eyebrow', {}, LONG.format(now)),
            h('h1', {}, tp('Daily challenge', 'האתגר היומי')),
            h('p.page-sub', {}, tp('One problem a day, the same for everyone, picked from the learning path. A new one at midnight, your time.', 'בעיה אחת ביום, זהה לכולם, מתוך מסלול הלמידה. בעיה חדשה בכל חצות, לפי השעון המקומי.')),
          ),
          dailyFor(today)
            ? shareButton({
                name: tp("Share today's daily challenge", 'לשתף את האתגר של היום'),
                get: (lang) => dailyShare({ number: dailyNumber(today), title: catalogEntry(dailyFor(today))?.title ?? dailyFor(today), solved: isSolved(dailyFor(today)), streak, lang }),
              })
            : null,
        ),
        dailyCard({ path, state, now, headingId: 'daily-today' }),
        h(
          'section.daily-facts',
          { 'aria-label': tp('Your streak', 'הרצף שלך') },
          he
            ? fact(`${streak}`, streak === 1 ? 'יום ברצף' : 'ימים ברצף', `${streak ? 'בעיה אחת ביום שומרת על הרצף.' : 'כל בעיה שנפתרת היום מתחילה רצף.'}${rest === null ? '' : ` יום המנוחה שלך: ${REST_NAMES_HE[rest]}.`}`)
            : fact(`${streak}`, 'day streak', `${streak ? 'Solve one problem a day to keep it.' : 'Solve any problem today to start one.'}${rest === null ? '' : ` ${REST_NAMES[rest]} is your rest day.`}`),
          fact(`${best}`, tp('best streak', 'רצף שיא'), tp('Your longest run.', 'הרצף הארוך ביותר שלך.')),
          fact(`${last30}`, tp('of the last 30 days', 'מתוך 30 הימים האחרונים'), tp('Days with an accepted solve. A missed day does not reset this.', 'ימים עם פתרון שהתקבל. יום שפוספס לא מאפס את המספר הזה.')),
          fact(`${dailiesSolved} / 8`, tp('dailies this week', 'אתגרים יומיים השבוע'), tp('Today and the 7 days before it.', 'היום ו-7 הימים שלפניו.')),
        ),
        quizCard(today, now),
        h(
          'section.daily-cal-card',
          { 'aria-labelledby': 'cal-title' },
          h(
            'div.daily-cal-head',
            {},
            h('h2.section-title', { id: 'cal-title' }, tp('Last 16 weeks', '16 השבועות האחרונים')),
            h(
              'ul.cal-legend',
              { 'aria-label': tp('Legend', 'מקרא') },
              h('li', {}, h('span.cal-day.is-active', { 'aria-hidden': 'true' }), tp('Solved something', 'נפתרה בעיה')),
              h('li', {}, h('span.cal-day.is-active.is-daily', { 'aria-hidden': 'true' }), tp('Solved that day\'s daily', 'נפתר האתגר של אותו יום')),
              h('li', {}, h('span.cal-day', { 'aria-hidden': 'true' }), tp('No solve', 'בלי פתרון')),
              rest === null ? null : h('li', {}, h('span.cal-day.is-rest', { 'aria-hidden': 'true' }), tp('Rest day', 'יום מנוחה')),
            ),
          ),
          h('div.cal-scroll', {}, cal),
          h('p.hint-text', {}, activeText(state.activeDays.filter((d) => d >= weeks[0][0].day).length)),
        ),
        h(
          'section.daily-past',
          { 'aria-labelledby': 'past-title' },
          h('h2.section-title', { id: 'past-title' }, tp('Earlier this week', 'בשבוע האחרון')),
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
                h('span.past-no', {}, tp(`No. ${dailyNumber(d)}`, `מס׳ ${dailyNumber(d)}`)),
                h('span.past-date', {}, SHORT.format(parseDay(d))),
                h('a.past-title', { href: `#/problem/${id}` }, e.title, h('span.sr-only', {}, solved ? tp(', solved', ', נפתרה') : tp(', not solved', ', לא נפתרה'))),
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
        h('span.eyebrow', {}, tp(`Quiz No. ${dailyQuizNumber(today)}`, `חידון מס׳ ${dailyQuizNumber(today)}`)),
        h('h2.section-title#daily-quiz-title', {}, tp('Daily quiz', 'החידון היומי')),
        h(
          'p.hint-text',
          {},
          done
            ? tp(`Done: ${done.correct} / ${done.total} correct. ${streak}-day quiz streak.`, `הושלם: ${done.correct} / ${done.total} נכונות. רצף חידון של ${heDays(streak)}.`)
            : tp(
                `${DAILY_QUIZ_SIZE} multiple-choice questions from ${DAILY_QUIZ_SIZE} topics, about two minutes.${streak ? ` ${streak}-day quiz streak, keep it going.` : ''}`,
                `${DAILY_QUIZ_SIZE} שאלות אמריקאיות מ-${DAILY_QUIZ_SIZE} נושאים, בערך 2 דקות.${streak ? ` רצף חידון של ${heDays(streak)}, כדאי להמשיך.` : ''}`,
              ),
        ),
      ),
      h(`a.btn.btn-sm${done ? '.btn-ghost' : '.btn-secondary'}`, { href: '#/quiz/daily' }, done ? tp('See result', 'לראות את התוצאה') : tp('Play the quiz', 'לשחק בחידון')),
    );
  };

  /** "12 active days in these 16 weeks." */
  const activeText = (n) => tp(`${n} active days in these 16 weeks.`, `${n === 1 ? 'יום פעיל אחד' : `${n} ימים פעילים`} ב-16 השבועות האלה.`);

  const fact = (value, label, note) => h('div.daily-fact', {}, h('div.daily-fact-value', {}, value), h('div.daily-fact-label', {}, label), h('p.hint-text', {}, note));

  loadPath().then((p) => {
    if (disposed) return;
    if (!p) {
      mount(
        root,
        h(
          'div.page.page-narrow',
          {},
          stateBlock({
            title: tp('Could not load the daily challenge', 'לא הצלחנו לטעון את האתגר היומי'),
            body: tp('Check your connection and reload.', 'כדאי לבדוק את החיבור ולטעון מחדש.'),
            kind: 'error',
            headingTag: 'h1',
            action: { label: tp('Reload', 'לטעון מחדש'), onClick: () => location.reload() },
          }),
          siteFooter(),
        ),
      );
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
      if (el) el.textContent = tp(`Next in ${formatCountdown(msUntilNextDaily(now))}`, `הבאה בעוד ${formatCountdown(msUntilNextDaily(now), 'he')}`);
    }, 60000);
  });
  const unsub = store.subscribe(() => path && !disposed && render());
  return () => {
    disposed = true;
    clearInterval(timer);
    unsub();
  };
}
