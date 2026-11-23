import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/view-cone/problem.js';

// Brute force with exact integer geometry, no floating point: try facing every point's own
// direction as one edge of the view (a best view can always be turned until a point sits on its
// edge) and count the points within the view by comparing exact angles via cross products.
function brute(points, angle, location) {
  const [x, y] = location;
  const dirs = [];
  let here = 0;
  for (const [px, py] of points) {
    if (px === x && py === y) here++;
    else dirs.push([px - x, py - y]);
  }
  if (!dirs.length) return here;
  // Exact counter-clockwise angle from a to b in [0, 360) degrees, compared against `angle`
  // through atan2 only on the difference vector of two exact integer directions.
  const ccw = (a, b) => {
    const cross = a[0] * b[1] - a[1] * b[0];
    const dot = a[0] * b[0] + a[1] * b[1];
    if (cross === 0 && dot > 0) return 0;
    const deg = (Math.atan2(cross, dot) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  };
  let best = 0;
  for (const start of dirs) {
    let seen = 0;
    for (const d of dirs) if (ccw(start, d) <= angle + 1e-7) seen++;
    best = Math.max(best, seen);
  }
  return best + here;
}

// Classic wrong answers.
function noWrap(points, angle, location) {
  const [x, y] = location;
  let here = 0;
  const a = [];
  for (const [px, py] of points) {
    if (px === x && py === y) here++;
    else a.push(Math.atan2(py - y, px - x));
  }
  a.sort((p, q) => p - q);
  const w = (angle * Math.PI) / 180 + 1e-9;
  let best = 0;
  for (let i = 0, j = 0; j < a.length; j++) {
    while (a[j] - a[i] > w) i++;
    best = Math.max(best, j - i + 1);
  }
  return best + here;
}
function viewerHasAngleZero(points, angle, location) {
  const shifted = points.map(([px, py]) => (px === location[0] && py === location[1] ? [px + 0.000001, py] : [px, py]));
  return reference(shifted, angle, location);
}
function strictEdge(points, angle, location) {
  const [x, y] = location;
  let here = 0;
  const a = [];
  for (const [px, py] of points) {
    if (px === x && py === y) here++;
    else a.push(Math.atan2(py - y, px - x));
  }
  a.sort((p, q) => p - q);
  const m = a.length;
  for (let i = 0; i < m; i++) a.push(a[i] + 2 * Math.PI);
  const w = (angle * Math.PI) / 180 - 1e-9;
  let best = 0;
  for (let i = 0, j = 0; j < 2 * m; j++) {
    while (a[j] - a[i] > w) i++;
    best = Math.max(best, j - i + 1);
  }
  return Math.min(best, m) + here;
}

test('reference matches an exact-angle brute force on 3000 seeded small cases', () => {
  const rnd = mulberry32(1610);
  for (let k = 0; k < 3000; k++) {
    const n = 1 + Math.floor(rnd() * 12);
    const span = 1 + Math.floor(rnd() * 6);
    const pts = Array.from({ length: n }, () => [Math.floor(rnd() * (span + 1)), Math.floor(rnd() * (span + 1))]);
    const loc = [Math.floor(rnd() * (span + 1)), Math.floor(rnd() * (span + 1))];
    const angle = [0, 45, 90, 135, 180, 270, 359, Math.floor(rnd() * 360)][k % 8];
    assert.equal(reference(pts, angle, loc), brute(pts, angle, loc), JSON.stringify([pts, angle, loc]));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${t.args[1]}\n${JSON.stringify(t.args[2])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [noWrap, viewerHasAngleZero, strictEdge]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser accepts three values and enforces the limits', () => {
  assert.deepEqual(problem.parseCustomInput('[[2,1],[2,2],[3,3]]; 90; [1,1]').args, [[[2, 1], [2, 2], [3, 3]], 90, [1, 1]]);
  assert.equal(problem.parseCustomInput('[[2,1]]; 360; [1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,101]]; 90; [1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[]; 90; [1,1]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1]]; 90').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1]]; 90; [1]').ok, false);
});
