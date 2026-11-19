import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/two-wall-tank/problem.js';

// Brute force: every pair. Independent of the two-pointer argument.
function brute(h) {
  let best = 0;
  for (let i = 0; i < h.length; i++) {
    for (let j = i + 1; j < h.length; j++) best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
  }
  return best;
}

// The classic wrong answer: move the taller wall. Some hidden case must catch it.
function moveTaller(h) {
  let l = 0;
  let r = h.length - 1;
  let best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
    if (h[l] > h[r]) l++;
    else r--;
  }
  return best;
}

test('reference matches brute force on 2000 random rows', () => {
  const rnd = mulberry32(2024);
  for (let i = 0; i < 2000; i++) {
    const n = 2 + Math.floor(rnd() * 30);
    const maxH = [1, 5, 50, 10000][i % 4];
    const h = Array.from({ length: n }, () => Math.floor(rnd() * (maxH + 1)));
    assert.equal(reference(h), brute(h), JSON.stringify(h));
  }
});

test('5 visible and 10 hidden cases, visible expectations agree, two or more at max size', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.ok(t.expected <= 2 ** 31 - 1);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of problem.hiddenTests.filter((x) => x.args[0].length <= 300)) assert.equal(brute(...t.args), t.expected);
});

test('the move-the-taller-wall mistake fails at least one case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  assert.ok(all.some((t) => moveTaller(...t.args) !== t.expected));
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1, 8, 6]').args, [[1, 8, 6]]);
  assert.equal(problem.parseCustomInput('[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,2.5]').ok, false);
  assert.equal(problem.parseCustomInput('1,2').ok, false);
  assert.equal(problem.solveReference([[3, 3]]), 3);
});
