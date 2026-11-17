// Every shipped solution, in every one of the 8 languages, must pass all 15 of its problem's
// cases. "Reveal Solution" shows these files to users, so an unverified one is a bug we ship.
//
// A language runs only where its toolchain exists. Locally a missing toolchain skips; with
// REQUIRE_ALL_LANGUAGES=1 (CI) it fails, so CI can never go green on a skipped language.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { availableProblems } from '../src/js/problems/index.js';
import { buildSuite, deepEqual } from '../src/js/engine/harness.js';
import { LANGUAGES, validateSignature } from '../src/js/engine/codegen.js';
import { buildHarness, encodeCases } from '../scripts/verify/harnesses.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const REQUIRE_ALL = process.env.REQUIRE_ALL_LANGUAGES === '1';
const works = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'ignore' });
  return !r.error && r.status === 0;
};
const localTsc = join(ROOT, 'node_modules/.bin/tsc');
const TSC = existsSync(localTsc) ? localTsc : 'tsc';
const dotnetVersion = () => Number(execFileSync('dotnet', ['--version'], { encoding: 'utf8' }).split('.')[0]);

const TOOLCHAIN = {
  javascript: () => true,
  python: () => works('python3', ['--version']),
  typescript: () => works(TSC, ['--version']),
  java: () => works('javac', ['-version']),
  cpp: () => works('g++', ['--version']),
  c: () => works('gcc', ['--version']),
  go: () => works('go', ['version']),
  csharp: () => works('dotnet', ['--version']),
};

const JAVA_HARNESS = join(ROOT, 'scripts/verify/Harness.java');
const run = (cmd, args, opts) => execFileSync(cmd, args, { maxBuffer: 1 << 28, encoding: 'utf8', ...opts });

/** Compiles and runs one language's solution on the cases; returns one parsed value per case. */
function execute(lang, problem, cases, { source, compileOnly = false } = {}) {
  const solution = source ?? readFileSync(join(ROOT, 'src/js/problems', problem.id, 'solutions', LANGUAGES.find((l) => l.id === lang).file), 'utf8');
  const dir = mkdtempSync(join(tmpdir(), `lfb-${lang}-`));
  const opts = lang === 'csharp' ? { dotnetMajor: dotnetVersion() } : undefined;
  const h = buildHarness(lang, problem.signature, solution, opts);
  for (const [name, content] of Object.entries(h.files)) writeFileSync(join(dir, name), content);
  let out;
  if (lang === 'java') {
    copyFileSync(JAVA_HARNESS, join(dir, 'Harness.java'));
    // ListNode and TreeNode are always compiled in: the harness refers to them, as do solutions.
    for (const f of ['ListNode.java', 'TreeNode.java']) copyFileSync(join(ROOT, 'scripts/verify', f), join(dir, f));
    run('javac', ['-d', dir, ...['Solution.java', 'Harness.java', 'ListNode.java', 'TreeNode.java'].map((f) => join(dir, f))], { stdio: 'pipe' });
    if (compileOnly) return [];
    out = run('java', ['-Xss64m', '-cp', dir, 'Harness', problem.signature.name], { input: JSON.stringify(cases) });
  } else {
    if (h.compile) {
      const [cmd, ...args] = h.compile;
      run(cmd === 'tsc' ? TSC : cmd, args, { cwd: dir, stdio: 'pipe', env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' } });
    }
    if (compileOnly) return [];
    const [cmd, ...args] = h.run;
    const input = h.input === 'json' ? JSON.stringify(cases) : encodeCases(cases, problem.signature);
    out = run(cmd, args, { cwd: dir, input });
  }
  return out.trim().split('\n').map((l) => JSON.parse(l));
}

for (const problem of availableProblems()) {
  const suite = buildSuite(problem);

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
    const available = TOOLCHAIN[lang]();
    const skip = !available && !REQUIRE_ALL && `${label} toolchain not installed`;
    test(`${problem.id}: ${label} solution passes all 15 cases`, { skip }, () => {
      assert.ok(available, `${label} toolchain missing but REQUIRE_ALL_LANGUAGES=1`);
      const actuals = execute(lang, problem, suite.map((tc) => tc.args));
      assert.equal(actuals.length, suite.length, `${label}: wrong number of results`);
      suite.forEach((tc, i) => assert.ok(deepEqual(actuals[i], tc.expected), `${label}: case ${tc.id} failed`));
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
