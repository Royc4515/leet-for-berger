import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/fizz-buzz-list/problem.js';

// Brute force: the same labels from an explicit four-way branch, with the combined case first.
function brute(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) out.push('FizzBuzz');
    else if (i % 3 === 0) out.push('Fizz');
    else if (i % 5 === 0) out.push('Buzz');
    else out.push(`${i}`);
  }
  return out;
}

// Classic wrong answers.
function checksThreeFirst(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (i % 3 === 0) out.push('Fizz');
    else if (i % 5 === 0) out.push('Buzz');
    else if (i % 15 === 0) out.push('FizzBuzz');
    else out.push(String(i));
  }
  return out;
}
// Counts from 0: a leading FizzBuzz, then the labels shifted by one place.
const startsAtZero = (n) => ['FizzBuzz', ...brute(n - 1)];
const stopsEarly = (n) => brute(n - 1);
const numbersNotStrings = (n) => brute(n).map((label) => (/^\d+$/.test(label) ? Number(label) : label));

test('reference matches brute force for every n up to 400 and 600 seeded larger n', () => {
  for (let n = 1; n <= 400; n++) assert.deepEqual(reference(n), brute(n), String(n));
  const rnd = mulberry32(412);
  for (let i = 0; i < 600; i++) {
    const n = 401 + Math.floor(rnd() * 99600);
    assert.deepEqual(reference(n), brute(n), String(n));
  }
});

test('labels follow the rules at the boundaries', () => {
  const out = reference(100000);
  assert.equal(out.length, 100000);
  assert.equal(out[14], 'FizzBuzz');
  assert.equal(out[99999], 'Buzz');
  assert.equal(out[99998], 'Fizz'); // 99999 = 3 * 33333
  assert.ok(out.every((label) => typeof label === 'string'));
});

test('visible expectations agree; 15 valid cases; two arrays at 10^5 entries or just under', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
    assert.equal(t.expected.length, t.args[0]);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 99991).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const differs = (wrong, t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected);
  for (const wrong of [checksThreeFirst, startsAtZero, stopsEarly, numbersNotStrings]) {
    assert.ok(suite.some((t) => differs(wrong, t)), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => differs(wrong, t)), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects out-of-range and malformed values', () => {
  assert.deepEqual(problem.parseCustomInput(' 15 ').args, [15]);
  assert.equal(problem.parseCustomInput('0').ok, false);
  assert.equal(problem.parseCustomInput('100001').ok, false);
  assert.equal(problem.parseCustomInput('-3').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
  assert.equal(problem.parseCustomInput('abc').ok, false);
});
