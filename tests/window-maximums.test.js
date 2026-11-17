import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/window-maximums/problem.js';

// Brute force: rescan every window.
function brute(nums, k) {
  const out = [];
  for (let i = 0; i + k <= nums.length; i++) out.push(Math.max(...nums.slice(i, i + k)));
  return out;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(62);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 15);
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * 11) - 5);
    const k = 1 + Math.floor(rnd() * n);
    assert.deepEqual(reference(nums, k), brute(nums, k));
  }
});

test('visible expectations agree; two max-size cases with large k; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1] >= 30000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n1.5').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1,3,2]\n2').args, [[1, 3, 2], 2]);
});
