// The daily-quiz Edge Function (deploy/supabase/functions/daily-quiz/core.js): it must pick the
// same questions as the browser, score choices itself, accept only a playable day, record the
// first play once, and rank fairly. Storage and auth are in-memory fakes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, dailyIds, scoreDaily, isPlayableDay, weekStart, streakOn, rank, weeklyTotals, cleanName } from '../deploy/supabase/functions/daily-quiz/core.js';
import { QUIZ_ROWS } from '../deploy/supabase/functions/daily-quiz/bank.js';
import { dailyQuizIds } from '../src/js/modes/quiz.js';
import { QUIZ_INDEX } from '../src/js/data/quiz-index.js';
import { readBank } from '../scripts/content/build-quiz.mjs';

const BANK = new Map(readBank().map((q) => [q.id, q]));
const NOW = Date.parse('2026-11-24T10:00:00Z');
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const perfect = (day) => dailyIds(day).map((id) => ({ id, choice: BANK.get(id).answer }));

test('the server picks the same daily questions as the browser, every day for over a year', () => {
  for (let i = 0; i < 420; i++) {
    const day = addDays('2026-11-23', i);
    assert.deepEqual(dailyIds(day), dailyQuizIds(QUIZ_INDEX, day), day);
  }
});

test('the server answer key matches the bank', () => {
  assert.equal(QUIZ_ROWS.length, BANK.size);
  for (const [id, topic, answer, count] of QUIZ_ROWS) {
    const q = BANK.get(id);
    assert.deepEqual([topic, answer, count], [q.topic, q.answer, q.options.length], id);
  }
});

test('scoreDaily scores choices in authored order and rejects anything that is not that day', () => {
  const day = '2026-11-24';
  assert.deepEqual(scoreDaily({ day, answers: perfect(day) }).correct, 5);
  const oneWrong = perfect(day).map((a, i) => (i === 0 ? { ...a, choice: (a.choice + 1) % BANK.get(a.id).options.length } : a));
  const s = scoreDaily({ day, answers: oneWrong });
  assert.equal(s.correct, 4);
  assert.deepEqual(s.results, [false, true, true, true, true]);
  assert.throws(() => scoreDaily({ day, answers: perfect('2026-11-25') }), /not the questions/);
  assert.throws(() => scoreDaily({ day, answers: perfect(day).slice(1) }), /Expected 5/);
  assert.throws(() => scoreDaily({ day, answers: perfect(day).map((a) => ({ ...a, choice: 9 })) }), /Invalid choice/);
  assert.throws(() => scoreDaily({ day, answers: [...perfect(day).slice(1), perfect(day)[1]] }), /not the questions/);
});

test('only a day that is today somewhere on Earth can be played', () => {
  assert.ok(isPlayableDay('2026-11-24', NOW));
  assert.ok(isPlayableDay('2026-11-25', Date.parse('2026-11-24T11:00:00Z')), 'UTC+14 is already tomorrow');
  assert.ok(!isPlayableDay('2026-11-25', Date.parse('2026-11-24T09:00:00Z')));
  assert.ok(isPlayableDay('2026-11-23', Date.parse('2026-11-24T11:00:00Z')), 'UTC-12 is still yesterday');
  assert.ok(!isPlayableDay('2026-11-22', NOW));
  assert.ok(!isPlayableDay('2026-02-30', NOW));
  assert.ok(!isPlayableDay('yesterday', NOW));
  assert.ok(!isPlayableDay('2026-11-22', Date.parse('2026-11-22T10:00:00Z')), 'before the first daily quiz');
});

test('weeks run Sunday to Saturday; the streak counts back from today or yesterday', () => {
  assert.equal(weekStart('2026-11-24'), '2026-11-22');
  assert.equal(weekStart('2026-11-22'), '2026-11-22');
  assert.equal(weekStart('2026-11-28'), '2026-11-22');
  assert.equal(weekStart('2026-11-29'), '2026-11-29');
  assert.equal(streakOn(['2026-11-22', '2026-11-23'], '2026-11-24'), 2, 'today still open');
  assert.equal(streakOn(['2026-11-22', '2026-11-23', '2026-11-24'], '2026-11-24'), 3);
  assert.equal(streakOn(['2026-11-20', '2026-11-24'], '2026-11-24'), 1);
  assert.equal(streakOn([], '2026-11-24'), 0);
});

test('ranking: score first, then time; equal score and time share a rank', () => {
  const r = rank([
    { user_id: 'a', correct: 4, ms: 50000 },
    { user_id: 'b', correct: 5, ms: 90000 },
    { user_id: 'c', correct: 4, ms: 40000 },
    { user_id: 'd', correct: 4, ms: 40000 },
  ]);
  assert.deepEqual(r.map((x) => [x.user_id, x.rank]), [['b', 1], ['c', 2], ['d', 2], ['a', 4]]);
  assert.deepEqual(weeklyTotals([{ user_id: 'a', correct: 3, ms: 10 }, { user_id: 'a', correct: 5, ms: 20 }, { user_id: 'b', correct: 4, ms: 5 }]), [
    { user_id: 'a', correct: 8, ms: 30, days: 2 },
    { user_id: 'b', correct: 4, ms: 5, days: 1 },
  ]);
});

/** An in-memory function: users by token, a results table, names. */
function fakeServer(now = NOW) {
  const rows = [];
  const nicknames = new Map();
  const users = { 'tok-ana': { id: 'u-ana' }, 'tok-ben': { id: 'u-ben' } };
  const handle = createHandler({
    now: () => now,
    getUser: async (jwt) => users[jwt] ?? null,
    results: {
      insert: async (row) => {
        if (rows.some((r) => r.user_id === row.user_id && r.day === row.day)) return false;
        rows.push({ ...row, submitted_at: new Date(now + rows.length).toISOString() });
        return true;
      },
      between: async (from, to) => rows.filter((r) => r.day >= from && r.day <= to),
      daysOf: async (userId, from) => rows.filter((r) => r.user_id === userId && r.day >= from).map((r) => r.day),
    },
    names: async (ids) => new Map(ids.map((id) => [id, nicknames.get(id) ?? (id === 'u-ana' ? 'Ana Levi' : 'Ben Cohen')])),
    profiles: {
      nickname: async (id) => nicknames.get(id) ?? null,
      setNickname: async (id, name) => (name ? nicknames.set(id, name) : nicknames.delete(id)),
    },
  });
  const call = (method, path, { token, body } = {}) =>
    handle(new Request(`https://x.supabase.co/functions/v1/daily-quiz${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })).then(async (r) => ({ status: r.status, body: await r.json() }));
  return { call, rows };
}

test('submit: needs a session, scores on the server, counts the first play only, and ranks', async () => {
  const { call, rows } = fakeServer();
  const day = '2026-11-24';
  assert.equal((await call('POST', '/submit', { body: { day, answers: perfect(day), ms: 1000 } })).status, 401);
  assert.equal((await call('POST', '/submit', { token: 'tok-ana', body: { day: '2026-11-20', answers: perfect(day) } })).status, 400);
  // A client-sent score is ignored: only the choices count.
  const wrongAll = perfect(day).map((a) => ({ ...a, choice: (a.choice + 1) % BANK.get(a.id).options.length }));
  const ana = await call('POST', '/submit', { token: 'tok-ana', body: { day, answers: wrongAll, ms: 30000, correct: 5 } });
  assert.equal(ana.status, 200);
  assert.equal(ana.body.correct, 0);
  assert.equal(ana.body.recorded, true);
  const again = await call('POST', '/submit', { token: 'tok-ana', body: { day, answers: perfect(day), ms: 1000 } });
  assert.equal(again.body.correct, 5, 'the replay is scored for the player');
  assert.equal(again.body.recorded, false, 'but the board keeps the first play');
  assert.equal(rows.length, 1);
  const ben = await call('POST', '/submit', { token: 'tok-ben', body: { day, answers: perfect(day), ms: 999999999 } });
  assert.equal(ben.body.board.daily[0].name, 'Ben Cohen');
  assert.equal(ben.body.board.daily[0].ms, 2 * 60 * 60 * 1000, 'time is clamped');
  assert.equal(ben.body.board.daily[0].you, true);
  assert.equal(ben.body.board.daily[1].you, false);
  assert.equal(ben.body.board.players, 2);
  assert.deepEqual(ben.body.board.me, { streak: 1, played: true, name: 'Ben Cohen', custom: false });
  assert.ok(!JSON.stringify(ben.body.board).includes('u-ana'), 'user ids never leave the server');
});

test('board: public to read, weekly sums across days, streak for the caller', async () => {
  const { call } = fakeServer(Date.parse('2026-11-25T10:00:00Z'));
  // Two days for Ana in the same week, through a server whose clock moves.
  const rows = [];
  const handleAt = (now) =>
    createHandler({
      now: () => now,
      getUser: async (jwt) => (jwt === 'tok-ana' ? { id: 'u-ana' } : null),
      results: {
        insert: async (row) => (rows.push({ ...row, submitted_at: new Date(now).toISOString() }), true),
        between: async (from, to) => rows.filter((r) => r.day >= from && r.day <= to),
        daysOf: async (id) => rows.filter((r) => r.user_id === id).map((r) => r.day),
      },
      names: async (ids) => new Map(ids.map((id) => [id, 'Ana Levi'])),
      profiles: { nickname: async () => null, setNickname: async () => {} },
    });
  const post = (now, day) => handleAt(now)(new Request('https://x/functions/v1/daily-quiz/submit', { method: 'POST', headers: { Authorization: 'Bearer tok-ana' }, body: JSON.stringify({ day, answers: perfect(day), ms: 60000 }) })).then((r) => r.json());
  await post(Date.parse('2026-11-24T10:00:00Z'), '2026-11-24');
  const second = await post(Date.parse('2026-11-25T10:00:00Z'), '2026-11-25');
  assert.equal(second.board.weekly[0].correct, 10);
  assert.equal(second.board.weekly[0].days, 2);
  assert.equal(second.board.me.streak, 2);
  const open = await handleAt(Date.parse('2026-11-25T10:00:00Z'))(new Request('https://x/functions/v1/daily-quiz/board?day=2026-11-25')).then((r) => r.json());
  assert.equal(open.daily.length, 1);
  assert.equal(open.me, undefined, 'signed-out readers get no personal block');
  assert.equal((await call('GET', '/board?day=2030-01-01')).status, 400);
  assert.equal((await call('GET', '/nope')).status, 404);
});

test('cleanName: trims, strips control and bidi characters, bounds the length, empty means none', () => {
  assert.equal(cleanName('  Roy   C  '), 'Roy C');
  assert.equal(cleanName('רועי'), 'רועי');
  assert.equal(cleanName('Ro\u202Ey'), 'Roy', 'a right-to-left override cannot flip the board');
  assert.equal(cleanName('a\u0000b'), 'ab');
  assert.equal(cleanName(''), null);
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName(null), null);
  assert.equal(cleanName('x'.repeat(24)), 'x'.repeat(24));
  assert.throws(() => cleanName('x'), /2 to 24/);
  assert.throws(() => cleanName('x'.repeat(25)), /2 to 24/);
  assert.throws(() => cleanName(42), /Invalid name/);
});

test('name: needs a session, shows on the board, and an empty name goes back to the sign-in name', async () => {
  const { call } = fakeServer();
  const day = '2026-11-24';
  assert.equal((await call('POST', '/name', { body: { name: 'Roy' } })).status, 401);
  assert.equal((await call('POST', '/name', { token: 'tok-ana', body: { name: 'A' } })).status, 400);
  const set = await call('POST', '/name', { token: 'tok-ana', body: { name: ' Ace ' } });
  assert.deepEqual(set.body, { name: 'Ace', custom: true });
  const played = await call('POST', '/submit', { token: 'tok-ana', body: { day, answers: perfect(day), ms: 1000 } });
  assert.equal(played.body.board.daily[0].name, 'Ace');
  assert.deepEqual(played.body.board.me, { streak: 1, played: true, name: 'Ace', custom: true });
  const reset = await call('POST', '/name', { token: 'tok-ana', body: { name: '' } });
  assert.deepEqual(reset.body, { name: 'Ana Levi', custom: false });
  assert.equal((await call('GET', `/board?day=${day}`)).body.daily[0].name, 'Ana Levi');
});
