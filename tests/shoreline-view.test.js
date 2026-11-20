import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/shoreline-view/problem.js';

// Brute force from the definition: a building has a view when every building to its right is
// strictly shorter. Quadratic, independent of the scan.
function brute(heights) {
  const out = [];
  for (let i = 0; i < heights.length; i++) {
    let sees = true;
    for (let j = i + 1; j < heights.length; j++) if (heights[j] >= heights[i]) sees = false;
    if (sees) out.push(i);
  }
  return out;
}

// Classic wrong answers.
const nonStrict = (heights) => {
  const out = [];
  let tallest = 0;
  for (let i = heights.length - 1; i >= 0; i--) {
    if (heights[i] >= tallest) {
      out.push(i);
      tallest = heights[i];
    }
  }
  return out.reverse();
};
const nextOnly = (heights) => heights.map((h, i) => i).filter((i) => i === heights.length - 1 || heights[i] > heights[i + 1]);
const seaOnLeft = (heights) => {
  const out = [];
  let tallest = 0;
  heights.forEach((h, i) => {
    if (h > tallest) {
      out.push(i);
      tallest = h;
    }
  });
  return out;
};
const decreasingOrder = (heights) => reference(heights).reverse();
const dropsLast = (heights) => {
  const out = reference(heights);
  return out.length > 1 ? out.slice(0, -1) : out;
};

/** Random heights from a small range, so equal heights and ties are common. */
function randomHeights(rnd, n, range) {
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * range));
}

test('reference matches brute force on 3000 random rows', () => {
  const rnd = mulberry32(99);
  for (let i = 0; i < 3000; i++) {
    const heights = randomHeights(rnd, 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 8));
    assert.deepEqual(reference(heights), brute(heights), JSON.stringify(heights));
  }
});

test('visible expectations agree; 5 visible, 10 hidden, four at 10^5; the long rows are not trivial', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests.slice(0, 6)]) assert.deepEqual(brute(...t.args), t.expected);
  for (const t of problem.hiddenTests) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 2);
  // A strictly decreasing row: every building has a view, the worst case for scanning right.
  assert.ok(big.some((t) => t.expected.length === 100000));
  assert.ok(big.some((t) => t.expected.length === 1));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [nonStrict, nextOnly, seaOnLeft, decreasingOrder, dropsLast]) {
    assert.ok(suite.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every case`);
    assert.ok(
      problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)),
      `${wrong.name} passes every hidden case`,
    );
  }
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[4,2,3,1]'), { ok: true, args: [[4, 2, 3, 1]] });
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1000000001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('3').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
