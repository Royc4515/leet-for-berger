import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/unique-prefix/problem.js';

// Brute force: repeatedly delete the first value that equals its left neighbour (the shifting
// approach), until no two neighbours are equal.
function brute(nums) {
  const a = nums.slice();
  for (let i = 1; i < a.length; ) {
    if (a[i] === a[i - 1]) a.splice(i, 1);
    else i++;
  }
  return a;
}

function randomSorted(rnd) {
  const n = 1 + Math.floor(rnd() * 14);
  return Array.from({ length: n }, () => Math.floor(rnd() * 9) - 4).sort((x, y) => x - y);
}

test('reference matches brute force on 3000 random sorted arrays', () => {
  const rnd = mulberry32(26);
  for (let i = 0; i < 3000; i++) {
    const nums = randomSorted(rnd);
    assert.deepEqual(reference(nums), brute(nums), JSON.stringify(nums));
  }
});

test('5 visible and 10 hidden cases, visible expectations agree, max-size arrays', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    // The answer is strictly increasing: sorted input and no duplicates left.
    for (let i = 1; i < t.expected.length; i++) assert.ok(t.expected[i] > t.expected[i - 1]);
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 2);
  // Shapes: one value, all distinct, and something in between.
  assert.deepEqual(big.map((t) => t.expected.length > 1).slice(0, 2), [false, true]);
  assert.ok(big.some((t) => t.expected.length === 100000));
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Compare each value with the next and stop at the end: the last value is always dropped.
  const dropsLast = (nums) => nums.filter((v, i) => i < nums.length - 1 && v !== nums[i + 1]);
  // Allow each value twice (the harder version of the task): a run of three keeps two copies.
  const atMostTwo = (nums) => {
    const out = [];
    for (const v of nums) if (out.length < 2 || v !== out[out.length - 2]) out.push(v);
    return out;
  };
  // Compare with the first value only: every later run keeps all its copies.
  const againstFirst = (nums) => nums.filter((v, i) => i === 0 || v !== nums[0]);
  for (const [name, wrong] of [['drops the last value', dropsLast], ['keeps two copies', atMostTwo], ['compares with the first value', againstFirst]]) {
    assert.ok(all.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), name);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[0,0,1,1,2]').args, [[0, 0, 1, 1, 2]]);
  assert.equal(problem.parseCustomInput('[1,0]').ok, false, 'unsorted');
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('[2000000000]').ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.deepEqual(problem.solveReference([[1, 1, 2]]), [1, 2]);
});
