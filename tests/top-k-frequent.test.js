import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/top-k-frequent/problem.js';

// Brute force: count each distinct value by filtering, then pick the best one k times.
function brute(nums, k) {
  const left = [...new Set(nums)];
  const out = [];
  while (out.length < k) {
    let best = null;
    for (const v of left) {
      if (out.includes(v)) continue;
      const c = nums.filter((x) => x === v).length;
      const bc = best === null ? -1 : nums.filter((x) => x === best).length;
      if (c > bc || (c === bc && v < best)) best = v;
    }
    out.push(best);
  }
  return out;
}

test('reference matches brute force on 1000 random inputs', () => {
  const rnd = mulberry32(3);
  for (let i = 0; i < 1000; i++) {
    const nums = Array.from({ length: 1 + Math.floor(rnd() * 15) }, () => Math.floor(rnd() * 9) - 4);
    const k = 1 + Math.floor(rnd() * new Set(nums).size);
    assert.deepEqual(reference(nums, k), brute(nums, k));
  }
});

test('visible expectations agree; tests are valid input', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input rejects k beyond the distinct count', () => {
  assert.equal(problem.parseCustomInput('[1,1,2]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[1,1,2]\n0').ok, false);
});
