import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/list-midpoint/problem.js';

// Independent brute force: simulate fast/slow pointers explicitly on linked node objects.
function fastSlowObjects(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { val: values[i], next: head };
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const out = [];
  for (let p = slow; p; p = p.next) out.push(p.val);
  return out;
}

// Classic wrong answers.
// Returns the first middle node on even lengths (floor((n - 1) / 2)).
const firstMiddle = (values) => values.slice(Math.floor((values.length - 1) / 2));
// Detaches the middle node and returns only a single element.
const singleNodeOnly = (values) => [values[Math.floor(values.length / 2)]];
// Off by one past the middle.
const onePastMiddle = (values) => values.slice(Math.min(values.length, Math.floor(values.length / 2) + 1));

test('reference matches fast/slow node traversal on 1000 seeded lists', () => {
  const rnd = mulberry32(876);
  for (let c = 0; c < 1000; c++) {
    const n = 1 + Math.floor(rnd() * 40);
    const values = Array.from({ length: n }, () => Math.floor(rnd() * 10001) - 5000);
    assert.deepEqual(reference(values), fastSlowObjects(values), JSON.stringify(values));
  }
});

test('5 visible and 10 hidden cases, visible agree, at least two max-size inputs, inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(fastSlowObjects(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('classic mistakes each fail a case', () => {
  const small = problem.hiddenTests.filter((t) => t.args[0].length <= 100);
  for (const wrong of [firstMiddle, singleNodeOnly, onePastMiddle]) {
    assert.ok(
      small.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)),
      `${wrong.name} passed all small hidden cases`,
    );
  }
});

test('custom input parser enforces limits', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3,4,5]').args, [[1, 2, 3, 4, 5]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[5001]').ok, false);
  assert.equal(problem.parseCustomInput('[-5001]').ok, false);
  assert.equal(problem.parseCustomInput('bad').ok, false);
});
