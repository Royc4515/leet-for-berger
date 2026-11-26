/**
 * The daily challenge card, shared by the Problems page hero and the Daily page: Daily No. N, the
 * date, today's problem with its difficulty and topic, a calm countdown (minutes, no seconds) to
 * the next one, and this week as seven hexes. Everything comes from local data: the deterministic
 * pick (data/recommend.js) and the user's own active days.
 */
import { h, difficulty, tp, pageLang } from './dom.js';
import { catalogEntry } from '../problems/index.js';
import { dailyProblem, dailyCandidates } from '../data/recommend.js';
import { dailyNumber, msUntilNextDaily, formatCountdown, calendarWeeks, bestStreak, parseDay } from '../data/daily.js';
import { dayKey, computeStreak, restDayOf } from '../state/progress.js';

const DATE_OPTS = { weekday: 'short', day: 'numeric', month: 'short' };
// By getDay() (Sunday = 0): each day is named from its own date, whichever day the week starts on.
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// The full name for screen readers, the letter Hebrew calendars print.
const WEEKDAY_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
const WEEKDAY_HE_LETTER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * Topic title of a path problem, from the essential path.
 * @param {import('../data/learning-path.js').PathTier[]} path
 * @param {string} id
 * @returns {string|null}
 */
export function pathTopicOf(path, id) {
  for (const tier of path) for (const tp of tier.topics) if (tp.problems.some((p) => p.id === id)) return tp.title;
  return null;
}

/**
 * Today's daily, or null when the path has no candidates.
 * @param {import('../data/learning-path.js').PathTier[]} path
 * @param {Date} now
 * @returns {{ id: string, entry: any, day: string, number: number }|null}
 */
export function todaysDaily(path, now) {
  const day = dayKey(now);
  const id = dailyProblem(dailyCandidates(path), day);
  const entry = id ? catalogEntry(id) : null;
  return entry ? { id, entry, day, number: dailyNumber(day) } : null;
}

/**
 * @param {{ path: any, state: any, now: Date, compact?: boolean, headingId?: string }} opts
 *   compact: the Problems page hero (links to the full Daily page)
 * @returns {HTMLElement|null}
 */
export function dailyCard({ path, state, now, compact = false, headingId = 'daily-title' }) {
  const daily = todaysDaily(path, now);
  if (!daily) return null;
  const done = state.problems[daily.id]?.status === 'solved';
  const topic = pathTopicOf(path, daily.id);
  const today = daily.day;
  const rest = restDayOf(state);
  const week = calendarWeeks({ today, weeks: 1, activeDays: state.activeDays, dailyFor: (d) => dailyProblem(dailyCandidates(path), d), isSolved: (id) => state.problems[id]?.status === 'solved', restDay: rest, weekStart: pageLang() === 'he' ? 0 : 1 })[0];
  const streak = computeStreak(state.activeDays, now, rest);
  const best = bestStreak(state.activeDays, rest);
  const lang = pageLang();
  // Made per render: the page language can differ between the Problems page and the Daily page.
  const dateFmt = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', DATE_OPTS);
  const dayState = (d) =>
    d.future ? 'still to come' : d.active ? 'solved something' : d.rest ? 'your streak rests' : d.today ? 'nothing solved yet' : 'no solve';
  const dayStateHe = (d) =>
    d.future ? 'עוד לא הגיע' : d.active ? 'נפתרה בעיה' : d.rest ? 'הרצף נשמר' : d.today ? 'עוד לא נפתרה בעיה' : 'בלי פתרון';
  const weekRow = h(
    'ol.week-row',
    { 'aria-label': tp('This week', 'השבוע') },
    week.map((d) => {
      const i = parseDay(d.day).getDay();
      return h(
        `li.week-day${d.active ? '.is-active' : ''}${d.today ? '.is-today' : ''}${d.future ? '.is-future' : ''}${d.rest ? '.is-rest' : ''}`,
        {},
        h('span.week-hex', { 'aria-hidden': 'true' }),
        h('span.week-label', { 'aria-hidden': 'true' }, tp(WEEKDAY[i][0], WEEKDAY_HE_LETTER[i])),
        h('span.sr-only', {}, tp(`${WEEKDAY[i]}${d.rest ? ', rest day' : ''}: ${dayState(d)}`, `${WEEKDAY_HE[i]}${d.rest ? ', יום מנוחה' : ''}: ${dayStateHe(d)}`)),
      );
    }),
  );
  return h(
    `section.today-card.today-daily${done ? '.is-done' : ''}`,
    { 'aria-labelledby': headingId },
    h(
      'div.today-daily-copy',
      {},
      h('div.today-kicker', { id: headingId }, h('span.daily-no', {}, tp(`Daily No. ${daily.number}`, `אתגר יומי מס׳ ${daily.number}`)), h('span', {}, ` · ${dateFmt.format(now)}`)),
      h('h2.today-main', {}, h('a.problem-link', { href: `#/problem/${daily.id}` }, daily.entry.title)),
      h(
        'div.today-meta',
        {},
        difficulty(daily.entry.difficulty),
        topic ? h('span', {}, topic) : null,
        done ? h('span.tag.tag-lamp', {}, tp('Solved today', 'נפתרה היום')) : null,
        h('span.today-countdown', {}, tp(`Next in ${formatCountdown(msUntilNextDaily(now))}`, `הבאה בעוד ${formatCountdown(msUntilNextDaily(now), 'he')}`)),
      ),
      h('div.today-actions', {}, h('a.btn.btn-primary.today-cta', { href: `#/problem/${daily.id}` }, done ? tp('Review', 'לחזור לבעיה') : tp('Solve today', 'לפתור היום')), compact ? h('a.btn.btn-ghost.btn-sm', { href: '#/daily' }, tp('Calendar', 'ללוח השנה')) : null),
    ),
    h(
      'div.today-week',
      {},
      weekRow,
      lang === 'he'
        ? h('p.today-streak', {}, h('strong', {}, `${streak}`), streak === 1 ? ' יום ברצף' : ' ימים ברצף', h('span', {}, ` · שיא ${best}`))
        : h('p.today-streak', {}, h('strong', {}, `${streak}`), '-day streak', h('span', {}, ` · best ${best}`)),
      h('p.hint-text', {}, tp('The same problem for everyone today.', 'היום כולם פותרים את אותה בעיה.')),
    ),
  );
}
