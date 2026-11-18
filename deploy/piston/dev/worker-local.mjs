#!/usr/bin/env node
/**
 * DEVELOPMENT ONLY. Serves the Cloudflare Worker (deploy/cloudflare-worker/src/index.js) from Node,
 * so the whole chain (site -> Worker -> gate -> Piston) can be exercised on one machine without a
 * Cloudflare account. The Worker code is unchanged; only the runtime around it differs (no
 * rate limiting binding, so the in-memory limiter applies; no VPC binding, so GATE_URL is used).
 *
 *   RUNNER_SECRET=... GATE_URL=http://127.0.0.1:8080 ALLOWED_ORIGINS=http://localhost:5173 \
 *     node deploy/piston/dev/worker-local.mjs [port]
 */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { createWorker } from '../../cloudflare-worker/src/index.js';

const port = Number(process.argv[2] ?? 8787);
const worker = createWorker();
const env = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173',
  GATE_URL: process.env.GATE_URL ?? 'http://127.0.0.1:8080',
  RUNNER_SECRET: process.env.RUNNER_SECRET,
  RATE_LIMIT: process.env.RATE_LIMIT ?? '60',
};

createServer(async (req, res) => {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  headers.set('CF-Connecting-IP', req.socket.remoteAddress ?? 'local');
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: 'half',
  });
  const response = await worker.fetch(request, env);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) Readable.fromWeb(response.body).pipe(res);
  else res.end();
}).listen(port, '127.0.0.1', () => console.log(`worker (local) on http://127.0.0.1:${port}`));
