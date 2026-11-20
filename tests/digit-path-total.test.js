import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/digit-path-total/problem.js';

const INT_MAX = 2147483647;

// Brute force: list every root-to-leaf path as a digit string, read it as a number, add them up
// with exact BigInt arithmetic. Independent of the carried-value walk.
function brute(level) {
  const root = treeFromLevel(level);
  const paths = [];
  const go = (node, digits) => {
    const next = digits + node.val;
    if (!node.left && !node.right) paths.push(next);
    if (node.left) go(node.left, next);
    if (node.right) go(node.right, next);
  };
  if (root) go(root, '');
  return Number(paths.reduce((sum, p) => sum + BigInt(p), 0n));
}

// Classic wrong answers.
function walkWith(level, visit) {
  const root = treeFromLevel(level);
  let total = 0;
  const go = (node, above, digitSum) => {
    const here = above * 10 + node.val;
    total += visit(node, here, digitSum + node.val);
    if (node.left) go(node.left, here, digitSum + node.val);
    if (node.right) go(node.right, here, digitSum + node.val);
  };
  go(root, 0, 0);
  return total;
}
const addsAtEveryNode = (level) => walkWith(level, (node, here) => here);
const oneChildIsLeaf = (level) => walkWith(level, (node, here) => (!node.left || !node.right ? here : 0));
const addsDigits = (level) => walkWith(level, (node, here, digitSum) => (!node.left && !node.right ? digitSum : 0));
const skipsRoot = (level) => {
  const root = treeFromLevel(level);
  if (!root.left && !root.right) return 0;
  let total = 0;
  const go = (node, above) => {
    const here = above * 10 + node.val;
    if (!node.left && !node.right) total += here;
    if (node.left) go(node.left, here);
    if (node.right) go(node.right, here);
  };
  if (root.left) go(root.left, 0);
  if (root.right) go(root.right, 0);
  return total;
};

/** Random tree of up to `n` nodes and height at most 6, digits from a small set. */
function randomShape(rnd, n) {
  const root = { val: Math.floor(rnd() * 10), left: null, right: null };
  const nodes = [[root, 1]];
  for (let i = 1; i < n; i++) {
    const [parent, depth] = nodes[Math.floor(rnd() * nodes.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (parent[side] || depth >= 6) continue;
    const child = { val: Math.floor(rnd() * 10), left: null, right: null };
    parent[side] = child;
    nodes.push([child, depth + 1]);
  }
  return levelFromTree(root);
}

test('reference matches brute force on 3000 random trees', () => {
  const rnd = mulberry32(99);
  for (let i = 0; i < 3000; i++) {
    const level = randomShape(rnd, 1 + Math.floor(rnd() * 20));
    assert.equal(reference(level), brute(level), JSON.stringify(level));
  }
});

test('visible expectations agree; 5 visible, 10 hidden, valid and within 32 bits', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.equal(brute(t.args[0]), t.expected, 'brute force agrees with the shipped expectation');
    assert.ok(t.expected >= 0 && t.expected <= INT_MAX);
  }
  // Two 1000-node trees, and a 10-node path whose number is the largest 32-bit value.
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 1000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === INT_MAX));
  // The big random trees stay interesting after the 32-bit fit.
  assert.ok(problem.hiddenTests.slice(-2).every((t) => t.expected > 1000000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [addsAtEveryNode, oneChildIsLeaf, addsDigits, skipsRoot]) {
    assert.ok(suite.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[4,9,0,5,1]'), { ok: true, args: [[4, 9, 0, 5, 1]] });
  assert.equal(problem.parseCustomInput('[0]').ok, true);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null]').ok, false);
  assert.equal(problem.parseCustomInput('[1,null,null,2]').ok, false);
  assert.equal(problem.parseCustomInput('[10]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('not json').ok, false);
  // Eleven levels is over the height limit.
  assert.equal(problem.parseCustomInput(JSON.stringify([1, 2, null, 3, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 1, null, 2, null, 3])).ok, false);
  // Ten nines on a path is 9999999999, past 32 bits; the height is exactly 10, so only the total objects.
  const tenNines = [9];
  for (let i = 1; i < 10; i++) tenNines.push(9, null);
  tenNines.pop();
  assert.equal(problem.parseCustomInput(JSON.stringify(tenNines)).error, 'The total must fit in a signed 32-bit integer.');
});
