import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/trade-cooldown/problem.js';

// Brute force: every decision on every day (unmemoized), exponential but fine for short series.
function brute(prices, day = 0, holding = false) {
  if (day >= prices.length) return 0;
  const wait = brute(prices, day + 1, holding);
  // Selling skips the next day: that is the rest day.
  const act = holding ? prices[day] + brute(prices, day + 2, false) : -prices[day] + brute(prices, day + 1, true);
  return Math.max(wait, act);
}

test('reference matches brute force on 2000 random price series', () => {
  const rnd = mulberry32(353);
  for (let t = 0; t < 2000; t++) {
    const n = 1 + Math.floor(rnd() * 12);
    const prices = Array.from({ length: n }, () => Math.floor(rnd() * (t % 2 ? 6 : 100)));
    assert.equal(reference(prices), brute(prices), JSON.stringify(prices));
  }
});

test('visible expectations agree; 15 valid cases; two cases with 10^5 days', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser', () => {
  assert.deepEqual(problem.parseCustomInput('[1,2,3,0,2]').args, [[1, 2, 3, 0, 2]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[-1]').ok, false);
  assert.equal(problem.parseCustomInput('[10001]').ok, false);
  assert.equal(problem.parseCustomInput('[1.5]').ok, false);
  assert.equal(problem.parseCustomInput(JSON.stringify(Array(100001).fill(1))).ok, false);
  assert.equal(problem.parseCustomInput('{"a":1}').ok, false);
});
