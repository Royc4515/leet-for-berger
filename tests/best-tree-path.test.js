import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/best-tree-path/problem.js';

// Brute force: the sum of the path between every pair of nodes (u = v included), found by
// walking both up to their lowest common ancestor. Independent of the post-order DP.
function brute(level) {
  const nodes = [];
  const parent = new Map();
  const depth = new Map();
  const stack = [[treeFromLevel(level), null, 0]];
  while (stack.length) {
    const [n, p, d] = stack.pop();
    if (!n) continue;
    nodes.push(n);
    parent.set(n, p);
    depth.set(n, d);
    stack.push([n.left, n, d + 1], [n.right, n, d + 1]);
  }
  let best = -Infinity;
  for (const u of nodes) {
    for (const v of nodes) {
      let a = u;
      let b = v;
      let sum = 0;
      while (depth.get(a) > depth.get(b)) {
        sum += a.val;
        a = parent.get(a);
      }
      while (depth.get(b) > depth.get(a)) {
        sum += b.val;
        b = parent.get(b);
      }
      while (a !== b) {
        sum += a.val + b.val;
        a = parent.get(a);
        b = parent.get(b);
      }
      best = Math.max(best, sum + a.val);
    }
  }
  return best;
}

function randomTree(rnd, n, lo, hi) {
  const root = { val: lo + Math.floor(rnd() * (hi - lo + 1)), left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const parent = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!parent[side]) {
      parent[side] = { val: lo + Math.floor(rnd() * (hi - lo + 1)), left: null, right: null };
      nodes.push(parent[side]);
    }
  }
  return levelFromTree(root);
}

test('reference matches brute force on 1500 random trees', () => {
  const rnd = mulberry32(307);
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 14);
    // Mostly mixed signs, sometimes all negative, so "start the answer at 0" would be caught.
    const level = i % 5 === 0 ? randomTree(rnd, n, -20, -1) : randomTree(rnd, n, -10, 10);
    assert.equal(reference(level), brute(level), JSON.stringify(level));
  }
});

test('visible expectations agree; 15 valid cases; two 3 * 10^4-node trees', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 30000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected < 0), 'an all-negative tree is tested');
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3]').args, [[1, 2, 3]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[1001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
