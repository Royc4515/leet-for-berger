import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/frequent-cache/problem.js';

// Brute force: every entry carries a use count and a "last used" timestamp; eviction scans for
// the smallest (count, timestamp) pair. Independent of the reference's per-count buckets.
function brute(ops, args) {
  const capacity = args[0][0];
  const entries = new Map(); // key -> { value, count, used }
  let clock = 0;
  return ops.map((op, i) => {
    if (op === 'get') {
      const e = entries.get(args[i][0]);
      if (!e) return -1;
      e.count++;
      e.used = ++clock;
      return e.value;
    }
    if (op === 'put') {
      const [key, value] = args[i];
      const e = entries.get(key);
      if (e) {
        e.value = value;
        e.count++;
        e.used = ++clock;
        return null;
      }
      if (entries.size === capacity) {
        let victim = null;
        for (const [k, x] of entries) {
          const v = victim === null ? null : entries.get(victim);
          if (v === null || x.count < v.count || (x.count === v.count && x.used < v.used)) victim = k;
        }
        entries.delete(victim);
      }
      entries.set(key, { value, count: 1, used: ++clock });
    }
    return null;
  });
}

/**
 * Number of evictions in a session, fast enough for 2 * 10^5 calls: a min-heap of
 * (count, last use, key) snapshots with lazy deletion, where stale snapshots are skipped.
 */
function countEvictions(ops, args) {
  const capacity = args[0][0];
  const entries = new Map(); // key -> { count, used }
  const heap = [];
  const less = (a, b) => a[0] - b[0] || a[1] - b[1];
  const push = (v) => {
    heap.push(v);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (less(heap[i], heap[p]) >= 0) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        let m = i;
        if (l < heap.length && less(heap[l], heap[m]) < 0) m = l;
        if (l + 1 < heap.length && less(heap[l + 1], heap[m]) < 0) m = l + 1;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  let clock = 0;
  let evicted = 0;
  const use = (key, e) => {
    e.count++;
    e.used = ++clock;
    push([e.count, e.used, key]);
  };
  ops.forEach((op, i) => {
    const key = args[i][0];
    const e = entries.get(key);
    if (op === 'get' && e) use(key, e);
    if (op !== 'put') return;
    if (e) return use(key, e);
    if (entries.size === capacity) {
      for (;;) {
        const [count, used, k] = pop();
        const x = entries.get(k);
        if (x && x.count === count && x.used === used) {
          entries.delete(k);
          break;
        }
      }
      evicted++;
    }
    const fresh = { count: 0, used: 0 };
    entries.set(key, fresh);
    use(key, fresh);
  });
  return evicted;
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(83);
  for (let t = 0; t < 1000; t++) {
    const capacity = 1 + Math.floor(rnd() * 4);
    const keys = 1 + Math.floor(rnd() * 8);
    const ops = ['LfuCache'];
    const args = [[capacity]];
    for (let i = 0; i < 50; i++) {
      const key = Math.floor(rnd() * keys);
      if (rnd() < 0.5) {
        ops.push('get');
        args.push([key]);
      } else {
        ops.push('put');
        args.push([key, Math.floor(rnd() * 100)]);
      }
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree; max-size cases; inputs are valid', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of problem.hiddenTests.slice(0, 6)) assert.deepEqual(t.expected, brute(...t.args));
  // Large full caches where most puts evict: an O(capacity) victim search per eviction is too slow.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001 && countEvictions(...t.args) * t.args[1][0][0] >= 2e9);
  assert.ok(big.length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['LfuCache', 'put', 'get'], [[1], [1, 1], [1]]), true);
  assert.equal(ok(['LfuCache'], [[0]]), false);
  assert.equal(ok(['LfuCache', 'get'], [[1], [100001]]), false);
  assert.equal(ok(['LfuCache', 'put'], [[1], [1, -1]]), false);
  assert.equal(ok(['LfuCache', 'put'], [[1], [1]]), false);
  assert.equal(ok(['LfuCache', 'evict'], [[1], []]), false);
  assert.equal(ok(['LruCache'], [[1]]), false);
  assert.equal(problem.parseCustomInput('["LfuCache"]').ok, false);
});
