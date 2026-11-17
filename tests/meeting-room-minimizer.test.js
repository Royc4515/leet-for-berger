import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/meeting-room-minimizer/problem.js';

// Brute force: the busiest moment. With half-open meetings it is always some start time, so count
// the meetings running at each start. Independent of the reference's sorted sweep.
function brute(intervals) {
  let best = 0;
  for (const [t] of intervals) {
    let running = 0;
    for (const [s, e] of intervals) if (s <= t && t < e) running++;
    best = Math.max(best, running);
  }
  return best;
}

test('reference matches brute force on 2000 random inputs', () => {
  const rnd = mulberry32(8);
  const pick = (k) => Math.floor(rnd() * k);
  for (let t = 0; t < 2000; t++) {
    const intervals = Array.from({ length: 1 + pick(10) }, () => {
      const s = pick(15);
      return [s, s + 1 + pick(6)];
    });
    assert.equal(reference(intervals), brute(intervals), JSON.stringify(intervals));
  }
});

test('visible expectations agree with the reference; every test parses; sizes as declared', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('custom input parser rejects bad input', () => {
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[3,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[4,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[-1,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,2,3]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1000000000],[5,6]]').ok, true);
});
