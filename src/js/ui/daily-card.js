/**
 * The daily challenge card, shared by the Problems page hero and the Daily page: Daily No. N, the
 * date, today's problem with its difficulty and topic, a calm countdown (minutes, no seconds) to
 * the next one, and this week as seven hexes. Everything comes from local data: the deterministic
 * pick (data/recommend.js) and the user's own active days.
 */
import { h, difficulty } from './dom.js';
import { catalogEntry } from '../problems/index.js';
import { dailyProblem, dailyCandidates } from '../data/recommend.js';
import { dailyNumber, msUntilNextDaily, formatCountdown, calendarWeeks, bestStreak } from '../data/daily.js';
import { dayKey, computeStreak, restDayOf } from '../state/progress.js';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const week = calendarWeeks({ today, weeks: 1, activeDays: state.activeDays, dailyFor: (d) => dailyProblem(dailyCandidates(path), d), isSolved: (id) => state.problems[id]?.status === 'solved', restDay: rest })[0];
  const streak = computeStreak(state.activeDays, now, rest);
  const best = bestStreak(state.activeDays, rest);
  const weekRow = h(
    'ol.week-row',
    { 'aria-label': 'This week' },
    week.map((d, i) =>
      h(
        `li.week-day${d.active ? '.is-active' : ''}${d.today ? '.is-today' : ''}${d.future ? '.is-future' : ''}${d.rest ? '.is-rest' : ''}`,
        {},
        h('span.week-hex', { 'aria-hidden': 'true' }),
        h('span.week-label', { 'aria-hidden': 'true' }, WEEKDAY[i][0]),
        h('span.sr-only', {}, `${WEEKDAY[i]}${d.rest ? ', rest day' : ''}: ${d.future ? 'still to come' : d.active ? 'solved something' : d.rest ? 'your streak rests' : d.today ? 'nothing solved yet' : 'no solve'}`),
      ),
    ),
  );
  return h(
    `section.today-card.today-daily${done ? '.is-done' : ''}`,
    { 'aria-labelledby': headingId },
    h(
      'div.today-daily-copy',
      {},
      h('div.today-kicker', { id: headingId }, h('span.daily-no', {}, `Daily No. ${daily.number}`), h('span', {}, ` · ${DATE_FMT.format(now)}`)),
      h('h2.today-main', {}, h('a.problem-link', { href: `#/problem/${daily.id}` }, daily.entry.title)),
      h(
        'div.today-meta',
        {},
        difficulty(daily.entry.difficulty),
        topic ? h('span', {}, topic) : null,
        done ? h('span.tag.tag-lamp', {}, 'Solved today') : null,
        h('span.today-countdown', {}, `Next in ${formatCountdown(msUntilNextDaily(now))}`),
      ),
      h('div.today-actions', {}, h('a.btn.btn-primary.today-cta', { href: `#/problem/${daily.id}` }, done ? 'Review' : 'Solve today'), compact ? h('a.btn.btn-ghost.btn-sm', { href: '#/daily' }, 'Calendar') : null),
    ),
    h(
      'div.today-week',
      {},
      weekRow,
      h('p.today-streak', {}, h('strong', {}, `${streak}`), '-day streak', h('span', {}, ` · best ${best}`)),
      h('p.hint-text', {}, 'The same problem for everyone today.'),
    ),
  );
}
