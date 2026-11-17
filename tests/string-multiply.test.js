import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/string-multiply/problem.js';

// Brute force: BigInt, which users are not allowed to use but makes an independent check here.
const brute = (a, b) => (BigInt(a) * BigInt(b)).toString();

function randomNumber(rnd, maxLen) {
  if (rnd() < 0.1) return '0';
  const len = 1 + Math.floor(rnd() * maxLen);
  let s = String(1 + Math.floor(rnd() * 9));
  for (let i = 1; i < len; i++) s += String(rnd() < 0.3 ? 9 : Math.floor(rnd() * 10));
  return s;
}

test('reference matches BigInt on 3000 random pairs', () => {
  const rnd = mulberry32(42);
  for (let i = 0; i < 3000; i++) {
    const a = randomNumber(rnd, i < 2000 ? 6 : 60);
    const b = randomNumber(rnd, i < 2000 ? 6 : 60);
    assert.equal(reference(a, b), brute(a, b), `${a} * ${b}`);
  }
});

test('visible and hidden expectations agree with BigInt; sizes as declared; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(t.expected, brute(...t.args));
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000 && t.args[1].length >= 999).length >= 2);
  // At least one product does not fit in 64 bits, so machine integers cannot shortcut it.
  assert.ok(problem.hiddenTests.some((t) => BigInt(t.expected) > 2n ** 64n));
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('"12"').ok, false);
  assert.equal(problem.parseCustomInput('"012"\n"3"').ok, false);
  assert.equal(problem.parseCustomInput('"-1"\n"3"').ok, false);
  assert.equal(problem.parseCustomInput('12\n3').ok, false);
  assert.equal(problem.parseCustomInput('""\n"3"').ok, false);
  assert.equal(problem.parseCustomInput(`"${'1'.repeat(1001)}"\n"3"`).ok, false);
  assert.deepEqual(problem.parseCustomInput('"0"\n"3"'), { ok: true, args: ['0', '3'] });
});
