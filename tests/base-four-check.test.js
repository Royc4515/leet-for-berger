import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/base-four-check/problem.js';

// Brute force: list every power of four that fits in 32 bits and look the value up.
const POWERS = new Set(Array.from({ length: 16 }, (_, k) => 4 ** k));
const brute = (n) => POWERS.has(n);

// Classic wrong answers.
const powerOfTwoOnly = (n) => n > 0 && (n & (n - 1)) === 0;
const divisibleByFour = (n) => n > 0 && n % 4 === 0;
const oddPositionMask = (n) => n > 0 && (n & (n - 1)) === 0 && (n & 0xaaaaaaaa) !== 0;
const absoluteValue = (n) => {
  const a = Math.abs(n);
  return a > 0 && (a & (a - 1)) === 0 && (a & 0x55555555) !== 0;
};

test('there are exactly 16 powers of four in a signed 32-bit int', () => {
  assert.equal([...POWERS].filter((p) => p <= 2147483647).length, 16);
});

test('reference matches brute force on every power of four, its neighbors and 4000 seeded values', () => {
  for (let k = 0; k <= 15; k++) {
    for (const n of [4 ** k - 1, 4 ** k, 4 ** k + 1, 2 * 4 ** k, -(4 ** k)]) {
      if (n < -2147483648 || n > 2147483647) continue;
      assert.equal(reference(n), brute(n), String(n));
    }
  }
  const rnd = mulberry32(342);
  for (let i = 0; i < 4000; i++) {
    const n = Math.floor(rnd() * 4294967296) - 2147483648;
    assert.equal(reference(n), brute(n), String(n));
  }
  // Every n up to 70000, which covers the first nine powers and all their near misses.
  for (let n = -5; n <= 70000; n++) assert.equal(reference(n), brute(n), String(n));
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
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [powerOfTwoOnly, divisibleByFour, oddPositionMask, absoluteValue]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects out-of-range and malformed values', () => {
  assert.deepEqual(problem.parseCustomInput(' 16 ').args, [16]);
  assert.deepEqual(problem.parseCustomInput('-2147483648').args, [-2147483648]);
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-2147483649').ok, false);
  assert.equal(problem.parseCustomInput('3.5').ok, false);
  assert.equal(problem.parseCustomInput('abc').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
