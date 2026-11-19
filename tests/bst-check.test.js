import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, bstFromInsertions, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/bst-check/problem.js';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

function valuesOf(node, out = []) {
  if (!node) return out;
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    out.push(n.val);
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return out;
}

// Brute force from the definition: every value in the left subtree is smaller and every value in
// the right subtree is larger, for every node. Independent of the bounds walk.
function brute(level) {
  const root = treeFromLevel(level);
  const stack = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop();
    if (valuesOf(n.left).some((v) => v >= n.val)) return false;
    if (valuesOf(n.right).some((v) => v <= n.val)) return false;
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return true;
}

// Classic wrong answer: compare each node only with its children.
function childrenOnly(level) {
  const stack = [treeFromLevel(level)];
  while (stack.length) {
    const n = stack.pop();
    if (n.left && n.left.val >= n.val) return false;
    if (n.right && n.right.val <= n.val) return false;
    if (n.left) stack.push(n.left);
    if (n.right) stack.push(n.right);
  }
  return true;
}

// Classic wrong answer: bounds seeded with INT_MIN / INT_MAX as ordinary values.
function intSentinel(level) {
  const stack = [[treeFromLevel(level), INT_MIN, INT_MAX]];
  while (stack.length) {
    const [n, lo, hi] = stack.pop();
    if (n.val <= lo || n.val >= hi) return false;
    if (n.left) stack.push([n.left, lo, n.val]);
    if (n.right) stack.push([n.right, n.val, hi]);
  }
  return true;
}

// Classic wrong answer: equal values allowed.
function allowsEqual(level) {
  const stack = [[treeFromLevel(level), -Infinity, Infinity]];
  while (stack.length) {
    const [n, lo, hi] = stack.pop();
    if (n.val < lo || n.val > hi) return false;
    if (n.left) stack.push([n.left, lo, n.val]);
    if (n.right) stack.push([n.right, n.val, hi]);
  }
  return true;
}

/** Random tree shape with values from a tiny range, so duplicates and violations are common. */
function randomShape(rnd, n, range) {
  const nodes = [{ val: Math.floor(rnd() * range), left: null, right: null }];
  for (let i = 1; i < n; i++) {
    const node = { val: Math.floor(rnd() * range), left: null, right: null };
    for (;;) {
      const parent = nodes[Math.floor(rnd() * nodes.length)];
      const side = rnd() < 0.5 ? 'left' : 'right';
      if (!parent[side]) {
        parent[side] = node;
        break;
      }
    }
    nodes.push(node);
  }
  return levelFromTree(nodes[0]);
}

/** A valid BST of distinct values with, sometimes, one value changed. */
function maybeBroken(rnd, n) {
  const pool = Array.from({ length: n * 3 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const root = bstFromInsertions(pool.slice(0, n));
  if (rnd() < 0.6) {
    const all = [];
    const stack = [root];
    while (stack.length) {
      const x = stack.pop();
      all.push(x);
      if (x.left) stack.push(x.left);
      if (x.right) stack.push(x.right);
    }
    all[Math.floor(rnd() * all.length)].val = Math.floor(rnd() * n * 3);
  }
  return levelFromTree(root);
}

test('reference matches brute force on 3000 random trees', () => {
  const rnd = mulberry32(98);
  let accepted = 0;
  for (let i = 0; i < 3000; i++) {
    const n = 1 + Math.floor(rnd() * 14);
    const level = i % 2 === 0 ? randomShape(rnd, n, 2 + Math.floor(rnd() * 8)) : maybeBroken(rnd, n);
    const expected = brute(level);
    assert.equal(reference(level), expected, JSON.stringify(level));
    if (expected) accepted++;
  }
  // Both outcomes must be well represented, or the comparison proves little.
  assert.ok(accepted > 500 && accepted < 2500, `accepted ${accepted} of 3000`);
});

test('visible expectations agree; 15 valid cases; two 10^4-node trees; both outcomes', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected, 'brute force agrees with the shipped expectation');
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length >= 9999).length >= 2);
  const results = problem.hiddenTests.map((t) => t.expected);
  assert.ok(results.filter(Boolean).length >= 3 && results.filter((r) => !r).length >= 3);
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [childrenOnly, intSentinel, allowsEqual]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser rejects malformed trees', () => {
  assert.deepEqual(problem.parseCustomInput('[2,1,3]').args, [[2, 1, 3]]);
  assert.equal(problem.parseCustomInput(`[${INT_MIN},null,${INT_MAX}]`).ok, true);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
});
