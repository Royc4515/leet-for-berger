// Growth input generators (src/js/engine/growth-inputs.js): deterministic from the seed, inside
// the options' rules, and in the judge's JSON forms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import { checkLevelArray, treeFromLevel } from '../src/js/engine/structures.js';
import { randInt, shuffle, intArray, charString, stringList, gridShape, grid, intGrid, levelTree, linkedList, intervals, edgeList } from '../src/js/engine/growth-inputs.js';

const rng = (seed = 7) => mulberry32(seed);

/** Height (levels) of a tree given as a level-order array, without recursion. */
function heightOf(level) {
  const root = treeFromLevel(level);
  let h = 0;
  for (let layer = root ? [root] : []; layer.length; h++) layer = layer.flatMap((n) => [n.left, n.right].filter(Boolean));
  return h;
}

/** In-order values of a level-order tree, without recursion. */
function inOrder(level) {
  const out = [];
  const stack = [];
  let node = treeFromLevel(level);
  while (stack.length || node) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    out.push(node.val);
    node = node.right;
  }
  return out;
}

test('every generator is deterministic for a seed and changes with it', () => {
  const makers = [
    (r) => intArray(50, r),
    (r) => intArray(50, r, { min: 0, max: 60, distinct: true }),
    (r) => charString(50, r),
    (r) => stringList(20, r, { distinct: true }),
    (r) => grid(64, r),
    (r) => intGrid(64, r),
    (r) => levelTree(50, r, { shape: 'random' }),
    (r) => linkedList(50, r),
    (r) => intervals(30, r),
    (r) => edgeList(20, 40, r, { connected: true }),
    (r) => shuffle([1, 2, 3, 4, 5, 6, 7, 8], r),
  ];
  for (const make of makers) {
    assert.deepEqual(make(rng(1)), make(rng(1)));
    assert.notDeepEqual(make(rng(1)), make(rng(2)));
  }
});

test('randInt stays in its inclusive range and reaches both ends', () => {
  const r = rng();
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = randInt(r, -2, 2);
    assert.ok(Number.isInteger(v) && v >= -2 && v <= 2);
    seen.add(v);
  }
  assert.equal(seen.size, 5);
});

test('intArray: range, distinct and sorted options', () => {
  const a = intArray(1000, rng(), { min: -5, max: 5 });
  assert.equal(a.length, 1000);
  assert.ok(a.every((v) => Number.isInteger(v) && v >= -5 && v <= 5));

  // Small range (partial shuffle) and large range (rejection) both give distinct values.
  for (const [min, max] of [[1, 1200], [-1e9, 1e9]]) {
    const d = intArray(1000, rng(), { min, max, distinct: true });
    assert.equal(new Set(d).size, 1000);
    assert.ok(d.every((v) => v >= min && v <= max));
  }
  const exact = intArray(10, rng(), { min: 1, max: 10, distinct: true });
  assert.deepEqual([...exact].sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const s = intArray(1000, rng(), { min: -1e9, max: 1e9, sorted: true });
  assert.ok(s.every((v, i) => i === 0 || s[i - 1] <= v));
  const sd = intArray(500, rng(), { min: 0, max: 600, distinct: true, sorted: true });
  assert.ok(sd.every((v, i) => i === 0 || sd[i - 1] < v));
  // 32-bit and 64-bit-safe ranges keep exact integers.
  assert.ok(intArray(100, rng(), { min: -(2 ** 31), max: 2 ** 31 - 1 }).every(Number.isSafeInteger));

  assert.throws(() => intArray(11, rng(), { min: 1, max: 10, distinct: true }), /do not fit/);
  assert.throws(() => intArray(3, rng(), { min: 5, max: 1 }), /bad range/);
  assert.deepEqual(intArray(0, rng()), []);
});

test('charString and stringList respect the alphabet and lengths', () => {
  const s = charString(500, rng(), { alphabet: '([{' });
  assert.equal(s.length, 500);
  assert.match(s, /^[([{]+$/);
  assert.match(charString(200, rng()), /^[a-z]+$/);

  // 9 + 27 + 81 = 117 strings exist; 100 distinct ones need many rejected repeats.
  const words = stringList(100, rng(), { minLen: 2, maxLen: 4, alphabet: 'xyz', distinct: true });
  assert.equal(words.length, 100);
  assert.equal(new Set(words).size, 100);
  assert.ok(words.every((w) => /^[xyz]{2,4}$/.test(w)));
  // 3 letters, length 1: only 3 distinct strings exist.
  assert.throws(() => stringList(4, rng(), { minLen: 1, maxLen: 1, alphabet: 'abc', distinct: true }), /not enough/);
});

test('grid: about n cells, rows of equal length, cells from the given values and weights', () => {
  assert.deepEqual(gridShape(10000), { rows: 100, cols: 100 });
  assert.deepEqual(gridShape(10000, { rows: 50 }), { rows: 50, cols: 200 });
  assert.deepEqual(gridShape(10000, { cols: 25 }), { rows: 400, cols: 25 });

  const g = grid(4096, rng(), { cells: '01', as: 'strings' });
  assert.equal(g.length, 64);
  assert.ok(g.every((row) => typeof row === 'string' && /^[01]{64}$/.test(row)));

  const w = grid(10000, rng(), { cells: [0, 1, 2], weights: [8, 1, 1] });
  const flat = w.flat();
  assert.ok(flat.every((v) => v === 0 || v === 1 || v === 2));
  const zeros = flat.filter((v) => v === 0).length / flat.length;
  assert.ok(zeros > 0.75 && zeros < 0.85, `weighted share ${zeros}`);
  assert.throws(() => grid(16, rng(), { cells: '01', weights: [1] }), /one weight/);

  const ig = intGrid(900, rng(), { min: -3, max: 3 });
  assert.equal(ig.length, 30);
  assert.ok(ig.every((row) => row.length === 30 && row.every((v) => v >= -3 && v <= 3)));
});

test('levelTree: canonical level order, n nodes, height bounds, values in range', () => {
  for (const shape of ['complete', 'random']) {
    for (const n of [1, 2, 3, 7, 100, 5000]) {
      const level = levelTree(n, rng(n), { shape, min: -100, max: 100 });
      assert.equal(checkLevelArray(level), null, `${shape} ${n}`);
      const values = level.filter((v) => v !== null);
      assert.equal(values.length, n);
      assert.ok(values.every((v) => v >= -100 && v <= 100));
    }
  }
  assert.deepEqual(levelTree(0, rng()), []);
  // Complete: height ceil(log2(n + 1)) and no null before the last value.
  const complete = levelTree(1000, rng(), { shape: 'complete' });
  assert.equal(heightOf(complete), 10);
  assert.ok(!complete.includes(null));
  // Random: well under the cap at 10^5 nodes, and the cap holds when it binds.
  assert.ok(heightOf(levelTree(100000, rng(), { shape: 'random' })) < 100);
  const capped = levelTree(3000, rng(), { shape: 'random', maxHeight: 12 });
  assert.ok(heightOf(capped) <= 12);
  assert.equal(capped.filter((v) => v !== null).length, 3000);
  assert.throws(() => levelTree(8, rng(), { shape: 'random', maxHeight: 3 }), /do not fit/);
  assert.throws(() => levelTree(8, rng(), { shape: 'complete', maxHeight: 3 }), /do not fit/);
  assert.throws(() => levelTree(8, rng(), { shape: 'spiral' }), /unknown shape/);
});

test('levelTree with bst: in-order values strictly increase', () => {
  for (const shape of ['complete', 'random']) {
    const level = levelTree(2000, rng(), { shape, bst: true, min: -(2 ** 31), max: 2 ** 31 - 1 });
    const vals = inOrder(level);
    assert.equal(vals.length, 2000);
    assert.ok(vals.every((v, i) => i === 0 || vals[i - 1] < v), shape);
  }
});

test('linkedList is an array of values with list defaults', () => {
  const l = linkedList(100, rng());
  assert.equal(l.length, 100);
  assert.ok(l.every((v) => Number.isInteger(v) && Math.abs(v) <= 1e4));
  const sorted = linkedList(100, rng(), { min: 0, max: 50, sorted: true });
  assert.ok(sorted.every((v, i) => i === 0 || sorted[i - 1] <= v));
});

test('intervals: bounds, lengths, sorting and disjointness', () => {
  const iv = intervals(2000, rng(), { min: 10, max: 1000, minLength: 1, maxLength: 50 });
  assert.equal(iv.length, 2000);
  assert.ok(iv.every(([s, e]) => s >= 10 && e <= 1000 && e - s >= 1 && e - s <= 50));
  const sorted = intervals(500, rng(), { sorted: true });
  assert.ok(sorted.every((x, i) => i === 0 || sorted[i - 1][0] <= x[0]));
  const dis = intervals(1000, rng(), { min: 0, max: 100000, maxLength: 20, disjoint: true });
  assert.ok(dis.every(([s, e]) => s >= 0 && e <= 100000 && e - s <= 20));
  assert.ok(dis.every((x, i) => i === 0 || dis[i - 1][1] < x[0]), 'disjoint intervals come sorted and do not touch');
  assert.throws(() => intervals(100, rng(), { min: 0, max: 99, maxLength: 5, disjoint: true }), /not enough room/);
  assert.throws(() => intervals(1, rng(), { minLength: 5, maxLength: 1 }), /minLength/);
});

test('edgeList: no self loops or duplicates, connected, acyclic, weighted, one-based', () => {
  const und = edgeList(200, 1000, rng());
  assert.equal(und.length, 1000);
  const keys = new Set(und.map(([u, v]) => `${Math.min(u, v)}-${Math.max(u, v)}`));
  assert.equal(keys.size, 1000, 'no duplicate in either direction');
  assert.ok(und.every(([u, v]) => u !== v && u >= 0 && v >= 0 && u < 200 && v < 200));

  // Connected: a union-find over the edges ends with one set.
  const n = 500;
  const conn = edgeList(n, n - 1, rng(), { connected: true });
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const [u, v] of conn) parent[find(u)] = find(v);
  assert.equal(new Set(parent.map((_, i) => find(i))).size, 1);

  // Acyclic: Kahn's algorithm takes every node.
  const dag = edgeList(n, 2000, rng(), { directed: true, acyclic: true, connected: true });
  const indeg = new Array(n).fill(0);
  const out = Array.from({ length: n }, () => []);
  for (const [u, v] of dag) {
    out[u].push(v);
    indeg[v]++;
  }
  const queue = indeg.flatMap((d, i) => (d === 0 ? [i] : []));
  for (let h = 0; h < queue.length; h++) for (const v of out[queue[h]]) if (--indeg[v] === 0) queue.push(v);
  assert.equal(queue.length, n);

  const directed = edgeList(30, 400, rng(), { directed: true });
  assert.equal(new Set(directed.map(([u, v]) => `${u}>${v}`)).size, 400);

  const weighted = edgeList(50, 100, rng(), { weights: [1, 9], oneBased: true });
  assert.ok(weighted.every(([u, v, w]) => u >= 1 && v >= 1 && u <= 50 && v <= 50 && w >= 1 && w <= 9));

  assert.throws(() => edgeList(4, 7, rng()), /do not fit/);
  assert.throws(() => edgeList(10, 5, rng(), { connected: true }), /at least nodes - 1/);
  assert.throws(() => edgeList(10, 5, rng(), { acyclic: true }), /directed/);
});
