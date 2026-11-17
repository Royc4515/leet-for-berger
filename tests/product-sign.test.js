import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/product-sign/problem.js';

// Brute force: the exact product in BigInt, then its sign.
function brute(nums) {
  const p = nums.reduce((acc, v) => acc * BigInt(v), 1n);
  return p > 0n ? 1 : p < 0n ? -1 : 0;
}

test('reference matches the exact BigInt product on 2000 random arrays', () => {
  const rnd = mulberry32(220);
  for (let k = 0; k < 2000; k++) {
    // Zeros are rarer than other values so all three answers occur often.
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 60) }, () => (rnd() < 0.02 ? 0 : (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 100))));
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible and hidden expectations agree with the exact product; max sizes; inputs are valid', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(t.expected, brute(t.args[0]));
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 1000).length >= 2);
  // A product that overflows a double to Infinity before a zero arrives.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 0 && t.args[0].reduce((a, v) => (v === 0 ? a : a * v), 1) === Infinity));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[-1,2,0]'), { ok: true, args: [[-1, 2, 0]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[101]').ok, false);
  assert.equal(problem.parseCustomInput('[-101]').ok, false);
  assert.equal(problem.parseCustomInput('[0.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(1001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
