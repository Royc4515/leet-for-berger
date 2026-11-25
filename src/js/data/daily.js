/**
 * Daily challenge calendar maths: the daily's number, streaks, a rolling count and the 16-week
 * calendar the Daily page draws. All dates are local calendar days ("YYYY-MM-DD", the same keys
 * as state/progress.js dayKey), because a streak follows the user's midnight.
 *
 * Pure: no DOM, `now` is always a parameter.
 */
import { dayKey } from '../state/progress.js';

/** Day 1 of the daily challenge. Daily No. N counts calendar days from here. */
export const DAILY_EPOCH = '2026-01-01';

/** "YYYY-MM-DD" -> local Date at midnight. */
export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `a` to `b` (positive when b is later). DST-safe: rounds the hour drift. */
export function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400000);
}

/** The key `n` days before (negative: after) `key`. */
export function shiftDay(key, n) {
  const d = parseDay(key);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

/**
 * The daily's public number: 1 on DAILY_EPOCH, counting up one per calendar day.
 * @param {string} day
 * @returns {number}
 */
export function dailyNumber(day) {
  return daysBetween(DAILY_EPOCH, day) + 1;
}

/**
 * True when every day strictly between `a` and `b` (a before b) is the rest day; adjacent days qualify.
 * @param {string} a
 * @param {string} b
 * @param {number|null} restDay
 */
function onlyRestBetween(a, b, restDay) {
  const gap = daysBetween(a, b);
  if (gap === 1) return true;
  if (restDay === null) return false;
  for (let k = 1; k < gap; k++) if (parseDay(shiftDay(a, -k)).getDay() !== restDay) return false;
  return true;
}

/**
 * Longest run of consecutive active days ever. A rest day between two active days does not
 * break the run, as in state/progress.js computeStreak.
 * @param {string[]} activeDays day keys, any order, duplicates allowed
 * @param {number|null} [restDay] weekday, 0 Sunday to 6 Saturday; null: every day counts
 * @returns {number}
 */
export function bestStreak(activeDays, restDay = null) {
  const days = [...new Set(activeDays)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && onlyRestBetween(days[i - 1], days[i], restDay) ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/**
 * Active days in the last `window` days, today included. A habit measure that a missed day does
 * not reset (Strava's rolling counts), shown next to the streak.
 * @param {string[]} activeDays
 * @param {string} today
 * @param {number} [window]
 * @returns {number}
 */
export function activeInWindow(activeDays, today, window = 30) {
  const from = shiftDay(today, window - 1);
  return new Set(activeDays.filter((d) => d >= from && d <= today)).size;
}

/**
 * Milliseconds until the next local midnight, when the daily changes.
 * @param {Date} now
 * @returns {number}
 */
export function msUntilNextDaily(now) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

/**
 * "9 h 41 min" or "41 min": minutes only, no ticking seconds (a calm clock).
 * @param {number} ms
 * @returns {string}
 */
export function formatCountdown(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return hours ? `${hours} h ${min} min` : `${min} min`;
}

/**
 * @typedef {{ day: string, active: boolean, today: boolean, future: boolean, dailyId: string|null, dailySolved: boolean, rest: boolean }} CalendarDay
 */

/**
 * Weeks of days for the calendar, oldest week first, Monday first in each week; the last week
 * holds today, so the calendar opens on the present (GitHub's phone view opens on the oldest end).
 * @param {{ today: string, weeks?: number, activeDays: string[], dailyFor: (day: string) => string|null, isSolved: (id: string) => boolean, restDay?: number|null }} input
 *   `restDay` marks that weekday `rest` (the user's, state/progress.js restDayOf)
 * @returns {CalendarDay[][]}
 */
export function calendarWeeks({ today, weeks = 16, activeDays, dailyFor, isSolved, restDay = null }) {
  const active = new Set(activeDays);
  const weekday = (parseDay(today).getDay() + 6) % 7; // Monday = 0
  const start = shiftDay(today, weekday + (weeks - 1) * 7);
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = shiftDay(start, -(w * 7 + d));
      const future = day > today;
      const dailyId = future ? null : dailyFor(day);
      week.push({ day, active: active.has(day), today: day === today, future, dailyId, dailySolved: Boolean(dailyId && isSolved(dailyId)), rest: parseDay(day).getDay() === restDay });
    }
    out.push(week);
  }
  return out;
}
