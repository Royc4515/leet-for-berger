// Web Push on this device (ADR 0011, part C): support detection, the hour picker's rules, the key
// conversion, the browser client against a fake browser and push function, and the sign-out hook.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAppleMobile, pushSupport, keyBytes, sameKey, formatHour, toggleHour, describeHours, pushFunctionUrl, MAX_PUSH_HOURS, hourAngle, hourAt, nearestTurn, daylight, moveHour, stepHour, suggestHour, nextReminder, describeNext } from '../src/js/data/push-device.js';
import { createPushClient, forgetThisDevice, SW_PATH } from '../src/js/auth/push-client.js';
import { createAccount, LEAVE_WAIT_MS } from '../src/js/auth/account.js';
import { authConfig } from '../src/js/config.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';

test('isAppleMobile: iPhone and iPad (which says Macintosh) yes; a Mac and Android no', () => {
  assert.equal(isAppleMobile({ userAgent: IPHONE }), true);
  assert.equal(isAppleMobile({ userAgent: IPAD_AS_MAC, platform: 'MacIntel', maxTouchPoints: 5 }), true);
  assert.equal(isAppleMobile({ userAgent: IPAD_AS_MAC, platform: 'MacIntel', maxTouchPoints: 0 }), false);
  assert.equal(isAppleMobile({ userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 }), false);
  assert.equal(isAppleMobile(), false);
});

test('pushSupport: ready with the APIs; an iPhone tab is told to install, an old Home Screen app to update', () => {
  const all = { hasServiceWorker: true, hasPush: true, hasNotification: true };
  assert.equal(pushSupport({ ...all, appleMobile: false, standalone: false }), 'ready');
  // iOS 16.4+ from the Home Screen has the APIs like any browser.
  assert.equal(pushSupport({ ...all, appleMobile: true, standalone: true }), 'ready');
  // Safari in a tab has a service worker but no Push API.
  const tab = { hasServiceWorker: true, hasPush: false, hasNotification: false };
  assert.equal(pushSupport({ ...tab, appleMobile: true, standalone: false }), 'install');
  assert.equal(pushSupport({ ...tab, appleMobile: true, standalone: true }), 'update');
  assert.equal(pushSupport({ ...tab, appleMobile: false, standalone: false }), 'unsupported');
});

test('keyBytes: base64url to bytes, padding restored; garbage refused; sameKey compares bytes', () => {
  const raw = Uint8Array.from({ length: 65 }, (_, i) => (i * 37 + 4) % 256);
  raw[0] = 4;
  const b64url = Buffer.from(raw).toString('base64url');
  assert.equal(b64url.length, 87);
  assert.deepEqual([...keyBytes(b64url)], [...raw]);
  assert.deepEqual([...keyBytes('-_8')], [0xfb, 0xff]);
  assert.throws(() => keyBytes('not base64!'), /Invalid key/);
  assert.throws(() => keyBytes(''), /Invalid key/);
  assert.equal(sameKey(raw.buffer, keyBytes(b64url)), true);
  assert.equal(sameKey(raw, raw.slice(1)), false);
  assert.equal(sameKey(null, raw), false);
});

test('the dial: noon at the top, 18:00 on the right, midnight at the bottom; every hour once', () => {
  assert.deepEqual([12, 18, 0, 6, 23].map(hourAngle), [0, 90, -180, -90, 165]);
  // A point straight above the centre is noon, to the right 18:00, below midnight, to the left 06:00.
  assert.deepEqual([hourAt(0, -1), hourAt(1, 0), hourAt(0, 1), hourAt(-1, 0)], [12, 18, 0, 6]);
  for (let h = 0; h < 24; h++) {
    const a = (hourAngle(h) * Math.PI) / 180;
    assert.equal(hourAt(Math.sin(a) * 100, -Math.cos(a) * 100), h, `round trip at ${h}`);
    // Half an hour either way still reads as this hour.
    const b = ((hourAngle(h) + 7) * Math.PI) / 180;
    assert.equal(hourAt(Math.sin(b), -Math.cos(b)), h);
  }
});

test('nearestTurn: 23:00 to 00:00 steps forward, never spins back round the dial', () => {
  assert.equal(nearestTurn(hourAngle(23), hourAngle(0)), 180);
  assert.equal(nearestTurn(-180, hourAngle(23)), -195);
  assert.equal(nearestTurn(720, 15), 735);
});

test('daylight: noon brightest, dark from 18:00 to 06:00', () => {
  assert.equal(daylight(12), 1);
  assert.equal(daylight(9), 0.707);
  assert.equal(daylight(15), 0.707);
  for (const h of [18, 21, 0, 3, 6]) assert.equal(daylight(h), 0);
});

test('moving, stepping and adding hours: never onto a taken hour, never past six', () => {
  assert.deepEqual(moveHour([16, 20], 16, 9), [9, 20]);
  assert.deepEqual(moveHour([16, 20], 16, 20), [16, 20], 'taken');
  assert.deepEqual(moveHour([16, 20], 15, 9), [16, 20], 'not a send hour');
  assert.deepEqual(moveHour([16, 20], 16, 24), [16, 20]);
  assert.equal(stepHour([16, 17, 20], 16, 1), 18, 'skips the taken 17:00');
  assert.equal(stepHour([0, 23], 23, 1), 1, 'round midnight');
  assert.equal(stepHour([0], 0, -1), 23);
  assert.equal(suggestHour([]), 20);
  assert.equal(suggestHour([20]), 16);
  assert.equal(suggestHour([8, 10, 12, 14, 16, 18]), null);
  assert.deepEqual(toggleHour([16, 20], 9), [9, 16, 20]);
  assert.deepEqual(toggleHour([9, 16, 20], 16), [9, 20]);
  const full = [8, 10, 12, 14, 16, 18];
  assert.equal(full.length, MAX_PUSH_HOURS);
  assert.deepEqual(toggleHour(full, 20), full, 'a seventh hour is not added');
  assert.throws(() => toggleHour([], 24), /0 to 23/);
  assert.equal(formatHour(7), '07:00');
});

test('nextReminder: the next send hour after now, skipping the rest day', () => {
  const friday = new Date(2026, 10, 27, 17, 30);
  assert.deepEqual(nextReminder({ hours: [16, 20], now: friday, restDay: 6 }), { hour: 20, days: 0, weekday: 'Friday' });
  // 16:00 has passed and Saturday rests: Sunday.
  assert.deepEqual(nextReminder({ hours: [16], now: friday, restDay: 6 }), { hour: 16, days: 2, weekday: 'Sunday' });
  assert.deepEqual(nextReminder({ hours: [16], now: friday, restDay: null }), { hour: 16, days: 1, weekday: 'Saturday' });
  // On the hour itself it is going out now: the next one is the one after.
  assert.equal(nextReminder({ hours: [17, 20], now: new Date(2026, 10, 26, 17, 0), restDay: 6 }).hour, 20);
  // On the rest day itself, nothing today.
  assert.deepEqual(nextReminder({ hours: [20], now: new Date(2026, 10, 28, 9, 0), restDay: 6 }), { hour: 20, days: 1, weekday: 'Sunday' });
  assert.equal(nextReminder({ hours: [], now: friday }), null);
  assert.equal(describeNext({ hour: 20, days: 0 }), 'Next at 20:00');
  assert.equal(describeNext({ hour: 9, days: 1 }), 'Next tomorrow at 09:00');
  assert.equal(describeNext({ hour: 16, days: 2, weekday: 'Sunday' }), 'Next on Sunday at 16:00');
  assert.match(describeNext(null), /ring/);
});

test('describeHours: the count and the times, in plain words; none says so', () => {
  assert.equal(describeHours([16, 20]), 'At most 2 a day, at 16:00 and 20:00');
  assert.equal(describeHours([9]), 'At most 1 a day, at 09:00');
  assert.equal(describeHours([8, 13, 21]), 'At most 3 a day, at 08:00, 13:00 and 21:00');
  assert.equal(describeHours([22, 6, 1, 6]), 'At most 3 a day, at 01:00, 06:00 and 22:00', 'earliest first, once each');
  assert.match(describeHours([]), /^No notifications/);
  assert.doesNotMatch(describeHours([1, 2]), /[\u2013\u2014!]/);
});

test('pushFunctionUrl: beside the other Edge Functions', () => {
  assert.equal(pushFunctionUrl('https://x.supabase.co/'), 'https://x.supabase.co/functions/v1/push');
});

/** A browser with Web Push, a push function, and a record of what happened, in the order it happened. */
function fakeBrowser({ permission = 'granted', failSubscribe = false, standalone = false, userAgent = ANDROID, push = true } = {}) {
  const log = [];
  const KEY = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => (i ? i : 4))).toString('base64url');
  let sub = null;
  const makeSub = (key) => ({
    endpoint: 'https://push.example/abc',
    options: { applicationServerKey: key.buffer },
    toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } }),
    unsubscribe: async () => {
      log.push('local unsubscribe');
      sub = null;
      return true;
    },
  });
  const pushManager = {
    getSubscription: async () => sub,
    subscribe: async ({ applicationServerKey, userVisibleOnly }) => {
      log.push(`subscribe visible=${userVisibleOnly} key=${applicationServerKey.length}`);
      sub = makeSub(applicationServerKey);
      return sub;
    },
  };
  const reg = { pushManager };
  const scope = {
    navigator: {
      userAgent,
      serviceWorker: {
        register: async (path) => (log.push(`register ${path}`), reg),
        ready: Promise.resolve(reg),
        getRegistration: async () => reg,
      },
    },
    matchMedia: () => ({ matches: standalone }),
    Notification: {
      permission: 'default',
      requestPermission() {
        log.push('ask');
        scope.Notification.permission = permission;
        return Promise.resolve(permission);
      },
    },
  };
  if (push) scope.PushManager = function PushManager() {};
  else {
    delete scope.Notification;
  }
  const calls = [];
  const fetchImpl = async (url, init) => {
    const route = url.replace('https://x.supabase.co/functions/v1/push', '');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ route, method: init.method, auth: init.headers.Authorization ?? null, apikey: init.headers.apikey, body });
    log.push(`${init.method} ${route}`);
    if (route === '/key') return { ok: true, status: 200, json: async () => ({ publicKey: KEY }) };
    if (route === '/subscribe' && failSubscribe) return { ok: false, status: 500, json: async () => ({ error: 'Reminders are unavailable right now' }) };
    return { ok: true, status: 200, json: async () => ({ hours: body?.hours ?? [16, 20], off: body?.off ?? [], timeZone: body?.timeZone ?? 'UTC', devices: 1 }) };
  };
  const account = { config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'anon' }), accessToken: async () => 'jwt' };
  return { scope, fetchImpl, account, log, calls, KEY, makeSub, current: () => sub, setSub: (s) => (sub = s) };
}

test('enable: asks first (the gesture), registers the worker, subscribes with the key, stores the device', async () => {
  const b = fakeBrowser();
  const client = createPushClient({ account: b.account, scope: b.scope, fetchImpl: b.fetchImpl });
  assert.equal(client.support(), 'ready');
  assert.equal(await client.isOn(), false);
  const res = await client.enable({ hours: [9, 20], off: ['away'] });
  assert.equal(res.ok, true);
  assert.deepEqual(res.view.hours, [9, 20]);
  assert.equal(b.log[0], 'ask', 'the permission prompt comes before anything is awaited');
  assert.deepEqual(b.log, ['ask', `register ${SW_PATH}`, 'GET /key', 'subscribe visible=true key=65', 'POST /subscribe']);
  const sent = b.calls.find((c) => c.route === '/subscribe');
  assert.equal(sent.auth, 'Bearer jwt');
  assert.equal(sent.apikey, 'anon');
  assert.equal(sent.body.subscription.endpoint, 'https://push.example/abc');
  assert.ok(sent.body.timeZone, 'the time zone rides with the subscription');
  assert.deepEqual(sent.body.off, ['away']);
  assert.equal(await client.isOn(), true);
});

test('enable: a refused or closed prompt subscribes nothing', async () => {
  for (const [permission, reason] of [['denied', 'denied'], ['default', 'dismissed']]) {
    const b = fakeBrowser({ permission });
    const res = await createPushClient({ account: b.account, scope: b.scope, fetchImpl: b.fetchImpl }).enable();
    assert.deepEqual(res, { ok: false, reason });
    assert.deepEqual(b.log, ['ask']);
  }
});

test('enable: a subscription made with another key is replaced; the server failing leaves the device off', async () => {
  const c = fakeBrowser();
  c.setSub(c.makeSub(new Uint8Array(65).fill(9)));
  await createPushClient({ account: c.account, scope: c.scope, fetchImpl: c.fetchImpl }).enable();
  assert.deepEqual(c.log.slice(3), ['local unsubscribe', 'subscribe visible=true key=65', 'POST /subscribe']);

  const d = fakeBrowser({ failSubscribe: true });
  const client = createPushClient({ account: d.account, scope: d.scope, fetchImpl: d.fetchImpl });
  await assert.rejects(client.enable(), /unavailable/);
  assert.equal(d.log.at(-1), 'local unsubscribe');
  assert.equal(await client.isOn(), false);
});

test('disable: the server forgets the device first, then the browser; a server error still ends it', async () => {
  const b = fakeBrowser();
  const client = createPushClient({ account: b.account, scope: b.scope, fetchImpl: b.fetchImpl });
  await client.enable();
  b.log.length = 0;
  await client.disable();
  assert.deepEqual(b.log, ['POST /unsubscribe', 'local unsubscribe']);
  assert.equal(b.calls.at(-1).body.endpoint, 'https://push.example/abc');
  await client.disable();
  assert.deepEqual(b.log, ['POST /unsubscribe', 'local unsubscribe'], 'nothing to do the second time');

  const down = fakeBrowser();
  const c2 = createPushClient({ account: down.account, scope: down.scope, fetchImpl: down.fetchImpl });
  await c2.enable();
  // The same browser, with the push function unreachable.
  const broken = createPushClient({ account: down.account, scope: down.scope, fetchImpl: async () => { throw new Error('offline'); } });
  await broken.disable();
  assert.equal(down.log.at(-1), 'local unsubscribe');
});

test('settings and save: GET, and a POST that carries the time zone', async () => {
  const b = fakeBrowser();
  const client = createPushClient({ account: b.account, scope: b.scope, fetchImpl: b.fetchImpl });
  await client.settings();
  await client.save({ hours: [7] });
  assert.deepEqual(b.calls.map((c) => `${c.method} ${c.route}`), ['GET /settings', 'POST /settings']);
  assert.deepEqual(b.calls[1].body.hours, [7]);
  assert.equal(typeof b.calls[1].body.timeZone, 'string');
});

test('support through the client: an iPhone Safari tab installs first; no Push API elsewhere is unsupported', async () => {
  const tab = fakeBrowser({ userAgent: IPHONE, push: false });
  const client = createPushClient({ account: tab.account, scope: tab.scope, fetchImpl: tab.fetchImpl });
  assert.equal(client.support(), 'install');
  assert.equal(await client.isOn(), false);
  assert.equal(client.permission(), 'default');
  const home = fakeBrowser({ userAgent: IPHONE, standalone: true });
  assert.equal(createPushClient({ account: home.account, scope: home.scope, fetchImpl: home.fetchImpl }).support(), 'ready');
  const old = fakeBrowser({ push: false });
  assert.equal(createPushClient({ account: old.account, scope: old.scope, fetchImpl: old.fetchImpl }).support(), 'unsupported');
});

test('forgetThisDevice: does nothing without accounts and never throws', async () => {
  await forgetThisDevice({ account: { config: { enabled: false } } });
  await forgetThisDevice({ account: null });
});

/** A signed-in account whose client records the order of things. */
function signedInAccount(log, opts = {}) {
  const listeners = [];
  const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: null, error: null }), upsert: async () => ({ error: null }) };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'a@example.com', user_metadata: {} }, access_token: 'jwt' } } }),
      onAuthStateChange: (cb) => (listeners.push(cb), { data: {} }),
      signOut: async () => {
        log.push('auth signOut');
        listeners.forEach((l) => l('SIGNED_OUT', null));
      },
    },
    from: () => chain,
  };
  const st = { get: () => ({ version: 1, problems: {}, activeDays: [], totals: { submissions: 0, accepted: 0 } }), update() {}, subscribe: () => () => {}, reset() {} };
  const acc = createAccount({ store: st, config: authConfig({ LFB_SUPABASE_URL: 'https://x.supabase.co', LFB_SUPABASE_ANON_KEY: 'k' }), loadClient: async () => client, ...opts });
  return { acc, fireSignedOut: () => listeners.forEach((l) => l('SIGNED_OUT', null)) };
}

test('beforeSignOut: runs once, while the session works, before the sign-out; a failing step never blocks it', async () => {
  const log = [];
  const { acc } = signedInAccount(log);
  await acc.start();
  await new Promise((r) => setTimeout(r, 0));
  acc.beforeSignOut(async () => log.push(`forget device (token ${await acc.accessToken()})`));
  acc.beforeSignOut(async () => {
    throw new Error('push function down');
  });
  assert.equal(await acc.signOut(), true);
  assert.deepEqual(log, ['forget device (token jwt)', 'auth signOut'], 'once, and before the session ends');
  assert.equal(acc.get().status, 'signed-out');
});

test('beforeSignOut: a step that hangs is waited for at most the leave wait (LEAVE_WAIT_MS on the site)', async () => {
  assert.ok(LEAVE_WAIT_MS >= 1000 && LEAVE_WAIT_MS <= 5000, 'long enough for the push function, short enough to wait for');
  const log = [];
  const { acc } = signedInAccount(log, { leaveWaitMs: 30 });
  await acc.start();
  await new Promise((r) => setTimeout(r, 0));
  acc.beforeSignOut(() => new Promise(() => {}));
  assert.equal(await acc.signOut(), true);
  assert.deepEqual(log, ['auth signOut']);
});

test('beforeSignOut: a sign-out in another tab runs the steps too (locally: the session is gone)', async () => {
  const log = [];
  const { acc, fireSignedOut } = signedInAccount(log);
  await acc.start();
  await new Promise((r) => setTimeout(r, 0));
  acc.beforeSignOut(() => log.push('forget device'));
  fireSignedOut();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(log, ['forget device']);
  assert.equal(acc.get().status, 'signed-out');
});
