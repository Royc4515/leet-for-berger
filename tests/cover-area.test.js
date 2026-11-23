import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/cover-area/problem.js';

// Brute force: count unit cells covered by either rectangle on a small grid.
function brute(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  let area = 0;
  for (let x = -20; x < 20; x++) {
    for (let y = -20; y < 20; y++) {
      const inA = x >= ax1 && x < ax2 && y >= ay1 && y < ay2;
      const inB = x >= bx1 && x < bx2 && y >= by1 && y < by2;
      if (inA || inB) area++;
    }
  }
  return area;
}

// Classic wrong answers.
function noClamp(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
  const h = Math.min(ay2, by2) - Math.max(ay1, by1);
  return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - w * h;
}
function clampProduct(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
  const h = Math.min(ay2, by2) - Math.max(ay1, by1);
  return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - Math.max(0, w * h);
}
function assumeBRight(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const w = Math.max(0, ax2 - bx1);
  const h = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - w * h;
}

const randRect = (rnd) => {
  const a = Math.floor(rnd() * 41) - 20;
  const b = Math.floor(rnd() * 41) - 20;
  return [Math.min(a, b), Math.max(a, b)];
};

test('reference matches a cell-counting brute force on 5000 seeded rectangle pairs', () => {
  const rnd = mulberry32(223);
  for (let k = 0; k < 5000; k++) {
    const [ax1, ax2] = randRect(rnd);
    const [ay1, ay2] = randRect(rnd);
    const [bx1, bx2] = randRect(rnd);
    const [by1, by2] = randRect(rnd);
    const args = [ax1, ay1, ax2, ay2, bx1, by1, bx2, by2];
    assert.equal(reference(...args), brute(...args), JSON.stringify(args));
  }
});

test('visible expectations agree; 15 valid cases; the full range appears', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(t.args.join(' ')).ok, true);
  assert.ok(problem.hiddenTests.some((t) => t.args.includes(10000) && t.args.includes(-10000)));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [noClamp, clampProduct, assumeBRight]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden case`);
  }
});

test('custom input parser enforces 8 ordered coordinates in range', () => {
  assert.deepEqual(problem.parseCustomInput('-3, 0, 3, 4, 0, -1, 9, 2').args, [-3, 0, 3, 4, 0, -1, 9, 2]);
  assert.deepEqual(problem.parseCustomInput('[-3,0,3,4,0,-1,9,2]').args, [-3, 0, 3, 4, 0, -1, 9, 2]);
  assert.equal(problem.parseCustomInput('1 2 3').ok, false);
  assert.equal(problem.parseCustomInput('3 0 1 4 0 0 1 1').ok, false);
  assert.equal(problem.parseCustomInput('0 0 1 1 0 0 1 10001').ok, false);
  assert.equal(problem.parseCustomInput('0 0 1 1 0 0 1 1.5').ok, false);
});
