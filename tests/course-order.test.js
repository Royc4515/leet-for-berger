import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/course-order/problem.js';

// Brute force: walk all permutations in lexicographic order; the first one that respects every
// pair is the answer, and none means [].
function brute(n, pairs) {
  const perm = Array.from({ length: n }, (_, i) => i);
  const valid = () => {
    const pos = [];
    perm.forEach((c, i) => (pos[c] = i));
    return pairs.every(([a, b]) => pos[b] < pos[a]);
  };
  for (;;) {
    if (valid()) return [...perm];
    // Next permutation in lexicographic order.
    let i = n - 2;
    while (i >= 0 && perm[i] >= perm[i + 1]) i--;
    if (i < 0) return [];
    let j = n - 1;
    while (perm[j] <= perm[i]) j--;
    [perm[i], perm[j]] = [perm[j], perm[i]];
    perm.splice(i + 1, n - i - 1, ...perm.slice(i + 1).reverse());
  }
}

test('reference matches brute force on 1500 random graphs, both outcomes represented', () => {
  const rnd = mulberry32(83);
  let empty = 0;
  for (let i = 0; i < 1500; i++) {
    const n = 1 + Math.floor(rnd() * 7);
    const seen = new Set();
    const pairs = [];
    const tries = Math.floor(rnd() * 10);
    for (let t = 0; t < tries; t++) {
      const a = Math.floor(rnd() * n);
      const b = Math.floor(rnd() * n);
      if ((a === b && rnd() < 0.9) || seen.has(`${a},${b}`)) continue;
      seen.add(`${a},${b}`);
      pairs.push([a, b]);
    }
    const want = brute(n, pairs);
    assert.deepEqual(reference(n, pairs), want);
    if (!want.length) empty++;
  }
  assert.ok(empty > 100 && empty < 1200);
});

test('visible expectations agree; two max-size cases; both outcomes hidden; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  const big = problem.hiddenTests.filter((t) => t.args[0] === 100000);
  assert.ok(big.length >= 2 && big.some((t) => t.expected.length) && big.some((t) => !t.expected.length));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${t.args[0]}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('0\n[]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[2,0]]').ok, false);
  assert.equal(problem.parseCustomInput('2\n[[1,0],[1,0]]').ok, false);
  assert.equal(problem.parseCustomInput('2.5\n[]').ok, false);
  assert.deepEqual(problem.parseCustomInput('3\n[[0,1]]').args, [3, [[0, 1]]]);
});
