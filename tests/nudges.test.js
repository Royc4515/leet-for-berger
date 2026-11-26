import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NUDGE_RULES, NUDGE_COPY, emptyNudgeState, normalizeNudgeState, nudgeAfterPractice, nudgeAfterSignIn, homeBanner, recordNudge, hideBanner } from '../src/js/data/nudges.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 26, 12);
const ready = { support: 'ready', on: false, permission: 'default' };
const guest = { accounts: true, signedIn: false, push: ready };
const member = { accounts: true, signedIn: true, push: ready };
const fresh = emptyNudgeState();

test('nothing at all when accounts are not configured', () => {
  assert.equal(nudgeAfterPractice({ ...guest, accounts: false, state: fresh, now: NOW }), null);
  assert.equal(nudgeAfterPractice({ ...member, accounts: false, state: fresh, now: NOW }), null);
  assert.equal(nudgeAfterSignIn({ ...member, accounts: false, state: fresh }), null);
  assert.equal(homeBanner({ ...guest, accounts: false, hasProgress: true, state: fresh, now: NOW }), null);
});

test('after practice: a guest is asked to sign in, a member without reminders to turn them on', () => {
  assert.equal(nudgeAfterPractice({ ...guest, state: fresh, now: NOW }), 'signin');
  assert.equal(nudgeAfterPractice({ ...member, state: fresh, now: NOW }), 'push');
});

test('a guest is asked at most 3 times, 3 days apart', () => {
  let s = recordNudge(fresh, 'signin', NOW);
  assert.equal(nudgeAfterPractice({ ...guest, state: s, now: NOW + DAY }), null, 'not the next day');
  assert.equal(nudgeAfterPractice({ ...guest, state: s, now: NOW + 3 * DAY }), 'signin', 'again after 3 days');
  s = recordNudge(recordNudge(s, 'signin', NOW + 3 * DAY), 'signin', NOW + 6 * DAY);
  assert.equal(s.signin.count, NUDGE_RULES.signin.max);
  assert.equal(nudgeAfterPractice({ ...guest, state: s, now: NOW + 60 * DAY }), null, 'never after the third');
});

test('a member without reminders is asked at most 4 times, a week apart', () => {
  let s = recordNudge(fresh, 'push', NOW);
  assert.equal(nudgeAfterPractice({ ...member, state: s, now: NOW + 6 * DAY }), null);
  assert.equal(nudgeAfterPractice({ ...member, state: s, now: NOW + 7 * DAY }), 'push');
  for (let i = 1; i < NUDGE_RULES.push.max; i++) s = recordNudge(s, 'push', NOW + 7 * i * DAY);
  assert.equal(nudgeAfterPractice({ ...member, state: s, now: NOW + 365 * DAY }), null);
});

test('reminders are never offered once on, once the browser refused, or where push cannot work', () => {
  for (const push of [{ ...ready, on: true }, { ...ready, permission: 'denied' }, { ...ready, support: 'unsupported' }]) {
    assert.equal(nudgeAfterPractice({ ...member, push, state: fresh, now: NOW }), null, JSON.stringify(push));
    assert.equal(nudgeAfterSignIn({ ...member, push, state: fresh }), null);
    assert.equal(homeBanner({ ...member, push, hasProgress: true, state: fresh, now: NOW }), null);
  }
  // An iPhone in Safari: offered, the dialog shows how to add the site to the Home Screen.
  assert.equal(nudgeAfterPractice({ ...member, push: { ...ready, support: 'install' }, state: fresh, now: NOW }), 'push');
});

test('right after a sign-in the dialog offered, reminders come at once, gap or not, within the count', () => {
  const s = recordNudge(fresh, 'push', NOW);
  assert.equal(nudgeAfterSignIn({ ...member, state: s }), 'push');
  assert.equal(nudgeAfterSignIn({ ...guest, state: fresh }), null, 'still signed out: nothing');
  let full = fresh;
  for (let i = 0; i < NUDGE_RULES.push.max; i++) full = recordNudge(full, 'push', NOW);
  assert.equal(nudgeAfterSignIn({ ...member, state: full }), null);
});

test('the home banner: reminders for a member, sign-in for a guest with something to save; its X hides it a week', () => {
  assert.equal(homeBanner({ ...member, hasProgress: false, state: fresh, now: NOW }), 'push');
  assert.equal(homeBanner({ ...guest, hasProgress: false, state: fresh, now: NOW }), null, 'a first visit gets no banner');
  assert.equal(homeBanner({ ...guest, hasProgress: true, state: fresh, now: NOW }), 'signin');
  const hidden = hideBanner(fresh, 'push', NOW);
  assert.equal(homeBanner({ ...member, hasProgress: true, state: hidden, now: NOW + 6 * DAY }), null);
  assert.equal(homeBanner({ ...member, hasProgress: true, state: hidden, now: NOW + 7 * DAY }), 'push');
  // Hiding one banner leaves the other.
  assert.equal(homeBanner({ ...guest, hasProgress: true, state: hidden, now: NOW }), 'signin');
  // The banner is not limited by the dialogs' counts: it is the always-there way in.
  let full = fresh;
  for (let i = 0; i < NUDGE_RULES.push.max; i++) full = recordNudge(full, 'push', NOW);
  assert.equal(homeBanner({ ...member, hasProgress: true, state: full, now: NOW }), 'push');
});

test('stored state: malformed values become an empty state; nothing is mutated', () => {
  assert.deepEqual(normalizeNudgeState(null), fresh);
  assert.deepEqual(normalizeNudgeState('x'), fresh);
  assert.deepEqual(normalizeNudgeState({ signin: { count: -2, at: 'x' }, push: { count: 2, at: 5 }, bannerHiddenUntil: { push: 9 } }), { signin: { count: 0, at: 0 }, push: { count: 2, at: 5 }, bannerHiddenUntil: { signin: 0, push: 9 } });
  const before = JSON.stringify(fresh);
  recordNudge(fresh, 'signin', NOW);
  hideBanner(fresh, 'push', NOW);
  assert.equal(JSON.stringify(fresh), before);
});

test('copy follows the voice: no em dashes, no exclamation marks', () => {
  const walk = (o) => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : walk(v)));
  for (const s of walk(NUDGE_COPY)) {
    assert.ok(!/[—–]/.test(s), s);
    assert.ok(!s.includes('!'), s);
  }
});
