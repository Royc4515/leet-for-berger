import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/sorted-list-dedupe/problem.js';

// Independent brute force: deduplicate via Set while preserving sorted order.
const brute = (values) => [...new Set(values)];

// Classic wrong answers.
// Advances immediately after dropping one duplicate -> fails on 3+ consecutive equal values.
function advanceAfterDelete(values) {
  const out = [...values];
  let i = 0;
  while (i + 1 < out.length) {
    if (out[i] === out[i + 1]) out.splice(i + 1, 1);
    i++;
  }
  return out;
}
// Drops ALL copies of any duplicated value (LC 82 behavior instead of LC 83).
function dropAllDuplicates(values) {
  const freq = new Map();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  return values.filter((v) => freq.get(v) === 1);
}
// Keeps everything unchanged.
const noOp = (values) => [...values];

test('reference matches brute force on 2000 seeded sorted lists', () => {
  const rnd = mulberry32(83);
  for (let c = 0; c < 2000; c++) {
    const n = Math.floor(rnd() * 30);
    const values = Array.from({ length: n }, () => Math.floor(rnd() * 15) - 7).sort((a, b) => a - b);
    assert.deepEqual(reference(values), brute(values), JSON.stringify(values));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
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

test('classic mistakes each fail a case', () => {
  const small = problem.hiddenTests.filter((t) => t.args[0].length <= 100);
  for (const wrong of [advanceAfterDelete, dropAllDuplicates, noOp]) {
    assert.ok(
      small.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)),
      `${wrong.name} passed all small hidden cases`,
    );
  }
});

test('custom input parser enforces sortedness and bounds', () => {
  assert.deepEqual(problem.parseCustomInput('[1,1,2,3,3]').args, [[1, 1, 2, 3, 3]]);
  assert.deepEqual(problem.parseCustomInput('[]').args, [[]]);
  assert.equal(problem.parseCustomInput('[2,1]').ok, false);
  assert.equal(problem.parseCustomInput('[5001]').ok, false);
  assert.equal(problem.parseCustomInput('[-5001]').ok, false);
  assert.equal(problem.parseCustomInput('bad').ok, false);
});
