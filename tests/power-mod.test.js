import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/power-mod/problem.js';

const MOD = 1000000007n;

// Brute force: multiply n times.
function brute(x, n) {
  let r = 1n;
  for (let i = 0; i < n; i++) r = (r * BigInt(x)) % MOD;
  return Number(r);
}

test('reference matches repeated multiplication on 2000 random small cases', () => {
  const rnd = mulberry32(81);
  for (let i = 0; i < 2000; i++) {
    const x = i % 3 ? Math.floor(rnd() * 1000000001) : Math.floor(rnd() * 5);
    const n = Math.floor(rnd() * 300);
    assert.equal(reference(x, n), brute(x, n), `${x}^${n}`);
  }
});

test('reference agrees with number theory on huge exponents', () => {
  // Fermat: x^(p-1) = 1 mod p for x not divisible by p, so exponents can be reduced mod p - 1.
  const rnd = mulberry32(82);
  for (let i = 0; i < 200; i++) {
    const x = 1 + Math.floor(rnd() * 1000000000);
    // n = k(p - 1) + r stays below 2^53, so it is exact, and x^n = x^r.
    const r = Math.floor(rnd() * 300);
    const n = Math.floor(rnd() * 9000000) * 1000000006 + r;
    assert.equal(reference(x, n), brute(x, r), `${x}^${n}`);
  }
  assert.equal(reference(0, 0), 1);
  assert.equal(reference(0, 10 ** 18), 0);
});

test('visible expectations agree; every n is exact as a JSON number; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const [x, n] = t.args;
    // The verifier and the browser read n from its JSON text, so text and value must agree.
    assert.equal(BigInt(n).toString(), JSON.stringify(n), `n = ${n} does not print exactly`);
    assert.equal(problem.parseCustomInput(`${x}\n${JSON.stringify(n)}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[1] >= 9e17).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[1] > 2 ** 31 && t.args[1] < 2 ** 33));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('2\n1000000000000000000'), { ok: true, args: [2, 1e18] });
  assert.deepEqual(problem.parseCustomInput('2\n9007199254740991'), { ok: true, args: [2, 9007199254740991] });
  assert.equal(problem.parseCustomInput('2\n123456789012345678').ok, false);
  assert.equal(problem.parseCustomInput('2\n1000000000000000001').ok, false);
  assert.equal(problem.parseCustomInput('1000000001\n2').ok, false);
  assert.equal(problem.parseCustomInput('-1\n2').ok, false);
  assert.equal(problem.parseCustomInput('2\n-2').ok, false);
  assert.equal(problem.parseCustomInput('2.5\n2').ok, false);
  assert.equal(problem.parseCustomInput('2').ok, false);
});
