// Supabase Edge Function: GitHub sync (ADR 0007). The logic is in core.js (unit-tested in Node);
// this file wires it to Deno, Supabase Auth and the github_links table, and handles CORS.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets, never in the repository):
//   GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY (the .pem GitHub generated), SITE_URL
// Provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { createHandler } from './core.js';

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
};

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const siteUrl = env('SITE_URL');
const allowed = new Set([new URL(siteUrl).origin, 'http://localhost:5173']);

const handle = createHandler({
  appId: env('GITHUB_APP_ID'),
  privateKeyPem: env('GITHUB_APP_PRIVATE_KEY'),
  siteUrl,
  fetchImpl: fetch,
  async getUser(jwt: string) {
    const { data, error } = await admin.auth.getUser(jwt);
    return error ? null : data.user;
  },
  links: {
    async get(userId: string) {
      const { data, error } = await admin.from('github_links').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async put(row: Record<string, unknown>) {
      const { error } = await admin.from('github_links').upsert({ ...row, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    },
    async remove(userId: string) {
      const { error } = await admin.from('github_links').delete().eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
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
