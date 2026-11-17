import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/skyline-outline/problem.js';

// Brute force: between consecutive edge coordinates the height is constant, the tallest
// building covering that stretch; emit a point wherever it differs from the previous stretch.
function brute(buildings) {
  const xs = [...new Set(buildings.flatMap(([l, r]) => [l, r]))].sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const x of xs) {
    let h = 0;
    for (const [l, r, height] of buildings) if (l <= x && x < r) h = Math.max(h, height);
    if (h !== prev) out.push([x, h]);
    prev = h;
  }
  return out;
}

test('reference matches brute force on 2000 random cities', () => {
  const rnd = mulberry32(1208);
  for (let i = 0; i < 2000; i++) {
    const n = 1 + Math.floor(rnd() * 8);
    const buildings = Array.from({ length: n }, () => {
      const l = Math.floor(rnd() * 12);
      return [l, l + 1 + Math.floor(rnd() * 6), 1 + Math.floor(rnd() * 4)];
    }).sort((a, b) => a[0] - b[0]);
    assert.deepEqual(reference(buildings), brute(buildings));
  }
});

test('output rules hold: increasing x, no repeated height, ends at 0', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const pts = t.expected;
    assert.equal(pts[pts.length - 1][1], 0);
    for (let i = 1; i < pts.length; i++) {
      assert.ok(pts[i][0] > pts[i - 1][0]);
      assert.notEqual(pts[i][1], pts[i - 1][1]);
    }
  }
});

test('visible expectations agree; two 10^5 cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,2,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-1,2,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,2147483648,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[5,6,1],[1,2,1]]').ok, false);
  assert.deepEqual(problem.parseCustomInput('[[1,2,3]]').args, [[[1, 2, 3]]]);
});
