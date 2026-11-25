// Supabase Edge Function: Web Push reminders (ADR 0011). The logic is in core.js (unit-tested in
// Node); this file wires it to Deno, Supabase Auth, the push tables, the push library and CORS.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets, never in the repository):
//   SITE_URL          the site, for CORS and the links a push opens
//   VAPID_KEYS        {"publicKey": JWK, "privateKey": JWK}, ECDSA P-256 (docs/DEPLOY_AUTH.md)
//   VAPID_SUBJECT     mailto: address push services may contact
//   PUSH_CRON_SECRET  the header the hourly pg_cron job sends to /run
// Provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Deploy with JWT verification off (`--no-verify-jwt`): /run is called by pg_cron with its own
// secret, and the other routes check the session themselves.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import * as webpush from 'jsr:@negrel/webpush@0.5.0';
import { createHandler } from './core.js';
import { TITLES } from './lib/titles.js';

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing secret ${name}`);
  return v;
};

/** A reminder delivered more than 4 hours late is no longer about today's streak. */
const PUSH_TTL_S = 4 * 3600;

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const siteUrl = env('SITE_URL');
const allowed = new Set([new URL(siteUrl).origin, 'http://localhost:5173']);
const vapidKeys = await webpush.importVapidKeys(JSON.parse(env('VAPID_KEYS')), { extractable: false });
const appServer = await webpush.ApplicationServer.new({ contactInformation: env('VAPID_SUBJECT'), vapidKeys });

const must = <T>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

const handle = createHandler({
  siteUrl,
  cronSecret: env('PUSH_CRON_SECRET'),
  titles: TITLES,
  async getUser(jwt: string) {
    const { data, error } = await admin.auth.getUser(jwt);
    return error ? null : data.user;
  },
  async send(sub, payload) {
    try {
      await appServer.subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }).pushTextMessage(JSON.stringify(payload), { ttl: PUSH_TTL_S, urgency: webpush.Urgency.Normal });
      return 'ok';
    } catch (err) {
      // The library counts only 410 as gone; a 404 means the same (the endpoint no longer exists).
      const status = err instanceof webpush.PushMessageError ? err.response.status : 0;
      return status === 404 || status === 410 ? 'gone' : 'failed';
    }
  },
  db: {
    settings: {
      get: async (userId: string) => must(await admin.from('push_settings').select('user_id, hours, off, time_zone').eq('user_id', userId).maybeSingle()),
      async upsert(row) {
        must(await admin.from('push_settings').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
      },
      all: async () => must(await admin.from('push_settings').select('user_id, hours, off, time_zone')) ?? [],
    },
    subs: {
      async upsert(row) {
        // On the endpoint: the same browser signed in as someone else moves to them, never shared.
        must(await admin.from('push_subscriptions').upsert({ ...row, failures: 0 }, { onConflict: 'endpoint' }));
      },
      async remove(userId: string, endpoint: string) {
        must(await admin.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint));
      },
      ofUser: async (userId: string) => must(await admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth, failures').eq('user_id', userId)) ?? [],
      async drop(id: number) {
        must(await admin.from('push_subscriptions').delete().eq('id', id));
      },
      async setFailures(id: number, failures: number) {
        must(await admin.from('push_subscriptions').update({ failures }).eq('id', id));
      },
    },
    log: {
      since: async (userId: string, fromDay: string) => must(await admin.from('push_log').select('user_id, day, hour, kind, key').eq('user_id', userId).gte('day', fromDay)) ?? [],
      async claim(row) {
        const { error } = await admin.from('push_log').insert(row);
        if (!error) return true;
        if (error.code === '23505') return false; // another run already took this hour
        throw new Error(error.message);
      },
    },
    state: {
      of: async (userId: string) => (must(await admin.from('user_state').select('state').eq('user_id', userId).maybeSingle()) as { state: unknown } | null)?.state ?? null,
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
