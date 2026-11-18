import { test } from 'node:test';
import assert from 'node:assert/strict';

import problem, { reference } from '../src/js/problems/smallest-base-segment/problem.js';
import { buildSuite, judge, TOTAL_COUNT, preview } from '../src/js/engine/harness.js';
import { mulberry32 } from '../src/js/engine/rng.js';

// O(n * d(n)) brute force: independent of KMP, so it can catch a broken reference.
function brute(s) {
  const n = s.length;
  for (let len = 1; len <= n; len++) {
    if (n % len === 0 && s.slice(0, len).repeat(n / len) === s) return s.slice(0, len);
  }
  return s;
}

test('reference matches brute force on 2000 random strings', () => {
  const rnd = mulberry32(123);
  for (let i = 0; i < 2000; i++) {
    const base = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => 'ab'[Math.floor(rnd() * 2)]).join('');
    let s = base.repeat(1 + Math.floor(rnd() * 5));
    if (rnd() < 0.3) s += 'a'; // break periodicity sometimes
    assert.equal(reference(s), brute(s), `input ${s}`);
  }
});

test('authored visible expectations agree with the reference', () => {
  for (const t of problem.visibleTests) assert.equal(reference(t.args[0]), t.expected);
});

test('suite always has exactly 15 cases: 5 visible + 10 hidden', () => {
  const suite = buildSuite(problem);
  assert.equal(suite.length, TOTAL_COUNT);
  assert.equal(suite.filter((c) => c.visible).length, 5);
  assert.deepEqual(suite.map((c) => c.id), Array.from({ length: 15 }, (_, i) => i + 1));
});

test('custom input takes slot 1 and keeps the total at 15', () => {
  const suite = buildSuite(problem, { customArgs: ['xyxy'] });
  assert.equal(suite.length, 15);
  assert.equal(suite[0].custom, true);
  assert.equal(suite[0].expected, 'xy');
  assert.equal(suite.filter((c) => c.visible).length, 5);
});

test('judge redacts hidden inputs and expectations', () => {
  const suite = buildSuite(problem);
  const raw = suite.map((c) => ({ id: c.id, state: 'ok', actual: c.expected }));
  const res = judge(suite, raw);
  assert.equal(res.accepted, true);
  assert.equal(res.verdict, 'Accepted');
  const hidden = res.cases.filter((c) => !c.visible);
  assert.ok(hidden.every((c) => !('args' in c) && !('expected' in c) && !('actual' in c)));
});

test('judge verdicts: wrong answer, timeout, runtime error', () => {
  const suite = buildSuite(problem);
  const ok = (c) => ({ id: c.id, state: 'ok', actual: c.expected });
  assert.equal(judge(suite, suite.map((c) => (c.id === 3 ? { ...ok(c), actual: 'nope' } : ok(c)))).verdict, 'Wrong Answer');
  assert.equal(judge(suite, suite.map((c) => (c.id === 12 ? { id: c.id, state: 'timeout' } : ok(c)))).verdict, 'Time Limit Exceeded');
  assert.equal(judge(suite, suite.map((c) => (c.id === 1 ? { id: 1, state: 'error', error: 'x' } : ok(c)))).verdict, 'Runtime Error');
});

test('judge: a compile error on every case is a Compile Error, and hidden cases still hide the message', () => {
  const suite = buildSuite(problem);
  const res = judge(suite, suite.map((c) => ({ id: c.id, state: 'compile-error', error: 'Line 1: Char 1: error TS2322: nope' })));
  assert.equal(res.verdict, 'Compile Error');
  assert.equal(res.passed, 0);
  assert.ok(res.cases.every((c) => c.status === 'compile-error'));
  assert.match(res.cases.find((c) => c.visible).error, /TS2322/);
  assert.ok(res.cases.filter((c) => !c.visible).every((c) => !('error' in c)));
});

test('custom input parser accepts JSON and bare text, rejects bad input', () => {
  assert.deepEqual(problem.parseCustomInput('"abab"'), { ok: true, args: ['abab'] });
  assert.deepEqual(problem.parseCustomInput('  abab \n'), { ok: true, args: ['abab'] });
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('ABC').ok, false);
  assert.equal(problem.parseCustomInput('"abc').ok, false);
});

test('hidden tests are deterministic across module loads', async () => {
  const again = await import('../src/js/problems/smallest-base-segment/problem.js?reload=1');
  assert.deepEqual(again.default.hiddenTests, problem.hiddenTests);
});

test('preview truncates huge values', () => {
  const p = preview('a'.repeat(100000));
  assert.ok(p.length < 220 && p.includes('100002 chars'));
});
