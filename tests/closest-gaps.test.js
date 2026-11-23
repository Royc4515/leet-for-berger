import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { intArray } from '../src/js/engine/growth-inputs.js';
import problem, { reference } from '../src/js/problems/closest-gaps/problem.js';

// Brute force: every pair of values, the smallest difference, then the matching pairs sorted.
function brute(arr) {
  let best = Infinity;
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) best = Math.min(best, Math.abs(arr[i] - arr[j]));
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (Math.abs(arr[i] - arr[j]) === best) out.push([Math.min(arr[i], arr[j]), Math.max(arr[i], arr[j])]);
    }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

// Classic wrong answers.
function unsortedNeighbours(arr) {
  let best = Infinity;
  for (let i = 1; i < arr.length; i++) best = Math.min(best, Math.abs(arr[i] - arr[i - 1]));
  const out = [];
  for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - arr[i - 1]) === best) out.push([Math.min(arr[i], arr[i - 1]), Math.max(arr[i], arr[i - 1])]);
  return out;
}
const firstPairOnly = (arr) => reference(arr).slice(0, 1);
function smallSentinel(arr) {
  const s = [...arr].sort((a, b) => a - b);
  let best = 1000000;
  for (let i = 1; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);
  const out = [];
  for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] === best) out.push([s[i - 1], s[i]]);
  return out;
}

test('reference matches brute force on 2000 seeded random arrays', () => {
  const rnd = mulberry32(1200);
  for (let k = 0; k < 2000; k++) {
    const n = 2 + Math.floor(rnd() * 30);
    const span = Math.max(n, Math.floor(rnd() * 200));
    const arr = intArray(n, mulberry32(k + 1), { min: -span, max: span, distinct: true });
    assert.deepEqual(reference(arr), brute(arr), JSON.stringify(arr));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [unsortedNeighbours, firstPairOnly, smallSentinel]) {
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden case`);
  }
});

test('growth input keeps the rules and has one closest pair', () => {
  const [arr] = problem.growth.input(400000, 7);
  assert.equal(new Set(arr).size, arr.length);
  assert.ok(arr.every((v) => v >= -1000000 && v <= 1000000));
  assert.equal(reference(arr).length, 1);
});

test('custom input parser enforces size, range and distinct values', () => {
  assert.deepEqual(problem.parseCustomInput(' [4,2,1,3] ').args, [[4, 2, 1, 3]]);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,1000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2.5]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
