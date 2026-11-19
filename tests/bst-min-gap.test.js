import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/bst-min-gap/problem.js';

// Brute force: every pair of values. Independent of the in-order walk.
function brute(level) {
  const vals = level.filter((v) => v !== null);
  let best = Infinity;
  for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) best = Math.min(best, Math.abs(vals[i] - vals[j]));
  return best;
}

// Classic wrong answer: only compare each node with its children.
function parentChildOnly(level) {
  let best = Infinity;
  const stack = [treeFromLevel(level)];
  while (stack.length) {
    const n = stack.pop();
    for (const c of [n.left, n.right]) {
      if (c) {
        best = Math.min(best, Math.abs(n.val - c.val));
        stack.push(c);
      }
    }
  }
  return best;
}

// Classic wrong answer: in-order walk whose previous value starts at 0 instead of "none".
function zeroSentinel(level) {
  const vals = level.filter((v) => v !== null).sort((a, b) => a - b);
  let prev = 0;
  let best = Infinity;
  for (const v of vals) {
    best = Math.min(best, v - prev);
    prev = v;
  }
  return best;
}

/** `n` distinct values from a small range, inserted in random order. */
function randomBst(rnd, n, range) {
  const pool = Array.from({ length: range }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return levelFromTree(bstFromInsertions(pool.slice(0, n)));
}

test('reference matches brute force on 2000 random BSTs', () => {
  const rnd = mulberry32(783);
  for (let i = 0; i < 2000; i++) {
    const n = 2 + Math.floor(rnd() * 40);
    const level = randomBst(rnd, n, n + Math.floor(rnd() * 200));
    assert.equal(reference(level), brute(level), JSON.stringify(level));
  }
});

test('visible expectations agree; 15 valid cases; two 10^4-node trees', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length >= 9999).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [parentChildOnly, zeroSentinel]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects non-BSTs, duplicates and too few nodes', () => {
  assert.deepEqual(problem.parseCustomInput('[8,3,12,1,6]').args, [[8, 3, 12, 1, 6]]);
  assert.equal(problem.parseCustomInput('[5]').ok, false);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[3,4,1]').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,5,null,null,2]').ok, false, 'a left-subtree value larger than an ancestor');
  assert.equal(problem.parseCustomInput('[2,2]').ok, false);
  assert.equal(problem.parseCustomInput('[100001,1]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
