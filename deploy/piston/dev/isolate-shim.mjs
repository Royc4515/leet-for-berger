#!/usr/bin/env node
/**
 * DEVELOPMENT ONLY. A stand-in for isolate so the real Piston API can run on a machine without
 * pure cgroup v2 (a laptop, a CI container). It runs the job as an ordinary process with the wall
 * time limit and writes isolate's meta file, and nothing else: no sandbox, no memory, process or
 * network limits. Never use it on a server that runs other people's code.
 *
 * Supports what Piston's job.js calls: --init, --run, --cleanup (with -b<id>, --meta, -E, -c,
 * --wall-time; other options are accepted and ignored).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.LFB_SHIM_ROOT ?? '/tmp/lfb-isolate-shim';
const args = process.argv.slice(2);
const box = args.find((a) => a.startsWith('-b'))?.slice(2) ?? '0';
const root = join(ROOT, box);

if (args.includes('--init')) {
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, 'box'), { recursive: true });
  mkdirSync(join(root, 'tmp'), { recursive: true });
  process.stdout.write(`${root}\n`);
  process.exit(0);
}
if (args.includes('--cleanup')) {
  rmSync(root, { recursive: true, force: true });
  process.exit(0);
}

const sep = args.indexOf('--');
const opts = args.slice(0, sep);
const [cmd, ...cmdArgs] = args.slice(sep + 1);
const meta = opts.find((a) => a.startsWith('--meta='))?.slice(7);
const wall = Number(opts.find((a) => a.startsWith('--wall-time='))?.slice(12) ?? 10);
const chdir = (opts[opts.indexOf('-c') + 1] ?? '/box').replace(/^\/box/, join(root, 'box'));
// isolate gives each box its own /tmp; here each box gets a directory, and variables naming /tmp or
// a path under it that does not exist on the host (GOCACHE=/tmp/gocache) point into it instead.
const tmp = join(root, 'tmp');
const env = {};
for (let i = 0; i < opts.length; i++) {
  if (opts[i] !== '-E') continue;
  const [k, ...v] = opts[i + 1].split('=');
  const val = v.join('=');
  env[k] = val === '/tmp' || (val.startsWith('/tmp/') && !val.includes(':') && !existsSync(val)) ? tmp + val.slice(4) : val;
}

const t0 = Date.now();
const child = spawn(cmd, cmdArgs, { cwd: chdir, env, stdio: 'inherit', detached: true });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}, wall * 1000);
child.on('exit', (code, signal) => {
  clearTimeout(timer);
  const secs = ((Date.now() - t0) / 1000).toFixed(3);
  const lines = [`time:${secs}`, `time-wall:${secs}`];
  if (timedOut) lines.push('status:TO', 'message:Time limit exceeded (wall clock)', 'killed:1');
  else if (signal) lines.push('status:SG', `exitsig:${{ SIGKILL: 9, SIGSEGV: 11, SIGABRT: 6, SIGFPE: 8 }[signal] ?? 9}`, `message:Caught fatal signal`);
  else {
    lines.push(`exitcode:${code}`);
    if (code !== 0) lines.push('status:RE', `message:Exited with error status ${code}`);
  }
  if (meta) writeFileSync(meta, lines.join('\n') + '\n');
  process.exit(timedOut || signal ? 1 : code);
});
