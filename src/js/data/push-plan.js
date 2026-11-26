/**
 * What a push says at one of the user's send hours (stage F7 step 3, ADR 0011). What is due comes
 * from data/notifications.js, the same rules as the bell; this decides the order and the count,
 * as the owner set them (2026-11-25):
 * - nothing on the user's rest day;
 * - at most one push per send hour, so no more in a day than the user has send hours (16:00 and
 *   20:00 unless they choose others);
 * - a streak that ends tonight comes first: both streaks at risk, one push each, the one not yet
 *   pushed today first; one streak at risk, that one at every send hour; none, none;
 * - then each at most once: a return after a few days away, a problem left unsolved, a new streak
 *   after a break.
 *
 * Pure. The server runs in UTC, so it passes `now` and the stored times as the user's wall clock
 * (toWallClock, zonedFacts): the rules read local fields, and those then show the user's calendar.
 */
import { dueNotifications, NOTIFICATION_KINDS } from './notifications.js';

/** Send hours of someone who has not chosen any (owner's decision): 16:00 and 20:00, their time. */
export const DEFAULT_PUSH_HOURS = [16, 20];
/** More than this is no longer a reminder; it is noise the user would turn off. */
export const MAX_PUSH_HOURS = 6;
/** Languages a push reminder can be written in (matches the site languages, docs/I18N.md). */
export const PUSH_LANGS = ['en', 'he'];

/**
 * True for a supported push language ('en' or 'he').
 * @param {unknown} lang
 * @returns {lang is 'en'|'he'}
 */
export function isPushLang(lang) {
  return lang === 'en' || lang === 'he';
}

/**
 * Normalizes a stored or incoming language to a supported push language, defaulting to 'en'.
 * @param {unknown} lang
 * @returns {'en'|'he'}
 */
export function normalizePushLang(lang) {
  return lang === 'he' ? 'he' : 'en';
}

/**
 * @typedef {{ hours: number[], off: import('./notifications.js').NotificationKind[] }} PushSettings
 * `hours`: whole local hours, 0 to 23, one push at most each; `off`: kinds never pushed.
 */

/**
 * Keeps only what makes sense: whole hours 0 to 23, sorted, unique, at most MAX_PUSH_HOURS (an empty
 * list means no pushes); known kinds. Missing hours are the default.
 * @param {any} raw
 * @returns {PushSettings}
 */
export function normalizePushSettings(raw) {
  const given = Array.isArray(raw?.hours) ? raw.hours : DEFAULT_PUSH_HOURS;
  const hours = [...new Set(given.filter((h) => Number.isInteger(h) && h >= 0 && h <= 23))].sort((a, b) => a - b).slice(0, MAX_PUSH_HOURS);
  const off = (Array.isArray(raw?.off) ? raw.off : []).filter((k) => NOTIFICATION_KINDS.includes(k));
  return { hours, off: [...new Set(off)] };
}

/**
 * The reminder to push now, or null.
 * @param {{
 *   facts: import('./notifications.js').Facts,
 *   now: Date,
 *   restDay?: number|null,
 *   settings?: any,
 *   sentToday?: { kind: string, key: string }[],
 *   sentKeys?: Iterable<string>,
 * }} input `now` and `facts` on the user's wall clock; `sentToday`: pushes already sent today;
 *   `sentKeys`: keys pushed recently, so a return, a problem or a break is pushed once
 * @returns {import('./notifications.js').Notification|null}
 */
export function pickPush({ facts, now, restDay = null, settings, sentToday = [], sentKeys = [] }) {
  const { hours, off } = normalizePushSettings(settings);
  if (now.getDay() === restDay) return null;
  if (sentToday.length >= hours.length) return null;
  const due = dueNotifications(facts, now, { settings: Object.fromEntries(off.map((k) => [k, false])), restDay });
  const streaks = due.filter((n) => n.kind === 'streak' || n.kind === 'quiz-streak');
  if (streaks.length) {
    // Both at risk: the one pushed fewer times today, which alternates them; a tie keeps the
    // coding streak first (the rules rank it first, and sort is stable). One at risk: always it.
    const pushed = (kind) => sentToday.filter((s) => s.kind === kind).length;
    return [...streaks].sort((a, b) => pushed(a.kind) - pushed(b.kind))[0];
  }
  const seen = new Set(sentKeys);
  return due.find((n) => !seen.has(n.key)) ?? null;
}

/**
 * True for a time zone this runtime knows (an IANA name such as "Asia/Jerusalem").
 * @param {unknown} timeZone
 * @returns {boolean}
 */
export function isTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * A Date whose local fields (getHours, getDate, ...) are the wall-clock time in `timeZone` at
 * `instant`, whatever zone runs the code. Built from the zone's own calendar fields, so it does not
 * assume the server's clock is UTC.
 * @param {Date} instant
 * @param {string} timeZone an IANA zone (isTimeZone)
 * @returns {Date}
 */
export function toWallClock(instant, timeZone) {
  const fields = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(instant)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  );
  return new Date(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second, instant.getMilliseconds());
}

/**
 * The facts with every stored time (submissions, draft edits) moved to the user's wall clock, as
 * toWallClock does for `now`. Day keys are already local to the user and stay as they are.
 * @param {import('./notifications.js').Facts} facts
 * @param {string} timeZone
 * @returns {import('./notifications.js').Facts}
 */
export function zonedFacts(facts, timeZone) {
  const zoned = (at) => {
    const t = Date.parse(at);
    return Number.isFinite(t) ? toWallClock(new Date(t), timeZone).toISOString() : at;
  };
  const problems = Object.fromEntries(
    Object.entries(facts.problems ?? {}).map(([id, p]) => [id, { ...p, ...(p.history ? { history: p.history.map((h) => ({ ...h, at: zoned(h.at) })) } : {}) }]),
  );
  return { ...facts, problems, ...(facts.drafts ? { drafts: facts.drafts.map((d) => ({ ...d, at: zoned(d.at) })) } : {}) };
}
