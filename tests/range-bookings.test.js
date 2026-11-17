import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/range-bookings/problem.js';

// Brute force: add each booking seat by seat. Independent of the reference.
function brute(bookings, n) {
  const out = Array(n).fill(0);
  for (const [first, last, seats] of bookings) for (let f = first; f <= last; f++) out[f - 1] += seats;
  return out;
}

const toRaw = (bookings, n) => `${JSON.stringify(bookings)}\n${n}`;

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(5);
  const pick = (k) => Math.floor(rnd() * k);
  for (let t = 0; t < 2000; t++) {
    const n = 1 + pick(12);
    const bookings = Array.from({ length: 1 + pick(8) }, () => {
      const a = 1 + pick(n);
      const b = 1 + pick(n);
      return [Math.min(a, b), Math.max(a, b), 1 + pick(20)];
    });
    assert.deepEqual(reference(bookings, n), brute(bookings, n));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(toRaw(...t.args)).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1] === 100000).length >= 2);
  assert.ok(problem.hiddenTests.every((t) => t.expected.every((v) => v <= 2147483647)));
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[[1,2,10]]').ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[0, 2, 10]], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[3, 2, 10]], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[1, 4, 10]], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[1, 2, 0]], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[1, 2]], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([], 3)).ok, false);
  assert.equal(problem.parseCustomInput(toRaw([[1, 3, 10000]], 3)).ok, true);
});
