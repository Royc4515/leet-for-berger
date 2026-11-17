import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/reverse-list/problem.js';

// Brute force on real nodes, independent of the array reference: build, rewire, read back.
function brute(values) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { val: values[i], next: head };
  const out = [];
  const walk = (n) => {
    if (!n) return;
    walk(n.next);
    out.push(n.val);
  };
  walk(head);
  return out;
}

test('reference matches brute force on 1000 random lists', () => {
  const rnd = mulberry32(99);
  for (let i = 0; i < 1000; i++) {
    const values = Array.from({ length: Math.floor(rnd() * 30) }, () => Math.floor(rnd() * 21) - 10);
    assert.deepEqual(reference(values), brute(values));
  }
});

test('visible expectations agree with the reference; 5 visible, 10 hidden', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3]'), { ok: true, args: [[1, 2, 3]] });
  assert.deepEqual(problem.parseCustomInput('[]'), { ok: true, args: [[]] });
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('[6000]').ok, false);
});
