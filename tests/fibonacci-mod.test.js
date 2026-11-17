import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/fibonacci-mod/problem.js';

const MOD = 1000000007n;

// Brute force: exact Fibonacci numbers in BigInt (no reduction until the end).
const exact = [0n, 1n];
for (let i = 2; i <= 3000; i++) exact.push(exact[i - 1] + exact[i - 2]);

// Independent check for large n: fast doubling, F(2k) = F(k)(2F(k+1) - F(k)), F(2k+1) = F(k)^2 + F(k+1)^2.
function fastDoubling(n) {
  if (n === 0) return [0n, 1n];
  const [a, b] = fastDoubling(Math.floor(n / 2));
  const c = (a * ((2n * b - a + MOD) % MOD)) % MOD;
  const d = (a * a + b * b) % MOD;
  return n % 2 === 0 ? [c, d] : [d, (c + d) % MOD];
}

test('reference matches exact Fibonacci numbers for every n <= 3000 and fast doubling for 100 large n', () => {
  for (let n = 0; n <= 3000; n++) assert.equal(reference(n), Number(exact[n] % MOD), `n = ${n}`);
  const rnd = mulberry32(250);
  for (let k = 0; k < 100; k++) {
    const n = Math.floor(rnd() * 1000001);
    assert.equal(reference(n), Number(fastDoubling(n)[0]), `n = ${n}`);
  }
  assert.equal(reference(1000000), Number(fastDoubling(1000000)[0]));
});

test('visible expectations agree; large n is tested; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(String(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0] >= 500000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('0'), { ok: true, args: [0] });
  assert.deepEqual(problem.parseCustomInput(' 1000000 '), { ok: true, args: [1000000] });
  assert.equal(problem.parseCustomInput('1000001').ok, false);
  assert.equal(problem.parseCustomInput('-1').ok, false);
  assert.equal(problem.parseCustomInput('1e3').ok, false);
  assert.equal(problem.parseCustomInput('').ok, false);
});
