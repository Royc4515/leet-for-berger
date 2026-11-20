import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/digit-flip/problem.js';

// Brute force with exact big integers: reverse the decimal string of |x|, restore the sign, range-check.
function brute(x) {
  const digits = (x < 0 ? -BigInt(x) : BigInt(x)).toString();
  let flipped = BigInt([...digits].reverse().join(''));
  if (x < 0) flipped = -flipped;
  return flipped < -(2n ** 31n) || flipped > 2n ** 31n - 1n ? 0 : Number(flipped);
}

test('reference matches brute force on 5000 seeded values of every digit count, both signs', () => {
  const rnd = mulberry32(7);
  let overflow = 0;
  for (let i = 0; i < 5000; i++) {
    const digits = 1 + Math.floor(rnd() * 10);
    // Ten-digit values only exist up to 2^31 - 1, so draw those from their own range.
    let x = digits === 10 ? 10 ** 9 + Math.floor(rnd() * (2 ** 31 - 10 ** 9)) : Math.floor(rnd() * 10 ** digits);
    if (rnd() < 0.5) x = -x;
    const want = brute(x);
    if (want === 0 && x !== 0) overflow++;
    assert.equal(reference(x), want, String(x));
    assert.ok(!Object.is(reference(x), -0));
  }
  assert.ok(overflow > 100, `${overflow} overflowing inputs`);
});

test('5 visible and 10 hidden cases, expectations agree, extremes and boundary values', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected);
  }
  const xs = problem.hiddenTests.map((t) => t.args[0]);
  assert.ok(xs.includes(2147483647) && xs.includes(-2147483648), 'both extremes');
  // Answers on both sides of the limit, for both signs.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 2147483641));
  assert.ok(problem.hiddenTests.some((t) => t.expected === -2147483641));
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 1563847412 && t.expected === 0));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // No range check at all: returns a value that is not a 32-bit integer.
  const noCheck = (x) => Number([...String(Math.abs(x))].reverse().join('')) * Math.sign(x);
  // Checks only the positive limit.
  const positiveOnly = (x) => {
    const r = noCheck(x);
    return r > 2 ** 31 - 1 ? 0 : r;
  };
  // Loses the sign.
  const dropsSign = (x) => reference(Math.abs(x));
  for (const [name, wrong] of [['no range check', noCheck], ['positive limit only', positiveOnly], ['drops the sign', dropsSign]]) {
    assert.ok(all.some((t) => Object.is(wrong(...t.args) || 0, t.expected) === false), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput(' -123 '), { ok: true, args: [-123] });
  assert.equal(problem.parseCustomInput('2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-2147483649').ok, false);
  assert.equal(problem.parseCustomInput('1.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
  assert.equal(problem.parseCustomInput('abc').ok, false);
  assert.equal(problem.solveReference([1534236469]), 0);
});
