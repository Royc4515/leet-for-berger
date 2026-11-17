import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/cookie-match/problem.js';

// Brute force: maximum bipartite matching by trying every assignment recursively.
function brute(g, s) {
  const used = Array(s.length).fill(false);
  const go = (i) => {
    if (i === g.length) return 0;
    let best = go(i + 1); // child i gets nothing
    for (let j = 0; j < s.length; j++) {
      if (used[j] || s[j] < g[i]) continue;
      used[j] = true;
      best = Math.max(best, 1 + go(i + 1));
      used[j] = false;
    }
    return best;
  };
  return go(0);
}

test('reference matches brute force on 1500 random inputs', () => {
  const rnd = mulberry32(83);
  for (let t = 0; t < 1500; t++) {
    const g = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => 1 + Math.floor(rnd() * 6));
    const s = Array.from({ length: Math.floor(rnd() * 7) }, () => 1 + Math.floor(rnd() * 6));
    assert.equal(reference(g, s), brute(g, s));
  }
});

test('visible expectations agree; two max-size cases; every test parses', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n[1]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n[2147483648]').ok, false);
  assert.equal(problem.parseCustomInput('[1]\n{}').ok, false);
  assert.deepEqual(problem.parseCustomInput('[1]\n[]').args, [[1], []]);
});
