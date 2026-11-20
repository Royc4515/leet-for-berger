import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/value-harvest/problem.js';

// Brute force: the game exactly as LeetCode states it. Pick one element, earn it, and delete the
// picked element and every v - 1 and v + 1; try every order. Memoised on the sorted remainder.
function brute(nums) {
  const memo = new Map();
  const go = (arr) => {
    if (arr.length === 0) return 0;
    const key = arr.join(',');
    if (memo.has(key)) return memo.get(key);
    let best = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      const rest = arr.filter((w, j) => j !== i && w !== v - 1 && w !== v + 1);
      best = Math.max(best, v + go(rest));
    }
    memo.set(key, best);
    return best;
  };
  return go([...nums].sort((a, b) => a - b));
}

// Classic wrong answer: house robber over the sorted distinct values, as if they were neighbours.
function distinctRobber(nums) {
  const counts = new Map();
  for (const v of nums) counts.set(v, (counts.get(v) ?? 0) + v);
  const values = [...counts.keys()].sort((a, b) => a - b);
  let skip = 0;
  let best = 0;
  for (const v of values) {
    const take = skip + counts.get(v);
    skip = best;
    best = Math.max(best, take);
  }
  return best;
}

// Classic wrong answer: house robber over the array positions after sorting, one copy at a time.
function positionRobber(nums) {
  const a = [...nums].sort((x, y) => x - y);
  let skip = 0;
  let best = 0;
  for (const v of a) {
    const take = skip + v;
    skip = best;
    best = Math.max(best, take);
  }
  return best;
}

// Classic wrong answer: greedily take the value with the largest total until nothing is left.
function greedyBiggest(nums) {
  const total = new Map();
  for (const v of nums) total.set(v, (total.get(v) ?? 0) + v);
  let score = 0;
  while (total.size) {
    let pick = -1;
    for (const [v, t] of total) if (pick === -1 || t > total.get(pick) || (t === total.get(pick) && v < pick)) pick = v;
    score += total.get(pick);
    total.delete(pick);
    total.delete(pick - 1);
    total.delete(pick + 1);
  }
  return score;
}

test('reference matches brute force on 2000 random arrays', () => {
  const rnd = mulberry32(740);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 8);
    const range = 1 + Math.floor(rnd() * 7);
    const nums = Array.from({ length: n }, () => 1 + Math.floor(rnd() * range));
    assert.equal(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('visible expectations agree; inputs are valid; max-size cases', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  // The 32-bit boundary: the biggest answer is 10^9, below 2^31 - 1.
  const maxAnswer = Math.max(...problem.hiddenTests.map((t) => t.expected));
  assert.equal(maxAnswer, 1e9);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [distinctRobber, positionRobber, greedyBiggest]) {
    assert.ok(
      suite.some((t) => wrong(...t.args) !== t.expected),
      `${wrong.name} passes every case`,
    );
    assert.ok(
      problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected),
      `${wrong.name} passes every hidden case`,
    );
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[2,2,3]').args, [[2, 2, 3]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('2 3').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
});
