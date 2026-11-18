#!/usr/bin/env node
/**
 * The gate: a zero-dependency HTTP service on the VM between the Cloudflare Worker and Piston
 * (docs/adr/0005-remote-runner.md). Piston has no authentication and also exposes package
 * install and uninstall endpoints, so it listens on 127.0.0.1 only and everything goes through here.
 *
 *   POST /v1/execute/{java|cpp|c|csharp|go}   X-LFB-Secret required
 *        body (JSON, optionally gzip): { files: [{ name, content }], stdin, args, timeLimitMs }
 *   GET  /v1/health                            X-LFB-Secret required; lists Piston's runtimes
 *
 * It checks the shared secret (constant time), inflates with a size cap, validates the body, pins
 * the language to one installed runtime and version, sets every limit itself (the client cannot
 * raise one), queues beyond Piston's capacity, and returns Piston's stage results without the
 * duplicated `output` fields.
 *
 * Environment: LFB_RUNNER_SECRET (required), GATE_LISTEN (127.0.0.1:8080), PISTON_URL
 * (http://127.0.0.1:2000), GATE_MAX_ACTIVE (2), GATE_MAX_QUEUE (8). Limits: RUNTIMES and LIMITS below.
 */
import { createServer } from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const gunzipAsync = promisify(gunzip);

/**
 * Our language id -> the Piston runtime that runs it. Versions match deploy/piston/packages and
 * are pinned exactly: a request can never pick another runtime.
 */
export const RUNTIMES = {
  java: { language: 'java', version: '21.0.13' },
  cpp: { language: 'c++', version: '12.2.0' },
  c: { language: 'c', version: '12.2.0' },
  csharp: { language: 'csharp', version: '8.0.428' },
  go: { language: 'go', version: '1.23.12' },
};

export const LIMITS = {
  maxRawBytes: 16 * 1024 * 1024, // as the Worker's MAX_BODY_BYTES
  maxJsonBytes: 48 * 1024 * 1024, // inflated; the largest submit is about 12 MB
  maxFiles: 8,
  maxSourceBytes: 512 * 1024, // all files together: user code plus the generated harness
  maxArgs: 4,
  compileTimeoutMs: 30_000, // dotnet build on 2 Arm cores is the slow one (about 8 s cold)
  compileCpuMs: 60_000, // compilers use several threads; CPU time is summed over them
  // A problem's timeLimitMs covers all 15 cases on a CI x86 core. The VM's Arm core is slower and
  // the run includes JVM or .NET startup, hence the factor and the allowance; capped below.
  runFactor: 2,
  runAllowanceMs: 1500,
  runTimeoutMaxMs: 12_000,
  compileMemoryBytes: 2_000_000_000,
  runMemoryBytes: 1_500_000_000,
  maxStderrBytes: 256 * 1024,
  maxCompileOutputBytes: 64 * 1024,
};

const FILE_NAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/;
const ARG = /^[A-Za-z0-9_]{1,64}$/;

/** Constant-time comparison of two secrets of any length. */
export function secretMatches(given, expected) {
  if (typeof given !== 'string' || !expected) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Validates a client body and builds the Piston execute request. Returns { error } when invalid.
 * @param {string} lang our language id
 * @param {any} body parsed JSON
 */
export function toPistonRequest(lang, body) {
  const rt = RUNTIMES[lang];
  if (!rt) return { error: `Unsupported language: ${lang}` };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Body must be a JSON object' };
  const { files, stdin = '', args = [], timeLimitMs } = body;
  if (!Array.isArray(files) || files.length < 1 || files.length > LIMITS.maxFiles) return { error: `files must be an array of 1 to ${LIMITS.maxFiles}` };
  let sourceBytes = 0;
  const names = new Set();
  for (const f of files) {
    if (!f || typeof f.name !== 'string' || !FILE_NAME.test(f.name) || f.name.includes('..')) return { error: 'Bad file name' };
    if (typeof f.content !== 'string') return { error: `files[${f.name}].content must be a string` };
    if (names.has(f.name)) return { error: `Duplicate file ${f.name}` };
    names.add(f.name);
    sourceBytes += Buffer.byteLength(f.content);
  }
  if (sourceBytes > LIMITS.maxSourceBytes) return { error: `Sources over ${LIMITS.maxSourceBytes} bytes` };
  if (typeof stdin !== 'string') return { error: 'stdin must be a string' };
  if (!Array.isArray(args) || args.length > LIMITS.maxArgs || !args.every((a) => typeof a === 'string' && ARG.test(a))) return { error: 'Bad args' };
  const limit = Number(timeLimitMs);
  if (!Number.isFinite(limit) || limit < 100 || limit > 10_000) return { error: 'timeLimitMs must be 100 to 10000' };
  const runMs = Math.min(LIMITS.runTimeoutMaxMs, Math.round(limit * LIMITS.runFactor + LIMITS.runAllowanceMs));
  return {
    request: {
      language: rt.language,
      version: rt.version,
      // The cases travel as the file .stdin, which the run scripts redirect: Piston ends its stdin
      // pipe with destroy() right after write(), and anything past the pipe buffer is lost. Base64
      // keeps it out of the compile arguments (Piston passes only utf8 files to the compiler), and
      // client names cannot start with a dot, so it cannot collide.
      files: [...files.map((f) => ({ name: f.name, content: f.content })), { name: '.stdin', content: Buffer.from(stdin).toString('base64'), encoding: 'base64' }],
      stdin: '',
      args,
      compile_timeout: LIMITS.compileTimeoutMs,
      compile_cpu_time: LIMITS.compileCpuMs,
      run_timeout: runMs,
      run_cpu_time: runMs,
      compile_memory_limit: LIMITS.compileMemoryBytes,
      run_memory_limit: LIMITS.runMemoryBytes,
    },
  };
}

const cap = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n)}\n... (truncated)` : s ?? '');

/** Piston's answer, minus the duplicated `output` fields, with caps on the error streams. */
export function trimResult(result) {
  const stage = (s, maxErr) =>
    s && {
      stdout: s.stdout ?? '',
      stderr: cap(s.stderr, maxErr),
      code: s.code ?? null,
      signal: s.signal ?? null,
      status: s.status ?? null,
      message: s.message ?? null,
      wall_time: s.wall_time ?? null,
      cpu_time: s.cpu_time ?? null,
      memory: s.memory ?? null,
    };
  const out = { language: result.language, version: result.version };
  if (result.compile) {
    out.compile = stage(result.compile, LIMITS.maxCompileOutputBytes);
    out.compile.stdout = cap(out.compile.stdout, LIMITS.maxCompileOutputBytes);
  }
  if (result.run) out.run = { ...stage(result.run, LIMITS.maxStderrBytes), memoryLimit: LIMITS.runMemoryBytes };
  return out;
}

/** Reads a request body up to `max` bytes; rejects with code 413 beyond it. */
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > max) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Creates the gate's request handler. `fetchImpl` reaches Piston (injectable for tests).
 * @param {{ secret: string, pistonUrl: string, fetchImpl?: typeof fetch, maxActive?: number, maxQueue?: number, log?: (msg: string) => void }} opts
 */
export function createGate({ secret, pistonUrl, fetchImpl = fetch, maxActive = 2, maxQueue = 8, log = () => {} }) {
  if (!secret || secret.length < 32) throw new Error('LFB_RUNNER_SECRET must be at least 32 characters');
  let active = 0;
  const waiting = [];
  const acquire = () =>
    active < maxActive
      ? (active++, Promise.resolve())
      : new Promise((resolve) => waiting.push(resolve));
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };

  const send = (res, status, body) => {
    const text = JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text), 'Cache-Control': 'no-store' });
    res.end(text);
  };

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://gate');
    if (!secretMatches(req.headers['x-lfb-secret'], secret)) return send(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET' && url.pathname === '/v1/health') {
      try {
        const r = await fetchImpl(`${pistonUrl}/api/v2/runtimes`);
        const runtimes = await r.json();
        return send(res, 200, { ok: true, runtimes: runtimes.map((x) => `${x.language}-${x.version}`), active, queued: waiting.length });
      } catch {
        return send(res, 503, { error: 'Piston unreachable' });
      }
    }

    const m = /^\/v1\/execute\/([a-z]+)$/.exec(url.pathname);
    if (!m || req.method !== 'POST') return send(res, 404, { error: 'Not found' });
    if (!RUNTIMES[m[1]]) return send(res, 400, { error: `Unsupported language: ${m[1]}` });

    let body;
    try {
      let raw = await readBody(req, LIMITS.maxRawBytes);
      const enc = String(req.headers['content-encoding'] ?? 'identity').toLowerCase();
      if (enc === 'gzip') raw = await gunzipAsync(raw, { maxOutputLength: LIMITS.maxJsonBytes });
      else if (enc !== 'identity') return send(res, 415, { error: 'Unsupported Content-Encoding' });
      if (raw.length > LIMITS.maxJsonBytes) return send(res, 413, { error: 'Body too large' });
      body = JSON.parse(raw.toString('utf8'));
    } catch (err) {
      // zlib reports an output over maxOutputLength as a RangeError.
      const tooLarge = err.status === 413 || err.code === 'ERR_BUFFER_TOO_LARGE' || err instanceof RangeError;
      return send(res, tooLarge ? 413 : 400, { error: tooLarge ? 'Body too large' : 'Body is not valid JSON' });
    }

    const { request, error } = toPistonRequest(m[1], body);
    if (error) return send(res, 400, { error });
    if (active >= maxActive && waiting.length >= maxQueue) return send(res, 503, { error: 'Busy' });

    await acquire();
    const t0 = Date.now();
    try {
      const r = await fetchImpl(`${pistonUrl}/api/v2/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      const result = await r.json().catch(() => null);
      if (!r.ok || !result) {
        log(`piston ${r.status} ${result?.message ?? ''}`);
        return send(res, 502, { error: 'The code server failed to run this' });
      }
      log(`${m[1]} ${Date.now() - t0}ms compile=${result.compile?.code ?? '-'} run=${result.run?.status ?? result.run?.code ?? '-'} client=${req.headers['x-lfb-client'] ?? '-'}`);
      return send(res, 200, trimResult(result));
    } catch {
      return send(res, 502, { error: 'Piston unreachable' });
    } finally {
      release();
    }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [host, port] = (process.env.GATE_LISTEN ?? '127.0.0.1:8080').split(':');
  const handle = createGate({
    secret: process.env.LFB_RUNNER_SECRET,
    pistonUrl: process.env.PISTON_URL ?? 'http://127.0.0.1:2000',
    maxActive: Number(process.env.GATE_MAX_ACTIVE ?? 2),
    maxQueue: Number(process.env.GATE_MAX_QUEUE ?? 8),
    log: (msg) => console.log(new Date().toISOString(), msg),
  });
  const server = createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500).end();
    });
  });
  // A run waits for compile plus run; keep idle sockets from piling up behind the tunnel.
  server.requestTimeout = 120_000;
  server.listen(Number(port), host, () => console.log(`gate listening on ${host}:${port}`));
}
