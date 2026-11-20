import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/daily-load-limit/problem.js';

// Days a limit needs, packages in order.
function daysFor(weights, limit, strict = false) {
  let days = 1;
  let load = 0;
  for (const w of weights) {
    if (strict ? load + w >= limit : load + w > limit) {
      days++;
      load = 0;
    }
    load += w;
  }
  return days;
}

// Brute force: try every limit from the heaviest package upward until one works.
function brute(weights, days) {
  for (let limit = Math.max(...weights); ; limit++) if (daysFor(weights, limit) <= days) return limit;
}

// Classic wrong answers.
// The average as the answer, with the heaviest package as the floor.
const ceilAverage = (weights, days) => Math.max(Math.max(...weights), Math.ceil(weights.reduce((s, v) => s + v, 0) / days));
// Packages reordered heaviest first: the order is part of the problem.
const sortedFirst = (weights, days) => reference([...weights].sort((a, b) => b - a), days);
// Strict comparison: a load equal to the limit is wrongly rejected.
function strictLimit(weights, days) {
  let limit = Math.max(...weights);
  while (daysFor(weights, limit, true) > days) limit++;
  return limit;
}
// Searching only up to the total divided by days, then giving up.
const averageOnly = (weights, days) => Math.ceil(weights.reduce((s, v) => s + v, 0) / days);

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 12);
  const max = [3, 10, 100][Math.floor(rnd() * 3)];
  const weights = Array.from({ length: n }, () => 1 + Math.floor(rnd() * max));
  return [weights, 1 + Math.floor(rnd() * n)];
}

test('reference matches brute force on 3000 seeded small inputs', () => {
  const rnd = mulberry32(1011);
  for (let i = 0; i < 3000; i++) {
    const [weights, days] = randomCase(rnd);
    assert.equal(reference(weights, days), brute(weights, days), JSON.stringify([weights, days]));
  }
});

test('reference matches brute force on 40 seeded medium inputs', () => {
  const rnd = mulberry32(1012);
  for (let i = 0; i < 40; i++) {
    const weights = Array.from({ length: 300 }, () => 1 + Math.floor(rnd() * 200));
    const days = 1 + Math.floor(rnd() * 60);
    assert.equal(reference(weights, days), brute(weights, days));
  }
});

test('visible expectations agree with the reference and the brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
});

test('hidden tests are valid, include at least two max-size tests, and reach the largest total', () => {
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${t.args[1]}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
    assert.ok(t.args[0].reduce((s, v) => s + v, 0) < 2 ** 31);
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
  assert.ok(problem.hiddenTests.some((t) => t.expected === 1e9));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [ceilAverage, sortedFirst, strictLimit, averageOnly]) {
    assert.ok(problem.hiddenTests.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every hidden test`);
  }
  // The average and the strict comparison already show on the visible cases.
  assert.ok(problem.visibleTests.some((t) => ceilAverage(...t.args) !== t.expected));
  assert.ok(problem.visibleTests.some((t) => strictLimit(...t.args) !== t.expected));
});

test('trying every limit upward would take billions of passes on the max tests', () => {
  // Each wasted limit is an O(n) pass; the answer minus the heaviest package counts them.
  const passes = (t) => (t.expected - Math.max(...t.args[0])) * t.args[0].length;
  assert.ok(problem.hiddenTests.filter((t) => passes(t) > 1e12).length >= 2);
});

test('custom input parser rejects invalid input', () => {
  assert.equal(problem.parseCustomInput('[1,2,3]\n2').ok, true);
  assert.equal(problem.parseCustomInput('[1,2,3]\n4').ok, false);
  assert.equal(problem.parseCustomInput('[1,2,3]\n0').ok, false);
  assert.equal(problem.parseCustomInput('[]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[0,2]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n1').ok, false);
  assert.equal(problem.parseCustomInput('[1,2]').ok, false);
  assert.equal(problem.parseCustomInput('nope\n1').ok, false);
});
