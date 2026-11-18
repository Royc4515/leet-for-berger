#!/usr/bin/env node
/**
 * End-to-end health check of the remote runner: site -> Cloudflare Worker -> Tunnel -> gate ->
 * Piston. Run on a schedule by .github/workflows/runner-health.yml; a failed run is the alert
 * (GitHub emails the repository owner when a scheduled workflow fails).
 *
 * Usage: node scripts/runner-health.mjs [workerUrl]   (default: src/js/config.js)
 * Exit codes: 0 up (or the Worker predates the deep check: a warning), 1 down.
 */
import { REMOTE_RUNNER } from '../src/js/config.js';
import { RUNTIMES } from '../deploy/piston/gate/gate.mjs';

/** Runtime ids the gate must report, e.g. "java-21.0.13", one per site language. */
export const EXPECTED_RUNTIMES = Object.values(RUNTIMES).map((r) => `${r.language}-${r.version}`);

/**
 * Turns a deep health response into a verdict.
 * @param {number} status HTTP status
 * @param {any} body parsed JSON (or null)
 * @returns {{ state: 'up'|'down'|'old-worker', message: string }}
 */
export function judgeHealth(status, body) {
  if (status === 200 && body?.ok === true && !body.gate) {
    return { state: 'old-worker', message: 'The Worker answers but predates the deep check. Redeploy it: cd deploy/cloudflare-worker && npx wrangler deploy' };
  }
  if (status !== 200 || body?.ok !== true) {
    const why = body?.gate?.error ?? body?.error ?? `HTTP ${status}`;
    return { state: 'down', message: `Runner is down: ${why}` };
  }
  const have = new Set(body.gate.runtimes ?? []);
  const missing = EXPECTED_RUNTIMES.filter((r) => !have.has(r));
  if (missing.length) return { state: 'down', message: `Runner is up but missing runtimes: ${missing.join(', ')}` };
  return { state: 'up', message: `Runner is up: ${EXPECTED_RUNTIMES.length} runtimes, ${body.gate.active ?? 0} active, ${body.gate.queued ?? 0} queued` };
}

async function main() {
  const base = (process.argv[2] ?? REMOTE_RUNNER.url).replace(/\/+$/, '');
  if (!base) {
    console.log('No runner URL configured; nothing to check.');
    return;
  }
  let status = 0;
  let body = null;
  try {
    const res = await fetch(`${base}/v1/health?deep=1`, { signal: AbortSignal.timeout(20000) });
    status = res.status;
    body = await res.json().catch(() => null);
  } catch (err) {
    body = { error: `request failed: ${err.message}` };
  }
  const verdict = judgeHealth(status, body);
  const line = `${verdict.state.toUpperCase()}: ${verdict.message}`;
  if (verdict.state === 'down') {
    // ::error:: puts the line on the workflow run's summary page.
    console.log(`::error::${line}`);
    console.log('Recovery: docs/DEPLOY_RUNNER.md (Oracle may have reclaimed the VM; sudo ./setup.sh tunnel on a new one).');
    process.exitCode = 1;
  } else if (verdict.state === 'old-worker') console.log(`::warning::${line}`);
  else console.log(line);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
