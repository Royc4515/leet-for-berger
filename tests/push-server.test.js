// The push Edge Function's logic (deploy/supabase/functions/push/core.js, ADR 0011), run in Node with
// an in-memory database, a fake push sender and a fixed clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHandler, cleanSubscription, MAX_FAILURES, TEST_EVERY_MS, testCopy } from '../deploy/supabase/functions/push/core.js';
import { pushLibFiles, PUSH_LIB } from '../scripts/content/build-push.mjs';

const SITE = 'https://royc4515.github.io/leet-for-berger/';
// 14:00 UTC on Wednesday 2026-11-25 is 16:00 in Israel (UTC+2) and 09:00 in New York.
const AT_1400Z = Date.parse('2026-11-25T14:00:00Z');
const SUB = (n) => ({ endpoint: `https://push.example/send/${n}`, keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } });

/** A user whose coding streak (Mon, Tue) ends tonight unless they solve today. */
const STREAK_STATE = { version: 1, activeDays: ['2026-11-23', '2026-11-24'], problems: {}, totals: { submissions: 2, accepted: 2 }, quiz: { questions: {}, daily: {}, best: {} } };

function fakeServer({ now = AT_1400Z, sendResult = () => 'ok' } = {}) {
  const clock = { t: now };
  const db = { settings: new Map(), subs: [], log: [], state: new Map() };
  let nextId = 1;
  const sent = [];
  const users = { 'tok-ana': { id: 'u-ana' }, 'tok-ben': { id: 'u-ben' } };
  const handle = createHandler({
    now: () => clock.t,
    getUser: async (jwt) => users[jwt] ?? null,
    siteUrl: SITE,
    cronSecret: async () => 'cron-secret-123',
    publicKey: async () => 'BPublicKey',
    titles: { 'pair-sum-target': 'Pair Sum Target' },
    send: async (sub, payload) => {
      sent.push({ endpoint: sub.endpoint, payload });
      return sendResult(sub);
    },
    db: {
      settings: {
        get: async (userId) => db.settings.get(userId) ?? null,
        upsert: async (row) => void db.settings.set(row.user_id, { ...row }),
        all: async () => [...db.settings.values()],
      },
      subs: {
        upsert: async (row) => {
          const existing = db.subs.find((s) => s.endpoint === row.endpoint);
          if (existing) Object.assign(existing, row, { failures: 0 });
          else db.subs.push({ id: nextId++, failures: 0, ...row });
        },
        remove: async (userId, endpoint) => {
          db.subs = db.subs.filter((s) => !(s.user_id === userId && s.endpoint === endpoint));
        },
        ofUser: async (userId) => db.subs.filter((s) => s.user_id === userId).map((s) => ({ ...s })),
        drop: async (id) => {
          db.subs = db.subs.filter((s) => s.id !== id);
        },
        setFailures: async (id, failures) => {
          db.subs.find((s) => s.id === id).failures = failures;
        },
      },
      log: {
        since: async (userId, fromDay) => db.log.filter((r) => r.user_id === userId && r.day >= fromDay),
        claim: async (row) => {
          if (db.log.some((r) => r.user_id === row.user_id && r.day === row.day && r.hour === row.hour)) return false;
          db.log.push({ ...row });
          return true;
        },
      },
      state: { of: async (userId) => db.state.get(userId) ?? null },
    },
  });
  const call = (method, path, { token, body, headers = {} } = {}) =>
    handle(new Request(`https://x.supabase.co/functions/v1/push${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined })).then(async (r) => ({ status: r.status, body: await r.json() }));
  const run = () => call('POST', '/run', { headers: { 'x-push-secret': 'cron-secret-123' } });
  return { call, run, db, sent, clock };
}

test('the rules copied into the function match src/js (run node scripts/content/build-push.mjs)', () => {
  for (const [name, text] of Object.entries(pushLibFiles())) {
    assert.equal(readFileSync(`${PUSH_LIB}/${name}`, 'utf8'), text, `${PUSH_LIB}/${name} is stale; run: node scripts/content/build-push.mjs`);
  }
});

test('cleanSubscription keeps an https endpoint and its two keys, and refuses anything else', () => {
  assert.deepEqual(cleanSubscription(SUB(1)), { endpoint: SUB(1).endpoint, p256dh: SUB(1).keys.p256dh, auth: SUB(1).keys.auth });
  assert.throws(() => cleanSubscription({ ...SUB(1), endpoint: 'http://push.example/x' }), /endpoint/);
  assert.throws(() => cleanSubscription({ ...SUB(1), endpoint: `https://x/${'a'.repeat(1100)}` }), /endpoint/);
  assert.throws(() => cleanSubscription({ endpoint: SUB(1).endpoint, keys: { p256dh: 'not base64!', auth: 'A'.repeat(22) } }), /keys/);
  assert.throws(() => cleanSubscription(null), /endpoint/);
});

test('subscribe needs a session and a time zone, stores the device and the settings', async () => {
  const { call, db } = fakeServer();
  assert.equal((await call('POST', '/subscribe', { body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } })).status, 401);
  assert.equal((await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Mars/Olympus' } })).status, 400);
  assert.equal((await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: { endpoint: 'ftp://x' }, timeZone: 'Asia/Jerusalem' } })).status, 400);
  const ok = await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { hours: [16, 20], off: [], timeZone: 'Asia/Jerusalem', devices: 1 });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(2), timeZone: 'Asia/Jerusalem', hours: [8, 21] } });
  assert.deepEqual(db.settings.get('u-ana').hours, [8, 21]);
  assert.equal(db.subs.length, 2);
  // The same browser signing in as someone else moves the device, never shares it.
  await call('POST', '/subscribe', { token: 'tok-ben', body: { subscription: SUB(1), timeZone: 'UTC' } });
  assert.deepEqual(db.subs.map((s) => s.user_id).sort(), ['u-ana', 'u-ben']);
});

test('settings: defaults until changed, cleaned when saved', async () => {
  const { call } = fakeServer();
  assert.equal((await call('GET', '/settings')).status, 401);
  assert.deepEqual((await call('GET', '/settings', { token: 'tok-ana' })).body, { hours: [16, 20], off: [], timeZone: 'UTC', devices: 0 });
  const saved = await call('POST', '/settings', { token: 'tok-ana', body: { hours: [20, 9, 9, 25], off: ['away', 'spam'], timeZone: 'Asia/Jerusalem' } });
  assert.deepEqual(saved.body, { hours: [9, 20], off: ['away'], timeZone: 'Asia/Jerusalem', devices: 0 });
  const kept = await call('POST', '/settings', { token: 'tok-ana', body: { off: [] } });
  assert.deepEqual(kept.body, { hours: [9, 20], off: [], timeZone: 'Asia/Jerusalem', devices: 0 }, 'what is not sent stays');
});

test('unsubscribe removes only the caller\'s own device', async () => {
  const { call, db } = fakeServer();
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'UTC' } });
  await call('POST', '/unsubscribe', { token: 'tok-ben', body: { endpoint: SUB(1).endpoint } });
  assert.equal(db.subs.length, 1);
  await call('POST', '/unsubscribe', { token: 'tok-ana', body: { endpoint: SUB(1).endpoint } });
  assert.equal(db.subs.length, 0);
});

test('run needs the cron secret', async () => {
  const { call } = fakeServer();
  assert.equal((await call('POST', '/run')).status, 401);
  assert.equal((await call('POST', '/run', { headers: { 'x-push-secret': 'nope' } })).status, 401);
});

test('run: at a user\'s send hour, the due reminder goes to every device, once', async () => {
  const { call, run, db, sent } = fakeServer();
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(2), timeZone: 'Asia/Jerusalem' } });
  db.state.set('u-ana', STREAK_STATE);
  // Ben's hour is 16:00 in New York, so 09:00 there now: not his time.
  await call('POST', '/subscribe', { token: 'tok-ben', body: { subscription: SUB(3), timeZone: 'America/New_York' } });
  db.state.set('u-ben', STREAK_STATE);
  const first = await run();
  assert.deepEqual(first.body, { checked: 1, sent: 2, dropped: 0 });
  assert.deepEqual(sent.map((s) => s.endpoint).sort(), [SUB(1).endpoint, SUB(2).endpoint]);
  assert.deepEqual(sent[0].payload, { title: 'Keep your 2-day streak', body: 'Solve one problem today. 8 h 0 min left.', url: `${SITE}#/daily`, tag: 'streak' });
  assert.deepEqual(db.log.map((r) => [r.user_id, r.day, r.hour, r.kind]), [['u-ana', '2026-11-25', 16, 'streak']]);
  assert.deepEqual((await run()).body, { checked: 1, sent: 0, dropped: 0 }, 'the same hour is not pushed twice');
});

test('run: nothing for a user without devices, without a synced record, or with nothing due', async () => {
  const { call, run, db, sent } = fakeServer();
  await call('POST', '/settings', { token: 'tok-ana', body: { timeZone: 'Asia/Jerusalem' } });
  db.state.set('u-ana', STREAK_STATE);
  await call('POST', '/subscribe', { token: 'tok-ben', body: { subscription: SUB(3), timeZone: 'Asia/Jerusalem' } });
  assert.deepEqual((await run()).body, { checked: 2, sent: 0, dropped: 0 });
  db.state.set('u-ben', { ...STREAK_STATE, activeDays: ['2026-11-24', '2026-11-25'] });
  assert.deepEqual((await run()).body, { checked: 2, sent: 0, dropped: 0 }, 'a streak kept today needs no push');
  assert.equal(sent.length, 0);
  assert.equal(db.log.length, 0);
});

test('run: nothing on the user\'s rest day', async () => {
  // Saturday 2026-11-28, 16:00 in Israel; the record keeps the default rest day, Saturday.
  const { call, run, db, sent } = fakeServer({ now: Date.parse('2026-11-28T14:00:00Z') });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } });
  db.state.set('u-ana', { ...STREAK_STATE, activeDays: ['2026-11-26', '2026-11-27'] });
  assert.deepEqual((await run()).body, { checked: 1, sent: 0, dropped: 0 });
  assert.equal(sent.length, 0);
});

test('run: a problem left unsolved is pushed by its title, and only from a submission', async () => {
  const { call, run, db, sent } = fakeServer();
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } });
  db.state.set('u-ana', { ...STREAK_STATE, activeDays: ['2026-11-25'], problems: { 'pair-sum-target': { status: 'attempted', submissions: 1, accepted: 0, history: [{ at: '2026-11-25T08:00:00Z', language: 'python' }] } } });
  await run();
  assert.equal(sent[0].payload.title, 'Finish Pair Sum Target');
  assert.equal(sent[0].payload.url, `${SITE}#/problem/pair-sum-target`);
});

test('run: a device the push service no longer knows is dropped; one that keeps failing is dropped after MAX_FAILURES', async () => {
  const { call, run, db } = fakeServer({ sendResult: (sub) => (sub.endpoint.endsWith('/1') ? 'gone' : 'failed') });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem' } });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(2), timeZone: 'Asia/Jerusalem' } });
  db.state.set('u-ana', STREAK_STATE);
  assert.deepEqual((await run()).body, { checked: 1, sent: 0, dropped: 1 });
  assert.deepEqual(db.subs.map((s) => [s.endpoint, s.failures]), [[SUB(2).endpoint, 1]]);
  db.subs[0].failures = MAX_FAILURES - 1;
  db.log.length = 0;
  assert.deepEqual((await run()).body, { checked: 1, sent: 0, dropped: 1 });
  assert.equal(db.subs.length, 0);
});

test('test push: to the caller\'s own device only, with their hours and rest day, at most once in TEST_EVERY_MS', async () => {
  const { call, db, sent, clock } = fakeServer();
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'Asia/Jerusalem', hours: [9, 21] } });
  await call('POST', '/subscribe', { token: 'tok-ben', body: { subscription: SUB(2), timeZone: 'UTC' } });
  db.state.set('u-ana', { ...STREAK_STATE, restDay: { day: 5, at: '2026-11-20T10:00:00Z' } });
  assert.equal((await call('POST', '/test', { body: { endpoint: SUB(1).endpoint } })).status, 401);
  assert.equal((await call('POST', '/test', { token: 'tok-ana', body: {} })).status, 400);
  // Someone else's device is not the caller's to ring.
  assert.equal((await call('POST', '/test', { token: 'tok-ana', body: { endpoint: SUB(2).endpoint } })).status, 404);
  assert.deepEqual(await call('POST', '/test', { token: 'tok-ana', body: { endpoint: SUB(1).endpoint } }), { status: 200, body: { sent: true } });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].endpoint, SUB(1).endpoint);
  assert.deepEqual(sent[0].payload, {
    title: 'Radio check: loud and clear',
    body: 'Reminders now reach this device. The real ones come at 09:00 and 21:00, only when something is due, and never on Friday.',
    url: `${SITE}#/me`,
    tag: 'test',
  });
  // A second press right away waits; after TEST_EVERY_MS it goes again.
  assert.equal((await call('POST', '/test', { token: 'tok-ana', body: { endpoint: SUB(1).endpoint } })).status, 429);
  clock.t += TEST_EVERY_MS;
  assert.equal((await call('POST', '/test', { token: 'tok-ana', body: { endpoint: SUB(1).endpoint } })).status, 200);
  assert.equal(sent.length, 2);
});

test('test push: a device the push service no longer knows is dropped and reported not sent', async () => {
  const { call, db } = fakeServer({ sendResult: () => 'gone' });
  await call('POST', '/subscribe', { token: 'tok-ana', body: { subscription: SUB(1), timeZone: 'UTC' } });
  assert.deepEqual((await call('POST', '/test', { token: 'tok-ana', body: { endpoint: SUB(1).endpoint } })).body, { sent: false });
  assert.equal(db.subs.length, 0);
});

test('testCopy: the default rest day is Saturday; one hour, none, and no rest day read right', () => {
  assert.match(testCopy({ hours: [16, 20], restDay: 6 }).body, /at 16:00 and 20:00, only when something is due, and never on Saturday\.$/);
  assert.match(testCopy({ hours: [9], restDay: null }).body, /at 09:00, only when something is due\.$/);
  assert.match(testCopy({ hours: [], restDay: 6 }).body, /no reminder hours yet/);
  for (const c of [testCopy({ hours: [16, 20], restDay: 6 }), testCopy({ hours: [], restDay: null })]) assert.doesNotMatch(c.title + c.body, /[\u2013\u2014!]/);
});

test('unknown routes answer 404; the public key is public', async () => {
  const { call } = fakeServer();
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.deepEqual(await call('GET', '/key'), { status: 200, body: { publicKey: 'BPublicKey' } });
});
