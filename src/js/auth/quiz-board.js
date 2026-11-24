/**
 * Daily quiz leaderboard, browser side: talks to the daily-quiz Edge Function
 * (deploy/supabase/functions/daily-quiz). The board is public to read; a signed-in player's first
 * play of the day is submitted as choices (never as a score) and scored on the server.
 * Inert when accounts are not configured.
 */

/**
 * @typedef {{ rank: number, name: string, correct: number, ms: number, total?: number, days?: number, you: boolean }} BoardRow
 * @typedef {{ day: string, week: { start: string, end: string }, players: number, daily: BoardRow[], weekly: BoardRow[], me?: { streak: number, played: boolean } }} Board
 */

/**
 * @param {{ account: { config: { supabaseUrl: string, supabaseAnonKey: string, enabled: boolean }, accessToken: () => Promise<string|null> }, fetchImpl?: typeof fetch }} deps
 */
export function createQuizBoard({ account, fetchImpl = (...a) => fetch(...a) }) {
  const { supabaseUrl, supabaseAnonKey, enabled } = account.config;

  async function call(route, body) {
    const token = await account.accessToken().catch(() => null);
    const headers = { apikey: supabaseAnonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) };
    const res = await fetchImpl(`${supabaseUrl}/functions/v1/daily-quiz${route}`, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Leaderboard unavailable (${res.status})`);
    return data;
  }

  return {
    available: Boolean(enabled),
    /**
     * @param {string} day
     * @returns {Promise<Board>}
     */
    board: (day) => call(`/board?day=${encodeURIComponent(day)}`),
    /**
     * @param {{ day: string, answers: { id: string, choice: number }[], ms: number }} p
     * @returns {Promise<{ correct: number, total: number, results: boolean[], recorded: boolean, board: Board }>}
     */
    submit: (p) => call('/submit', p),
  };
}
