import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/two-power-check/problem.js';

// Brute force: list every power of two that fits in a signed 32-bit int and look the value up.
const POWERS = new Set(Array.from({ length: 31 }, (_, k) => 2 ** k));
const brute = (n) => POWERS.has(n);

// Classic wrong answers.
const noSignCheck = (n) => (n & (n - 1)) === 0;
const isEven = (n) => n !== 0 && n % 2 === 0;
const absoluteValue = (n) => {
  const a = Math.abs(n);
  return a > 0 && (a & (a - 1)) === 0;
};

test('there are exactly 31 powers of two in a signed 32-bit int', () => {
  assert.equal([...POWERS].filter((p) => p <= 2147483647).length, 31);
});

test('reference matches brute force on every power of two, its neighbours and 4000 seeded values', () => {
  for (let k = 0; k <= 30; k++) {
    for (const n of [2 ** k - 1, 2 ** k, 2 ** k + 1, 3 * 2 ** k, -(2 ** k)]) {
      if (n < -2147483648 || n > 2147483647) continue;
      assert.equal(reference(n), brute(n), String(n));
    }
  }
  const rnd = mulberry32(231);
  for (let i = 0; i < 4000; i++) {
    const n = Math.floor(rnd() * 4294967296) - 2147483648;
    assert.equal(reference(n), brute(n), String(n));
  }
  for (let n = -70000; n <= 70000; n++) assert.equal(reference(n), brute(n), String(n));
  assert.equal(reference(-2147483648), false);
});

test('visible expectations agree; 15 valid cases; both 32-bit extremes appear', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  }
  const hiddenArgs = problem.hiddenTests.map((t) => t.args[0]);
  assert.ok(hiddenArgs.includes(-2147483648) && hiddenArgs.includes(2147483647));
  assert.ok(problem.hiddenTests.some((t) => t.expected === true) && problem.hiddenTests.some((t) => t.expected === false));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [noSignCheck, isEven, absoluteValue]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects out-of-range and malformed values', () => {
  assert.deepEqual(problem.parseCustomInput(' 16 ').args, [16]);
  assert.deepEqual(problem.parseCustomInput('-2147483648').args, [-2147483648]);
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-2147483649').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
