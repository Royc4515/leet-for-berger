// The native program builder (src/js/engine/programs/) is shared by the CI verifier and the
// browser's remote runner (docs/adr/0005-remote-runner.md). These tests pin that sharing down:
// it must stay browser-safe, the verifier must use it unchanged, and the case protocol must parse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { availableProblems } from '../src/js/problems/index.js';
import { buildSuite } from '../src/js/engine/harness.js';
import { isSql } from '../src/js/engine/sql.js';
import * as browserBuild from '../src/js/engine/programs/build.js';
import * as verifierBuild from '../scripts/verify/harnesses.mjs';
import { splitOutput, CASE_MARK, RESULT_MARK } from '../src/js/engine/programs/output.js';

const ROOT = new URL('..', import.meta.url).pathname;
const PROGRAMS = join(ROOT, 'src/js/engine/programs');
const javaSupport = Object.fromEntries(browserBuild.JAVA_SUPPORT_FILES.map((f) => [f, readFileSync(join(PROGRAMS, 'java', f), 'utf8')]));

test('the verifier builds programs with the browser module itself, not a copy', () => {
  for (const name of ['buildHarness', 'buildProgram', 'encodeCases', 'programStdin']) assert.equal(verifierBuild[name], browserBuild[name], name);
  const verifier = readFileSync(join(ROOT, 'tests/solutions.test.js'), 'utf8');
  assert.match(verifier, /src\/js\/engine\/programs\/java/, 'verifier reads the Java files the browser fetches');
});

test('program modules are browser-safe: no Node built-ins, no Buffer, no process', () => {
  for (const f of readdirSync(PROGRAMS).filter((x) => x.endsWith('.js'))) {
    const src = readFileSync(join(PROGRAMS, f), 'utf8');
    // Only relative imports; generated programs may mention require() inside their template text.
    for (const m of src.matchAll(/^import .* from '([^']+)'/gm)) assert.match(m[1], /^\.\.?\//, `${f} imports ${m[1]}`);
    assert.doesNotMatch(src, /\bBuffer\.(from|byteLength|alloc)|\bprocess\.(env|argv|exit|stdout|stderr)/, f);
  }
});

test('every native program is identical whether built for the verifier or the browser', () => {
  let n = 0;
  for (const problem of availableProblems()) {
    if (isSql(problem.signature)) continue;
    const args = buildSuite(problem).map((t) => t.args);
    for (const lang of browserBuild.NATIVE_LANGUAGES) {
      const solution = problem.starterCode[lang];
      const a = browserBuild.buildProgram(lang, problem.signature, solution, { javaSupport });
      const b = verifierBuild.buildProgram(lang, problem.signature, solution, { javaSupport });
      assert.deepEqual(a, b);
      assert.equal(browserBuild.programStdin(a, args, problem.signature), verifierBuild.programStdin(b, args, problem.signature));
      n++;
    }
  }
  assert.ok(n > 500, `only ${n} programs compared`);
});

test('string tokens count UTF-8 bytes, as the native readers expect', () => {
  const sig = { name: 'f', params: [{ name: 's', type: 'string' }], returns: 'int' };
  assert.equal(browserBuild.encodeCases([['héllo, 世界']], sig), `1 ${Buffer.byteLength('héllo, 世界')} héllo, 世界\n`);
});

test('Java program: support files included, entry name passed as the run argument', () => {
  const sig = { name: 'pairSum', params: [{ name: 'nums', type: 'int[]' }], returns: 'int' };
  const p = browserBuild.buildProgram('java', sig, 'class Solution {}', { javaSupport });
  assert.deepEqual(Object.keys(p.files), ['Solution.java', ...browserBuild.JAVA_SUPPORT_FILES]);
  assert.deepEqual(p.args, ['pairSum']);
  assert.deepEqual(p.run.slice(-1), ['pairSum']);
  assert.equal(p.input, 'json');
  assert.throws(() => browserBuild.buildProgram('java', sig, 'x', {}), /support files missing/);
});

test('solutionLine points at the first line of the user code in the generated file', () => {
  const sig = { name: 'f', params: [{ name: 'n', type: 'int' }], returns: 'int' };
  const code = 'class Solution {\npublic:\n    int f(int n) { return n; }\n};';
  const p = browserBuild.buildProgram('cpp', sig, code);
  const lines = p.files[p.solutionFile].split('\n');
  assert.equal(lines[p.solutionLine - 1], 'class Solution {');
  const go = browserBuild.buildProgram('go', sig, 'func f(n int) int { return n }');
  assert.equal(go.solutionFile, 'solution.go');
  assert.equal(go.solutionLine, 3);
});

test('Harness.java uses the same case marks as output.js', () => {
  const src = javaSupport['Harness.java'];
  const javaLit = (s) => JSON.stringify(s).replace(/\\u001e/g, '\\u001e');
  assert.ok(src.includes(`CASE_MARK = ${javaLit(CASE_MARK)}`), 'CASE_MARK');
  assert.ok(src.includes(`RESULT_MARK = ${javaLit(RESULT_MARK)}`), 'RESULT_MARK');
});

test('splitOutput: results, per-case prints and per-case stderr', () => {
  const stdout = `${RESULT_MARK}[1]\nhello\n${RESULT_MARK}2\npartial${RESULT_MARK}"x"\nlast words\n`;
  const stderr = `JVM note\n${CASE_MARK}${CASE_MARK}dbg 2\n${CASE_MARK}${CASE_MARK}boom\n`;
  const out = splitOutput(stdout, stderr);
  assert.deepEqual(out.results, ['[1]', '2', '"x"']);
  assert.deepEqual(out.stdout, ['', 'hello', 'partial', 'last words']);
  assert.equal(out.startup, 'JVM note\n');
  assert.equal(out.started, 4);
  assert.equal(out.stderr[1], 'dbg 2\n');
  assert.equal(out.stderr[3], 'boom\n');
});

test('splitOutput: no output at all', () => {
  assert.deepEqual(splitOutput('', ''), { results: [], stdout: [], startup: '', stderr: [], started: 0 });
});
