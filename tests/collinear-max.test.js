import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/collinear-max/problem.js';

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

// Independent check: the slope-hashing method with exact reduced directions, keyed by string.
function hashing(points, { reduce = true, canonicalSign = true, laterOnly = false } = {}) {
  if (points.length <= 2) return points.length;
  let best = 1;
  for (let i = 0; i < points.length; i++) {
    const seen = new Map();
    for (let j = laterOnly ? i + 1 : 0; j < points.length; j++) {
      if (j === i) continue;
      let dx = points[j][0] - points[i][0];
      let dy = points[j][1] - points[i][1];
      if (reduce) {
        const g = gcd(dx, dy);
        dx /= g;
        dy /= g;
      }
      if (canonicalSign && (dx < 0 || (dx === 0 && dy < 0))) {
        dx = -dx;
        dy = -dy;
      }
      const key = `${dx},${dy}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
      best = Math.max(best, seen.get(key) + 1);
    }
  }
  return best;
}

// Classic wrong answers.
const noGcd = (points) => hashing(points, { reduce: false });
// Only later points per anchor, as the shipped solutions do: then a missing sign fix splits a line.
const noCanonicalSign = (points) => hashing(points, { canonicalSign: false, laterOnly: true });
const onePointIsZero = (points) => (points.length === 1 ? 0 : reference(points));

const randomPoints = (rnd, n, span) => {
  const seen = new Set();
  const out = [];
  while (out.length < n) {
    const p = [Math.floor(rnd() * (2 * span + 1)) - span, Math.floor(rnd() * (2 * span + 1)) - span];
    if (seen.has(`${p}`)) continue;
    seen.add(`${p}`);
    out.push(p);
  }
  return out;
};

test('reference (cross products) matches exact slope hashing on 2000 seeded cases', () => {
  const rnd = mulberry32(149);
  for (let c = 0; c < 2000; c++) {
    const span = 1 + Math.floor(rnd() * 6);
    const n = 1 + Math.floor(rnd() * Math.min(20, (2 * span + 1) ** 2));
    const points = randomPoints(rnd, n, span);
    assert.equal(reference(points), hashing(points), JSON.stringify(points));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(hashing(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 300).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [noGcd, noCanonicalSign]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
  assert.ok([...problem.visibleTests, ...problem.hiddenTests].some((t) => onePointIsZero(...t.args) !== t.expected));
});

test('custom input parser enforces size, range and distinct points', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,1],[2,2]]').args, [[[1, 1], [2, 2]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,1],[1,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[10001,0]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1]]').ok, false);
});
