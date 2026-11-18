// Remote runner (docs/adr/0005-remote-runner.md): request shape, verdict mapping, failures.
// The network is a fake fetch; nothing here needs a server.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { RemoteRunner, mapResponse, mapCompilerMessage, REMOTE_LANGUAGES } from '../src/js/engine/runners/remote-runner.js';
import { buildProgram, programStdin } from '../src/js/engine/programs/build.js';
import { RESULT_MARK, CASE_MARK } from '../src/js/engine/programs/output.js';
import { remoteRunnerConfig, REMOTE_RUNNER } from '../src/js/config.js';
import { buildSuite, judge } from '../src/js/engine/harness.js';
import { availableProblems } from '../src/js/problems/index.js';

const sig = { name: 'twice', params: [{ name: 'n', type: 'int' }], returns: 'int' };
const cases = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, args: [i] }));
const loadText = (url) => readFile(new URL(url), 'utf8');
const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const runOutput = (values, { prints = {} } = {}) => ({
  stdout: values.map((v, i) => `${prints[i] ?? ''}${RESULT_MARK}${JSON.stringify(v)}\n`).join(''),
  stderr: CASE_MARK.repeat(values.length),
  code: 0,
  signal: null,
  status: null,
});

/** A runner whose fetch records the request and answers with `answer(request)`. */
function fakeRunner(language, answer, opts = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return answer({ url, init });
  };
  return { runner: new RemoteRunner({ language, url: 'https://runner.example/', fetchImpl, loadText, ...opts }), calls };
}

const bodyOf = (init) => JSON.parse(init.headers['Content-Encoding'] === 'gzip' ? gunzipSync(init.body).toString('utf8') : init.body);

test('config: the file sets the runner; a window override replaces it, and empty turns it off', () => {
  // The file points at the live Worker; it must be an https URL (no secrets, invariant 10).
  assert.match(remoteRunnerConfig({}).url, /^https:\/\/[a-z0-9.-]+$/);
  assert.equal(remoteRunnerConfig({}).url, REMOTE_RUNNER.url.replace(/\/+$/, ''));
  assert.equal(remoteRunnerConfig({ LFB_REMOTE_RUNNER_URL: ' https://w.example/// ' }).url, 'https://w.example');
  // The smoke test relies on this to stay off the live runner.
  assert.equal(remoteRunnerConfig({ LFB_REMOTE_RUNNER_URL: '' }).url, '');
});

test('request: path per language, gzip JSON body with files, stdin and args, never expected values', async () => {
  const problem = availableProblems().find((p) => p.id === 'pair-sum-target');
  const suite = buildSuite(problem);
  const { runner, calls } = fakeRunner('go', () => ok({ compile: { code: 0, stdout: '', stderr: '' }, run: runOutput(suite.map((t) => t.expected)) }));
  const raw = await runner.run({ code: problem.starterCode.go, signature: problem.signature, cases: suite.map(({ id, args }) => ({ id, args })), timeLimitMs: problem.timeLimitMs });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://runner.example/v1/execute/go');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Encoding'], 'gzip');
  const body = bodyOf(calls[0].init);
  assert.deepEqual(Object.keys(body).sort(), ['args', 'files', 'stdin', 'timeLimitMs']);
  assert.deepEqual(body.files.map((f) => f.name), ['solution.go', 'harness.go']);
  // Invariant 2: stdin is built from the args alone, and no other field carries case data.
  const program = buildProgram('go', problem.signature, problem.starterCode.go);
  assert.equal(body.stdin, programStdin(program, suite.map((t) => t.args), problem.signature));
  assert.doesNotMatch(JSON.stringify(body), /expected/);
  assert.equal(judge(suite, raw).verdict, 'Accepted');
});

test('request: plain JSON when compression is off; Java sends its support files and entry name', async () => {
  const { runner, calls } = fakeRunner('java', () => ok({ compile: { code: 0 }, run: runOutput(cases.map((c) => c.args[0] * 2)) }), { compress: false });
  await runner.run({ code: 'class Solution { int twice(int n) { return 2 * n; } }', signature: sig, cases, timeLimitMs: 1000 });
  const body = bodyOf(calls[0].init);
  assert.equal(calls[0].init.headers['Content-Encoding'], undefined);
  assert.deepEqual(body.files.map((f) => f.name), ['Solution.java', 'Harness.java', 'ListNode.java', 'TreeNode.java', 'RandomListNode.java', 'NestedInteger.java']);
  assert.deepEqual(body.args, ['twice']);
  assert.deepEqual(JSON.parse(body.stdin), cases.map((c) => c.args));
});

test('Turnstile token goes in a header when a provider is configured', async () => {
  const { runner, calls } = fakeRunner('c', () => ok({ compile: { code: 0 }, run: runOutput(cases.map(() => 0)) }), { getToken: async () => 'tok-1' });
  await runner.run({ code: 'int twice(int n) { return 0; }', signature: sig, cases, timeLimitMs: 1000 });
  assert.equal(calls[0].init.headers['CF-Turnstile-Response'], 'tok-1');
});

const program = buildProgram('cpp', sig, 'class Solution {\npublic:\n    int twice(int n) { return n * 2 }\n};');

test('mapResponse: compile error on every case, pointed at the user file and line', () => {
  const line = program.solutionLine + 2;
  const raw = mapResponse({ compile: { code: 1, stderr: `/box/submission/main.cpp:${line}:38: error: expected ';' before '}' token\n` } }, cases, program);
  assert.equal(raw.length, 15);
  assert.ok(raw.every((r) => r.state === 'error' && r.error.startsWith('Compile error:')));
  assert.match(raw[0].error, /solution\.cpp:3:38: error: expected ';'/);
  assert.doesNotMatch(raw[0].error, /box\/submission/);
});

test('mapResponse: all finished cases are ok, with the user prints of each case', () => {
  const run = runOutput(cases.map((c) => c.args[0] * 2), { prints: { 1: 'debug two\n' } });
  const raw = mapResponse({ compile: { code: 0 }, run }, cases, program);
  assert.ok(raw.every((r) => r.state === 'ok'));
  assert.equal(raw[3].actual, 6);
  assert.equal(raw[1].stdout, 'debug two');
  assert.equal(raw[0].stdout, undefined);
});

test('mapResponse: a timeout names the case that was running; later cases were not run', () => {
  const done = runOutput([0, 2, 4]);
  const run = { ...done, stderr: CASE_MARK.repeat(4), status: 'TO', signal: 'SIGKILL', message: 'Time limit exceeded (wall clock)', wall_time: 5000 };
  const raw = mapResponse({ run }, cases, program);
  assert.deepEqual(raw.slice(0, 5).map((r) => r.state), ['ok', 'ok', 'ok', 'timeout', 'skipped']);
  assert.equal(raw[3].timeMs, 5000);
  const result = judge(buildCasesSuite(), raw);
  assert.equal(result.verdict, 'Time Limit Exceeded');
});

test('mapResponse: a crash reports that case\'s stderr (the stack trace), trimmed', () => {
  const trace = Array.from({ length: 60 }, (_, i) => `\tat Solution.f(Solution.java:${i})`).join('\n');
  const run = { stdout: `${RESULT_MARK}0\n`, stderr: `${CASE_MARK}${CASE_MARK}java.lang.ArithmeticException: / by zero\n${trace}\n`, code: 1, signal: null, status: 'RE' };
  const raw = mapResponse({ run }, cases, program);
  assert.equal(raw[0].state, 'ok');
  assert.equal(raw[1].state, 'error');
  assert.match(raw[1].error, /Solution\.java:59/);
  assert.ok(raw[1].error.split('\n').length <= 26);
  assert.equal(raw[2].state, 'skipped');
});

test('mapResponse: signals, memory limit and output limit get plain explanations', () => {
  const at0 = (run) => mapResponse({ run: { stdout: '', stderr: CASE_MARK, code: null, ...run } }, cases, program)[0].error;
  assert.match(at0({ signal: 'SIGSEGV', status: 'SG' }), /Segmentation fault/);
  assert.match(at0({ signal: 'SIGKILL', status: 'SG', memory: 1_499_000_000, memoryLimit: 1_500_000_000 }), /Memory limit exceeded \(1500 MB\)/);
  assert.match(at0({ status: 'OL', signal: 'SIGKILL' }), /Output limit exceeded/);
  assert.match(at0({ code: 3, status: 'RE' }), /Exited with code 3/);
});

test('mapResponse: a result line that is not JSON points the user at stderr', () => {
  const run = { stdout: `${RESULT_MARK}oops not json\n`, stderr: CASE_MARK, code: 0 };
  const raw = mapResponse({ run }, cases.slice(0, 1), program);
  assert.equal(raw[0].state, 'error');
  assert.match(raw[0].error, /stderr/);
});

test('mapCompilerMessage: C# errors once each, without project noise', () => {
  const cs = buildProgram('csharp', sig, 'public class Solution { public int Twice(int n) { return n * 2 } }');
  const err = '/box/submission/Solution.cs(1,63): error CS1002: ; expected [/box/submission/Harness.csproj]';
  const text = mapCompilerMessage(`${err}\n\nBuild FAILED.\n\n${err}\n    0 Warning(s)\n    1 Error(s)\n`, cs);
  assert.equal(text, 'Solution.cs(1,63): error CS1002: ; expected');
});

test('no verdict: unreachable, rate limited, busy, refused, too slow', async () => {
  const run = (answer, opts) => fakeRunner('go', answer, opts).runner.run({ code: 'func twice(n int) int { return n }', signature: sig, cases, timeLimitMs: 1000 });
  await assert.rejects(run(() => Promise.reject(new TypeError('fetch failed'))), { name: 'RemoteUnavailableError', message: /unreachable/ });
  await assert.rejects(run(() => new Response('{"error":"Too many requests"}', { status: 429 })), { remote: true, message: /Too many runs/ });
  await assert.rejects(run(() => new Response('{"error":"Busy"}', { status: 503 })), { message: /busy or offline/ });
  await assert.rejects(run(() => new Response('{"error":"Origin not allowed"}', { status: 403 })), { message: /refused this site/ });
  const never = ({ init }) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  await assert.rejects(run(never, { totalTimeoutMs: 50 }), { message: /did not answer in time/ });
});

test('cancel() abandons the request; a busy runner refuses a second run', async () => {
  const { runner } = fakeRunner('cpp', ({ init }) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))));
  const pending = runner.run({ code: 'int x;', signature: sig, cases, timeLimitMs: 1000 });
  await new Promise((r) => setTimeout(r, 10));
  await assert.rejects(runner.run({ code: 'int x;', signature: sig, cases, timeLimitMs: 1000 }), /already in progress/);
  runner.cancel();
  await assert.rejects(pending, { message: 'Cancelled.' });
  assert.equal(runner.busy, false);
});

test('every remote language is a native program language', () => {
  for (const l of REMOTE_LANGUAGES) assert.doesNotThrow(() => new RemoteRunner({ language: l, url: 'https://x' }));
  assert.throws(() => new RemoteRunner({ language: 'python', url: 'https://x' }));
});

function buildCasesSuite() {
  return cases.map((c) => ({ ...c, visible: c.id <= 5, custom: false, expected: c.args[0] * 2 }));
}
