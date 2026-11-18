/**
 * A stand-in for the remote runner (Cloudflare Worker + gate + Piston, ADR 0005) for the smoke test.
 * It speaks the Worker's API (POST /v1/execute/java, CORS preflight, gzip bodies) and answers in
 * Piston's shape. When a JDK is installed it really compiles and runs the program the page sent,
 * with the same commands as the server's package scripts; without one it answers each case with
 * the problem's reference solution, which still exercises the page's request, the case protocol
 * and judging, but not the user's code.
 */
import { createServer } from 'node:http';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RESULT_MARK, CASE_MARK } from '../src/js/engine/programs/output.js';

const hasJdk = () => {
  const r = spawnSync('javac', ['-version'], { stdio: 'ignore' });
  return !r.error && r.status === 0;
};

/** Compiles and runs a Java program like deploy/piston/packages/java (compile, then run with .stdin). */
function runJava(files, stdin, args) {
  const dir = mkdtempSync(join(tmpdir(), 'lfb-fake-'));
  try {
    for (const f of files) writeFileSync(join(dir, f.name), f.content);
    const c = spawnSync('javac', ['-d', '.', ...files.map((f) => f.name)], { cwd: dir, encoding: 'utf8' });
    const compile = { stdout: c.stdout, stderr: c.stderr, code: c.status, signal: null, status: c.status ? 'RE' : null };
    if (c.status !== 0) return { compile };
    const r = spawnSync('java', ['-Xss64m', '-cp', '.', 'Harness', ...args], { cwd: dir, input: stdin, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 20000 });
    return { compile, run: { stdout: r.stdout, stderr: r.stderr, code: r.status, signal: r.signal, status: r.status ? 'RE' : null } };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * @param {number} port
 * @param {{ origin: string, reference: (args: unknown[]) => unknown }} opts reference answers a case
 * @returns {Promise<{ close: () => void, requests: object[], real: boolean }>}
 */
export async function startFakeRunner(port, { origin, reference }) {
  const real = hasJdk();
  const requests = [];
  const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Content-Encoding', Vary: 'Origin' };
  const server = createServer((req, res) => {
    if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      let raw = Buffer.concat(chunks);
      if (req.headers['content-encoding'] === 'gzip') raw = gunzipSync(raw);
      const body = JSON.parse(raw.toString('utf8'));
      requests.push({ path: req.url, encoding: req.headers['content-encoding'] ?? null, body });
      let answer;
      if (real) answer = runJava(body.files, body.stdin, body.args);
      else {
        const cases = JSON.parse(body.stdin);
        answer = {
          compile: { stdout: '', stderr: '', code: 0, signal: null },
          run: { stdout: cases.map((a) => `${RESULT_MARK}${JSON.stringify(reference(a))}\n`).join(''), stderr: CASE_MARK.repeat(cases.length), code: 0, signal: null, status: null },
        };
      }
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify(answer));
    });
  });
  await new Promise((resolve) => server.listen(port, resolve));
  return { close: () => server.close(), requests, real };
}
