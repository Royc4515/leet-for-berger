import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/add-without-plus/problem.js';

// Brute force: exact sum, then wrap to 32-bit two's complement with modular arithmetic.
function brute(a, b) {
  const s = (((a + b) % 4294967296) + 4294967296) % 4294967296;
  return s >= 2147483648 ? s - 4294967296 : s;
}

test('reference matches brute force on 5000 random pairs over the full 32-bit range', () => {
  const rnd = mulberry32(26);
  for (let k = 0; k < 5000; k++) {
    // Half the pairs are small so ordinary sums and sign changes are well covered too.
    const span = k % 2 ? 4294967296 : 2001;
    const off = k % 2 ? -2147483648 : -1000;
    const a = Math.floor(rnd() * span) + off;
    const b = Math.floor(rnd() * span) + off;
    assert.equal(reference(a, b), brute(a, b), `${a} ${b}`);
  }
});

test('visible expectations agree; tests are valid input; both overflow directions are covered', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${t.args[0]}\n${t.args[1]}`).ok, true);
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  assert.ok(all.some(({ args: [a, b] }) => a + b > 2147483647));
  assert.ok(all.some(({ args: [a, b] }) => a + b < -2147483648));
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('1').ok, false);
  assert.equal(problem.parseCustomInput('1\n2147483648').ok, false);
  assert.equal(problem.parseCustomInput('-2147483649\n0').ok, false);
  assert.equal(problem.parseCustomInput('1.5\n2').ok, false);
  assert.deepEqual(problem.parseCustomInput('-2147483648\n2147483647'), { ok: true, args: [-2147483648, 2147483647] });
});
