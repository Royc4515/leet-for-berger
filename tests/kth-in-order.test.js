import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { levelFromTree, bstFromInsertions, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/kth-in-order/problem.js';

// Brute force: the values sorted, then indexed. Independent of the in-order walk.
const brute = (level, k) => level.filter((v) => v !== null).sort((a, b) => a - b)[k - 1];

/** `n` distinct small values inserted in random order. */
function randomBst(rnd, n) {
  const pool = Array.from({ length: 60 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return levelFromTree(bstFromInsertions(pool.slice(0, n)));
}

test('reference matches brute force for every k on 1000 random BSTs', () => {
  const rnd = mulberry32(311);
  for (let i = 0; i < 1000; i++) {
    const n = 1 + Math.floor(rnd() * 25);
    const level = randomBst(rnd, n);
    for (let k = 1; k <= n; k++) assert.equal(reference(level, k), brute(level, k), `${JSON.stringify(level)} k=${k}`);
  }
});

test('visible expectations agree; 15 valid cases; two 10^4-node trees', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 10000).length >= 2);
});

test('custom input parser rejects non-BSTs, duplicates and bad k', () => {
  assert.deepEqual(problem.parseCustomInput('[3,1,4,null,2]\n1').args, [[3, 1, 4, null, 2], 1]);
  assert.equal(problem.parseCustomInput('[3,1,4,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,4,null,2]\n5').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,4,null,2]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[3,4,1]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[3,1,5,null,null,2]\n1').ok, false, 'a left-subtree value larger than an ancestor');
  assert.equal(problem.parseCustomInput('[2,2]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n1').ok, false);
});
