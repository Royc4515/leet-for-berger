import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/prime-count/problem.js';

// Brute force: trial division of every candidate.
function isPrime(k) {
  if (k < 2) return false;
  for (let d = 2; d * d <= k; d++) if (k % d === 0) return false;
  return true;
}
function brute(n) {
  let count = 0;
  for (let k = 2; k < n; k++) if (isPrime(k)) count++;
  return count;
}

test('reference matches trial division on 1500 random n and every n up to 600', () => {
  for (let n = 0; n <= 600; n++) assert.equal(reference(n), brute(n), String(n));
  const rnd = mulberry32(72);
  for (let i = 0; i < 1500; i++) {
    const n = Math.floor(rnd() * 5000);
    assert.equal(reference(n), brute(n), String(n));
  }
});

test('known prime counts', () => {
  // pi(10^6) = 78498 and pi(5 * 10^6) = 348513 are published values.
  assert.equal(reference(1000000), 78498);
  assert.equal(reference(5000000), 348513);
  assert.equal(reference(7920), 1000);
});

test('visible expectations agree; hidden tests hit the bounds; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 4999000).length >= 2);
  // n prime itself must not be counted: 5 and 4999963 are prime.
  assert.ok(isPrime(5) && isPrime(4999963));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput(' 10 '), { ok: true, args: [10] });
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('5000001').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
