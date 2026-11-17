import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/tree-heist/problem.js';

// Brute force: every subset of nodes, kept when no taken node has a taken parent.
function brute(level) {
  const nodes = [];
  const parentIndex = [];
  const stack = [[treeFromLevel(level), -1]];
  while (stack.length) {
    const [n, p] = stack.pop();
    if (!n) continue;
    const id = nodes.length;
    nodes.push(n.val);
    parentIndex.push(p);
    stack.push([n.left, id], [n.right, id]);
  }
  let best = 0;
  for (let mask = 0; mask < 1 << nodes.length; mask++) {
    let ok = true;
    let sum = 0;
    for (let i = 0; i < nodes.length && ok; i++) {
      if (!(mask & (1 << i))) continue;
      if (parentIndex[i] >= 0 && mask & (1 << parentIndex[i])) ok = false;
      sum += nodes[i];
    }
    if (ok) best = Math.max(best, sum);
  }
  return best;
}

function randomTree(rnd, n) {
  const root = { val: Math.floor(rnd() * 10), left: null, right: null };
  const nodes = [root];
  while (nodes.length < n) {
    const parent = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!parent[side]) {
      parent[side] = { val: Math.floor(rnd() * 10), left: null, right: null };
      nodes.push(parent[side]);
    }
  }
  return levelFromTree(root);
}

test('reference matches brute force on 1000 random trees', () => {
  const rnd = mulberry32(313);
  for (let i = 0; i < 1000; i++) {
    const level = randomTree(rnd, 1 + Math.floor(rnd() * 13));
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
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 10000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[3,2,3,null,3,null,1]').args, [[3, 2, 3, null, 3, null, 1]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,').ok, false);
});
