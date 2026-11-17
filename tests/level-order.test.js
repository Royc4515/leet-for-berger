import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/level-order/problem.js';

// Brute force: depth-first, bucket by depth. Independent of the BFS reference.
function brute(level) {
  const out = [];
  const dfs = (n, d) => {
    if (!n) return;
    (out[d] ??= []).push(n.val);
    dfs(n.left, d + 1);
    dfs(n.right, d + 1);
  };
  dfs(treeFromLevel(level), 0);
  return out;
}

function randomTree(rnd, n) {
  if (!n) return [];
  const root = { val: 0, left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const parent = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!parent[side]) {
      parent[side] = { val: Math.floor(rnd() * 21) - 10, left: null, right: null };
      nodes.push(parent[side]);
    }
  }
  return levelFromTree(root);
}

test('reference matches brute force on 1000 random trees', () => {
  const rnd = mulberry32(5);
  for (let i = 0; i < 1000; i++) {
    const level = randomTree(rnd, Math.floor(rnd() * 40));
    assert.deepEqual(reference(level), brute(level), JSON.stringify(level));
  }
});

test('level-order arrays round-trip through tree nodes', () => {
  const rnd = mulberry32(6);
  for (let i = 0; i < 200; i++) {
    const level = randomTree(rnd, Math.floor(rnd() * 30));
    assert.deepEqual(levelFromTree(treeFromLevel(level)), level);
    assert.equal(checkLevelArray(level), null);
  }
});

test('visible expectations agree with the reference; hidden tests are canonical trees', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(checkLevelArray(t.args[0]), null);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length >= 8000).length >= 2);
});

test('custom input parser rejects malformed trees', () => {
  assert.equal(problem.parseCustomInput('[3,9,20,null,null,15,7]').ok, true);
  assert.equal(problem.parseCustomInput('[null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[5000]').ok, false);
});
