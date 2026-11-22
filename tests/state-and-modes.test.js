import { test } from 'node:test';
import assert from 'node:assert/strict';

import { emptyState, recordSubmission, computeStreak, stats, dayKey, load } from '../src/js/state/progress.js';
import { createSession, recordAttempt, recordTabSwitch, finish, analytics, remainingMs, formatClock, timerState, problemStatus, scoreBand, WARNING_MS } from '../src/js/modes/interview.js';
import { createBot } from '../src/js/modes/battle.js';
import { ScriptedMentor } from '../src/js/mentor/mentor.js';
import problem from '../src/js/problems/smallest-base-segment/problem.js';

const day = (s) => new Date(`${s}T12:00:00`);

test('accuracy and solved count follow submissions', () => {
  let s = emptyState();
  s = recordSubmission(s, { problemId: 'p', accepted: false, now: day('2026-11-14') });
  s = recordSubmission(s, { problemId: 'p', accepted: true, now: day('2026-11-14') });
  s = recordSubmission(s, { problemId: 'p', accepted: false, now: day('2026-11-14') });
  const st = stats(s, day('2026-11-14'));
  assert.equal(st.solved, 1);
  assert.equal(st.accuracy, 33);
  assert.equal(s.problems.p.status, 'solved', 'a later failed submit must not un-solve');
});

test('streak counts consecutive days and tolerates "not yet today"', () => {
  const days = ['2026-11-13', '2026-11-14', '2026-11-15'];
  assert.equal(computeStreak(days, day('2026-11-15')), 3);
  assert.equal(computeStreak(days, day('2026-11-16')), 3);
  assert.equal(computeStreak(days, day('2026-11-17')), 0);
  assert.equal(dayKey(day('2026-01-05')), '2026-01-05');
});

test('load survives corrupt storage', () => {
  const bad = { getItem: () => '{not json' };
  assert.deepEqual(load(bad), emptyState());
});

test('interview session: timer, attempts, status, warning window, score band, integrity penalty', () => {
  const t0 = 1_000_000;
  let s = createSession({ problemIds: ['a', 'b', 'c'], now: t0 });
  assert.equal(remainingMs(s, t0 + 60_000), 45 * 60_000 - 60_000);
  assert.equal(problemStatus(s, 'a'), 'todo');
  assert.equal(problemStatus(s, 'b'), 'todo');
  assert.equal(problemStatus(s, 'c'), 'todo');
  // Before the last 5 minutes: not warning. Inside the last 5 minutes: warning. At 0: expired.
  assert.deepEqual(timerState(s, t0 + 45 * 60_000 - WARNING_MS - 1000), { ms: WARNING_MS + 1000, warning: false, expired: false });
  assert.deepEqual(timerState(s, t0 + 45 * 60_000 - WARNING_MS), { ms: WARNING_MS, warning: true, expired: false });
  assert.deepEqual(timerState(s, t0 + 45 * 60_000), { ms: 0, warning: false, expired: true });

  s = recordAttempt(s, { problemId: 'a', passed: 15, total: 15, accepted: true, kind: 'submit', now: t0 + 10 * 60_000 });
  // Even a 0/15 run marks the problem as tried.
  s = recordAttempt(s, { problemId: 'b', passed: 0, total: 15, accepted: false, kind: 'run', now: t0 + 20 * 60_000 });
  assert.equal(problemStatus(s, 'a'), 'solved');
  assert.equal(problemStatus(s, 'b'), 'tried');
  assert.equal(problemStatus(s, 'c'), 'todo');

  s = recordTabSwitch(s, t0 + 25 * 60_000);
  s = finish(s, t0 + 30 * 60_000);
  const a = analytics(s);
  assert.equal(a.solved, 1);
  assert.equal(a.tabSwitches, 1);
  assert.equal(a.runs, 1);
  assert.ok(a.score > 0 && a.score <= 100);
  assert.equal(a.band.band, scoreBand(a.score).band);
  assert.equal(scoreBand(85).band, 'strong');
  assert.equal(scoreBand(60).band, 'mid');
  assert.equal(scoreBand(20).band, 'low');
  // Attempts after the session ends are ignored.
  const after = recordAttempt(s, { problemId: 'b', passed: 15, total: 15, accepted: true, kind: 'submit', now: t0 + 31 * 60_000 });
  assert.equal(after.perProblem.b.bestPassed, 0);
  assert.equal(formatClock(65_000), '01:05');
});

test('battle bot is monotonic, seeded, and finishes', () => {
  const bot = createBot({ difficulty: 'Medium', seed: 7 });
  const again = createBot({ difficulty: 'Medium', seed: 7 });
  let prev = 0;
  for (let t = 0; t <= bot.solveMs; t += 5000) {
    const p = bot.passedAt(t);
    assert.ok(p >= prev);
    assert.equal(p, again.passedAt(t));
    prev = p;
  }
  assert.equal(bot.passedAt(bot.solveMs), 15);
});

test('scripted mentor refuses to give the answer and walks hints in order', async () => {
  const m = new ScriptedMentor();
  const refuse = await m.reply({ message: 'just give me the solution', problem });
  assert.match(refuse, /won't hand you the solution/);
  const h1 = await m.reply({ message: 'hint please', problem });
  const h2 = await m.reply({ message: 'another', problem });
  assert.match(h1, /^Hint 1\//);
  assert.match(h2, /^Hint 2\//);
});
