import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/double-inversions/problem.js';

// Brute force: every pair of indices.
function brute(nums) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] > 2 * nums[j]) count++;
  return count;
}

test('reference matches brute force on 2000 random arrays, small and full-range values', () => {
  const rnd = mulberry32(1207);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 40);
    const wide = i % 2 === 0;
    const nums = Array.from({ length: n }, () => (wide ? Math.floor(rnd() * 4294967296) - 2147483648 : Math.floor(rnd() * 21) - 10));
    assert.equal(reference(nums), brute(nums));
  }
});

test('visible expectations agree; three 10^5 cases, counts beyond 32 bits; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 3);
  assert.ok(big.some((t) => t.expected > 2147483647));
  // The boundary case: brute force agrees where 2 * x overflows 32 bits.
  assert.equal(problem.hiddenTests[0].expected, brute(problem.hiddenTests[0].args[0]));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[-2147483649]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('{"a":1}').ok, false);
  assert.deepEqual(problem.parseCustomInput('[-2147483648,2147483647]').args, [[-2147483648, 2147483647]]);
});
