import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, dayKey, emptyState, recordSubmission, restDayOf, setRestDay, stats, DEFAULT_REST_DAY } from '../src/js/state/progress.js';
import { bestStreak, calendarWeeks, parseDay, shiftDay } from '../src/js/data/daily.js';
import { mergeProgress } from '../src/js/state/sync.js';
import { profileNumbers } from '../src/js/data/profile.js';
import { dailyQuizStreak, emptyQuizProgress } from '../src/js/state/quiz-progress.js';
import { dueNotifications } from '../src/js/data/notifications.js';
import { streakOn } from '../deploy/supabase/functions/daily-quiz/core.js';

// November 2026: Friday 20, Saturday 21, Sunday 22 ... Friday 27, Saturday 28, Sunday 29.
const SAT = 6;
const at = (day, hour = 12) => {
  const d = parseDay(day);
  d.setHours(hour);
  return d;
};

test('the default rest day is Saturday (owner decision 2026-11-25)', () => {
  assert.equal(DEFAULT_REST_DAY, SAT);
  assert.equal(parseDay('2026-11-28').getDay(), SAT);
});

test('a rest day off does not break the coding streak', () => {
  const days = ['2026-11-20', '2026-11-22', '2026-11-23', '2026-11-24'];
  assert.equal(computeStreak(days, at('2026-11-25')), 3, 'without a rest day the missed Saturday breaks it');
  assert.equal(computeStreak(days, at('2026-11-25'), SAT), 4, 'with Saturday as rest day it carries over');
});

test('practice on the rest day still counts', () => {
  const days = ['2026-11-20', '2026-11-21', '2026-11-22'];
  assert.equal(computeStreak(days, at('2026-11-22'), SAT), 3);
  assert.equal(computeStreak(days, at('2026-11-22')), 3);
});

test('the morning after the rest day, Friday keeps the streak alive', () => {
  assert.equal(computeStreak(['2026-11-26', '2026-11-27'], at('2026-11-29', 8), SAT), 2);
  assert.equal(computeStreak(['2026-11-26', '2026-11-27'], at('2026-11-29', 8)), 0);
});

test('the rest day does not excuse a missed working day', () => {
  assert.equal(computeStreak(['2026-11-26'], at('2026-11-28'), SAT), 0, 'Friday was missed');
  assert.equal(computeStreak([], at('2026-11-29'), SAT), 0);
});

test('bestStreak joins runs across a rest day, never across a missed day', () => {
  assert.equal(bestStreak(['2026-11-20', '2026-11-22', '2026-11-23'], SAT), 3);
  assert.equal(bestStreak(['2026-11-20', '2026-11-22', '2026-11-23']), 2);
  assert.equal(bestStreak(['2026-11-19', '2026-11-21'], SAT), 1, 'Friday is missing between them');
  assert.equal(bestStreak(['2026-11-13', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-22'], SAT), 8, 'a Shabbat keeper can pass six days');
});

test('the daily quiz streak takes the same rest day', () => {
  const p = { ...emptyQuizProgress(), daily: { '2026-11-27': { correct: 5, total: 10 }, '2026-11-29': { correct: 6, total: 10 } } };
  assert.equal(dailyQuizStreak(p, at('2026-11-29'), SAT), 2);
  assert.equal(dailyQuizStreak(p, at('2026-11-29')), 1);
});

test('reminders: none on the rest day itself, and the day after it keeps the streak', () => {
  const facts = { activeDays: ['2026-11-27'], problems: {}, quizDays: ['2026-11-27'] };
  const kinds = (now, restDay) => dueNotifications(facts, now, { restDay }).map((n) => n.kind);
  assert.deepEqual(kinds(at('2026-11-28'), SAT), [], 'Saturday is the rest day: nothing ends tonight');
  assert.deepEqual(kinds(at('2026-11-28'), null), ['streak', 'quiz-streak']);
  assert.deepEqual(kinds(at('2026-11-29'), SAT), ['streak', 'quiz-streak'], 'Sunday: alive through Friday');
  assert.deepEqual(kinds(at('2026-11-29'), null), ['restart'], 'without a rest day both broke on Saturday: start again');
  const [n] = dueNotifications({ ...facts, activeDays: ['2026-11-26', '2026-11-27'] }, at('2026-11-29'), { restDay: SAT });
  assert.equal(n.data.streak, 2);
});

test('the server quiz streak agrees with the page on random histories and rest days', () => {
  // A seeded generator, so a failure reproduces.
  let seed = 20261125;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let trial = 0; trial < 600; trial++) {
    const today = shiftDay('2026-12-31', Math.floor(rnd() * 400));
    const days = [];
    for (let back = 0; back < 40; back++) if (rnd() < 0.7) days.push(shiftDay(today, back));
    const restDay = rnd() < 0.2 ? null : Math.floor(rnd() * 7);
    const page = computeStreak(days, at(today, 1 + Math.floor(rnd() * 22)), restDay);
    assert.equal(streakOn(days, today, restDay), page, `days ${days.join(',')} today ${today} rest ${restDay}`);
  }
  assert.equal(dayKey(at('2026-11-28')), '2026-11-28');
});

/* ---------- The setting: stored in the progress record, synced with it ---------- */

const withDays = (days) => ({ ...emptyState(), activeDays: days });

test('restDayOf: Saturday until the user chooses; a choice of a day or of none sticks', () => {
  assert.equal(restDayOf(emptyState()), SAT);
  assert.equal(restDayOf(setRestDay(emptyState(), 5, at('2026-11-25'))), 5);
  assert.equal(restDayOf(setRestDay(emptyState(), null, at('2026-11-25'))), null);
  // A record from a newer or broken client falls back to the default rather than to nonsense.
  assert.equal(restDayOf({ ...emptyState(), restDay: { day: 9, at: 'x' } }), SAT);
  assert.equal(restDayOf({ ...emptyState(), restDay: 'Saturday' }), SAT);
});

test('setRestDay records when it was chosen, and refuses a day that is not a weekday', () => {
  const s = setRestDay(emptyState(), 0, at('2026-11-25'));
  assert.deepEqual(s.restDay, { day: 0, at: at('2026-11-25').toISOString() });
  assert.throws(() => setRestDay(emptyState(), 7, at('2026-11-25')), /weekday/);
  assert.throws(() => setRestDay(emptyState(), 'sat', at('2026-11-25')), /weekday/);
});

test('stats counts the streak with the user\'s rest day', () => {
  const s = withDays(['2026-11-20', '2026-11-22', '2026-11-23']);
  assert.equal(stats(s, at('2026-11-23')).streak, 3, 'default Saturday joins Friday to Sunday');
  assert.equal(stats(setRestDay(s, null, at('2026-11-23')), at('2026-11-23')).streak, 2, 'no rest day: Saturday breaks it');
  assert.equal(stats(setRestDay(s, 5, at('2026-11-23')), at('2026-11-23')).streak, 2, 'Friday rest: Saturday was a working day');
});

test('across devices the newest choice wins, and a record without one keeps the other side\'s', () => {
  const older = setRestDay(emptyState(), 5, new Date('2026-11-20T10:00:00Z'));
  const newer = setRestDay(emptyState(), null, new Date('2026-11-22T10:00:00Z'));
  assert.deepEqual(mergeProgress(older, newer).restDay, newer.restDay);
  assert.deepEqual(mergeProgress(newer, older).restDay, newer.restDay);
  assert.deepEqual(mergeProgress(emptyState(), older).restDay, older.restDay);
  assert.deepEqual(mergeProgress(older, emptyState()).restDay, older.restDay);
  assert.equal(mergeProgress(emptyState(), emptyState()).restDay, undefined, 'nobody chose: nothing stored, Saturday by default');
  const merged = mergeProgress(older, newer);
  assert.deepEqual(mergeProgress(merged, merged), merged, 'idempotent');
});

test('the calendar marks the rest day of each week', () => {
  const weeks = calendarWeeks({ today: '2026-11-25', weeks: 2, activeDays: [], dailyFor: () => null, isSolved: () => false, restDay: SAT });
  const rest = weeks.flat().filter((d) => d.rest).map((d) => d.day);
  assert.deepEqual(rest, ['2026-11-21', '2026-11-28']);
  const none = calendarWeeks({ today: '2026-11-25', weeks: 2, activeDays: [], dailyFor: () => null, isSolved: () => false });
  assert.ok(none.flat().every((d) => d.rest === false));
});

test('the profile counts both streaks with the rest day', () => {
  const quiz = { questions: {}, daily: { '2026-11-27': { correct: 5, total: 5 }, '2026-11-29': { correct: 5, total: 5 } }, best: {} };
  const progress = withDays(['2026-11-27', '2026-11-29']);
  const n = profileNumbers({ progress, quiz, now: at('2026-11-29') });
  assert.equal(n.streak, 2);
  assert.equal(n.quizStreak, 2);
  const strict = profileNumbers({ progress: setRestDay(progress, null, at('2026-11-29')), quiz, now: at('2026-11-29') });
  assert.equal(strict.streak, 1);
  assert.equal(strict.quizStreak, 1);
  assert.ok(recordSubmission(progress, { problemId: 'p', accepted: true, now: at('2026-11-29') }).restDay === undefined, 'a submission never invents a choice');
});
