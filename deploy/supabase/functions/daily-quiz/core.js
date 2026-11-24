/**
 * Daily quiz scoring and leaderboard, server side: runs in a Supabase Edge Function (Deno), and in
 * Node for the unit tests. Storage and auth are injected.
 *
 * The browser plays the daily quiz from the public bank, but the score that reaches the
 * leaderboard is computed here from the player's choices, recorded once per user per day, and
 * never accepted from the client. The bank is public, so a player who reads the files can still
 * look answers up; the owner accepted that trade-off (docs/PLAN.md decision log, 2026-11-24).
 *
 * Routes:
 *   GET  /board?day=YYYY-MM-DD   today's and this week's leaderboard, plus the caller's streak
 *                                when a session is sent (signed-out callers see the board)
 *   POST /submit { day, answers: [{ id, choice }], ms }   needs a session; scores and records the
 *                                first play of `day`, returns the score, rank and streak
 *
 * `choice` is the index of the chosen option in the question's AUTHORED order (the browser
 * shuffles options for display and maps the choice back), so scoring needs no shuffle here.
 */
import { QUIZ_ROWS, DAILY_QUIZ_EPOCH, DAILY_QUIZ_SIZE } from './bank.js';

/** Rows shown per leaderboard; the caller's own row is added when it falls below. */
export const BOARD_SIZE = 50;
/** A play longer than this is clamped: the time only breaks ties. */
export const MAX_MS = 2 * 60 * 60 * 1000;

// don't touch / mulberry32 and FNV-1a must match src/js/engine/rng.js and src/js/data/recommend.js
// exactly, or the server picks different daily questions than the browser shows.
// tests/daily-quiz-server.test.js compares the two pickers over hundreds of days.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function shuffled(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The daily quiz ids for `day`, the same algorithm as dailyQuizIds in src/js/modes/quiz.js.
 * @param {string} day
 * @returns {string[]}
 */
export function dailyIds(day) {
  const rand = mulberry32(hashString(`quiz:${day}`));
  const sorted = QUIZ_ROWS.map(([id, topic]) => ({ id, topic })).sort((a, b) => (a.id < b.id ? -1 : 1));
  const topics = shuffled([...new Set(sorted.map((q) => q.topic))].sort(), rand);
  const picks = [];
  for (const t of topics) {
    if (picks.length === DAILY_QUIZ_SIZE) break;
    const inTopic = sorted.filter((q) => q.topic === t);
    picks.push(inTopic[Math.floor(rand() * inTopic.length)].id);
  }
  const rest = shuffled(sorted.filter((q) => !picks.includes(q.id)), rand);
  while (picks.length < DAILY_QUIZ_SIZE && rest.length) picks.push(rest.shift().id);
  return picks;
}

const KEY = new Map(QUIZ_ROWS.map(([id, , answer, count]) => [id, { answer, count }]));

/** "YYYY-MM-DD" -> days since 1970-01-01 (UTC calendar arithmetic, no time zones). */
const dayNumber = (day) => Math.round(Date.parse(`${day}T00:00:00Z`) / 86400000);
const dayFromNumber = (n) => new Date(n * 86400000).toISOString().slice(0, 10);

/**
 * True when `day` is a real calendar day that can be "today" somewhere on Earth at `now`
 * (UTC-12 to UTC+14): players submit their local day, and a day outside that window is a
 * replayed or forged one.
 * @param {string} day
 * @param {number} now ms since epoch
 */
export function isPlayableDay(day, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || dayFromNumber(dayNumber(day)) !== day) return false;
  if (day < DAILY_QUIZ_EPOCH) return false;
  const earliest = dayFromNumber(Math.floor((now - 12 * 3600000) / 86400000));
  const latest = dayFromNumber(Math.floor((now + 14 * 3600000) / 86400000));
  return day >= earliest && day <= latest;
}

/**
 * The Sunday that starts `day`'s week (the Israeli working week, Sunday to Saturday).
 * @param {string} day
 * @returns {string}
 */
export function weekStart(day) {
  const n = dayNumber(day);
  const weekday = (n + 4) % 7; // 1970-01-01 was a Thursday; 0 = Sunday
  return dayFromNumber(n - weekday);
}

/**
 * Scores one submission. Throws a message the client can show when the submission does not
 * match `day`'s quiz.
 * @param {{ day: string, answers: { id: string, choice: number }[] }} input
 * @returns {{ correct: number, total: number, results: boolean[] }}
 */
export function scoreDaily({ day, answers }) {
  const ids = dailyIds(day);
  if (!Array.isArray(answers) || answers.length !== ids.length) throw new Error(`Expected ${ids.length} answers`);
  const byId = new Map(answers.map((a) => [a?.id, a?.choice]));
  if (byId.size !== ids.length || ids.some((id) => !byId.has(id))) throw new Error('These are not the questions of that day');
  const results = ids.map((id) => {
    const { answer, count } = KEY.get(id);
    const choice = byId.get(id);
    if (!Number.isInteger(choice) || choice < 0 || choice >= count) throw new Error('Invalid choice');
    return choice === answer;
  });
  return { correct: results.filter(Boolean).length, total: ids.length, results };
}

/**
 * Consecutive played days ending on `day`, or on the day before while `day` is not played yet.
 * @param {string[]} days played days, any order
 * @param {string} day
 */
export function streakOn(days, day) {
  const set = new Set(days);
  let n = dayNumber(day);
  if (!set.has(day)) n -= 1;
  let streak = 0;
  while (set.has(dayFromNumber(n))) {
    streak++;
    n--;
  }
  return streak;
}

/**
 * Ranks rows: more correct first, then less time, then earlier submission. Rows are
 * { user_id, correct, ms, submitted_at } (daily) or aggregated weekly rows with `days`.
 * @template {{ user_id: string, correct: number, ms: number, submitted_at?: string }} R
 * @param {R[]} rows
 * @returns {(R & { rank: number })[]}
 */
export function rank(rows) {
  const sorted = [...rows].sort((a, b) => b.correct - a.correct || a.ms - b.ms || String(a.submitted_at ?? '').localeCompare(String(b.submitted_at ?? '')));
  let rankNo = 0;
  let prev = null;
  return sorted.map((r, i) => {
    // Equal score and time share a rank, so a tie never looks like a loss.
    if (!prev || prev.correct !== r.correct || prev.ms !== r.ms) rankNo = i + 1;
    prev = r;
    return { ...r, rank: rankNo };
  });
}

/**
 * Sums a week's daily rows per user.
 * @param {{ user_id: string, correct: number, ms: number }[]} rows
 */
export function weeklyTotals(rows) {
  const by = new Map();
  for (const r of rows) {
    const t = by.get(r.user_id) ?? { user_id: r.user_id, correct: 0, ms: 0, days: 0 };
    t.correct += r.correct;
    t.ms += r.ms;
    t.days += 1;
    by.set(r.user_id, t);
  }
  return [...by.values()];
}

/**
 * The top BOARD_SIZE rows with display names, plus the caller's row when it is below the cut.
 * @param {any[]} ranked
 * @param {Map<string, string>} names
 * @param {string|null} me
 */
function publicRows(ranked, names, me) {
  const top = ranked.slice(0, BOARD_SIZE);
  const mine = me ? ranked.find((r) => r.user_id === me) : null;
  if (mine && !top.includes(mine)) top.push(mine);
  return top.map((r) => ({
    rank: r.rank,
    name: names.get(r.user_id) ?? 'Player',
    correct: r.correct,
    ms: r.ms,
    ...(r.days !== undefined ? { days: r.days } : { total: r.total ?? DAILY_QUIZ_SIZE }),
    you: r.user_id === me,
  }));
}

/**
 * @param {{
 *   getUser: (jwt: string) => Promise<{ id: string }|null>,
 *   now?: () => number,
 *   results: {
 *     insert: (row: { user_id: string, day: string, correct: number, total: number, ms: number, answers: any }) => Promise<boolean>,
 *     between: (from: string, to: string) => Promise<{ user_id: string, day: string, correct: number, total: number, ms: number, submitted_at: string }[]>,
 *     daysOf: (userId: string, from: string) => Promise<string[]>,
 *   },
 *   names: (userIds: string[]) => Promise<Map<string, string>>,
 * }} deps
 * @returns {(req: Request) => Promise<Response>}
 */
export function createHandler({ getUser, now = () => Date.now(), results, names }) {
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  async function userOf(req) {
    const auth = req.headers.get('Authorization') ?? '';
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    return jwt ? getUser(jwt) : null;
  }

  async function board(day, me) {
    const start = weekStart(day);
    const end = dayFromNumber(dayNumber(start) + 6);
    const week = await results.between(start, end);
    const today = week.filter((r) => r.day === day);
    const dailyRanked = rank(today);
    const weeklyRanked = rank(weeklyTotals(week));
    const ids = [...new Set([...dailyRanked.slice(0, BOARD_SIZE), ...weeklyRanked.slice(0, BOARD_SIZE)].map((r) => r.user_id).concat(me ? [me] : []))];
    const nameMap = await names(ids);
    const out = { day, week: { start, end }, players: today.length, daily: publicRows(dailyRanked, nameMap, me), weekly: publicRows(weeklyRanked, nameMap, me) };
    if (me) {
      const days = await results.daysOf(me, dayFromNumber(dayNumber(day) - 400));
      out.me = { streak: streakOn(days, day), played: days.includes(day) };
    }
    return out;
  }

  return async function handle(req) {
    try {
      const url = new URL(req.url);
      const route = url.pathname.replace(/^.*\/daily-quiz/, '') || '/';
      if (req.method === 'GET' && route === '/board') {
        const day = url.searchParams.get('day') ?? '';
        if (!isPlayableDay(day, now())) return json(400, { error: 'Unknown day' });
        const user = await userOf(req);
        return json(200, await board(day, user?.id ?? null));
      }
      if (req.method === 'POST' && route === '/submit') {
        const user = await userOf(req);
        if (!user) return json(401, { error: 'Sign in to join the leaderboard' });
        const body = await req.json().catch(() => null);
        const day = String(body?.day ?? '');
        if (!isPlayableDay(day, now())) return json(400, { error: 'That daily quiz is closed' });
        let score;
        try {
          score = scoreDaily({ day, answers: body?.answers });
        } catch (err) {
          return json(400, { error: err.message });
        }
        const ms = Math.min(MAX_MS, Math.max(0, Math.round(Number(body?.ms) || 0)));
        // Only the first play of a day counts; a replay gets its score but changes nothing.
        const recorded = await results.insert({ user_id: user.id, day, correct: score.correct, total: score.total, ms, answers: body.answers });
        return json(200, { ...score, recorded, board: await board(day, user.id) });
      }
      return json(404, { error: 'Not found' });
    } catch (err) {
      return json(500, { error: 'The leaderboard is unavailable right now' });
    }
  };
}
