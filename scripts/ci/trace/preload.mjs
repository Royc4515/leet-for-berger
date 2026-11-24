/**
 * Preloaded into every node process of a traced test run (scripts/ci/check-selection.mjs): records
 * each repository file the process imports or touches through `fs`, as "<test file>\t<path>" lines
 * in $TRACE_OUT. Test files run in their own process, so the test is read from argv.
 */
import fs from 'node:fs';
import { register, syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const OUT = process.env.TRACE_OUT;
const who = (process.argv.find((a) => /\/tests\/[^/]+\.test\.js$/.test(a)) ?? process.argv[1] ?? 'unknown').replace(ROOT, '');
const append = fs.appendFileSync.bind(fs);
const seen = new Set();

function note(p) {
  try {
    let s = typeof p === 'string' ? p : p instanceof URL ? fileURLToPath(p) : Buffer.isBuffer(p) ? p.toString() : null;
    if (!s) return;
    if (s.startsWith('file://')) s = fileURLToPath(s);
    if (!s.startsWith('/')) s = `${process.cwd()}/${s}`;
    if (!s.startsWith(ROOT) || s.includes('/node_modules/')) return;
    const rel = s.slice(ROOT.length).replace(/\/+$/, '');
    if (seen.has(rel)) return;
    seen.add(rel);
    append(OUT, `${who}\t${rel}\n`);
  } catch {
    // Tracing must never change what a test sees.
  }
}

for (const name of ['readFileSync', 'readdirSync', 'statSync', 'lstatSync', 'existsSync', 'openSync', 'readFile', 'readdir', 'stat', 'createReadStream', 'accessSync', 'opendirSync']) {
  const orig = fs[name];
  if (typeof orig === 'function') fs[name] = function traced(p, ...rest) {
    note(p);
    return orig.call(this, p, ...rest);
  };
}
for (const name of ['readFile', 'readdir', 'stat', 'access', 'open', 'opendir']) {
  const orig = fs.promises[name];
  if (typeof orig === 'function') fs.promises[name] = function traced(p, ...rest) {
    note(p);
    return orig.call(this, p, ...rest);
  };
}
syncBuiltinESMExports();
register(new URL('./hooks.mjs', import.meta.url), { data: { who, out: OUT, root: ROOT } });
