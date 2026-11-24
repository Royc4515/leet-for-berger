// Supabase Edge Function: daily quiz scoring and leaderboard. The logic is in core.js
// (unit-tested in Node); this file wires it to Deno, Supabase Auth and the quiz_daily_results
// table, and handles CORS.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets, never in the repository): SITE_URL
// Provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Deploy with JWT verification off (`--no-verify-jwt`): signed-out visitors may read the board;
// /submit checks the session itself.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { createHandler } from './core.js';

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
};

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const allowed = new Set([new URL(env('SITE_URL')).origin, 'http://localhost:5173']);

/** The name a player shows on the board: their profile name, else the name from sign-in. */
async function displayName(id: string): Promise<string> {
  const { data: profile } = await admin.from('profiles').select('display_name').eq('user_id', id).maybeSingle();
  if (profile?.display_name) return profile.display_name;
  const { data } = await admin.auth.admin.getUserById(id);
  const m = data?.user?.user_metadata ?? {};
  return m.full_name ?? m.name ?? m.user_name ?? 'Player';
}

const handle = createHandler({
  async getUser(jwt: string) {
    const { data, error } = await admin.auth.getUser(jwt);
    return error ? null : data.user;
  },
  results: {
    async insert(row: Record<string, unknown>) {
      const { error } = await admin.from('quiz_daily_results').insert(row);
      if (!error) return true;
      if (error.code === '23505') return false; // already played that day
      throw new Error(error.message);
    },
    async between(from: string, to: string) {
      const { data, error } = await admin.from('quiz_daily_results').select('user_id, day, correct, total, ms, submitted_at').gte('day', from).lte('day', to);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    async daysOf(userId: string, from: string) {
      const { data, error } = await admin.from('quiz_daily_results').select('day').eq('user_id', userId).gte('day', from);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: { day: string }) => r.day);
    },
  },
  async names(ids: string[]) {
    const pairs = await Promise.all(ids.map(async (id) => [id, await displayName(id)] as [string, string]));
    return new Map(pairs);
  },
});

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? '';
  const cors: Record<string, string> = allowed.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' }
    : {};
  if (req.method === 'OPTIONS') return new Response(null, { status: allowed.has(origin) ? 204 : 403, headers: cors });
  const res = await handle(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
});
