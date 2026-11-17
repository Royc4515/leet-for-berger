import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { randomListFrom, randomListToPairs } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/random-link-copy/problem.js';

// Brute force on real nodes: copy by index lookups (O(n^2), independent of any map), then check
// that no copied node is an original before serializing.
function brute(pairs) {
  const { head, nodes } = randomListFrom(pairs);
  const copies = [];
  for (let n = head; n; n = n.next) copies.push({ val: n.val, next: null, random: null });
  let i = 0;
  for (let n = head; n; n = n.next, i++) {
    copies[i].next = copies[i + 1] ?? null;
    copies[i].random = n.random === null ? null : copies[nodes.indexOf(n.random)];
  }
  const originals = new Set(nodes);
  assert.ok(copies.every((c) => !originals.has(c) && !originals.has(c.random)));
  return randomListToPairs(copies[0] ?? null);
}

test('reference matches brute force on 1500 random lists', () => {
  const rnd = mulberry32(57);
  for (let k = 0; k < 1500; k++) {
    const n = Math.floor(rnd() * 10);
    const pairs = Array.from({ length: n }, () => [Math.floor(rnd() * 5) - 2, rnd() < 0.3 ? null : Math.floor(rnd() * n)]);
    assert.deepEqual(reference(pairs), brute(pairs));
  }
});

test('visible expectations agree with the reference; 5 visible, 10 hidden, 2+ at max size', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 49999).length >= 2);
  // Every hidden list is valid input.
  for (const t of problem.hiddenTests) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[[3,null],[8,0]]'), { ok: true, args: [[[3, null], [8, 0]]] });
  assert.deepEqual(problem.parseCustomInput('[]'), { ok: true, args: [[]] });
  assert.equal(problem.parseCustomInput('[[3,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[[3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[10001,null]]').ok, false);
  assert.equal(problem.parseCustomInput('[3,null]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
