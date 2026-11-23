import { test } from 'node:test';
import assert from 'node:assert/strict';
import problem, { reference } from '../src/js/problems/bit-tally/problem.js';

// Brute force: count the bits of every number one at a time.
const popcount = (v) => {
  let c = 0;
  for (let x = v; x > 0; x >>= 1) c += x & 1;
  return c;
};
const brute = (n) => Array.from({ length: n + 1 }, (_, i) => popcount(i));

// Classic wrong answers.
const lengthN = (n) => reference(n).slice(0, n);
const countUp = (n) => Array.from({ length: n + 1 }, (_, i) => i);
const startsAtOne = (n) => reference(n).map((v, i) => (i === 0 ? 1 : v));

test('reference matches brute force for every n up to 2000 and at the limit', () => {
  for (let n = 0; n <= 2000; n++) assert.deepEqual(reference(n), brute(n));
  assert.deepEqual(reference(100000), brute(100000));
});

test('visible expectations agree; 15 valid cases; the limit appears', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(brute(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 100000));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [lengthN, countUp, startsAtOne]) {
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces the range', () => {
  assert.deepEqual(problem.parseCustomInput(' 5 ').args, [5]);
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('100001').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
