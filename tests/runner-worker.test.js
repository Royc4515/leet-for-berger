// Cloudflare Worker in front of the runner (deploy/cloudflare-worker, ADR 0005), run in Node with
// a fake upstream: routing, CORS, size caps, rate limit, Turnstile, secret injection, streaming.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWorker, MemoryLimiter, corsHeaders, parseOrigins } from '../deploy/cloudflare-worker/src/index.js';

const SITE = 'https://site.example';
const env = (extra = {}) => ({ ALLOWED_ORIGINS: `${SITE}, http://localhost:5173/`, GATE_URL: 'https://gate.example/', RUNNER_SECRET: 's3cret', ...extra });

function setup({ upstream = () => new Response('{"run":{}}', { status: 200 }), limiter } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: init.body ? await new Response(init.body).text() : null });
    return upstream(url, init);
  };
  return { worker: createWorker({ fetchImpl, fallbackLimiter: limiter ?? new MemoryLimiter({ limit: 100 }) }), calls };
}

const post = (path = '/v1/execute/java', { body = '{"files":[]}', headers = {}, origin = SITE } = {}) =>
  new Request(`https://w.example${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)), ...(origin ? { Origin: origin } : {}), 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body,
  });

test('forwards a valid request to the gate with the secret, and streams the answer back with CORS', async () => {
  const { worker, calls } = setup({ upstream: () => new Response('{"run":{"stdout":"x"}}', { status: 200 }) });
  const res = await worker.fetch(post(), env());
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), SITE);
  assert.equal(res.headers.get('Vary'), 'Origin');
  assert.deepEqual(await res.json(), { run: { stdout: 'x' } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://gate.example/v1/execute/java');
  assert.equal(calls[0].init.headers['X-LFB-Secret'], 's3cret');
  assert.equal(calls[0].init.headers['X-LFB-Client'], '203.0.113.7');
  assert.equal(calls[0].body, '{"files":[]}');
});

test('the secret never reaches the browser', async () => {
  const { worker } = setup();
  const res = await worker.fetch(post(), env());
  const all = JSON.stringify([...res.headers]) + (await res.text());
  assert.ok(!all.includes('s3cret'));
});

test('gzip bodies pass through untouched with their encoding', async () => {
  const { worker, calls } = setup();
  await worker.fetch(post('/v1/execute/go', { headers: { 'Content-Encoding': 'gzip' } }), env());
  assert.equal(calls[0].init.headers['Content-Encoding'], 'gzip');
  const res = await worker.fetch(post('/v1/execute/go', { headers: { 'Content-Encoding': 'br' } }), env());
  assert.equal(res.status, 415);
});

test('uses the VPC service binding when present instead of GATE_URL', async () => {
  const { worker, calls } = setup();
  const bound = [];
  const GATE = { fetch: async (url, init) => (bound.push({ url, init }), new Response('{}', { status: 200 })) };
  const res = await worker.fetch(post('/v1/execute/cpp'), env({ GATE, GATE_URL: undefined }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
  assert.equal(bound[0].url, 'http://gate/v1/execute/cpp');
  assert.equal(bound[0].init.headers['X-LFB-Secret'], 's3cret');
});

test('CORS: preflight for allowed origins only; foreign or missing Origin is refused', async () => {
  const { worker, calls } = setup();
  const pre = await worker.fetch(new Request('https://w.example/v1/execute/java', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } }), env());
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.match(pre.headers.get('Access-Control-Allow-Headers'), /Content-Encoding/);
  const bad = await worker.fetch(new Request('https://w.example/v1/execute/java', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), env());
  assert.equal(bad.status, 403);
  assert.equal((await worker.fetch(post('/v1/execute/java', { origin: 'https://evil.example' }), env())).status, 403);
  assert.equal((await worker.fetch(post('/v1/execute/java', { origin: null }), env())).status, 403);
  assert.equal(calls.length, 0);
  assert.equal(corsHeaders(SITE, parseOrigins('')), null);
});

test('routing: unknown paths, methods and languages never reach the gate', async () => {
  const { worker, calls } = setup();
  assert.equal((await worker.fetch(post('/api/v2/packages'), env())).status, 404);
  assert.equal((await worker.fetch(post('/v1/execute/python'), env())).status, 400);
  assert.equal((await worker.fetch(post('/v1/execute/../packages'), env())).status, 404);
  assert.equal((await worker.fetch(new Request('https://w.example/v1/execute/java', { headers: { Origin: SITE } }), env())).status, 405);
  assert.equal((await worker.fetch(new Request('https://w.example/v1/health'), env())).status, 200);
  assert.equal(calls.length, 0);
});

test('size and type caps: Content-Length required and bounded, JSON only', async () => {
  const { worker, calls } = setup();
  const big = await worker.fetch(post('/v1/execute/java', { headers: { 'Content-Length': String(16 * 1024 * 1024 + 1) } }), env());
  assert.equal(big.status, 413);
  const small = await worker.fetch(post('/v1/execute/java', { body: '{"a":1}' }), env({ MAX_BODY_BYTES: '4' }));
  assert.equal(small.status, 413);
  const noLength = new Request('https://w.example/v1/execute/java', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: '{}' });
  noLength.headers.delete('Content-Length');
  assert.equal((await worker.fetch(noLength, env())).status, 411);
  assert.equal((await worker.fetch(post('/v1/execute/java', { headers: { 'Content-Type': 'text/plain' } }), env())).status, 415);
  assert.equal(calls.length, 0);
});

test('rate limit: per IP, 429 with Retry-After, other IPs unaffected', async () => {
  let t = 0;
  const { worker, calls } = setup({ limiter: new MemoryLimiter({ limit: 2, now: () => t }) });
  const from = (ip) => post('/v1/execute/c', { headers: { 'CF-Connecting-IP': ip } });
  assert.equal((await worker.fetch(from('1.1.1.1'), env())).status, 200);
  assert.equal((await worker.fetch(from('1.1.1.1'), env())).status, 200);
  const limited = await worker.fetch(from('1.1.1.1'), env());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  assert.equal(limited.headers.get('Access-Control-Allow-Origin'), SITE, 'the page can read the 429');
  assert.equal((await worker.fetch(from('2.2.2.2'), env())).status, 200);
  t = 60_000;
  assert.equal((await worker.fetch(from('1.1.1.1'), env())).status, 200, 'a new window starts after a minute');
  assert.equal(calls.length, 4);
});

test('rate limit: the Cloudflare binding is used when configured', async () => {
  const { worker } = setup();
  const keys = [];
  const RUN_LIMITER = { limit: async ({ key }) => (keys.push(key), { success: false }) };
  assert.equal((await worker.fetch(post(), env({ RUN_LIMITER }))).status, 429);
  assert.deepEqual(keys, ['203.0.113.7']);
});

test('Turnstile: when a secret is set, the token is verified before forwarding', async () => {
  const verified = [];
  const { worker, calls } = setup({
    upstream: (url, init) => {
      if (url.includes('siteverify')) {
        verified.push(init.body.get('response'));
        return new Response(JSON.stringify({ success: init.body.get('response') === 'good' }));
      }
      return new Response('{}', { status: 200 });
    },
  });
  const e = env({ TURNSTILE_SECRET: 'ts' });
  assert.equal((await worker.fetch(post(), e)).status, 403, 'no token');
  assert.equal((await worker.fetch(post('/v1/execute/java', { headers: { 'CF-Turnstile-Response': 'bad' } }), e)).status, 403);
  assert.equal((await worker.fetch(post('/v1/execute/java', { headers: { 'CF-Turnstile-Response': 'good' } }), e)).status, 200);
  assert.deepEqual(verified, ['bad', 'good']);
  assert.equal(calls.filter((c) => c.url.includes('/v1/execute/')).length, 1);
});

test('misconfigured or unreachable gate: 503 or 502, never a hang', async () => {
  const { worker } = setup({ upstream: () => Promise.reject(new TypeError('connect ECONNREFUSED')) });
  assert.equal((await worker.fetch(post(), env())).status, 502);
  assert.equal((await worker.fetch(post(), env({ RUNNER_SECRET: undefined }))).status, 503);
  assert.equal((await worker.fetch(post(), env({ GATE_URL: undefined }))).status, 503);
});

// The file now holds the live deployment's public values (origin, VPC service id); secrets never.
test('wrangler.toml holds only public values: https origins, a VPC service id, no secrets', () => {
  const toml = readFileSync(new URL('../deploy/cloudflare-worker/wrangler.toml', import.meta.url), 'utf8');
  assert.doesNotMatch(toml, /RUNNER_SECRET\s*=|TURNSTILE_SECRET\s*=/);
  const origins = toml.match(/^ALLOWED_ORIGINS = "(.*)"$/m)[1].split(',');
  for (const o of origins) assert.match(o, /^(https:\/\/[a-z0-9.-]+|http:\/\/localhost:\d+)$/, o);
  assert.match(toml, /^service_id = "([0-9a-f-]{36}|VPC_SERVICE_ID)"$/m);
  assert.match(toml, /\[\[ratelimits\]\]/);
});

test('deep health: asks the gate with the secret and reports its runtimes; failures are 503 or 502', async () => {
  const ok = setup({ upstream: () => new Response(JSON.stringify({ ok: true, runtimes: ['java-21.0.13', 'gcc-12.2.0'], active: 0, queued: 0 }), { status: 200 }) });
  const res = await ok.worker.fetch(new Request('https://w.example/v1/health?deep=1'), env());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.deepEqual(body.gate.runtimes, ['java-21.0.13', 'gcc-12.2.0']);
  assert.equal(ok.calls[0].url, 'https://gate.example/v1/health');
  assert.equal(ok.calls[0].init.headers['X-LFB-Secret'], 's3cret');
  assert.ok(!JSON.stringify(body).includes('s3cret'), 'the secret never comes back');

  const down = setup({ upstream: () => new Response('{"error":"Piston unreachable"}', { status: 503 }) });
  const r2 = await down.worker.fetch(new Request('https://w.example/v1/health?deep=1'), env());
  assert.equal(r2.status, 503);
  assert.equal((await r2.json()).gate.error, 'Piston unreachable');

  const gone = setup({ upstream: () => { throw new Error('tunnel down'); } });
  assert.equal((await gone.worker.fetch(new Request('https://w.example/v1/health?deep=1'), env())).status, 502);

  // The plain check stays VM-free.
  const plain = setup();
  assert.equal((await plain.worker.fetch(new Request('https://w.example/v1/health'), env())).status, 200);
  assert.equal(plain.calls.length, 0);
});

test('deep health is rate limited like a run', async () => {
  const { worker } = setup({ upstream: () => new Response('{"ok":true,"runtimes":[]}', { status: 200 }), limiter: new MemoryLimiter({ limit: 1 }) });
  const req = () => new Request('https://w.example/v1/health?deep=1', { headers: { 'CF-Connecting-IP': '198.51.100.1' } });
  assert.equal((await worker.fetch(req(), env())).status, 200);
  assert.equal((await worker.fetch(req(), env())).status, 429);
});
