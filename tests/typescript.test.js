// TypeScript in the browser (engine/typescript.js): user code is type-checked with LeetCode's
// compiler flags, then transpiled and run as JavaScript through the JavaScript adapter.
//
// The pure helpers are tested always. The checks that need the `typescript` devDependency (type-check
// every shipped TS solution with the browser's options and ambient types, then run the transpiled
// output through the JavaScript adapter on all 15 cases) follow VERIFY_LANGUAGES like
// tests/solutions.test.js, so they run in CI's TypeScript job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TS_COMPILER_OPTIONS, AMBIENT_TYPES, toModuleSource, fromModuleOutput, flattenMessage, compileErrors } from '../src/js/engine/typescript.js';
import { loadAllProblems } from '../src/js/problems/index.js';

const problems = await loadAllProblems();
import { buildSuite, judge, comparatorFor } from '../src/js/engine/harness.js';
import { isSql } from '../src/js/engine/sql.js';
import { TypeScriptRunner, TYPE_CHECK_NOTE, NO_COMPILER_MESSAGE } from '../src/js/engine/runners/ts-runner.js';

const ROOT = new URL('..', import.meta.url).pathname;
const ONLY = process.env.VERIFY_LANGUAGES ? new Set(process.env.VERIFY_LANGUAGES.split(',').map((l) => l.trim())) : null;
let ts = null;
try {
  ts = (await import('typescript')).default;
} catch {
  /* not installed: the compiler-backed checks skip */
}
// With REQUIRE_ALL_LANGUAGES=1 (CI) a missing compiler fails instead of skipping.
const missing = !ts && process.env.REQUIRE_ALL_LANGUAGES !== '1' && 'typescript devDependency not installed';
const skip = ONLY && !ONLY.has('typescript') ? 'VERIFY_LANGUAGES excludes typescript' : missing;

test('the module marker goes after the user code, so line numbers match the editor', () => {
  const code = 'function f(): number {\n  return 1; // trailing comment';
  const source = toModuleSource(code);
  // Nothing goes before the code, and the marker starts on its own line: a trailing // comment cannot swallow it.
  assert.equal(source, `${code}\nexport {};\n`);
  assert.equal(fromModuleOutput('function f() {\n    return 1; // trailing comment\n}\nexport {};\n'), 'function f() {\n    return 1; // trailing comment\n}\n');
  assert.throws(() => fromModuleOutput('function f() {}\n'), /module marker/);
});

test('compile errors use LeetCode\'s "Line L: Char C: error TSnnnn" format, errors only', () => {
  const source = 'let a = 1;\nlet b: number = "x";\n';
  const errors = compileErrors(source, [
    { start: source.indexOf('b:'), length: 1, code: 2322, category: 1, messageText: "Type 'string' is not assignable to type 'number'." },
    { start: 0, length: 3, code: 6133, category: 2, messageText: 'a suggestion, not an error' },
    { start: 0, length: 3, code: 9999, category: 0, messageText: 'a warning, not an error' },
  ]);
  assert.deepEqual(errors, ["Line 2: Char 5: error TS2322: Type 'string' is not assignable to type 'number'."]);
  // A diagnostic with no position (options-level) still reports, without a location.
  assert.deepEqual(compileErrors(source, [{ code: 5023, category: 1, messageText: 'Unknown option.' }]), ['error TS5023: Unknown option.']);
});

test('message chains flatten with indentation, as tsc prints them', () => {
  const chain = { messageText: 'outer', next: [{ messageText: 'middle', next: [{ messageText: 'inner' }] }] };
  assert.equal(flattenMessage(chain), 'outer\n  middle\n    inner');
  assert.equal(flattenMessage('plain'), 'plain');
});

test('compiler options follow LeetCode\'s TypeScript flags', () => {
  assert.equal(TS_COMPILER_OPTIONS.strict, false);
  assert.equal(TS_COMPILER_OPTIONS.alwaysStrict, true);
  assert.equal(TS_COMPILER_OPTIONS.strictBindCallApply, true);
  assert.equal(TS_COMPILER_OPTIONS.strictFunctionTypes, true);
});

/** Type-checks sources as modules next to the ambient types; returns formatted errors per file. */
function typeCheck(files) {
  const options = { ...TS_COMPILER_OPTIONS, noEmit: true, types: [] };
  const host = ts.createCompilerHost(options);
  const all = { 'lfb-globals.d.ts': AMBIENT_TYPES, ...files };
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, lang) => (name in all ? ts.createSourceFile(name, all[name], lang) : getSourceFile(name, lang));
  host.fileExists = ((exists) => (name) => name in all || exists(name))(host.fileExists.bind(host));
  const program = ts.createProgram(Object.keys(all), options, host);
  const out = {};
  for (const name of Object.keys(files)) {
    const sf = program.getSourceFile(name);
    out[name] = compileErrors(files[name], [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)]);
  }
  return out;
}

const tsProblems = () => problems.filter((p) => !isSql(p.signature));
const solutionOf = (p) => readFileSync(join(ROOT, 'src/js/problems', p.id, 'solutions/solution.ts'), 'utf8');

test('every TypeScript solution type-checks with the browser\'s options and ambient types', { skip }, () => {
  const files = Object.fromEntries(tsProblems().map((p) => [`${p.id}.ts`, toModuleSource(solutionOf(p))]));
  const failures = Object.entries(typeCheck(files)).filter(([, errs]) => errs.length);
  assert.deepEqual(failures, []);
});

test('a type error is reported at the user\'s own line, and an implicit any is not an error', { skip: missing }, () => {
  const code = 'function pairSum(nums: number[], target: number): number[] {\n  const x: number = "nope";\n  return [];\n}\n';
  const { 'a.ts': errs } = typeCheck({ 'a.ts': toModuleSource(code) });
  assert.equal(errs.length, 1);
  assert.match(errs[0], /^Line 2: Char 9: error TS2322: Type 'string' is not assignable to type 'number'\.$/);
  // LeetCode compiles with --strict false: an implicit any is fine.
  assert.deepEqual(typeCheck({ 'b.ts': toModuleSource('function f(a) { return a; }\n') })['b.ts'], []);
});

test('every transpiled TypeScript solution passes its 15 cases through the JavaScript adapter', { skip }, () => {
  for (const p of tsProblems()) {
    const out = ts.transpileModule(toModuleSource(solutionOf(p)), { compilerOptions: TS_COMPILER_OPTIONS });
    const js = fromModuleOutput(out.outputText);
    // Same construction as engine/workers/js-worker.js, with the adapter hydrate() gives TypeScript.
    const ad = p.adapters.typescript;
    const entry = p.signatures.typescript.entry;
    const fn = ad
      ? new Function(`${ad.before}${js}${ad.after}\nreturn ${ad.entry};`)()
      : new Function(`${js}\nreturn typeof ${entry} === 'function' ? ${entry} : undefined;`)();
    const suite = buildSuite(p);
    const raw = suite.map((c) => ({ id: c.id, state: 'ok', actual: fn(...structuredClone(c.args)) }));
    const res = judge(suite, raw, comparatorFor(p));
    assert.equal(res.verdict, 'Accepted', `${p.id}: ${res.passed}/15`);
  }
});

test('hydrate gives TypeScript the JavaScript adapter, since it runs as transpiled JavaScript', () => {
  for (const p of tsProblems()) assert.deepEqual(p.adapters.typescript, p.adapters.javascript, p.id);
});

/* ---------- TypeScriptRunner with a fake compiler and a fake JavaScript runner ---------- */

function fakeJs() {
  return {
    calls: [],
    cancels: 0,
    async run(job) {
      this.calls.push({ kind: 'run', code: job.code });
      return job.cases.map((c) => ({ id: c.id, state: 'ok', actual: 1 }));
    },
    async measureGrowth(job) {
      this.calls.push({ kind: 'growth', code: job.code });
      return { samples: [{ n: 1, ms: 1 }] };
    },
    cancelGrowth() {
      this.cancels++;
    },
  };
}
const cases = [
  { id: 1, args: [] },
  { id: 2, args: [] },
];

test('runner: clean code runs its transpiled JavaScript, and Submit then growth compile once', async () => {
  const js = fakeJs();
  let compiles = 0;
  const compiler = async (code) => {
    compiles++;
    return { errors: [], js: `/*js*/${code}` };
  };
  const runner = new TypeScriptRunner({ js, loadCompiler: async () => compiler });
  const raw = await runner.run({ code: 'let a: number = 1;', cases });
  assert.deepEqual(raw.map((r) => r.state), ['ok', 'ok']);
  await runner.measureGrowth({ code: 'let a: number = 1;' });
  assert.deepEqual(js.calls, [
    { kind: 'run', code: '/*js*/let a: number = 1;' },
    { kind: 'growth', code: '/*js*/let a: number = 1;' },
  ]);
  assert.equal(compiles, 1);
});

test('runner: a type error is a compile-error on every case, with the policy note, and nothing runs', async () => {
  const js = fakeJs();
  const runner = new TypeScriptRunner({ js, loadCompiler: async () => async () => ({ errors: ['Line 2: Char 9: error TS2322: x'] }) });
  const raw = await runner.run({ code: 'x', cases });
  assert.deepEqual(raw.map((r) => r.state), ['compile-error', 'compile-error']);
  assert.ok(raw[0].error.startsWith('Line 2: Char 9: error TS2322: x'));
  assert.ok(raw[0].error.endsWith(TYPE_CHECK_NOTE));
  assert.equal(js.calls.length, 0);
  assert.equal((await runner.measureGrowth({ code: 'x' })).error, 'Line 2: Char 9: error TS2322: x');
});

test('runner: without a compiler (no Monaco) every case is unsupported with an honest message', async () => {
  const runner = new TypeScriptRunner({ js: fakeJs(), loadCompiler: async () => null });
  const raw = await runner.run({ code: 'x', cases });
  assert.deepEqual(raw.map((r) => [r.state, r.error]), [
    ['unsupported', NO_COMPILER_MESSAGE],
    ['unsupported', NO_COMPILER_MESSAGE],
  ]);
  // A loader that throws is the same as no compiler: no crash, no rejected promise.
  const broken = new TypeScriptRunner({ js: fakeJs(), loadCompiler: () => Promise.reject(new Error('no')) });
  await broken.warmUp();
  assert.equal((await broken.run({ code: 'x', cases }))[0].state, 'unsupported');
});

test('runner: a compiler crash is a runtime error per case, not an exception', async () => {
  const runner = new TypeScriptRunner({
    js: fakeJs(),
    loadCompiler: async () => async () => {
      throw new Error('worker died');
    },
  });
  const raw = await runner.run({ code: 'x', cases });
  assert.deepEqual(raw.map((r) => r.state), ['error', 'error']);
  assert.match(raw[0].error, /worker died/);
});

test('runner: a growth cancel that arrives while compiling stops the measurement', async () => {
  const js = fakeJs();
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const compiler = async () => {
    await gate;
    return { errors: [], js: 'x' };
  };
  const runner = new TypeScriptRunner({ js, loadCompiler: async () => compiler });
  const pending = runner.measureGrowth({ code: 'x' });
  runner.cancelGrowth();
  release();
  assert.deepEqual(await pending, { samples: [], cancelled: true });
  assert.equal(js.calls.length, 0);
  assert.equal(js.cancels, 1);
});
