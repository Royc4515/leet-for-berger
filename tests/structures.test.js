import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycleListFrom, checkCycleArg, randomListFrom, randomListToPairs, checkRandomPairs, checkNestedList } from '../src/js/engine/structures.js';

test('cycleListFrom links the tail back to pos', () => {
  const head = cycleListFrom([3, 2, 0, -4], 1);
  assert.equal(head.next.next.next.next, head.next);
  assert.equal(cycleListFrom([], -1), null);
  const solo = cycleListFrom([5], 0);
  assert.equal(solo.next, solo);
  const plain = cycleListFrom([1, 2], -1);
  assert.equal(plain.next.next, null);
});

test('checkCycleArg', () => {
  assert.equal(checkCycleArg([[1, 2], -1]), null);
  assert.equal(checkCycleArg([[1, 2], 1]), null);
  assert.equal(checkCycleArg([[], -1]), null);
  assert.ok(checkCycleArg([[1, 2], 2]));
  assert.ok(checkCycleArg([[], 0]));
  assert.ok(checkCycleArg([[1.5], -1]));
  assert.ok(checkCycleArg([1, 2]));
  assert.ok(checkCycleArg([[1], -2]));
});

test('randomListFrom and randomListToPairs round-trip', () => {
  const pairs = [[3, null], [8, 0], [5, 4], [2, 2], [9, 0]];
  const { head, nodes } = randomListFrom(pairs);
  assert.equal(nodes.length, 5);
  assert.equal(nodes[2].random, nodes[4]);
  assert.deepEqual(randomListToPairs(head), pairs);
  assert.deepEqual(randomListToPairs(randomListFrom([]).head), []);
  const stray = randomListFrom([[1, 0]]).head;
  stray.random = { val: 0, next: null, random: null };
  assert.throws(() => randomListToPairs(stray));
});

test('checkRandomPairs', () => {
  assert.equal(checkRandomPairs([]), null);
  assert.equal(checkRandomPairs([[1, null], [2, 0]]), null);
  assert.ok(checkRandomPairs([[1, 2]]));
  assert.ok(checkRandomPairs([[1]]));
  assert.ok(checkRandomPairs([['a', null]]));
  assert.ok(checkRandomPairs({}));
});

test('checkNestedList', () => {
  assert.equal(checkNestedList([[1, 1], 2, [1, 1]]), null);
  assert.equal(checkNestedList([[], [[]]]), null);
  assert.ok(checkNestedList(5));
  assert.ok(checkNestedList([1, 'x']));
  assert.ok(checkNestedList([[1.5]]));
  let deep = [1];
  for (let i = 0; i < 10; i++) deep = [deep];
  assert.equal(checkNestedList(deep, 11), null);
  assert.ok(checkNestedList(deep, 10));
});
