import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickPush, normalizePushSettings, toWallClock, zonedFacts, isTimeZone, DEFAULT_PUSH_HOURS, MAX_PUSH_HOURS } from '../src/js/data/push-plan.js';
import { dayKey } from '../src/js/state/progress.js';

// Local wall-clock times, so the plan means the same in every time zone the tests run in.
// Wednesday 2026-11-25; the rest day in these tests is Saturday (6).
const at = (d, h) => new Date(2026, 10, d, h, 0);
const AT16 = at(25, 16);
const AT20 = at(25, 20);
const day = (d) => dayKey(new Date(2026, 10, d));
const SAT = 6;
const facts = (f = {}) => ({ activeDays: [], problems: {}, quizDays: [], ...f });
const both = facts({ activeDays: [day(23), day(24)], quizDays: [day(24)] });
const plan = (f, now, opts = {}) => pickPush({ facts: f, now, restDay: SAT, settings: {}, sentToday: [], sentKeys: [], ...opts });

test('settings: 16:00 and 20:00 unless the user chooses; hours are whole, sorted, unique, at most MAX_PUSH_HOURS', () => {
  assert.deepEqual(DEFAULT_PUSH_HOURS, [16, 20]);
  assert.deepEqual(normalizePushSettings(undefined), { hours: [16, 20], off: [] });
  assert.deepEqual(normalizePushSettings({ hours: [21, 9, 9, 24, -1, 7.5, '8'] }), { hours: [9, 21], off: [] });
  assert.deepEqual(normalizePushSettings({ hours: [] }), { hours: [], off: [] }, 'no send hours: no pushes');
  assert.equal(normalizePushSettings({ hours: [0, 1, 2, 3, 4, 5, 6, 7] }).hours.length, MAX_PUSH_HOURS);
  assert.deepEqual(normalizePushSettings({ off: ['away', 'spam'] }).off, ['away']);
});

test('both streaks at risk: one push for each, the one not yet sent today first', () => {
  const first = plan(both, AT16);
  assert.equal(first.kind, 'streak', 'the coding streak first');
  const second = plan(both, AT20, { sentToday: [{ kind: 'streak', key: first.key }] });
  assert.equal(second.kind, 'quiz-streak');
});

test('one streak at risk: that one at every send hour', () => {
  const onlyQuiz = facts({ quizDays: [day(23), day(24)] });
  const first = plan(onlyQuiz, AT16);
  assert.equal(first.kind, 'quiz-streak');
  assert.equal(plan(onlyQuiz, AT20, { sentToday: [{ kind: 'quiz-streak', key: first.key }] }).kind, 'quiz-streak');
});

test('the second reminder of the day carries the hours left', () => {
  const onlyCoding = facts({ activeDays: [day(24)] });
  assert.equal(plan(onlyCoding, AT16).data.msLeft, 8 * 3600000);
  assert.equal(plan(onlyCoding, AT20).urgent, true, 'four hours before midnight');
});

test('a streak kept today needs no push; neither does a user with no streak and nothing else due', () => {
  assert.equal(plan(facts({ activeDays: [day(24), day(25)], quizDays: [day(24), day(25)] }), AT16), null);
  assert.equal(plan(facts(), AT16), null);
});

test('nothing on the rest day, whatever is due', () => {
  const sat = at(28, 16);
  assert.equal(plan(facts({ activeDays: [day(20)], problems: { p: { status: 'attempted', history: [{ at: at(27, 10).toISOString() }] } } }), sat), null);
});

test('never more pushes in a day than send hours', () => {
  const sent = [{ kind: 'streak', key: 'a' }, { kind: 'quiz-streak', key: 'b' }];
  assert.equal(plan(both, at(25, 21), { sentToday: sent }), null, 'two hours, two pushes: done for today');
  assert.equal(plan(both, at(25, 21), { sentToday: sent, settings: { hours: [16, 20, 21] } }).kind, 'streak', 'a third hour the user chose');
  assert.equal(plan(both, AT16, { settings: { hours: [] } }), null);
});

test('after the streaks: a return, a problem left, a new streak, each pushed once', () => {
  const away = facts({ activeDays: [day(20)] });
  const n = plan(away, AT16);
  assert.equal(n.kind, 'away');
  assert.equal(plan(away, AT20, { sentKeys: [n.key] }), null, 'the same absence is not pushed twice');

  const left = facts({ activeDays: [day(25)], problems: { p: { status: 'attempted', history: [{ at: at(25, 9).toISOString() }] } } });
  const u = plan(left, AT16);
  assert.equal(u.kind, 'unfinished');
  assert.equal(plan(left, AT20, { sentKeys: [u.key] }), null);

  const broke = facts({ activeDays: [day(23)] });
  assert.equal(plan(broke, AT16).kind, 'restart');
});

test('a streak at risk comes before anything else', () => {
  const f = facts({ activeDays: [day(24)], problems: { p: { status: 'attempted', history: [{ at: at(25, 9).toISOString() }] } } });
  assert.equal(plan(f, AT16).kind, 'streak');
});

test('kinds the user turned off are never pushed', () => {
  assert.equal(plan(both, AT16, { settings: { off: ['streak'] } }).kind, 'quiz-streak');
  assert.equal(plan(both, AT16, { settings: { off: ['streak', 'quiz-streak'] } }), null);
});

test('toWallClock shows the time in the user\'s zone, whatever zone runs the code', () => {
  const instant = new Date('2026-11-25T14:00:00Z');
  const il = toWallClock(instant, 'Asia/Jerusalem');
  assert.deepEqual([il.getFullYear(), il.getMonth(), il.getDate(), il.getHours(), il.getMinutes()], [2026, 10, 25, 16, 0], 'UTC+2 in winter');
  const summer = toWallClock(new Date('2026-07-01T13:00:00Z'), 'Asia/Jerusalem');
  assert.equal(summer.getHours(), 16, 'UTC+3 in summer');
  const ny = toWallClock(new Date('2026-11-26T03:30:00Z'), 'America/New_York');
  assert.deepEqual([ny.getDate(), ny.getHours(), ny.getMinutes()], [25, 22, 30], 'the day before, in New York');
  assert.equal(toWallClock(new Date('2026-11-25T23:30:00Z'), 'UTC').getHours(), 23);
});

test('zonedFacts moves submission and draft times to the user\'s wall clock; day keys stay as they are', () => {
  const raw = { activeDays: ['2026-11-25'], quizDays: ['2026-11-24'], problems: { p: { status: 'attempted', history: [{ at: '2026-11-25T22:30:00Z', language: 'js' }] } }, drafts: [{ problemId: 'q', lang: 'go', at: '2026-11-25T21:30:00Z' }] };
  const z = zonedFacts(raw, 'Asia/Jerusalem');
  assert.deepEqual(z.activeDays, raw.activeDays);
  assert.deepEqual(z.quizDays, raw.quizDays);
  const local = new Date(z.problems.p.history[0].at);
  assert.deepEqual([local.getDate(), local.getHours(), local.getMinutes()], [26, 0, 30], 'after midnight in Israel: the next day');
  assert.equal(new Date(z.drafts[0].at).getHours(), 23);
  assert.equal(z.problems.p.status, 'attempted');
  assert.deepEqual(zonedFacts(raw, 'Asia/Jerusalem').problems.p.history[0].language, 'js');
});

test('isTimeZone accepts IANA zones and refuses the rest', () => {
  assert.equal(isTimeZone('Asia/Jerusalem'), true);
  assert.equal(isTimeZone('UTC'), true);
  assert.equal(isTimeZone('Mars/Olympus'), false);
  assert.equal(isTimeZone(''), false);
  assert.equal(isTimeZone(42), false);
});
