/**
 * Web Push on this device (stage F7 step 3, part C, ADR 0011): what the browser can do, the send
 * hours the user picks, and the plain conversions the subscription needs. The browser calls live
 * in auth/push-client.js and the controls in ui/push-panel.js; everything here is pure, so it is
 * unit-tested in Node.
 */
import { DEFAULT_PUSH_HOURS, MAX_PUSH_HOURS } from './push-plan.js';

export { DEFAULT_PUSH_HOURS, MAX_PUSH_HOURS };

/**
 * @typedef {'ready'|'install'|'update'|'unsupported'} PushSupport
 * - ready: this browser can subscribe now
 * - install: an iPhone or iPad in a browser tab; push works once the site is on the Home Screen
 * - update: on the Home Screen of an iPhone or iPad too old for Web Push (before iOS 16.4)
 * - unsupported: this browser has no Web Push
 */

/**
 * An iPhone, iPod or iPad. iPadOS asks for desktop sites, so an iPad says "Macintosh" and is told
 * apart from a Mac by its touch screen.
 * @param {{ userAgent?: string, platform?: string, maxTouchPoints?: number }} nav
 * @returns {boolean}
 */
export function isAppleMobile({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return (platform === 'MacIntel' || /Macintosh/.test(userAgent)) && maxTouchPoints > 1;
}

/**
 * Whether this device can get push reminders, and if not, what the user can do about it.
 * Safari on an iPhone has no Push API in a tab at all: only a site opened from the Home Screen gets
 * one (iOS 16.4 and later), so a missing API there means "add it first", not "impossible".
 * @param {{ hasServiceWorker: boolean, hasPush: boolean, hasNotification: boolean, appleMobile: boolean, standalone: boolean }} env
 * @returns {PushSupport}
 */
export function pushSupport({ hasServiceWorker, hasPush, hasNotification, appleMobile, standalone }) {
  if (hasServiceWorker && hasPush && hasNotification) return 'ready';
  if (appleMobile) return standalone ? 'update' : 'install';
  return 'unsupported';
}

/**
 * The bytes of a VAPID public key, from the base64url text the push function serves (GET /key),
 * for `pushManager.subscribe({ applicationServerKey })`.
 * @param {string} base64url
 * @returns {Uint8Array}
 */
export function keyBytes(base64url) {
  if (typeof base64url !== 'string' || !/^[A-Za-z0-9_-]+$/.test(base64url)) throw new Error('Invalid key');
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * True when two keys hold the same bytes: a subscription made with another key must be replaced.
 * @param {ArrayBuffer|Uint8Array|null|undefined} a
 * @param {ArrayBuffer|Uint8Array|null|undefined} b
 */
export function sameKey(a, b) {
  if (!a || !b) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

/** "16:00": a send hour as the clock shows it. */
export const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;

/**
 * `angle` turned by whole circles to lie nearest `from`: a hex moving from 11:00 to 12:00 steps
 * 30 degrees forward instead of spinning back around the whole clock.
 * @param {number} from
 * @param {number} angle
 * @returns {number}
 */
export function nearestTurn(from, angle) {
  return angle + 360 * Math.round((from - angle) / 360);
}

/**
 * How lit an hour is, 0 at night to 1 at noon: the clock's day face brightens toward 12 with it.
 * @param {number} hour
 * @returns {number}
 */
export function daylight(hour) {
  // Rounded: cos(90 degrees) is 6e-17 in floating point, and 18:00 is night.
  return Math.round(Math.max(0, Math.cos(((hour - 12) * Math.PI) / 12)) * 1000) / 1000;
}

/**
 * Moves one send hour to another. Nothing changes when the target is taken or out of range.
 * @param {number[]} hours
 * @param {number} from
 * @param {number} to
 * @returns {number[]} sorted
 */
export function moveHour(hours, from, to) {
  if (!hours.includes(from) || !Number.isInteger(to) || to < 0 || to > 23 || (to !== from && hours.includes(to))) return hours;
  return hours.map((x) => (x === from ? to : x)).sort((a, b) => a - b);
}

/**
 * The next free hour from `from`, one step at a time in `dir` (1 later, -1 earlier), round the clock.
 * @param {number[]} hours
 * @param {number} from
 * @param {1|-1} dir
 * @returns {number} `from` itself when every other hour is taken
 */
export function stepHour(hours, from, dir) {
  for (let i = 1; i < 24; i++) {
    const h = (((from + dir * i) % 24) + 24) % 24;
    if (!hours.includes(h)) return h;
  }
  return from;
}

/* ---------- The clock: 12 positions, a day face and a night face ---------- */

/**
 * The two faces of the clock: day 06:00 to 17:00, night 18:00 to 05:00. Like a clock's hand, the
 * day passes the 6 at the bottom twice, and that is where one face turns into the other.
 * @param {number} hour
 * @returns {'day'|'night'}
 */
export const faceOf = (hour) => (hour >= 6 && hour < 18 ? 'day' : 'night');

/** Where an hour sits on the clock, in degrees clockwise from the 12 at the top. */
export const clockAngle = (hour) => (hour % 12) * 30;

/**
 * The clock position nearest a point from the centre (x right, y down): 0 at the top, 1 to 11 clockwise.
 * @param {number} dx
 * @param {number} dy
 * @returns {number}
 */
export function clockPos(dx, dy) {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return ((Math.round(deg / 30) % 12) + 12) % 12;
}

/**
 * The hour a clock position shows on a face: the day face reads 12 to 17 down the right and
 * 06 to 11 up the left; the night face 00 to 05 and 18 to 23.
 * @param {'day'|'night'} face
 * @param {number} pos 0 to 11
 * @returns {number}
 */
export function faceHour(face, pos) {
  if (face === 'day') return pos < 6 ? pos + 12 : pos;
  return pos < 6 ? pos : pos + 12;
}

/**
 * Of the two hours at a clock position (morning or evening), the one nearest in time to `from`:
 * a hex dragged past the 6 keeps going round the day, onto the other face.
 * @param {number} from
 * @param {number} pos 0 to 11
 * @returns {number}
 */
export function nearestAt(from, pos) {
  const dist = (x) => Math.min(Math.abs(x - from), 24 - Math.abs(x - from));
  return dist(pos) <= dist(pos + 12) ? pos : pos + 12;
}

/** Where a new reminder goes when it is added without a place: the evening first, then the afternoon. */
const SUGGESTED = [20, 16, 12, 9, 18, 22, 14, 7, 10, 21, 8, 19, 13, 11, 15, 17, 23, 6, 0, 1, 2, 3, 4, 5];

/**
 * A free hour for a new reminder, or null when the day is full (MAX_PUSH_HOURS).
 * @param {number[]} hours
 * @returns {number|null}
 */
export function suggestHour(hours) {
  if (hours.length >= MAX_PUSH_HOURS) return null;
  return SUGGESTED.find((h) => !hours.includes(h)) ?? null;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** The same days in Hebrew, Sunday first: "יום ראשון". */
export const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * When the next reminder can come: the first send hour after now, skipping the rest day, when
 * nothing is pushed (data/push-plan.js pickPush). A reminder comes only when something is due, so
 * this is the next chance, not a promise.
 * @param {{ hours: number[], now: Date, restDay?: number|null }} input `now` on the user's clock
 * @returns {{ hour: number, days: number, weekday: string }|null} `days` from today; null without hours
 */
export function nextReminder({ hours, now, restDay = null }) {
  if (!hours.length) return null;
  const sorted = [...hours].sort((a, b) => a - b);
  for (let days = 0; days < 8; days++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    if (day.getDay() === restDay) continue;
    const hour = sorted.find((h) => days > 0 || h > now.getHours());
    if (hour !== undefined) return { hour, days, weekday: WEEKDAYS[day.getDay()] };
  }
  return null;
}

/**
 * "Next at 16:00", "Next tomorrow at 09:00", "Next on Sunday at 16:00".
 * @param {ReturnType<typeof nextReminder>} next
 * @param {'en'|'he'} [lang]
 * @returns {string}
 */
export function describeNext(next, lang = 'en') {
  if (lang === 'he') {
    if (!next) return 'לחיצה על הטבעת מוסיפה תזכורת';
    const at = formatHour(next.hour);
    if (next.days === 0) return `הבאה ב-${at}`;
    if (next.days === 1) return `הבאה מחר ב-${at}`;
    const day = WEEKDAYS_HE[WEEKDAYS.indexOf(next.weekday)] ?? next.weekday;
    return day === 'שבת' ? `הבאה בשבת ב-${at}` : `הבאה ביום ${day} ב-${at}`;
  }
  if (!next) return 'Tap the ring to add one';
  const at = formatHour(next.hour);
  if (next.days === 0) return `Next at ${at}`;
  if (next.days === 1) return `Next tomorrow at ${at}`;
  return `Next on ${next.weekday} at ${at}`;
}

/**
 * Turns a send hour on or off. Sorted and unique; at most MAX_PUSH_HOURS, so a seventh hour is not
 * added.
 * @param {number[]} hours
 * @param {number} hour 0 to 23
 * @returns {number[]}
 */
export function toggleHour(hours, hour) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error(`An hour is 0 to 23: got ${hour}`);
  const set = new Set(hours);
  if (set.has(hour)) set.delete(hour);
  else if (set.size < MAX_PUSH_HOURS) set.add(hour);
  return [...set].sort((a, b) => a - b);
}

/**
 * The line above the picker: how many a day, and when. An empty list means none, said plainly.
 * @param {number[]} hours any order: listed earliest first
 * @param {'en'|'he'} [lang]
 * @returns {string}
 */
export function describeHours(hours, lang = 'en') {
  if (lang === 'he') {
    if (!hours.length) return 'אין התראות. כדי לקבל אותן שוב, צריך להוסיף שעה.';
    const times = [...new Set(hours)].sort((a, b) => a - b).map(formatHour);
    const list = times.length === 1 ? times[0] : `${times.slice(0, -1).join(', ')} ו-${times.at(-1)}`;
    return `${times.length === 1 ? 'לכל היותר אחת ביום' : `לכל היותר ${times.length} ביום`}, ב-${list}`;
  }
  if (!hours.length) return 'No notifications. Add an hour to get them again.';
  const times = [...new Set(hours)].sort((a, b) => a - b).map(formatHour);
  const list = times.length === 1 ? times[0] : `${times.slice(0, -1).join(', ')} and ${times.at(-1)}`;
  return `${times.length === 1 ? 'At most 1 a day' : `At most ${times.length} a day`}, at ${list}`;
}

/**
 * The push function's address: one Edge Function beside the others (deploy/supabase/functions/push).
 * @param {string} supabaseUrl
 * @returns {string}
 */
export const pushFunctionUrl = (supabaseUrl) => `${String(supabaseUrl).replace(/\/+$/, '')}/functions/v1/push`;
