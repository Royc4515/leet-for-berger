import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/stair-paths/problem.js';

const MOD = 1000000007n;

// Brute force 1: enumerate every climb literally (exponential, small n only).
function enumerate(n) {
  if (n < 0) return 0;
  if (n === 0) return 1;
  return enumerate(n - 1) + enumerate(n - 2);
}

// Brute force 2: the exact count as a BigInt, reduced only at the end. Independent of the
// reference's step-by-step reduction.
const exact = [1n, 1n];
for (let i = 2; i <= 3000; i++) exact.push(exact[i - 1] + exact[i - 2]);

test('reference matches literal enumeration for n <= 22', () => {
  for (let n = 1; n <= 22; n++) assert.equal(reference(n), enumerate(n));
});

test('reference matches exact BigInt counts on 1500 seeded n up to 3000', () => {
  const rnd = mulberry32(113);
  for (let t = 0; t < 1500; t++) {
    const n = 1 + Math.floor(rnd() * 3000);
    assert.equal(reference(n), Number(exact[n] % MOD));
  }
});

test('visible expectations agree; two max-size cases; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 999999).length >= 2);
  // n = 46 is the first count past 2^31 - 1 when unreduced; it must be in the hidden set.
  assert.ok(problem.hiddenTests.some((t) => t.args[0] === 46));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('0').ok, false);
  assert.equal(problem.parseCustomInput('1000001').ok, false);
  assert.equal(problem.parseCustomInput('-3').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
  assert.deepEqual(problem.parseCustomInput('45').args, [45]);
});
