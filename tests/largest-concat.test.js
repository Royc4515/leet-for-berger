import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/largest-concat/problem.js';

// Brute force: try every order, keep the largest value (as a BigInt). Independent of the reference.
function brute(nums) {
  let best = -1n;
  const used = Array(nums.length).fill(false);
  const walk = (acc, depth) => {
    if (depth === nums.length) {
      const v = BigInt(acc);
      if (v > best) best = v;
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      walk(acc + nums[i], depth + 1);
      used[i] = false;
    }
  };
  walk('', 0);
  return best.toString();
}

test('reference matches brute force on 1500 random small inputs', () => {
  const rnd = mulberry32(6);
  const pick = (k) => Math.floor(rnd() * k);
  // Small digit pools make shared prefixes and zeros common.
  const pools = [[0, 1, 2, 3, 9, 10, 30, 34, 300, 303], [0, 0, 1, 10, 100, 101, 11, 110], [121, 12, 1212, 2, 21, 212, 0]];
  for (let t = 0; t < 1500; t++) {
    const pool = pools[t % pools.length];
    const nums = Array.from({ length: 1 + pick(6) }, () => (rnd() < 0.2 ? pick(1000) : pool[pick(pool.length)]));
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.args[0].length > 1 && t.expected === '0'));
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('["12"]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(101).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('[1000000000, 0]').ok, true);
});
