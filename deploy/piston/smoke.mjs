#!/usr/bin/env node
/**
 * Smoke test for a deployed runner: runs shipped solutions in every remote language through the
 * same client code the site uses (RemoteRunner) and judges them like the browser does.
 *
 *   On the VM, against the gate (setup.sh does this; the secret comes from secrets/gate.env):
 *     LFB_RUNNER_SECRET=... node deploy/piston/smoke.mjs --gate http://127.0.0.1:8080
 *   From anywhere, through the Cloudflare Worker (the Origin must be in ALLOWED_ORIGINS):
 *     node deploy/piston/smoke.mjs --worker https://lfb-runner.NAME.workers.dev --origin https://USER.github.io
 *
 * Options: --problems pair-sum-target,min-stack   --languages java,go
 * Exit code 0 when every run is Accepted.
 */
import { readFile } from 'node:fs/promises';
import { loadProblem } from '../../src/js/problems/index.js';
import { buildSuite, judge, comparatorFor } from '../../src/js/engine/harness.js';
import { RemoteRunner, REMOTE_LANGUAGES } from '../../src/js/engine/runners/remote-runner.js';
import { LANGUAGES } from '../../src/js/engine/codegen.js';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const gate = opt('gate');
const worker = opt('worker');
if (!gate === !worker) {
  console.error('Pass exactly one of --gate URL or --worker URL.');
  process.exit(2);
}
const headers = {};
if (gate) {
  if (!process.env.LFB_RUNNER_SECRET) {
    console.error('LFB_RUNNER_SECRET is not set.');
    process.exit(2);
  }
  headers['X-LFB-Secret'] = process.env.LFB_RUNNER_SECRET;
} else {
  headers.Origin = opt('origin', 'http://localhost:5173');
}
const problemIds = opt('problems', 'pair-sum-target,min-stack').split(',');
const languages = opt('languages', REMOTE_LANGUAGES.join(',')).split(',');

const fetchImpl = (url, init) => fetch(url, { ...init, headers: { ...init.headers, ...headers } });
const loadText = (url) => readFile(new URL(url), 'utf8');
let failed = 0;

for (const id of problemIds) {
  const problem = await loadProblem(id).catch(() => null);
  if (!problem) throw new Error(`No problem ${id}`);
  const suite = buildSuite(problem);
  for (const lang of languages) {
    const file = LANGUAGES.find((l) => l.id === lang).file;
    const code = await readFile(new URL(`../../src/js/problems/${id}/solutions/${file}`, import.meta.url), 'utf8');
    const runner = new RemoteRunner({ language: lang, url: gate ?? worker, fetchImpl, loadText });
    const t0 = performance.now();
    let line;
    try {
      const raw = await runner.run({ code, signature: problem.signature, cases: suite.map(({ id: cid, args }) => ({ id: cid, args })), timeLimitMs: problem.timeLimitMs });
      const result = judge(suite, raw, comparatorFor(problem));
      if (!result.accepted) failed++;
      const firstBad = raw.find((r) => r.state !== 'ok');
      line = `${result.verdict} ${result.passed}/15${firstBad?.error ? ` - ${String(firstBad.error).split('\n').slice(0, 3).join(' | ')}` : ''}`;
    } catch (err) {
      failed++;
      line = `NO VERDICT - ${err.message}`;
    }
    console.log(`${id.padEnd(18)} ${lang.padEnd(7)} ${String(Math.round(performance.now() - t0)).padStart(6)} ms  ${line}`);
  }
}
console.log(failed ? `\n${failed} run(s) not Accepted.` : '\nAll runs Accepted.');
process.exitCode = failed ? 1 : 0;
