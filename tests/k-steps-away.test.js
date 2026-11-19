import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { treeFromLevel, levelFromTree, checkLevelArray } from '../src/js/engine/structures.js';
import problem, { reference } from '../src/js/problems/k-steps-away/problem.js';

// Brute force: depths and parents by DFS, then each node's distance to the target through their
// lowest common ancestor (walk the deeper one up until they meet). No search from the target.
function brute(level, target, k) {
  const nodes = [];
  const walk = (n, parent, depth) => {
    if (!n) return;
    const entry = { n, parent, depth };
    nodes.push(entry);
    walk(n.left, entry, depth + 1);
    walk(n.right, entry, depth + 1);
  };
  walk(treeFromLevel(level), null, 0);
  const t = nodes.find((x) => x.n.val === target);
  const dist = (a, b) => {
    let [x, y, d] = [a, b, 0];
    while (x !== y) {
      if (x.depth >= y.depth) x = x.parent;
      else y = y.parent;
      d++;
    }
    return d;
  };
  return nodes.filter((x) => dist(x, t) === k).map((x) => x.n.val).sort((a, b) => a - b);
}

/** Random shape by attaching each new node under a random free slot; distinct small values. */
function randomTree(rnd, n) {
  const vals = Array.from({ length: 40 }, (_, i) => i * 3 + 1);
  for (let i = vals.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  const root = { val: vals[0], left: null, right: null };
  const all = [root];
  while (all.length < n) {
    const p = all[Math.floor(rnd() * all.length)];
    const side = rnd() < 0.5 ? 'left' : 'right';
    if (!p[side]) {
      p[side] = { val: vals[all.length], left: null, right: null };
      all.push(p[side]);
    }
  }
  return levelFromTree(root);
}

test('reference matches brute force on 1500 random trees, every k up to the diameter', () => {
  const rnd = mulberry32(863);
  let nonEmpty = 0;
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 30);
    const level = randomTree(rnd, n);
    const vals = level.filter((v) => v !== null);
    const target = vals[Math.floor(rnd() * vals.length)];
    for (let k = 0; k <= n; k++) {
      const want = brute(level, target, k);
      if (want.length) nonEmpty++;
      assert.deepEqual(reference(level, target, k), want, `${JSON.stringify(level)} target=${target} k=${k}`);
    }
  }
  assert.ok(nonEmpty > 5000);
});

test('5 visible and 10 hidden cases, all valid; visible and hidden agree with brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(checkLevelArray(t.args[0]), null);
    const raw = t.args.map((a) => JSON.stringify(a)).join('\n');
    assert.equal(problem.parseCustomInput(raw).ok, true, problem.parseCustomInput(raw).error);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].filter((v) => v !== null).length === 10000).length >= 2);
  // The chain cases land where their comments say.
  assert.deepEqual(problem.hiddenTests[3].expected, [98, 5100]);
  assert.deepEqual(problem.hiddenTests[4].expected, [30, 270, 5270]);
});

test('the classic mistakes each fail a case', () => {
  const all = [...problem.visibleTests, ...problem.hiddenTests];
  // Only searching below the target.
  const downOnly = (level, target, k) => {
    const find = (n) => (!n ? null : n.val === target ? n : find(n.left) ?? find(n.right));
    let frontier = [find(treeFromLevel(level))];
    for (let s = 0; s < k; s++) frontier = frontier.flatMap((n) => [n.left, n.right].filter(Boolean));
    return frontier.map((n) => n.val).sort((a, b) => a - b);
  };
  assert.ok(all.some((t) => JSON.stringify(downOnly(...t.args)) !== JSON.stringify(t.expected)), 'down only');
  // No seen set: walks back and also reports nodes at k - 2, k - 4, ...
  const noSeen = (level, target, k) => {
    const root = treeFromLevel(level);
    const parent = new Map();
    const stack = [root];
    let start = null;
    while (stack.length) {
      const n = stack.pop();
      if (n.val === target) start = n;
      for (const c of [n.left, n.right]) if (c) parent.set(c, n), stack.push(c);
    }
    let frontier = [start];
    for (let s = 0; s < k; s++) frontier = frontier.flatMap((n) => [n.left, n.right, parent.get(n)].filter(Boolean));
    return [...new Set(frontier.map((n) => n.val))].sort((a, b) => a - b);
  };
  assert.ok(all.filter((t) => t.args[2] <= 12).some((t) => JSON.stringify(noSeen(...t.args)) !== JSON.stringify(t.expected)), 'no seen set');
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[5,1,9]\n1\n1').args, [[5, 1, 9], 1, 1]);
  assert.equal(problem.parseCustomInput('[5,1,9]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[5,1,9]\n4\n1').ok, false, 'target not in the tree');
  assert.equal(problem.parseCustomInput('[5,1,1]\n1\n1').ok, false, 'duplicate values');
  assert.equal(problem.parseCustomInput('[]\n1\n1').ok, false);
  assert.equal(problem.parseCustomInput('[5,1,9]\n1\n-1').ok, false);
  assert.equal(problem.parseCustomInput('[5,1,9]\n1\n1001').ok, false);
  assert.equal(problem.parseCustomInput('[100001]\n100001\n0').ok, false);
  const deep = Array.from({ length: 301 }, (_, i) => i);
  const chainLevel = [0];
  for (let i = 1; i < deep.length; i++) chainLevel.push(i, null);
  chainLevel.pop();
  assert.equal(checkLevelArray(chainLevel), null);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(chainLevel)}\n0\n1`).ok, false, 'height 301');
});
