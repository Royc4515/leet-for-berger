/**
 * Leet-For-Berger runner proxy: a Cloudflare Worker (free plan) between the site and the Piston VM.
 * docs/adr/0005-remote-runner.md explains the design, docs/DEPLOY_RUNNER.md the deployment.
 *
 *   POST    /v1/execute/{java|cpp|c|csharp|go}   forwards the body to the VM's gate
 *   GET     /v1/health                           liveness of this Worker only (no VM call)
 *   OPTIONS any                                  CORS preflight
 *
 * Checks here, before anything reaches the VM: path and method, CORS origin allowlist, per-IP rate
 * limit, Content-Length cap, content type, and an optional Turnstile token. The body is streamed
 * through unparsed on purpose: a submit carries up to ~12 MB of test input, and parsing it would
 * blow the free plan's 10 ms CPU budget. The VM's gate (deploy/piston/gate) parses and validates it.
 * The shared secret is added here and never leaves Cloudflare and the VM (invariant 10).
 *
 * Environment (wrangler.toml [vars] and secrets):
 *   ALLOWED_ORIGINS   comma-separated origins, e.g. "https://user.github.io,http://localhost:5173"
 *   MAX_BODY_BYTES    request cap in bytes (default 16 MiB)
 *   RATE_LIMIT        requests per minute per IP for the in-memory fallback (default 20)
 *   GATE_URL          gate base URL when reached over HTTPS (fallback path); unused with GATE
 *   GATE              Workers VPC service binding to the gate through Cloudflare Tunnel (preferred)
 *   RUNNER_SECRET     secret: shared with the gate, sent as X-LFB-Secret
 *   TURNSTILE_SECRET  secret, optional: require a valid CF-Turnstile-Response header
 *   RUN_LIMITER       optional rate limiting binding ([[ratelimits]] in wrangler.toml)
 */

export const LANGUAGES = ['java', 'cpp', 'c', 'csharp', 'go'];
const DEFAULT_MAX_BODY = 16 * 1024 * 1024;
const DEFAULT_RATE = 20;
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

/** @param {string|undefined} list */
export function parseOrigins(list) {
  return new Set(
    String(list ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  );
}

/** CORS headers for an allowed origin, or null when the origin is not on the list. */
export function corsHeaders(origin, allowed) {
  if (!origin || !allowed.has(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Content-Encoding, CF-Turnstile-Response',
    // Chrome caps this at 2 hours; one preflight then covers a whole practice session.
    'Access-Control-Max-Age': '7200',
    Vary: 'Origin',
  };
}

/**
 * In-memory fixed-window limiter, used when no rate limiting binding is configured. Per Worker
 * isolate, so approximate: it slows a single abusive client, it is not a global quota.
 */
export class MemoryLimiter {
  constructor({ limit, periodMs = 60_000, now = () => Date.now() }) {
    this.max = limit;
    this.periodMs = periodMs;
    this.now = now;
    this.windows = new Map();
  }

  /**
   * Same shape as the rate limiting binding: env.RUN_LIMITER.limit({ key }).
   * @param {{ key: string }} opts
   * @returns {Promise<{ success: boolean }>}
   */
  async limit({ key }) {
    const t = this.now();
    let w = this.windows.get(key);
    if (!w || t - w.start >= this.periodMs) {
      w = { start: t, count: 0 };
      this.windows.set(key, w);
    }
    w.count++;
    // Bound memory: old windows are dropped once the map grows.
    if (this.windows.size > 10_000) for (const [k, v] of this.windows) if (t - v.start >= this.periodMs) this.windows.delete(k);
    return { success: w.count <= this.max };
  }
}

/** Verifies a Turnstile token with Cloudflare. */
async function turnstileOk(token, secret, ip, fetchImpl) {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY, { method: 'POST', body: form });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Builds the Worker. Dependencies are injectable so tests run in node with a fake fetch.
 * @param {{ fetchImpl?: typeof fetch, fallbackLimiter?: MemoryLimiter }} [deps]
 */
export function createWorker({ fetchImpl = (...a) => fetch(...a), fallbackLimiter = null } = {}) {
  let memoryLimiter = fallbackLimiter;

  return {
    /** @param {Request} request @param {Record<string, any>} env */
    async fetch(request, env) {
      const url = new URL(request.url);
      const allowed = parseOrigins(env.ALLOWED_ORIGINS);
      const origin = request.headers.get('Origin');
      const cors = corsHeaders(origin, allowed);

      if (request.method === 'OPTIONS') {
        return cors ? new Response(null, { status: 204, headers: cors }) : json(403, { error: 'Origin not allowed' });
      }
      if (url.pathname === '/v1/health' && request.method === 'GET') return json(200, { ok: true }, cors ?? {});

      const m = /^\/v1\/execute\/([a-z]+)$/.exec(url.pathname);
      if (!m) return json(404, { error: 'Not found' }, cors ?? {});
      if (request.method !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST', ...(cors ?? {}) });
      // Browsers always send Origin on a cross-origin POST; a missing or foreign one is not the site.
      if (!cors) return json(403, { error: 'Origin not allowed' });
      const language = m[1];
      if (!LANGUAGES.includes(language)) return json(400, { error: `Unsupported language: ${language}` }, cors);

      const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
      if (type !== 'application/json') return json(415, { error: 'Content-Type must be application/json' }, cors);
      const encoding = (request.headers.get('Content-Encoding') ?? 'identity').trim().toLowerCase();
      if (encoding !== 'identity' && encoding !== 'gzip') return json(415, { error: 'Content-Encoding must be gzip or absent' }, cors);
      const lengthHeader = request.headers.get('Content-Length');
      if (lengthHeader === null) return json(411, { error: 'Content-Length required' }, cors);
      const length = Number(lengthHeader);
      const maxBody = Number(env.MAX_BODY_BYTES ?? DEFAULT_MAX_BODY);
      if (!Number.isFinite(length) || length < 0) return json(400, { error: 'Bad Content-Length' }, cors);
      if (length > maxBody) return json(413, { error: `Body over ${maxBody} bytes` }, cors);

      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      let limiter = env.RUN_LIMITER;
      if (!limiter) limiter = memoryLimiter ??= new MemoryLimiter({ limit: Number(env.RATE_LIMIT ?? DEFAULT_RATE) });
      const { success } = await limiter.limit({ key: ip });
      if (!success) return json(429, { error: 'Too many requests' }, { ...cors, 'Retry-After': '60' });

      if (env.TURNSTILE_SECRET) {
        const ok = await turnstileOk(request.headers.get('CF-Turnstile-Response'), env.TURNSTILE_SECRET, ip, fetchImpl);
        if (!ok) return json(403, { error: 'Turnstile check failed' }, cors);
      }
      if (!env.RUNNER_SECRET || !(env.GATE || env.GATE_URL)) return json(503, { error: 'Runner not configured' }, cors);

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': lengthHeader,
        'X-LFB-Secret': env.RUNNER_SECRET,
        'X-LFB-Client': ip,
      };
      if (encoding === 'gzip') headers['Content-Encoding'] = 'gzip';
      const target = `${env.GATE ? 'http://gate' : String(env.GATE_URL ?? '').replace(/\/+$/, '')}/v1/execute/${language}`;
      let upstream;
      try {
        // duplex: required by the fetch standard for a streamed body (Node enforces it); workerd ignores it.
        const init = { method: 'POST', headers, body: request.body, duplex: 'half' };
        upstream = env.GATE ? await env.GATE.fetch(target, init) : await fetchImpl(target, init);
      } catch {
        return json(502, { error: 'Code server unreachable' }, cors);
      }
      // Only the gate's JSON goes back; its status codes are already the ones the client maps.
      const out = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors });
      return new Response(upstream.body, { status: upstream.status, headers: out });
    },
  };
}

export default createWorker();
