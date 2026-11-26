import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyNumber, bestStreak, activeInWindow, msUntilNextDaily, formatCountdown, calendarWeeks, daysBetween, shiftDay, DAILY_EPOCH } from '../src/js/data/daily.js';

test('dailyNumber counts calendar days from the epoch, across a DST change', () => {
  assert.equal(dailyNumber(DAILY_EPOCH), 1);
  assert.equal(dailyNumber('2026-01-02'), 2);
  assert.equal(dailyNumber('2026-11-23'), 327);
  assert.equal(daysBetween('2026-03-26', '2026-03-30'), 4);
});

test('shiftDay moves by calendar days', () => {
  assert.equal(shiftDay('2026-03-01', 1), '2026-02-28');
  assert.equal(shiftDay('2026-12-31', -1), '2027-01-01');
});

test('bestStreak finds the longest consecutive run, ignoring order and duplicates', () => {
  assert.equal(bestStreak([]), 0);
  assert.equal(bestStreak(['2026-11-01']), 1);
  assert.equal(bestStreak(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-02', '2026-11-05', '2026-11-06']), 3);
  assert.equal(bestStreak(['2026-02-27', '2026-02-28', '2026-03-01']), 3);
});

test('activeInWindow counts distinct active days in the last N days, today included', () => {
  const days = ['2026-11-23', '2026-11-20', '2026-10-25', '2026-10-24', '2026-11-30'];
  assert.equal(activeInWindow(days, '2026-11-23', 30), 3);
  assert.equal(activeInWindow(days, '2026-11-23', 1), 1);
});

test('msUntilNextDaily and formatCountdown: minutes only, never zero', () => {
  const now = new Date(2026, 10, 23, 14, 18, 30);
  const ms = msUntilNextDaily(now);
  assert.equal(ms, (9 * 60 + 41) * 60000 + 30000);
  assert.equal(formatCountdown(ms), '9 h 42 min');
  assert.equal(formatCountdown(59 * 60000), '59 min');
  assert.equal(formatCountdown(5), '1 min');
});

test('calendarWeeks: 16 Monday-first weeks ending with the week that holds today', () => {
  const weeks = calendarWeeks({
    today: '2026-11-23', // a Monday
    activeDays: ['2026-11-23', '2026-11-20'],
    dailyFor: (d) => `p-${d}`,
    isSolved: (id) => id === 'p-2026-11-20',
  });
  assert.equal(weeks.length, 16);
  assert.ok(weeks.every((w) => w.length === 7));
  const last = weeks.at(-1);
  assert.equal(last[0].day, '2026-11-23');
  assert.equal(last[0].today, true);
  assert.equal(last[0].active, true);
  assert.equal(last[1].future, true);
  assert.equal(last[1].dailyId, null);
  const fri = weeks.at(-2)[4];
  assert.equal(fri.day, '2026-11-20');
  assert.deepEqual([fri.active, fri.dailySolved], [true, true]);
  assert.equal(weeks[0][0].day, '2026-08-10');
  // Every day appears once, in order.
  const flat = weeks.flat().map((d) => d.day);
  assert.equal(new Set(flat).size, 112);
  assert.deepEqual(flat, [...flat].sort());
});

test('formatCountdown in Hebrew: hours and minutes in Hebrew abbreviations; English is unchanged', () => {
  const ms = 9 * 3600000 + 42 * 60000;
  assert.equal(formatCountdown(ms, 'he'), '9 שע׳ 42 דק׳');
  assert.equal(formatCountdown(59 * 60000, 'he'), '59 דק׳');
  assert.equal(formatCountdown(ms, 'en'), '9 h 42 min');
  assert.equal(formatCountdown(ms), '9 h 42 min');
});
