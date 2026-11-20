import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/skyline-block/problem.js';

// Brute force: every span of bars, with the shortest bar of the span as the height. O(n^2).
function brute(heights) {
  let best = 0;
  for (let l = 0; l < heights.length; l++) {
    let min = Infinity;
    for (let r = l; r < heights.length; r++) {
      min = Math.min(min, heights[r]);
      best = Math.max(best, min * (r - l + 1));
    }
  }
  return best;
}

/** Stack scan with one detail changed: `sentinel` adds the final height-0 bar, `widthFix` the -1. */
function stackScan(heights, { sentinel = true, widthFix = 1 } = {}) {
  const stack = [];
  let best = 0;
  const end = sentinel ? heights.length : heights.length - 1;
  for (let i = 0; i <= end; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, height * (i - left - widthFix));
    }
    stack.push(i);
  }
  return best;
}

// Wrong answer: bars still on the stack when the scan ends are never popped.
const noFlush = (h) => stackScan(h, { sentinel: false });

// Wrong answer: width is i - left instead of i - left - 1.
const widthOffByOne = (h) => stackScan(h, { widthFix: 0 });

// Wrong answer: only rectangles of one or two bars are considered.
function atMostTwoBars(h) {
  let best = 0;
  for (let i = 0; i < h.length; i++) {
    best = Math.max(best, h[i]);
    if (i + 1 < h.length) best = Math.max(best, 2 * Math.min(h[i], h[i + 1]));
  }
  return best;
}

// Wrong answer: either the tallest single bar or the shortest bar across the whole skyline.
const maxOrGlobalMin = (h) => Math.max(Math.max(...h), Math.min(...h) * h.length);

function randomHeights(rnd) {
  const n = 1 + Math.floor(rnd() * 14);
  const hi = 1 + Math.floor(rnd() * 8);
  return Array.from({ length: n }, () => Math.floor(rnd() * (hi + 1)));
}

test('reference matches brute force on 3000 random skylines', () => {
  const rnd = mulberry32(84);
  for (let i = 0; i < 3000; i++) {
    const h = randomHeights(rnd);
    assert.equal(reference(h), brute(h), JSON.stringify(h));
  }
});

test('reference matches brute force on mid-size skylines', () => {
  const rnd = mulberry32(840);
  for (let i = 0; i < 100; i++) {
    const n = 200 + Math.floor(rnd() * 300);
    const hi = [3, 50, 10000][i % 3];
    const h = Array.from({ length: n }, () => Math.floor(rnd() * (hi + 1)));
    assert.equal(reference(h), brute(h));
  }
});

test('visible expectations agree; the largest area fits in 32 bits; at least two max-size tests', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
    assert.ok(t.expected >= 0 && t.expected <= 2 ** 31 - 1);
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000);
  assert.ok(big.length >= 2);
  // The full-width rectangle at the maximum height, which also drives the O(n^2) approach to 5 * 10^9 steps.
  assert.ok(big.some((t) => t.expected === 1000000000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const wrongs = { noFlush, widthOffByOne, atMostTwoBars, maxOrGlobalMin };
  for (const [name, wrong] of Object.entries(wrongs)) {
    assert.ok(suite.some((t) => wrong(t.args[0]) !== t.expected), `${name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => wrong(t.args[0]) !== t.expected), `${name} passes every hidden case`);
  }
  // The correct scan, with defaults, is the reference.
  for (const t of suite.slice(0, 8)) assert.equal(stackScan(t.args[0]), t.expected);
});

test('custom input parser rejects invalid skylines', () => {
  assert.equal(problem.parseCustomInput('[2,1,5,6,2,3]').ok, true);
  assert.equal(problem.parseCustomInput('[0]').ok, true);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput('["a"]').ok, false);
  assert.equal(problem.parseCustomInput('5').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(new Array(100001).fill(1))).ok, false);
});
