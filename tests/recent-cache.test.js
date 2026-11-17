import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/recent-cache/problem.js';

// Brute force: entries carry a "last used" timestamp; eviction scans for the smallest one.
// Independent of the reference's Map ordering.
function brute(ops, args) {
  const capacity = args[0][0];
  const entries = new Map(); // key -> { value, used }
  let clock = 0;
  return ops.map((op, i) => {
    if (op === 'get') {
      const e = entries.get(args[i][0]);
      if (!e) return -1;
      e.used = ++clock;
      return e.value;
    }
    if (op === 'put') {
      const [key, value] = args[i];
      entries.set(key, { value, used: ++clock });
      if (entries.size > capacity) {
        let oldest = null;
        for (const [k, e] of entries) if (oldest === null || e.used < entries.get(oldest).used) oldest = k;
        entries.delete(oldest);
      }
    }
    return null;
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(79);
  for (let t = 0; t < 1000; t++) {
    const capacity = 1 + Math.floor(rnd() * 4);
    const keys = 1 + Math.floor(rnd() * 8);
    const ops = ['LruCache'];
    const args = [[capacity]];
    for (let i = 0; i < 40; i++) {
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
  // Sessions with 2 * 10^5 calls on a large cache, where an O(capacity) scan per call is too slow.
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 200001 && t.args[1][0][0] >= 50000);
  assert.ok(big.length >= 2);
  // Every big session has hits, so it is not trivially all -1, and misses occur too.
  for (const t of big) assert.ok(t.expected.some((v) => v !== null && v >= 0));
  assert.ok(big.some((t) => t.expected.some((v) => v === -1)));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['LruCache', 'put', 'get'], [[1], [1, 1], [1]]), true);
  assert.equal(ok(['LruCache'], [[0]]), false);
  assert.equal(ok(['LruCache'], [[100001]]), false);
  assert.equal(ok(['LruCache', 'get'], [[1], [-1]]), false);
  assert.equal(ok(['LruCache', 'put'], [[1], [1]]), false);
  assert.equal(ok(['LruCache', 'put'], [[1], [1, 1000000001]]), false);
  assert.equal(ok(['LruCache', 'delete'], [[1], [1]]), false);
  assert.equal(ok(['Cache'], [[1]]), false);
  assert.equal(problem.parseCustomInput('["LruCache"]').ok, false);
});
