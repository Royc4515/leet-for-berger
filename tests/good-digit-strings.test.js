import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/good-digit-strings/problem.js';

const MOD = 1000000007n;

// Brute force for small n: enumerate every digit string and test the rule.
function enumerate(n) {
  let count = 0;
  for (let v = 0; v < 10 ** n; v++) {
    const s = String(v).padStart(n, '0');
    if ([...s].every((ch, i) => (i % 2 === 0 ? '02468' : '2357').includes(ch))) count++;
  }
  return count;
}

// Brute force for medium n: multiply position by position.
function multiply(n) {
  let r = 1n;
  for (let i = 0; i < n; i++) r = (r * (i % 2 === 0 ? 5n : 4n)) % MOD;
  return Number(r);
}

test('reference matches enumeration for n <= 6 and position-by-position products for 1000 n', () => {
  for (let n = 1; n <= 6; n++) assert.equal(reference(n), enumerate(n), `n = ${n}`);
  const rnd = mulberry32(240);
  for (let k = 0; k < 1000; k++) {
    const n = 1 + Math.floor(rnd() * 3000);
    assert.equal(reference(n), multiply(n), `n = ${n}`);
  }
});

test('reference agrees with Fermat on huge n', () => {
  // 5^(p-1) = 4^(p-1) = 1 mod p, so exponents reduce modulo p - 1 = 1000000006: for
  // n = 2k(p - 1) + r (even multiple, so the split into halves is unchanged), the answer equals that of r.
  const rnd = mulberry32(241);
  for (let k = 0; k < 200; k++) {
    const r = 1 + Math.floor(rnd() * 500);
    const n = 2 * Math.floor(rnd() * 400000) * 1000000006 + r;
    assert.equal(reference(n), multiply(r), `n = ${n}`);
  }
});

test('visible expectations agree; huge n is tested; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 1e14).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0] > 2 ** 32 && t.args[0] < 2 ** 33));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('50'), { ok: true, args: [50] });
  assert.deepEqual(problem.parseCustomInput('1000000000000000'), { ok: true, args: [1e15] });
  assert.equal(problem.parseCustomInput('1000000000000001').ok, false);
  assert.equal(problem.parseCustomInput('0').ok, false);
  assert.equal(problem.parseCustomInput('-3').ok, false);
  assert.equal(problem.parseCustomInput('2.5').ok, false);
});
