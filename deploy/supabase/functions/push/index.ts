// Supabase Edge Function: Web Push reminders (ADR 0011). The logic is in core.js (unit-tested in
// Node); this file wires it to Deno, Supabase Auth, the push tables, the push library and CORS.
//
// No secret is typed in by hand, and none passes through a person or a chat:
//   the VAPID key pair is generated here on first use and kept in push_keys, a table only the
//   service role reads (ADR 0011); browsers get the public key from GET /key;
//   the cron secret is generated inside the database, in Vault, and read through push_cron_secret(),
//   a function only the service role may call (deploy/supabase/migrations/20261125_push.sql).
// Secrets: SITE_URL (the site, for CORS and the links a push opens), already set for the other
// functions. Provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
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
/** Who push services may contact about these pushes: the site's public address (privacy.html). */
const VAPID_SUBJECT = 'mailto:LeetForBerger@gmail.com';

const must = <T>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const siteUrl = env('SITE_URL');
const allowed = new Set([new URL(siteUrl).origin, 'http://localhost:5173']);
/**
 * The one VAPID key pair, made on first use. Every device subscribes with its public half, so a new
 * pair would cut them all off: two first calls racing insert under the same id, and both then read
 * the row that won.
 */
async function loadVapidKeys() {
  const read = async () => must(await admin.from('push_keys').select('public_jwk, private_jwk').eq('id', 1).maybeSingle()) as { public_jwk: JsonWebKey; private_jwk: JsonWebKey } | null;
  let row = await read();
  if (!row) {
    const made = await webpush.exportVapidKeys(await webpush.generateVapidKeys({ extractable: true }));
    const { error } = await admin.from('push_keys').insert({ id: 1, public_jwk: made.publicKey, private_jwk: made.privateKey });
    if (error && error.code !== '23505') throw new Error(error.message);
    row = await read();
  }
  if (!row) throw new Error('No VAPID keys');
  return webpush.importVapidKeys({ publicKey: row.public_jwk, privateKey: row.private_jwk }, { extractable: false });
}

let ready: Promise<{ appServer: webpush.ApplicationServer; publicKey: string }> | null = null;
/** Keys and the application server, once per instance; a failure is retried on the next call. */
const server = () =>
  (ready ??= (async () => {
    const vapidKeys = await loadVapidKeys();
    return { appServer: await webpush.ApplicationServer.new({ contactInformation: VAPID_SUBJECT, vapidKeys }), publicKey: await webpush.exportApplicationServerKey(vapidKeys) };
  })().catch((err) => {
    ready = null;
    throw err;
  }));

const handle = createHandler({
  siteUrl,
  titles: TITLES,
  cronSecret: async () => String(must(await admin.rpc('push_cron_secret')) ?? ''),
  publicKey: async () => (await server()).publicKey,
  async getUser(jwt: string) {
    const { data, error } = await admin.auth.getUser(jwt);
    return error ? null : data.user;
  },
  async send(sub, payload) {
    try {
      const { appServer } = await server();
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
      get: async (userId: string) => must(await admin.from('push_settings').select('user_id, hours, off, time_zone, lang').eq('user_id', userId).maybeSingle()),
      async upsert(row) {
        must(await admin.from('push_settings').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
      },
      all: async () => must(await admin.from('push_settings').select('user_id, hours, off, time_zone, lang')) ?? [],
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
