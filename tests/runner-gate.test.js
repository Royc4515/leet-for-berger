// The VM-side gate (deploy/piston/gate/gate.mjs, ADR 0005): secret, validation, pinned runtimes and
// limits, gzip with a cap, queueing. Runs a real HTTP server on a random port with a fake Piston.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { createGate, toPistonRequest, trimResult, secretMatches, RUNTIMES, LIMITS } from '../deploy/piston/gate/gate.mjs';

const SECRET = 'x'.repeat(40);
const files = [{ name: 'main.cpp', content: 'int main(){}' }];

async function startGate(piston, opts = {}) {
  const sent = [];
  const fetchImpl = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    sent.push({ url, body });
    return piston(url, body);
  };
  const handle = createGate({ secret: SECRET, pistonUrl: 'http://piston', fetchImpl, ...opts });
  const server = createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, sent, close: () => server.close() };
}

const pistonOk = () => new Response(JSON.stringify({ language: 'c++', version: '12.2.0', compile: { stdout: '', stderr: '', output: '', code: 0, signal: null }, run: { stdout: 'out', stderr: 'err', output: 'outerr', code: 0, signal: null, status: null, wall_time: 12 } }));
const call = (base, path, { body, headers = {}, secret = SECRET, raw } = {}) =>
  fetch(`${base}${path}`, { method: body || raw ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(secret ? { 'X-LFB-Secret': secret } : {}), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });

test('secret comparison is exact and length-safe', () => {
  assert.ok(secretMatches(SECRET, SECRET));
  assert.ok(!secretMatches(SECRET.slice(1), SECRET));
  assert.ok(!secretMatches(undefined, SECRET));
  assert.ok(!secretMatches('', ''));
  assert.throws(() => createGate({ secret: 'short', pistonUrl: 'x' }), /at least 32/);
});

test('without the secret nothing happens', async () => {
  const g = await startGate(pistonOk);
  try {
    assert.equal((await call(g.base, '/v1/execute/cpp', { body: { files, timeLimitMs: 1000 }, secret: null })).status, 401);
    assert.equal((await call(g.base, '/v1/execute/cpp', { body: { files, timeLimitMs: 1000 }, secret: 'y'.repeat(40) })).status, 401);
    assert.equal((await call(g.base, '/v1/health', { secret: null })).status, 401);
    assert.equal(g.sent.length, 0);
  } finally {
    g.close();
  }
});

test('a valid run: pinned runtime and limits, cases as a base64 .stdin file, trimmed answer', async () => {
  const g = await startGate(pistonOk);
  try {
    const res = await call(g.base, '/v1/execute/cpp', { body: { files, stdin: '2 1 2\n', args: [], timeLimitMs: 2000, run_timeout: 999999, language: 'bash' } });
    assert.equal(res.status, 200);
    const out = await res.json();
    assert.equal(out.run.stdout, 'out');
    assert.equal(out.run.output, undefined, 'duplicated output dropped');
    assert.equal(out.run.memoryLimit, LIMITS.runMemoryBytes);
    const req = g.sent[0].body;
    assert.equal(g.sent[0].url, 'http://piston/api/v2/execute');
    assert.equal(req.language, 'c++');
    assert.equal(req.version, RUNTIMES.cpp.version);
    assert.equal(req.run_timeout, 2000 * LIMITS.runFactor + LIMITS.runAllowanceMs, 'client run_timeout ignored');
    assert.equal(req.stdin, '');
    const stdinFile = req.files.find((f) => f.name === '.stdin');
    assert.equal(stdinFile.encoding, 'base64');
    assert.equal(Buffer.from(stdinFile.content, 'base64').toString(), '2 1 2\n');
    assert.deepEqual(req.files[0], files[0]);
  } finally {
    g.close();
  }
});

test('gzip bodies are inflated; a zip bomb stops at the cap', async () => {
  const g = await startGate(pistonOk);
  try {
    const body = JSON.stringify({ files, stdin: '1 1\n', timeLimitMs: 1000 });
    assert.equal((await call(g.base, '/v1/execute/cpp', { raw: gzipSync(body), headers: { 'Content-Encoding': 'gzip' } })).status, 200);
    const bomb = gzipSync(Buffer.alloc(LIMITS.maxJsonBytes + 1024, 32));
    assert.ok(bomb.length < LIMITS.maxRawBytes);
    assert.equal((await call(g.base, '/v1/execute/cpp', { raw: bomb, headers: { 'Content-Encoding': 'gzip' } })).status, 413);
    assert.equal((await call(g.base, '/v1/execute/cpp', { raw: 'x', headers: { 'Content-Encoding': 'br' } })).status, 415);
    assert.equal((await call(g.base, '/v1/execute/cpp', { raw: '{not json' })).status, 400);
  } finally {
    g.close();
  }
});

test('validation: language, files, names, args, time limit, source size', () => {
  const ok = { files, stdin: '', args: [], timeLimitMs: 1000 };
  assert.ok(toPistonRequest('java', ok).request);
  assert.match(toPistonRequest('python', ok).error, /Unsupported/);
  assert.match(toPistonRequest('java', { ...ok, files: [] }).error, /files/);
  assert.match(toPistonRequest('java', { ...ok, files: Array(9).fill(files[0]) }).error, /files/);
  for (const name of ['../x', '.stdin', 'a/b', '', 'x'.repeat(65)]) assert.match(toPistonRequest('java', { ...ok, files: [{ name, content: '' }] }).error, /file name/i, name);
  assert.match(toPistonRequest('java', { ...ok, files: [files[0], files[0]] }).error, /Duplicate/);
  assert.match(toPistonRequest('java', { ...ok, args: ['$(rm -rf /)'] }).error, /args/);
  assert.match(toPistonRequest('java', { ...ok, timeLimitMs: 60_000 }).error, /timeLimitMs/);
  assert.match(toPistonRequest('java', { ...ok, files: [{ name: 'A.java', content: 'x'.repeat(LIMITS.maxSourceBytes + 1) }] }).error, /Sources/);
  assert.equal(toPistonRequest('java', { ...ok, timeLimitMs: 10_000 }).request.run_timeout, LIMITS.runTimeoutMaxMs, 'capped');
});

test('queue: beyond active + queue the gate answers 503 Busy', async () => {
  let release;
  const gateOpen = new Promise((r) => (release = r));
  const g = await startGate(async () => (await gateOpen, pistonOk()), { maxActive: 1, maxQueue: 1 });
  try {
    const body = { files, timeLimitMs: 1000 };
    const first = call(g.base, '/v1/execute/cpp', { body });
    await new Promise((r) => setTimeout(r, 30));
    const second = call(g.base, '/v1/execute/cpp', { body });
    await new Promise((r) => setTimeout(r, 30));
    const third = await call(g.base, '/v1/execute/cpp', { body });
    assert.equal(third.status, 503);
    release();
    assert.equal((await first).status, 200);
    assert.equal((await second).status, 200);
  } finally {
    g.close();
  }
});

test('Piston failures become 502; health lists runtimes', async () => {
  const g = await startGate((url) => (url.endsWith('/runtimes') ? new Response(JSON.stringify([{ language: 'java', version: '21.0.13' }])) : new Response('{"message":"boom"}', { status: 500 })));
  try {
    assert.equal((await call(g.base, '/v1/execute/java', { body: { files, timeLimitMs: 1000 } })).status, 502);
    const health = await (await call(g.base, '/v1/health')).json();
    assert.deepEqual(health.runtimes, ['java-21.0.13']);
    assert.equal((await call(g.base, '/api/v2/packages', { body: { language: 'bash', version: '*' } })).status, 404, 'package management is never reachable');
  } finally {
    g.close();
  }
});

test('trimResult caps stderr and compile output', () => {
  const r = trimResult({ language: 'go', version: '1', compile: { stdout: 'a'.repeat(LIMITS.maxCompileOutputBytes + 10), stderr: '', code: 1 }, run: undefined });
  assert.ok(r.compile.stdout.endsWith('(truncated)'));
  assert.equal(r.run, undefined);
});
