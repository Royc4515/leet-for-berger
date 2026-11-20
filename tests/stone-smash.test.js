import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/stone-smash/problem.js';

// Brute force: sort the whole pile every round. Independent of the heap.
function brute(stones) {
  const pile = [...stones];
  while (pile.length > 1) {
    pile.sort((a, b) => b - a);
    const a = pile.shift();
    const b = pile.shift();
    if (a !== b) pile.push(a - b);
  }
  return pile.length ? pile[0] : 0;
}

// Classic wrong answer: sort once, then pair neighbors from the top, never re-inserting.
function sortOnce(stones) {
  const sorted = [...stones].sort((a, b) => b - a);
  let carry = 0;
  for (let i = 0; i < sorted.length; i += 2) {
    if (i + 1 >= sorted.length) return Math.abs(carry - sorted[i]);
    carry = Math.abs(carry - (sorted[i] - sorted[i + 1]));
  }
  return carry;
}

// Classic wrong answer: smash the two lightest stones instead of the two heaviest.
function lightestFirst(stones) {
  const pile = [...stones];
  while (pile.length > 1) {
    pile.sort((a, b) => a - b);
    const a = pile.shift();
    const b = pile.shift();
    if (a !== b) pile.push(b - a);
  }
  return pile.length ? pile[0] : 0;
}

test('reference matches brute force on 3000 random piles', () => {
  const rnd = mulberry32(1046);
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 12);
    const max = 1 + Math.floor(rnd() * (i % 3 === 0 ? 3 : 40));
    const stones = Array.from({ length: n }, () => 1 + Math.floor(rnd() * max));
    assert.equal(reference(stones), brute(stones), JSON.stringify(stones));
  }
});

test('visible expectations agree; 15 valid cases; at least two 10^5-stone piles', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
  // Both an empty pile (0) and a surviving stone must occur.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 0) && problem.hiddenTests.some((t) => t.expected > 0));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [sortOnce, lightestFirst]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces the constraints', () => {
  assert.deepEqual(problem.parseCustomInput('[2,7,4,1,8,1]').args, [[2, 7, 4, 1, 8, 1]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('7').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
