import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/tree-height/problem.js';

// Brute force: recursive depth-first height. Independent of the breadth-first reference.
function brute(level) {
  const h = (n) => (n ? 1 + Math.max(h(n.left), h(n.right)) : 0);
  return h(treeFromLevel(level));
}

function randomTree(rnd, n) {
  if (!n) return [];
  const root = { val: 0, left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const parent = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!parent[side]) {
      parent[side] = { val: Math.floor(rnd() * 201) - 100, left: null, right: null };
      nodes.push(parent[side]);
    }
  }
  return levelFromTree(root);
}

test('reference matches brute force on 1000 random trees', () => {
  const rnd = mulberry32(301);
  for (let i = 0; i < 1000; i++) {
    const level = randomTree(rnd, Math.floor(rnd() * 40));
    assert.equal(reference(level), brute(level), JSON.stringify(level));
  }
});

test('visible expectations agree; 15 valid cases; two 10^4-node trees and height-500 chains', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 10000).length >= 2);
  assert.ok(problem.hiddenTests.filter((t) => t.expected === 500).length >= 2);
});

test('custom input parser rejects malformed, oversized and too tall trees', () => {
  assert.deepEqual(problem.parseCustomInput('[3,9,20,null,null,15,7]').args, [[3, 9, 20, null, null, 15, 7]]);
  assert.equal(problem.parseCustomInput('[]').ok, true);
  assert.equal(problem.parseCustomInput('[null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('[101]').ok, false);
  assert.equal(problem.parseCustomInput('{}').ok, false);
  const tall = [0];
  for (let i = 1; i < 501; i++) tall.push(0, null);
  tall.pop();
  assert.equal(problem.parseCustomInput(JSON.stringify(tall)).ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(tall.slice(0, -2))).ok, true);
});
