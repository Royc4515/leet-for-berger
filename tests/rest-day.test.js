import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, dayKey } from '../src/js/state/progress.js';
import { bestStreak, DEFAULT_REST_DAY, parseDay, shiftDay } from '../src/js/data/daily.js';
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
  assert.deepEqual(kinds(at('2026-11-29'), null), [], 'without a rest day it already broke on Saturday');
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
