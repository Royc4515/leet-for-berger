import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dueNotifications,
  notificationCopy,
  NOTIFICATION_KINDS,
  UNFINISHED_MIN_DAYS,
  UNFINISHED_MAX_DAYS,
  AWAY_DAYS,
} from '../src/js/data/notifications.js';
import {
  emptyNotificationState,
  normalizeNotificationState,
  setKindEnabled,
  isKindEnabled,
  dismiss,
  loadNotificationState,
  saveNotificationState,
  DISMISS_KEEP_DAYS,
} from '../src/js/state/notifications.js';
import { NOTIFICATIONS_KEY } from '../src/js/state/user-data.js';
import { dayKey } from '../src/js/state/progress.js';
import { shiftDay } from '../src/js/data/daily.js';

// Local times, so the tests mean the same in every time zone: Wednesday 2026-11-25 at noon.
const NOON = new Date(2026, 10, 25, 12, 0);
const day = (n) => dayKey(new Date(2026, 10, 25 - n));
const at = (n, hour = 10) => new Date(2026, 10, 25 - n, hour).toISOString();
const facts = (f = {}) => ({ activeDays: [], problems: {}, quizDays: [], drafts: [], ...f });
const attempted = (n, language = 'python') => ({ status: 'attempted', history: [{ at: at(n), language }] });
const kinds = (list) => list.map((n) => n.kind);

test('a new visitor with no activity gets nothing', () => {
  assert.deepEqual(dueNotifications(facts(), NOON), []);
  assert.deepEqual(dueNotifications({ activeDays: [], problems: {} }, NOON), []);
});

test('streak: alive from yesterday and nothing accepted today', () => {
  const [n] = dueNotifications(facts({ activeDays: [day(3), day(2), day(1)] }), NOON);
  assert.equal(n.kind, 'streak');
  assert.equal(n.key, `streak:${day(0)}`);
  assert.equal(n.data.streak, 3);
  assert.equal(n.data.msLeft, 12 * 3600 * 1000);
  assert.equal(n.urgent, false);
});

test('streak: nothing once today is solved, or once the streak is already broken', () => {
  assert.deepEqual(kinds(dueNotifications(facts({ activeDays: [day(1), day(0)] }), NOON)), []);
  assert.deepEqual(kinds(dueNotifications(facts({ activeDays: [day(3), day(2)] }), NOON)), []);
});

test('streak reminders turn urgent in the last four hours of the day', () => {
  const f = facts({ activeDays: [day(1)], quizDays: [day(1)] });
  assert.ok(dueNotifications(f, new Date(2026, 10, 25, 19, 59)).every((n) => !n.urgent));
  const late = dueNotifications(f, new Date(2026, 10, 25, 21, 0));
  assert.deepEqual(kinds(late), ['streak', 'quiz-streak']);
  assert.ok(late.every((n) => n.urgent));
});

test('quiz-streak: the daily quiz played yesterday and not today', () => {
  const [n] = dueNotifications(facts({ quizDays: [day(1)] }), NOON);
  assert.equal(n.kind, 'quiz-streak');
  assert.equal(n.key, `quiz-streak:${day(0)}`);
  assert.equal(n.data.streak, 1);
  assert.deepEqual(dueNotifications(facts({ quizDays: [day(1), day(0)] }), NOON), []);
});

test('unfinished: a problem not solved, last touched within the window', () => {
  const [n] = dueNotifications(facts({ problems: { 'pair-sum-target': attempted(3) } }), NOON);
  assert.equal(n.kind, 'unfinished');
  assert.equal(n.key, `unfinished:pair-sum-target:${day(3)}`);
  assert.deepEqual(n.data, { problemId: 'pair-sum-target', lang: 'python', days: 3 });
});

test('unfinished: not before UNFINISHED_MIN_DAYS, not after UNFINISHED_MAX_DAYS', () => {
  const recent = { activeDays: [day(0)] }; // keeps "away" out of the way
  const due = (n) => kinds(dueNotifications(facts({ ...recent, problems: { p: attempted(n) } }), NOON)).includes('unfinished');
  assert.equal(due(UNFINISHED_MIN_DAYS - 1), false);
  assert.equal(due(UNFINISHED_MIN_DAYS), true);
  assert.equal(due(UNFINISHED_MAX_DAYS), true);
  assert.equal(due(UNFINISHED_MAX_DAYS + 1), false);
});

test('unfinished: solved problems never count; a draft edit is a touch', () => {
  assert.deepEqual(dueNotifications(facts({ problems: { p: { status: 'solved', history: [{ at: at(3), language: 'go' }] } } }), NOON), []);
  const solvedWithDraft = facts({ problems: { p: { status: 'solved' } }, drafts: [{ problemId: 'p', lang: 'js', at: at(3) }] });
  assert.deepEqual(dueNotifications(solvedWithDraft, NOON), []);
  const [n] = dueNotifications(facts({ drafts: [{ problemId: 'never-submitted', lang: 'js', at: at(2) }] }), NOON);
  assert.deepEqual(n.data, { problemId: 'never-submitted', lang: 'js', days: 2 });
});

test('unfinished: a newer draft edit means the problem was not left', () => {
  const f = facts({ problems: { p: attempted(5) }, drafts: [{ problemId: 'p', lang: 'js', at: at(1) }] });
  assert.deepEqual(dueNotifications(f, NOON), []);
});

test('unfinished: the most recent problem in the window, even while another is in progress today', () => {
  const f = facts({ problems: { a: attempted(3), b: attempted(5), c: attempted(0) } });
  const list = dueNotifications(f, NOON);
  assert.deepEqual(kinds(list), ['unfinished']);
  assert.equal(list[0].data.problemId, 'a');
});

test('unfinished: a touch with an unreadable time is ignored', () => {
  assert.deepEqual(dueNotifications(facts({ problems: { p: { status: 'attempted', history: [{ at: 'yesterday', language: 'js' }] } } }), NOON), []);
});

test('away: a week or more without practice, with the problem to resume', () => {
  const f = facts({ activeDays: [day(12)], problems: { a: attempted(10, 'java'), s: { status: 'solved', history: [{ at: at(9), language: 'go' }] } } });
  const list = dueNotifications(f, NOON);
  assert.deepEqual(kinds(list), ['away']);
  assert.equal(list[0].key, `away:${day(9)}`);
  assert.deepEqual(list[0].data, { days: 9, lastDay: day(9), resume: { problemId: 'a', lang: 'java' } });
});

test('away: starts at AWAY_DAYS; a daily quiz counts as practice', () => {
  assert.deepEqual(kinds(dueNotifications(facts({ activeDays: [day(AWAY_DAYS - 1)] }), NOON)), []);
  assert.deepEqual(kinds(dueNotifications(facts({ activeDays: [day(AWAY_DAYS)] }), NOON)), ['away']);
  assert.deepEqual(kinds(dueNotifications(facts({ activeDays: [day(AWAY_DAYS)], quizDays: [day(2)] }), NOON)), []);
});

test('away: nothing to resume when everything touched is solved', () => {
  const [n] = dueNotifications(facts({ activeDays: [day(8)] }), NOON);
  assert.equal(n.data.resume, null);
});

test('kinds turned off and dismissed keys are left out; the rest keep their order', () => {
  const f = facts({ activeDays: [day(1)], quizDays: [day(1)], problems: { p: attempted(3) } });
  assert.deepEqual(kinds(dueNotifications(f, NOON)), ['streak', 'quiz-streak', 'unfinished']);
  assert.deepEqual(kinds(dueNotifications(f, NOON, { settings: { 'quiz-streak': false } })), ['streak', 'unfinished']);
  assert.deepEqual(kinds(dueNotifications(f, NOON, { dismissed: { [`streak:${day(0)}`]: day(0) } })), ['quiz-streak', 'unfinished']);
  // Yesterday's dismissal does not hide today's reminder.
  assert.deepEqual(kinds(dueNotifications(f, NOON, { dismissed: { [`streak:${day(1)}`]: day(1) } })), ['streak', 'quiz-streak', 'unfinished']);
});

test('a new touch on the same problem is a new occurrence', () => {
  const first = dueNotifications(facts({ problems: { p: attempted(4) } }), NOON)[0];
  const later = dueNotifications(facts({ problems: { p: attempted(2) } }), NOON)[0];
  assert.notEqual(first.key, later.key);
});

test('copy: every kind has a title, a body, a link and an action', () => {
  const title = (id) => ({ p: 'Pair Sum Target' })[id] ?? null;
  const late = new Date(2026, 10, 25, 21, 0);
  const all = [
    ...dueNotifications(facts({ activeDays: [day(2), day(1)], quizDays: [day(1)], problems: { p: attempted(3) } }), late),
    ...dueNotifications(facts({ activeDays: [day(8)], problems: { p: attempted(8) } }), NOON),
  ];
  assert.deepEqual(kinds(all).sort(), [...NOTIFICATION_KINDS].sort());
  const copy = Object.fromEntries(all.map((n) => [n.kind, notificationCopy(n, { problemTitle: title })]));
  assert.deepEqual(copy.streak, { title: 'Keep your 2-day streak', body: 'Solve one problem today. 3 h 0 min left.', href: '#/daily', action: "Today's problem" });
  assert.deepEqual(copy['quiz-streak'], { title: 'Keep your quiz streak going', body: "Play today's daily quiz. 3 h 0 min left.", href: '#/quiz/daily', action: 'Play the daily quiz' });
  assert.deepEqual(copy.unfinished, { title: 'Finish Pair Sum Target', body: 'You left it 3 days ago, not solved yet.', href: '#/problem/p', action: 'Continue' });
  assert.deepEqual(copy.away, { title: 'Welcome back', body: 'It has been 8 days. Pick up Pair Sum Target where you left it.', href: '#/problem/p', action: 'Continue' });
  for (const c of Object.values(copy)) assert.doesNotMatch(Object.values(c).join(' '), /[!\u2013\u2014]/, 'no exclamation marks or dashes in UI copy');
});

test('copy: never names a problem the catalog does not have', () => {
  const unfinished = dueNotifications(facts({ problems: { gone: attempted(3) } }), NOON)[0];
  assert.equal(notificationCopy(unfinished), null);
  const away = dueNotifications(facts({ activeDays: [day(8)], problems: { gone: attempted(8) } }), NOON)[0];
  assert.deepEqual(notificationCopy(away), { title: 'Welcome back', body: "It has been 8 days. Today's problem is a good way back in.", href: '#/daily', action: "Today's problem" });
});

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

test('settings: every kind starts on; turning one off and on again', () => {
  let s = emptyNotificationState();
  assert.ok(NOTIFICATION_KINDS.every((k) => isKindEnabled(s, k)));
  s = setKindEnabled(s, 'away', false);
  assert.equal(isKindEnabled(s, 'away'), false);
  assert.deepEqual(s.settings, { away: false });
  s = setKindEnabled(s, 'away', true);
  assert.deepEqual(s.settings, {});
  assert.throws(() => setKindEnabled(s, 'spam', false), /Unknown notification kind/);
});

test('dismiss records the day and drops keys older than DISMISS_KEEP_DAYS', () => {
  const today = day(0);
  let s = { ...emptyNotificationState(), dismissed: { old: shiftDay(today, DISMISS_KEEP_DAYS + 1), edge: shiftDay(today, DISMISS_KEEP_DAYS) } };
  s = dismiss(s, `streak:${today}`, NOON);
  assert.deepEqual(s.dismissed, { edge: shiftDay(today, DISMISS_KEEP_DAYS), [`streak:${today}`]: today });
});

test('settings and dismissals feed dueNotifications', () => {
  const f = facts({ activeDays: [day(1)], problems: { p: attempted(3) } });
  let s = setKindEnabled(emptyNotificationState(), 'unfinished', false);
  s = dismiss(s, `streak:${day(0)}`, NOON);
  assert.deepEqual(dueNotifications(f, NOON, s), []);
});

test('normalizeNotificationState keeps only what this version understands', () => {
  assert.deepEqual(normalizeNotificationState(null), emptyNotificationState());
  assert.deepEqual(normalizeNotificationState({ version: 2, settings: { away: false } }), emptyNotificationState());
  const raw = { version: 1, settings: { away: false, streak: true, spam: false }, dismissed: { a: '2026-11-20', b: 5, c: 'soon' } };
  assert.deepEqual(normalizeNotificationState(raw), { version: 1, settings: { away: false }, dismissed: { a: '2026-11-20' } });
});

test('load and save round-trip; a broken or missing store starts empty', () => {
  const st = fakeStorage();
  const s = dismiss(setKindEnabled(emptyNotificationState(), 'streak', false), 'k', NOON);
  saveNotificationState(s, st);
  assert.deepEqual(loadNotificationState(st), s);
  assert.deepEqual(loadNotificationState(fakeStorage({ [NOTIFICATIONS_KEY]: '{not json' })), emptyNotificationState());
  assert.deepEqual(loadNotificationState(null), emptyNotificationState());
  assert.doesNotThrow(() => saveNotificationState(s, { setItem: () => { throw new Error('quota'); } }));
});
