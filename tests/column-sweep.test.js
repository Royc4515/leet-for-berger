import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/column-sweep/problem.js';

// Brute force: label every node with (column, row, path of L/R turns) by depth-first search, then
// sort. Within one row, left to right is the same as the path compared as text with L < R.
function brute(level) {
  const root = treeFromLevel(level);
  const all = [];
  const stack = root ? [[root, 0, 0, '']] : [];
  while (stack.length) {
    const [n, col, row, path] = stack.pop();
    all.push({ val: n.val, col, row, path });
    if (n.left) stack.push([n.left, col - 1, row + 1, path + 'L']);
    if (n.right) stack.push([n.right, col + 1, row + 1, path + 'R']);
  }
  all.sort((a, b) => a.col - b.col || a.row - b.row || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const out = [];
  for (const e of all) {
    if (!out.length || out[out.length - 1].col !== e.col) out.push({ col: e.col, vals: [] });
    out[out.length - 1].vals.push(e.val);
  }
  return out.map((c) => c.vals);
}

// Classic wrong answer: a preorder walk that appends to the column lists as it goes.
function dfsOrder(level) {
  const root = treeFromLevel(level);
  if (!root) return [];
  const columns = new Map();
  const stack = [[root, 0]];
  while (stack.length) {
    const [n, col] = stack.pop();
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col).push(n.val);
    if (n.right) stack.push([n.right, col + 1]);
    if (n.left) stack.push([n.left, col - 1]);
  }
  return [...columns.keys()].sort((a, b) => a - b).map((c) => columns.get(c));
}

// Classic wrong answer: the right grouping, with each column sorted by value.
function sortedByValue(level) {
  return reference(level).map((col) => [...col].sort((a, b) => a - b));
}

// Classic wrong answer: columns listed in the order they were first met.
function firstMetOrder(level) {
  const root = treeFromLevel(level);
  if (!root) return [];
  const columns = new Map();
  const queue = [[root, 0]];
  for (let h = 0; h < queue.length; h++) {
    const [n, col] = queue[h];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col).push(n.val);
    if (n.left) queue.push([n.left, col - 1]);
    if (n.right) queue.push([n.right, col + 1]);
  }
  return [...columns.values()];
}

/** Random tree of n nodes with small values, so equal rows and columns often hold unsorted values. */
function randomShape(rnd, n) {
  const nodes = [{ val: Math.floor(rnd() * 20), left: null, right: null }];
  for (let i = 1; i < n; i++) {
    const child = { val: Math.floor(rnd() * 20), left: null, right: null };
    for (;;) {
      const parent = nodes[Math.floor(rnd() * nodes.length)];
      const side = rnd() < 0.5 ? 'left' : 'right';
      if (!parent[side]) {
        parent[side] = child;
        break;
      }
    }
    nodes.push(child);
  }
  return levelFromTree(nodes[0]);
}

test('reference matches the sort-by-position brute force on 3000 random trees', () => {
  const rnd = mulberry32(314);
  for (let i = 0; i < 3000; i++) {
    const level = randomShape(rnd, Math.floor(rnd() * 16));
    assert.deepEqual(reference(level), brute(level), JSON.stringify(level));
  }
});

test('visible expectations agree; 15 valid cases; two 10^4-node trees', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(t.args[0]), t.expected, 'brute force agrees with the shipped expectation');
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length >= 9999);
  assert.ok(big.length >= 2);
  // The deepest trees must reach the height cap without passing it.
  assert.ok(problem.hiddenTests.some((t) => t.expected.length >= 499));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [dfsOrder, sortedByValue, firstMetOrder]) {
    assert.ok(suite.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects malformed trees', () => {
  assert.deepEqual(problem.parseCustomInput('[3,9,20,null,null,15,7]').args, [[3, 9, 20, null, null, 15, 7]]);
  assert.deepEqual(problem.parseCustomInput('[]').args, [[]]);
  assert.equal(problem.parseCustomInput('[null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
