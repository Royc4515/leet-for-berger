// Every shipped solution, in every one of the 8 languages, must pass all 15 of its problem's
// cases. "Reveal Solution" shows these files to users, so an unverified one is a bug we ship.
//
// A language runs only where its toolchain exists. Locally a missing toolchain skips; with
// REQUIRE_ALL_LANGUAGES=1 (CI) it fails, so CI can never go green on a skipped language.
//
// VERIFY_LANGUAGES=java,go (or "sql", or "none") limits which solutions run, so CI can run one
// language per parallel job; unset runs all. tests/ci.test.js checks the CI matrix covers them all.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { availableProblems } from '../src/js/problems/index.js';
import { buildSuite, comparatorFor } from '../src/js/engine/harness.js';
import { LANGUAGES, validateSignature } from '../src/js/engine/codegen.js';
import { buildHarness, buildProgram, programStdin, splitOutput, NATIVE_LANGUAGES, JAVA_SUPPORT_FILES } from '../scripts/verify/harnesses.mjs';
import { isSql, validateSqlProblem } from '../src/js/engine/sql.js';
import { sqlEngineAvailable, loadSqlEngine, runSqlCases } from '../scripts/verify/sql.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const REQUIRE_ALL = process.env.REQUIRE_ALL_LANGUAGES === '1';
const ONLY = process.env.VERIFY_LANGUAGES ? new Set(process.env.VERIFY_LANGUAGES.split(',').map((l) => l.trim())) : null;
const selected = (lang) => !ONLY || ONLY.has(lang);
const works = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'ignore' });
  return !r.error && r.status === 0;
};
// Each probe spawns a process; with 133 problems that is a thousand spawns, so probe once.
const once = (fn) => {
  let v;
  return () => (v ??= fn());
};
const localTsc = join(ROOT, 'node_modules/.bin/tsc');
const TSC = existsSync(localTsc) ? localTsc : 'tsc';
const dotnetVersion = once(() => Number(execFileSync('dotnet', ['--version'], { encoding: 'utf8' }).split('.')[0]));

const TOOLCHAIN = {
  javascript: () => true,
  python: once(() => works('python3', ['--version'])),
  typescript: once(() => works(TSC, ['--version'])),
  java: once(() => works('javac', ['-version'])),
  cpp: once(() => works('g++', ['--version'])),
  c: once(() => works('gcc', ['--version'])),
  go: once(() => works('go', ['version'])),
  csharp: once(() => works('dotnet', ['--version'])),
};

// The same Java files the browser's remote runner fetches (src/js/engine/programs/java/).
const JAVA_SUPPORT = Object.fromEntries(JAVA_SUPPORT_FILES.map((f) => [f, readFileSync(join(ROOT, 'src/js/engine/programs/java', f), 'utf8')]));
const run = (cmd, args, opts) => execFileSync(cmd, args, { maxBuffer: 1 << 28, encoding: 'utf8', ...opts });
const quiet = { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' };

/** Wall time of the most recent run (compile excluded), read by the time-limit check. */
let lastRunMs = 0;

/** Compiles and runs one language's solution on the cases; returns one parsed value per case. */
function execute(lang, problem, cases, { source, compileOnly = false } = {}) {
  const solution = source ?? readFileSync(join(ROOT, 'src/js/problems', problem.id, 'solutions', LANGUAGES.find((l) => l.id === lang).file), 'utf8');
  const dir = mkdtempSync(join(tmpdir(), `lfb-${lang}-`));
  const native = NATIVE_LANGUAGES.includes(lang);
  // Native languages: the exact program the remote runner sends (src/js/engine/programs/build.js).
  const h = native
    ? buildProgram(lang, problem.signature, solution, { javaSupport: JAVA_SUPPORT, dotnetMajor: lang === 'csharp' ? dotnetVersion() : undefined })
    : buildHarness(lang, problem.signature, solution);
  for (const [name, content] of Object.entries(h.files)) writeFileSync(join(dir, name), content);
  if (h.compile) {
    const [cmd, ...args] = h.compile;
    run(cmd === 'tsc' ? TSC : cmd, args, { cwd: dir, stdio: 'pipe', env: quiet });
  }
  if (compileOnly) return [];
  const [cmd, ...args] = h.run;
  const input = native ? programStdin(h, cases, problem.signature) : JSON.stringify(cases);
  const t0 = performance.now();
  const r = spawnSync(cmd, args, { cwd: dir, input, maxBuffer: 1 << 28, encoding: 'utf8' });
  lastRunMs = performance.now() - t0;
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${lang} exited with ${r.status ?? r.signal}: ${r.stderr.slice(-2000)}`);
  if (!native) return r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  const out = splitOutput(r.stdout, r.stderr);
  assert.equal(out.started, cases.length, `${lang}: ${out.started} cases started, expected ${cases.length}`);
  return out.results.map((l) => JSON.parse(l));
}

// SQL problems ship one solution, solution.sql, run by the same sql.js build and case runner as
// the browser worker (docs/adr/0003-sql-problems.md). The 8-language rule is for algorithm problems.
function verifySql(problem, suite) {
  test(`${problem.id}: SQL schema and all 15 cases are valid`, () => {
    assert.deepEqual(validateSqlProblem(problem), []);
  });
  if (!selected('sql')) return;
  const available = sqlEngineAvailable();
  const skip = !available && !REQUIRE_ALL && 'sql.js devDependency not installed (npm ci)';
  test(`${problem.id}: SQL solution passes all 15 cases`, { skip }, async () => {
    assert.ok(available, 'sql.js missing but REQUIRE_ALL_LANGUAGES=1');
    const query = readFileSync(join(ROOT, 'src/js/problems', problem.id, 'solutions/solution.sql'), 'utf8');
    // Engine boot is timed too, like process startup for the other languages.
    const t0 = performance.now();
    await loadSqlEngine();
    const actuals = await runSqlCases(problem.signature, query, suite.map((tc) => tc.args));
    const ms = performance.now() - t0;
    suite.forEach((tc, i) => {
      assert.equal(actuals[i].error, undefined, `case ${tc.id}: ${actuals[i].error}`);
      assert.ok(problem.compare(actuals[i], tc.expected), `SQL: case ${tc.id} failed`);
    });
    // Same budget rule as the other languages: all 15 cases within one case's limit.
    const factor = Number(process.env.LFB_TIME_FACTOR ?? 1);
    if (factor > 0) assert.ok(ms <= problem.timeLimitMs * factor, `SQL: 15 cases took ${Math.round(ms)} ms, budget ${problem.timeLimitMs * factor} ms`);
    if (process.env.LFB_TIMINGS) appendFileSync(process.env.LFB_TIMINGS, `${problem.id}\tsql\t${Math.round(ms)}\t${problem.timeLimitMs}\n`);
  });
}

for (const problem of availableProblems()) {
  const suite = buildSuite(problem);
  if (isSql(problem.signature)) {
    verifySql(problem, suite);
    continue;
  }

  test(`${problem.id}: signature is valid`, () => {
    assert.deepEqual(validateSignature(problem.signature), []);
  });

  // A case whose argument list does not match the signature is silently accepted by
  // JavaScript (extra args are ignored) while typed languages reject it.
  test(`${problem.id}: every case passes exactly the signature's arguments`, () => {
    const arity = problem.signature.kind === 'class' ? 2 : problem.signature.params.length;
    for (const tc of suite) assert.equal(tc.args.length, arity, `case ${tc.id} has ${tc.args.length} args, expected ${arity}`);
  });

  for (const { id: lang, label } of LANGUAGES) {
    if (!selected(lang)) continue;
    const available = TOOLCHAIN[lang]();
    const skip = !available && !REQUIRE_ALL && `${label} toolchain not installed`;
    test(`${problem.id}: ${label} solution passes all 15 cases`, { skip }, () => {
      assert.ok(available, `${label} toolchain missing but REQUIRE_ALL_LANGUAGES=1`);
      const actuals = execute(lang, problem, suite.map((tc) => tc.args));
      assert.equal(actuals.length, suite.length, `${label}: wrong number of results`);
      // The problem's judge mode, as in the browser (exact equality unless it declares one).
      const compare = comparatorFor(problem);
      suite.forEach((tc, i) => assert.ok(compare(actuals[i], tc.expected, tc), `${label}: case ${tc.id} failed`));
      // The browser watchdog only enforces limits for JavaScript and Python. Here every language
      // must finish all 15 cases, process startup included, within one case's limit: optimal
      // solutions use under half of it, while a naive O(n^2) on a max-size case needs seconds.
      // LFB_TIME_FACTOR scales the budget on slow machines; 0 disables the check.
      const factor = Number(process.env.LFB_TIME_FACTOR ?? 1);
      if (factor > 0) {
        const budget = problem.timeLimitMs * factor;
        assert.ok(lastRunMs <= budget, `${label}: 15 cases took ${Math.round(lastRunMs)} ms, budget ${budget} ms`);
      }
      if (process.env.LFB_TIMINGS) appendFileSync(process.env.LFB_TIMINGS, `${problem.id}\t${lang}\t${Math.round(lastRunMs)}\t${problem.timeLimitMs}\n`);
    });

    // The generated starter code is what users see first; it must compile in every language.
    if (lang !== 'javascript' && lang !== 'python') {
      test(`${problem.id}: ${label} starter code compiles`, { skip }, () => {
        assert.ok(available, `${label} toolchain missing but REQUIRE_ALL_LANGUAGES=1`);
        execute(lang, problem, [], { source: problem.starterCode[lang], compileOnly: true });
      });
    }
  }
}
