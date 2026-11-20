import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/weighted-draw-lookup/problem.js';

// Brute force: walk the intervals one by one and test containment directly. Independent of the
// prefix array and the binary search.
function brute(weights, draws) {
  return draws.map((d) => {
    let start = 0;
    for (let i = 0; i < weights.length; i++) {
      if (d >= start && d < start + weights[i]) return i;
      start += weights[i];
    }
    throw new Error('draw outside the line');
  });
}

// Classic wrong answer: the first prefix that is at least d (lower bound), off by one on edges.
function lowerBound(weights, draws) {
  const prefix = [];
  let total = 0;
  for (const w of weights) prefix.push((total += w));
  return draws.map((d) => {
    let lo = 0;
    let hi = prefix.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prefix[mid] >= d) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  });
}

// Classic wrong answer: ignores the weights and spreads the draws evenly over the indices.
const byPosition = (weights, draws) => {
  const total = weights.reduce((s, v) => s + v, 0);
  return draws.map((d) => Math.floor((d * weights.length) / total));
};

function randomCase(rnd) {
  const n = 1 + Math.floor(rnd() * 8);
  const maxW = [1, 3, 10, 10000][Math.floor(rnd() * 4)];
  const weights = Array.from({ length: n }, () => 1 + Math.floor(rnd() * maxW));
  const total = weights.reduce((s, v) => s + v, 0);
  const q = 1 + Math.floor(rnd() * 12);
  return [weights, Array.from({ length: q }, () => Math.floor(rnd() * total))];
}

test('reference matches brute force on 3000 seeded small inputs', () => {
  const rnd = mulberry32(528);
  for (let i = 0; i < 3000; i++) {
    const [weights, draws] = randomCase(rnd);
    assert.deepEqual(reference(weights, draws), brute(weights, draws), JSON.stringify([weights, draws]));
  }
});

test('reference matches brute force on every draw of 60 seeded mid-size arrays', () => {
  const rnd = mulberry32(529);
  for (let i = 0; i < 60; i++) {
    const weights = Array.from({ length: 40 }, () => 1 + Math.floor(rnd() * 25));
    const total = weights.reduce((s, v) => s + v, 0);
    const draws = Array.from({ length: total }, (_, d) => d);
    assert.deepEqual(reference(weights, draws), brute(weights, draws));
  }
});

test('visible expectations agree with the reference and the brute force', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
});

test('hidden tests are valid, include at least two max-size tests and stay below 2^31', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const t of suite) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
    assert.ok(t.args[0].reduce((s, v) => s + v, 0) < 2 ** 31);
  }
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1].length === 100000);
  assert.ok(big.length >= 2);
  // The largest allowed total, exactly 10^9.
  assert.ok(problem.hiddenTests.some((t) => t.args[0].reduce((s, v) => s + v, 0) === 1e9));
});

test('hidden tests catch the classic wrong answers', () => {
  for (const wrong of [lowerBound, byPosition]) {
    assert.ok(problem.hiddenTests.some((t) => JSON.stringify(wrong(...t.args)) !== JSON.stringify(t.expected)), `${wrong.name} passes every hidden test`);
  }
  // The lower bound is wrong on the visible edge draws too, so the first Run already shows it.
  assert.ok(problem.visibleTests.some((t) => JSON.stringify(lowerBound(...t.args)) !== JSON.stringify(t.expected)));
});

test('a scan per draw would take billions of steps on the max tests', () => {
  // A linear scan stops at the answer, so its cost is the sum of (answer + 1) over the draws.
  const cost = (t) => t.expected.reduce((s, i) => s + i + 1, 0);
  const heavy = problem.hiddenTests.filter((t) => cost(t) > 2e9);
  assert.ok(heavy.length >= 2, `only ${heavy.length} tests cost more than 2e9 steps`);
});

test('custom input parser rejects invalid input', () => {
  assert.equal(problem.parseCustomInput('[1,3]\n[0,1,2,3]').ok, true);
  assert.equal(problem.parseCustomInput('[1,3]\n[4]').ok, false);
  assert.equal(problem.parseCustomInput('[1,3]\n[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[0,3]\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('[1,3]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[1,3]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]\n[0]').ok, false);
  assert.equal(problem.parseCustomInput('nope\n[0]').ok, false);
});
