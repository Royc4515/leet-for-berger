import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/start-value-floor/problem.js';

// Brute force: try start = 1, 2, 3, ... and simulate each one until it survives.
function brute(nums) {
  for (let start = 1; ; start++) {
    let total = start;
    let ok = true;
    for (const v of nums) {
      total += v;
      if (total < 1) {
        ok = false;
        break;
      }
    }
    if (ok) return start;
  }
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(1413);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 10);
    const span = 1 + Math.floor(rnd() * 8);
    const bias = Math.floor(rnd() * 3) - 1; // negative, neutral and positive drift
    const nums = Array.from({ length: n }, () => Math.floor(rnd() * (2 * span + 1)) - span + bias);
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const parsed = problem.parseCustomInput(JSON.stringify(t.args[0]));
    assert.equal(parsed.ok, true, parsed.error);
    assert.ok(t.expected >= 1 && t.expected <= 2 ** 31 - 1);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 4);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length < 100)) assert.equal(brute(...t.args), t.expected);
  // Trying starts one by one costs answer * n steps: one hidden case needs 10^14 of them, and the
  // all-negative input has the largest answer an int can hold.
  assert.ok(problem.hiddenTests.some((t) => t.expected * t.args[0].length > 1e12));
  assert.ok(problem.hiddenTests.some((t) => t.expected === 1e9 + 1));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Off by one: lands on 0 instead of 1.
  const landsOnZero = (nums) => {
    let sum = 0;
    let low = 0;
    for (const v of nums) {
      sum += v;
      low = Math.min(low, sum);
    }
    return -low;
  };
  // Forgets that the start must be positive: an all-positive array gives a start below 1.
  const noFloor = (nums) => {
    let sum = 0;
    let low = Infinity;
    for (const v of nums) {
      sum += v;
      low = Math.min(low, sum);
    }
    return 1 - low;
  };
  // Looks only at the final total instead of the lowest point on the way.
  const finalTotal = (nums) => Math.max(1, 1 - nums.reduce((a, b) => a + b, 0));
  // Looks only at the first negative prefix it meets.
  const firstDip = (nums) => {
    let sum = 0;
    for (const v of nums) {
      sum += v;
      if (sum < 1) return 1 - sum;
    }
    return 1;
  };
  for (const [name, wrong] of [['lands on zero', landsOnZero], ['no floor of 1', noFloor], ['final total only', finalTotal], ['first dip only', firstDip]]) {
    assert.ok(all.some((t) => wrong(...t.args) !== t.expected), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[-3,2,-3,4,2]').args, [[-3, 2, -3, 4, 2]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[-10001]').ok, false);
  assert.equal(problem.parseCustomInput('["a"]').ok, false);
  assert.equal(problem.parseCustomInput('[10000,-10000]').ok, true);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
  assert.equal(problem.solveReference([[-3, 2, -3, 4, 2]]), 5);
});
