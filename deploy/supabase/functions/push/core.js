/**
 * Web Push reminders, server side (ADR 0011): runs in a Supabase Edge Function (Deno), and in Node
 * for the unit tests (tests/push-server.test.js). Storage, auth and the push sender are injected.
 *
 * What a push says comes from the same rules as the bell (lib/, copied from src/js by
 * scripts/content/build-push.mjs): at each of the user's send hours, in their time zone, at most
 * one push, sent to every device they turned it on for.
 *
 * Routes:
 *   GET  /key                  the VAPID public key a browser subscribes with (public by design)
 *   GET  /settings             the caller's send hours, kinds off, time zone, language and device count
 *   POST /settings { hours?, off?, timeZone?, lang? }  what is not sent stays as it was
 *   POST /subscribe { subscription: { endpoint, keys: { p256dh, auth } }, timeZone, hours?, off?, lang? }
 *   POST /unsubscribe { endpoint }
 *   POST /test { endpoint }    a test push to the caller's own device, right after it is turned on
 *   POST /run                  the hourly cron (header x-push-secret): pushes what is due
 */
import { pickPush, normalizePushSettings, normalizePushLang, isPushLang, toWallClock, zonedFacts, isTimeZone } from './lib/push-plan.js';
import { notificationCopy } from './lib/notifications.js';
import { dayKey, restDayOf } from './lib/progress.js';
import { shiftDay } from './lib/daily.js';

/** A device that fails this many pushes in a row is dropped; a dead one (404, 410) at once. */
export const MAX_FAILURES = 5;
/** How far back the send log counts, for "pushed once" (an absence, a problem, a break). */
export const LOG_DAYS = 30;
/** One test push per user in this time: a test is a check, not a way to ring a phone on repeat. */
export const TEST_EVERY_MS = 30 * 1000;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
/** Owner-approved Hebrew radio-check title for the test push (stage 4). */
export const TEST_TITLE_HE = 'בדיקת קשר: שומעים חזק וברור';

/**
 * What the test push says (owner's request: something with a bit of fun): a radio check, then
 * what the real reminders will do, with the user's own hours and rest day.
 * @param {{ hours: number[], restDay: number|null, lang?: 'en'|'he' }} settings
 * @returns {{ title: string, body: string }}
 */
export function testCopy({ hours, restDay, lang = 'en' }) {
  const times = hours.map((h) => `${String(h).padStart(2, '0')}:00`);
  if (lang === 'he') {
    const list = times.length < 2 ? times[0] : `${times.slice(0, -1).join(', ')} ו-${times.at(-1)}`;
    const rest = restDay === null ? '' : restDay === 6 ? ', ואף פעם לא בשבת' : `, ואף פעם לא ביום ${WEEKDAYS_HE[restDay]}`;
    const when = times.length
      ? `האמיתיות מגיעות ב-${list}, רק כשיש משהו לעשות${rest}.`
      : 'עוד לא נבחרו שעות לתזכורות: אפשר לבחור בפרופיל.';
    return { title: TEST_TITLE_HE, body: `התזכורות מגיעות עכשיו למכשיר הזה. ${when}` };
  }
  const list = times.length < 2 ? times[0] : `${times.slice(0, -1).join(', ')} and ${times.at(-1)}`;
  const when = times.length
    ? `The real ones come at ${list}, only when something is due${restDay === null ? '' : `, and never on ${WEEKDAYS[restDay]}`}.`
    : 'You have no reminder hours yet: pick some on your profile.';
  return { title: 'Radio check: loud and clear', body: `Reminders now reach this device. ${when}` };
}

const B64URL = /^[A-Za-z0-9_-]+$/;

/**
 * A browser PushSubscription, checked: an https endpoint and its two keys (base64url).
 * @param {any} raw `subscription.toJSON()` from the browser
 * @returns {{ endpoint: string, p256dh: string, auth: string }}
 */
export function cleanSubscription(raw) {
  const endpoint = raw?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 1024 || !/^https:\/\/[^\s]+$/.test(endpoint)) throw new Error('Invalid endpoint');
  const { p256dh, auth } = raw.keys ?? {};
  const ok = (k, min, max) => typeof k === 'string' && k.length >= min && k.length <= max && B64URL.test(k);
  if (!ok(p256dh, 40, 200) || !ok(auth, 8, 64)) throw new Error('Invalid keys');
  return { endpoint, p256dh, auth };
}

/**
 * Equal strings in time that does not depend on where they differ: the cron secret is compared
 * with what any caller sends.
 * @param {string} a
 * @param {string} b
 */
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * @typedef {{ user_id: string, hours: number[], off: string[], time_zone: string, lang?: 'en'|'he' }} SettingsRow
 * @typedef {{ id: number, user_id: string, endpoint: string, p256dh: string, auth: string, failures: number }} SubscriptionRow
 * @typedef {{ user_id: string, day: string, hour: number, kind: string, key: string }} LogRow
 */

/**
 * @param {{
 *   getUser: (jwt: string) => Promise<{ id: string }|null>,
 *   now?: () => number,
 *   siteUrl: string,
 *   cronSecret: () => Promise<string>,
 *   publicKey: () => Promise<string>,
 *   titles?: Record<string, string>,
 *   send: (sub: SubscriptionRow, payload: { title: string, body: string, url: string, tag: string }) => Promise<'ok'|'gone'|'failed'>,
 *   db: {
 *     settings: { get: (userId: string) => Promise<SettingsRow|null>, upsert: (row: SettingsRow) => Promise<void>, all: () => Promise<SettingsRow[]> },
 *     subs: {
 *       upsert: (row: { user_id: string, endpoint: string, p256dh: string, auth: string }) => Promise<void>,
 *       remove: (userId: string, endpoint: string) => Promise<void>,
 *       ofUser: (userId: string) => Promise<SubscriptionRow[]>,
 *       drop: (id: number) => Promise<void>,
 *       setFailures: (id: number, failures: number) => Promise<void>,
 *     },
 *     log: { since: (userId: string, fromDay: string) => Promise<LogRow[]>, claim: (row: LogRow) => Promise<boolean> },
 *     state: { of: (userId: string) => Promise<any|null> },
 *   },
 * }} deps
 * @returns {(req: Request) => Promise<Response>}
 */
export function createHandler({ getUser, now = () => Date.now(), siteUrl, cronSecret, publicKey, titles = {}, send, db }) {
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  /** user id -> when their last test push went: kept per instance, enough to stop a stuck button. */
  const lastTest = new Map();

  /** The test push: to the caller's own device only, at most once per TEST_EVERY_MS. */
  async function testPush(user, endpoint) {
    const sub = (await db.subs.ofUser(user.id)).find((s) => s.endpoint === endpoint);
    if (!sub) return json(404, { error: 'Turn notifications on for this device first' });
    if (now() - (lastTest.get(user.id) ?? -Infinity) < TEST_EVERY_MS) return json(429, { error: 'A test is on its way. Try again in a moment.' });
    lastTest.set(user.id, now());
    const row = (await db.settings.get(user.id)) ?? {};
    const { hours } = normalizePushSettings(row);
    const copy = testCopy({ hours, restDay: restDayOf(await db.state.of(user.id)), lang: normalizePushLang(row.lang) });
    const result = await send(sub, { ...copy, url: new URL('#/me', siteUrl).href, tag: 'test' });
    if (result === 'gone') await db.subs.drop(sub.id);
    return json(200, { sent: result === 'ok' });
  }

  async function userOf(req) {
    const auth = req.headers.get('Authorization') ?? '';
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    return jwt ? getUser(jwt) : null;
  }

  /** The stored settings, with what `body` changes; the time zone only when it is a real one. */
  async function mergedSettings(userId, body) {
    const prev = (await db.settings.get(userId)) ?? { hours: undefined, off: [], time_zone: 'UTC', lang: 'en' };
    const clean = normalizePushSettings({ hours: body?.hours ?? prev.hours, off: body?.off ?? prev.off });
    const timeZone = body?.timeZone === undefined ? prev.time_zone : body.timeZone;
    const lang = normalizePushLang(body?.lang === undefined ? prev.lang : body.lang);
    return { user_id: userId, hours: clean.hours, off: clean.off, time_zone: timeZone, lang };
  }

  async function view(userId) {
    const row = (await db.settings.get(userId)) ?? { hours: undefined, off: [], time_zone: 'UTC', lang: 'en' };
    const { hours, off } = normalizePushSettings(row);
    return { hours, off, timeZone: row.time_zone, lang: normalizePushLang(row.lang), devices: (await db.subs.ofUser(userId)).length };
  }

  /** The hourly cron: every user whose local hour is a send hour gets at most one push. */
  async function run() {
    const at = new Date(now());
    const out = { checked: 0, sent: 0, dropped: 0 };
    for (const row of await db.settings.all()) {
      const tz = isTimeZone(row.time_zone) ? row.time_zone : 'UTC';
      const wall = toWallClock(at, tz);
      const hour = wall.getHours();
      const settings = normalizePushSettings(row);
      if (!settings.hours.includes(hour)) continue;
      out.checked++;
      const day = dayKey(wall);
      const log = await db.log.since(row.user_id, shiftDay(day, LOG_DAYS));
      if (log.some((r) => r.day === day && r.hour === hour)) continue;
      const subs = await db.subs.ofUser(row.user_id);
      if (!subs.length) continue;
      const state = await db.state.of(row.user_id);
      if (!state) continue;
      // Drafts never leave the device, so on the phone a problem left means a submission.
      const facts = zonedFacts({ activeDays: state.activeDays ?? [], problems: state.problems ?? {}, quizDays: Object.keys(state.quiz?.daily ?? {}) }, tz);
      const n = pickPush({ facts, now: wall, restDay: restDayOf(state), settings, sentToday: log.filter((r) => r.day === day), sentKeys: log.map((r) => r.key) });
      if (!n) continue;
      const copy = notificationCopy(n, { problemTitle: (id) => titles[id], lang: normalizePushLang(row.lang) });
      if (!copy) continue;
      // Claimed before sending: a second run in the same hour finds it taken and sends nothing.
      if (!(await db.log.claim({ user_id: row.user_id, day, hour, kind: n.kind, key: n.key }))) continue;
      const payload = { title: copy.title, body: copy.body, url: new URL(copy.href, siteUrl).href, tag: n.kind };
      for (const sub of subs) {
        const result = await send(sub, payload);
        if (result === 'ok') {
          out.sent++;
          if (sub.failures) await db.subs.setFailures(sub.id, 0);
        } else if (result === 'gone' || sub.failures + 1 >= MAX_FAILURES) {
          await db.subs.drop(sub.id);
          out.dropped++;
        } else {
          await db.subs.setFailures(sub.id, sub.failures + 1);
        }
      }
    }
    return out;
  }

  return async function handle(req) {
    try {
      const url = new URL(req.url);
      const route = url.pathname.replace(/^.*\/push/, '') || '/';
      if (req.method === 'POST' && route === '/run') {
        if (!sameSecret(req.headers.get('x-push-secret') ?? '', await cronSecret())) return json(401, { error: 'Not allowed' });
        return json(200, await run());
      }
      if (req.method === 'GET' && route === '/key') return json(200, { publicKey: await publicKey() });
      const user = await userOf(req);
      if (!user && ['/settings', '/subscribe', '/unsubscribe', '/test'].includes(route)) return json(401, { error: 'Sign in to get reminders on this device' });
      if (req.method === 'GET' && route === '/settings') return json(200, await view(user.id));
      if (req.method === 'POST' && (route === '/settings' || route === '/subscribe')) {
        const body = await req.json().catch(() => null);
        if (body?.timeZone !== undefined && !isTimeZone(body.timeZone)) return json(400, { error: 'Unknown time zone' });
        if (body?.lang !== undefined && !isPushLang(body.lang)) return json(400, { error: 'Unknown language' });
        if (route === '/subscribe') {
          if (!isTimeZone(body?.timeZone)) return json(400, { error: 'Unknown time zone' });
          let sub;
          try {
            sub = cleanSubscription(body.subscription);
          } catch (err) {
            return json(400, { error: err.message });
          }
          await db.subs.upsert({ user_id: user.id, ...sub });
        }
        await db.settings.upsert(await mergedSettings(user.id, body));
        return json(200, await view(user.id));
      }
      if (req.method === 'POST' && route === '/test') {
        const body = await req.json().catch(() => null);
        if (typeof body?.endpoint !== 'string') return json(400, { error: 'Invalid endpoint' });
        return testPush(user, body.endpoint);
      }
      if (req.method === 'POST' && route === '/unsubscribe') {
        const body = await req.json().catch(() => null);
        if (typeof body?.endpoint !== 'string') return json(400, { error: 'Invalid endpoint' });
        await db.subs.remove(user.id, body.endpoint);
        return json(200, await view(user.id));
      }
      return json(404, { error: 'Not found' });
    } catch {
      return json(500, { error: 'Reminders are unavailable right now' });
    }
  };
}
