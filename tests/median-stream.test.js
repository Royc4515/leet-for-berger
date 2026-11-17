import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/median-stream/problem.js';

// Brute force: keep every number, sort a copy on each query. Independent of the reference.
function brute(ops, args) {
  const seen = [];
  return ops.map((op, i) => {
    if (op === 'addNum') seen.push(args[i][0]);
    if (op !== 'findMedian') return null;
    const s = [...seen].sort((x, y) => x - y);
    const n = s.length;
    return n % 2 ? 2 * s[(n - 1) / 2] : s[n / 2 - 1] + s[n / 2];
  });
}

test('reference matches brute force on 1000 random sessions', () => {
  const rnd = mulberry32(29);
  for (let k = 0; k < 1000; k++) {
    const ops = ['MedianFinder'];
    const args = [[]];
    const range = 1 + Math.floor(rnd() * 30);
    for (let i = 0; i < 30; i++) {
      ops.push('addNum');
      args.push([Math.floor(rnd() * (2 * range + 1)) - range]);
      if (rnd() < 0.6) {
        ops.push('findMedian');
        args.push([]);
      }
    }
    assert.deepEqual(reference(ops, args), brute(ops, args));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].filter((o) => o === 'findMedian').length === 50000);
  assert.ok(big.length >= 2);
  // At least one answer must need more than 32 bits, or the long return is never exercised.
  const all = [...problem.visibleTests, ...problem.hiddenTests].flatMap((t) => t.expected);
  assert.ok(all.some((v) => v !== null && Math.abs(v) > 2 ** 31));
});

test('custom input parser rejects invalid sessions', () => {
  const ok = (ops, args) => problem.parseCustomInput(`${JSON.stringify(ops)}\n${JSON.stringify(args)}`).ok;
  assert.equal(ok(['MedianFinder', 'addNum', 'findMedian'], [[], [1], []]), true);
  assert.equal(ok(['MedianFinder', 'findMedian'], [[], []]), false);
  assert.equal(ok(['MedianFinder', 'addNum'], [[], [2147483648]]), false);
  assert.equal(ok(['MedianFinder', 'addNum'], [[], [1.5]]), false);
  assert.equal(ok(['MedianFinder', 'removeNum'], [[], [1]]), false);
  assert.equal(ok(['Median'], [[]]), false);
  assert.equal(problem.parseCustomInput('["MedianFinder"]').ok, false);
});
