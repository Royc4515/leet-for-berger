/**
 * Which reminders are due right now (stage F7, the pure layer under the bell, the toast and,
 * later, Web Push). Every channel asks the same question with the same facts, so a reminder reads
 * the same on the page and on the phone; a channel decides only how and how often it delivers.
 *
 * Rules (thresholds below, each with its reason):
 * - streak: the coding streak is alive (through yesterday, or through the rest day before it) and
 *   nothing is accepted today. Never on the rest day itself: nothing ends that night.
 * - quiz-streak: the same for the daily quiz.
 * - unfinished: the most recently touched problem that is not solved, last submitted or edited
 *   UNFINISHED_MIN_DAYS to UNFINISHED_MAX_DAYS days ago.
 * - away: nothing done for AWAY_DAYS days or more. It carries the problem to resume and replaces
 *   unfinished while it shows: one nudge back, not two.
 *
 * Days are local calendar days (state/progress.js dayKey), as the streaks are.
 * Pure: no DOM, no storage, `now` is always a parameter.
 */
import { dayKey, computeStreak } from '../state/progress.js';
import { daysBetween, msUntilNextDaily, formatCountdown } from './daily.js';

/**
 * @typedef {'streak'|'quiz-streak'|'away'|'unfinished'} NotificationKind
 */

/** Every kind, in the order they rank when several are due: a streak ends at midnight, the rest can wait. */
export const NOTIFICATION_KINDS = /** @type {NotificationKind[]} */ (['streak', 'quiz-streak', 'away', 'unfinished']);

/** A day's pause is normal; from the second calendar day without a touch, the problem was left. */
export const UNFINISHED_MIN_DAYS = 2;
/** After two weeks a half-done problem is history, not a task; reminding then is noise. */
export const UNFINISHED_MAX_DAYS = 14;
/** A week without any practice: long enough to be a break, short enough to come back from. */
export const AWAY_DAYS = 7;
/** In the last hours before midnight a streak reminder is urgent and ranks first. */
export const STREAK_URGENT_MS = 4 * 3600 * 1000;

/**
 * @typedef {{ status?: string, history?: { at: string, language?: string }[] }} ProblemFacts
 * @typedef {{ problemId: string, lang: string, at: string }} DraftEdit
 * @typedef {{
 *   activeDays: string[],
 *   problems: Record<string, ProblemFacts>,
 *   quizDays?: string[],
 *   drafts?: DraftEdit[],
 * }} Facts
 * `activeDays` and `problems` are the progress state's (state/progress.js); `quizDays` are the days
 * with a finished daily quiz (the keys of state/quiz-progress.js `daily`); `drafts` are real edits
 * (state/drafts.js listDraftEdits). Leave `drafts` out where there are none (the server).
 */

/**
 * @typedef {{ kind: NotificationKind, key: string, urgent: boolean, data: Record<string, any> }} Notification
 * `key` names this one occurrence. Dismissing it hides it until the facts behind it change: a new
 * day for a streak, a new touch for a problem, a new absence for away.
 */

/**
 * The latest touch per problem: a submission or a draft edit, whichever is newer.
 * @param {Facts} facts
 * @returns {Map<string, { t: number, lang: string|null }>}
 */
function touches(facts) {
  const out = new Map();
  const note = (id, at, lang) => {
    const t = Date.parse(at);
    if (!Number.isFinite(t)) return;
    const prev = out.get(id);
    if (!prev || t > prev.t) out.set(id, { t, lang: lang ?? prev?.lang ?? null });
  };
  for (const [id, p] of Object.entries(facts.problems ?? {})) for (const h of p.history ?? []) note(id, h.at, h.language);
  for (const d of facts.drafts ?? []) note(d.problemId, d.at, d.lang);
  return out;
}

/**
 * The most recently touched problem that is not solved, among those `fits` accepts.
 * Ties go to the smaller id, so the answer never depends on object key order.
 * @param {Facts} facts
 * @param {Map<string, { t: number, lang: string|null }>} touched
 * @param {(t: number) => boolean} fits
 * @returns {{ problemId: string, lang: string|null, t: number }|null}
 */
function latestUnsolved(facts, touched, fits) {
  let best = null;
  for (const [id, touch] of touched) {
    if (facts.problems?.[id]?.status === 'solved' || !fits(touch.t)) continue;
    if (!best || touch.t > best.t || (touch.t === best.t && id < best.problemId)) best = { problemId: id, ...touch };
  }
  return best;
}

/**
 * The last day with any practice: an Accepted, a submission, a draft edit or a daily quiz.
 * @param {Facts} facts
 * @param {Map<string, { t: number }>} touched
 * @returns {string|null} null for someone who has never done anything (the start block greets them)
 */
function lastActiveDay(facts, touched) {
  let last = null;
  const see = (day) => {
    if (day && (!last || day > last)) last = day;
  };
  for (const d of facts.activeDays ?? []) see(d);
  for (const d of facts.quizDays ?? []) see(d);
  for (const { t } of touched.values()) see(dayKey(new Date(t)));
  return last;
}

/**
 * The reminders due now, most pressing first (urgent first, then NOTIFICATION_KINDS order).
 * @param {Facts} facts
 * @param {Date} now
 * @param {{ settings?: Partial<Record<NotificationKind, boolean>>, dismissed?: Record<string, string>, restDay?: number|null }} [prefs]
 *   `settings`: a kind set to false is off (absent means on); `dismissed`: keys the user closed
 *   (state/notifications.js); `restDay`: the user's streak rest day (state/progress.js restDayOf)
 * @returns {Notification[]}
 */
export function dueNotifications(facts, now, { settings = {}, dismissed = {}, restDay = null } = {}) {
  const today = dayKey(now);
  const msLeft = msUntilNextDaily(now);
  const urgent = msLeft <= STREAK_URGENT_MS;
  const restToday = now.getDay() === restDay;
  const out = [];

  // Today not done yet, so a streak above 0 is the one that ends at midnight.
  const atRisk = (days) => (restToday || days.includes(today) ? 0 : computeStreak(days, now, restDay));
  const coding = atRisk(facts.activeDays ?? []);
  if (coding > 0) out.push({ kind: 'streak', key: `streak:${today}`, urgent, data: { streak: coding, msLeft } });
  const quiz = atRisk(facts.quizDays ?? []);
  if (quiz > 0) out.push({ kind: 'quiz-streak', key: `quiz-streak:${today}`, urgent, data: { streak: quiz, msLeft } });

  const touched = touches(facts);
  const last = lastActiveDay(facts, touched);
  const idleDays = (t) => daysBetween(dayKey(new Date(t)), today);
  if (last && daysBetween(last, today) >= AWAY_DAYS) {
    const resume = latestUnsolved(facts, touched, () => true);
    out.push({
      kind: 'away',
      key: `away:${last}`,
      urgent: false,
      data: { days: daysBetween(last, today), lastDay: last, resume: resume && { problemId: resume.problemId, lang: resume.lang } },
    });
  } else {
    const left = latestUnsolved(facts, touched, (t) => idleDays(t) >= UNFINISHED_MIN_DAYS && idleDays(t) <= UNFINISHED_MAX_DAYS);
    if (left) {
      const day = dayKey(new Date(left.t));
      out.push({ kind: 'unfinished', key: `unfinished:${left.problemId}:${day}`, urgent: false, data: { problemId: left.problemId, lang: left.lang, days: idleDays(left.t) } });
    }
  }

  const rank = (n) => (n.urgent ? 0 : NOTIFICATION_KINDS.length) + NOTIFICATION_KINDS.indexOf(n.kind);
  return out.filter((n) => settings[n.kind] !== false && !Object.hasOwn(dismissed, n.key)).sort((a, b) => rank(a) - rank(b));
}

/**
 * What a notification says on the page, and where its button goes. No exclamation marks: none of
 * these is a success.
 * @param {Notification} n
 * @param {{ problemTitle?: (problemId: string) => string|null|undefined }} [names] the catalog's title for a problem
 * @returns {{ title: string, body: string, href: string, action: string }|null} null when it would
 *   name a problem the catalog does not have (the caller shows nothing rather than an id)
 */
export function notificationCopy(n, { problemTitle = () => null } = {}) {
  const days = (d) => (d === 1 ? '1 day' : `${d} days`);
  switch (n.kind) {
    case 'streak':
      return {
        title: n.data.streak > 1 ? `Keep your ${n.data.streak}-day streak` : 'Keep your streak going',
        body: `Solve one problem today. ${formatCountdown(n.data.msLeft)} left.`,
        href: '#/daily',
        action: "Today's problem",
      };
    case 'quiz-streak':
      return {
        title: n.data.streak > 1 ? `Keep your ${n.data.streak}-day quiz streak` : 'Keep your quiz streak going',
        body: `Play today's daily quiz. ${formatCountdown(n.data.msLeft)} left.`,
        href: '#/quiz/daily',
        action: 'Play the daily quiz',
      };
    case 'unfinished': {
      const name = problemTitle(n.data.problemId);
      if (!name) return null;
      return { title: `Finish ${name}`, body: `You left it ${days(n.data.days)} ago, not solved yet.`, href: `#/problem/${n.data.problemId}`, action: 'Continue' };
    }
    case 'away': {
      const id = n.data.resume?.problemId;
      const name = id ? problemTitle(id) : null;
      return name
        ? { title: 'Welcome back', body: `It has been ${days(n.data.days)}. Pick up ${name} where you left it.`, href: `#/problem/${id}`, action: 'Continue' }
        : { title: 'Welcome back', body: `It has been ${days(n.data.days)}. Today's problem is a good way back in.`, href: '#/daily', action: "Today's problem" };
    }
    default:
      return null;
  }
}
