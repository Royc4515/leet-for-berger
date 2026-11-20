import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/drop-from-tail/problem.js';

// Brute force on real nodes with the textbook two passes: count, then walk to the predecessor.
function brute(values, n) {
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) head = { val: values[i], next: head };
  let len = 0;
  for (let p = head; p; p = p.next) len++;
  if (len === n) head = head.next;
  else {
    let p = head;
    for (let i = 0; i < len - n - 1; i++) p = p.next;
    p.next = p.next.next;
  }
  const out = [];
  for (let p = head; p; p = p.next) out.push(p.val);
  return out;
}

// Classic wrong answers.
const fromFront = (values, n) => values.filter((_, i) => i !== n - 1);
const offByOne = (values, n) => {
  const drop = values.length - n - 1;
  return values.filter((_, i) => i !== drop);
};
// Without a placeholder node the head cannot be dropped: the list comes back unchanged.
const headNotHandled = (values, n) => (n === values.length ? values : reference(values, n));
// Removes the first node whose value equals the target node's value.
const byValue = (values, n) => {
  const target = values[values.length - n];
  const at = values.indexOf(target);
  return values.filter((_, i) => i !== at);
};

test('reference matches brute force on 2000 random lists', () => {
  const rnd = mulberry32(99);
  for (let i = 0; i < 2000; i++) {
    const len = 1 + Math.floor(rnd() * 12);
    const values = Array.from({ length: len }, () => Math.floor(rnd() * 5) - 2);
    const n = 1 + Math.floor(rnd() * len);
    assert.deepEqual(reference(values, n), brute(values, n), `${JSON.stringify(values)} n=${n}`);
  }
});

test('visible expectations agree with the reference; 5 visible, 10 hidden, 4 at 10^5 nodes', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.deepEqual(brute(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [fromFront, offByOne, headNotHandled, byValue]) {
    assert.ok(suite.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every case`);
    assert.ok(
      problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)),
      `${wrong.name} passes every hidden case`,
    );
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3,4,5]\n2'), { ok: true, args: [[1, 2, 3, 4, 5], 2] });
  assert.deepEqual(problem.parseCustomInput('[7]\n1').args, [[7], 1]);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n3').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[6000]\n1').ok, false);
  assert.equal(problem.parseCustomInput('nope\n1').ok, false);
});
