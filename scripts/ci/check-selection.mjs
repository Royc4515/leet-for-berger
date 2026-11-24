#!/usr/bin/env node
/**
 * Proves the affected-test selection on the real suite: runs every unit test with each process
 * traced (scripts/ci/trace/), then checks that every repository file a test actually opened or
 * imported is among the files scripts/ci/deps.mjs says it reaches. A file it misses is a change
 * that would skip a test that needed to run. Run it after changing deps.mjs or how tests find
 * their files (about three minutes):
 *
 *   node scripts/ci/check-selection.mjs [--trace=existing.tsv]
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { reach, touches } from './deps.mjs';
import { repoFs } from './repo-fs.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));

let trace = args.trace;
if (!trace) {
  trace = join(mkdtempSync(join(tmpdir(), 'lfb-trace-')), 'trace.tsv');
  const preload = fileURLToPath(new URL('./trace/preload.mjs', import.meta.url));
  console.log('Running every unit test, traced...');
  const run = spawnSync(process.execPath, ['--test', 'tests/**/*.test.js'], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, TRACE_OUT: trace, NODE_OPTIONS: `--import=${preload}`, VERIFY_LANGUAGES: process.env.VERIFY_LANGUAGES ?? 'none' } });
  // A failing test still shows what it reads; the comparison below is what this script checks.
  if (run.status !== 0) console.log(`(the test run itself exited ${run.status}; tracing is still complete for what ran)`);
}

const fs = repoFs(ROOT);

const byTest = new Map();
for (const line of readFileSync(trace, 'utf8').split('\n')) {
  const [who, path] = line.split('\t');
  if (!path || !/^tests\/[^/]+\.test\.js$/.test(who)) continue;
  if (!byTest.has(who)) byTest.set(who, new Set());
  byTest.get(who).add(path);
}
const cache = new Map();
let misses = 0;
for (const [test, paths] of [...byTest].sort()) {
  const deps = reach(test, fs, cache);
  const miss = [...paths].filter((p) => {
    const k = fs.kind(p);
    // Packages are covered by package-lock.json, which runs every test.
    if (!k || p === test || p.startsWith('.git') || p.split('/')[0] === 'node_modules') return false;
    // A folder a test lists is covered by a dependency on the folder or on what is inside it.
    if (k === 'dir') return !deps.some((d) => d.path === p || d.path.startsWith(`${p}/`) || (d.type === 'dir' && p.startsWith(`${d.path}/`)));
    return !deps.some((d) => touches(d, p));
  });
  if (miss.length) {
    misses += miss.length;
    console.log(`${test} reads, but the selection misses: ${miss.join(', ')}`);
  }
}
console.log(`${byTest.size} tests traced; ${misses} file(s) read but not predicted`);
process.exit(misses ? 1 : 0);
