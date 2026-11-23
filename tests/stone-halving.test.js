import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { intArray } from '../src/js/engine/growth-inputs.js';
import problem, { reference } from '../src/js/problems/stone-halving/problem.js';

// Brute force: rescan for the largest pile on every operation.
function brute(piles, k) {
  const a = [...piles];
  for (let op = 0; op < k; op++) {
    let best = 0;
    for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
    a[best] -= Math.floor(a[best] / 2);
  }
  return a.reduce((s, p) => s + p, 0);
}

// Exhaustive check on tiny inputs: try every sequence of k choices.
function exhaustive(piles, k) {
  if (k === 0) return piles.reduce((s, p) => s + p, 0);
  let best = Infinity;
  for (let i = 0; i < piles.length; i++) {
    const next = [...piles];
    next[i] -= Math.floor(next[i] / 2);
    best = Math.min(best, exhaustive(next, k - 1));
  }
  return best;
}

// Classic wrong answers.
function removesCeil(piles, k) {
  const a = [...piles];
  for (let op = 0; op < k; op++) {
    let best = 0;
    for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
    a[best] -= Math.ceil(a[best] / 2);
  }
  return a.reduce((s, p) => s + p, 0);
}
function sortedOnce(piles, k) {
  const a = [...piles].sort((x, y) => y - x);
  for (let op = 0; op < k && op < a.length; op++) a[op] -= Math.floor(a[op] / 2);
  return a.reduce((s, p) => s + p, 0);
}
function firstLargestOnly(piles, k) {
  const a = [...piles];
  let best = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
  for (let op = 0; op < k; op++) a[best] -= Math.floor(a[best] / 2);
  return a.reduce((s, p) => s + p, 0);
}

test('reference matches exhaustive search on tiny inputs and brute force on 1000 random ones', () => {
  const rnd = mulberry32(1962);
  for (let c = 0; c < 400; c++) {
    const piles = intArray(1 + Math.floor(rnd() * 4), mulberry32(c + 1), { min: 1, max: 40 });
    const k = 1 + Math.floor(rnd() * 4);
    assert.equal(reference(piles, k), exhaustive(piles, k), JSON.stringify([piles, k]));
  }
  for (let c = 0; c < 1000; c++) {
    const piles = intArray(1 + Math.floor(rnd() * 40), mulberry32(c + 500), { min: 1, max: 10000 });
    const k = 1 + Math.floor(rnd() * 80);
    assert.equal(reference(piles, k), brute(piles, k), JSON.stringify([piles, k]));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1] === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [removesCeil, sortedOnce, firstLargestOnly]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces the limits', () => {
  assert.deepEqual(problem.parseCustomInput('[5,4,9]; 2').args, [[5, 4, 9], 2]);
  assert.equal(problem.parseCustomInput('[5,4,9]').ok, false);
  assert.equal(problem.parseCustomInput('[0]; 1').ok, false);
  assert.equal(problem.parseCustomInput('[10001]; 1').ok, false);
  assert.equal(problem.parseCustomInput('[5]; 0').ok, false);
  assert.equal(problem.parseCustomInput('[5]; 100001').ok, false);
});
