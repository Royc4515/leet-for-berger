import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/most-events/problem.js';

// Brute force: maximum bipartite matching between events and days (augmenting paths).
function brute(events) {
  const dayOwner = new Map();
  const tryAssign = (e, seen) => {
    for (let d = events[e][0]; d <= events[e][1]; d++) {
      if (seen.has(d)) continue;
      seen.add(d);
      if (!dayOwner.has(d) || tryAssign(dayOwner.get(d), seen)) {
        dayOwner.set(d, e);
        return true;
      }
    }
    return false;
  };
  let count = 0;
  for (let e = 0; e < events.length; e++) if (tryAssign(e, new Set())) count++;
  return count;
}

// Classic wrong answers.
function intervalScheduling(events) {
  const s = [...events].sort((a, b) => a[1] - b[1]);
  let last = 0;
  let count = 0;
  for (const [a, b] of s) {
    if (a > last) {
      count++;
      last = b;
    }
  }
  return count;
}
function startDayOnly(events) {
  const used = new Set();
  for (const [a] of events) used.add(a);
  return used.size;
}
function earliestStartFirst(events) {
  const s = [...events].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const used = new Set();
  let count = 0;
  for (const [a, b] of s) {
    for (let d = a; d <= b; d++) {
      if (!used.has(d)) {
        used.add(d);
        count++;
        break;
      }
    }
  }
  return count;
}

test('reference matches a bipartite-matching brute force on 2000 seeded small cases', () => {
  const rnd = mulberry32(1353);
  for (let c = 0; c < 2000; c++) {
    const n = 1 + Math.floor(rnd() * 12);
    const days = 1 + Math.floor(rnd() * 10);
    const events = Array.from({ length: n }, () => {
      const a = 1 + Math.floor(rnd() * days);
      return [a, a + Math.floor(rnd() * (days - a + 1))];
    });
    assert.equal(reference(events), brute(events), JSON.stringify(events));
  }
});

test('visible expectations agree; 15 valid cases; at least two at the size limit', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.equal(reference(...t.args), t.expected);
    assert.equal(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(JSON.stringify(t.args[0])).ok, true);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 100000).length >= 2);
});

test('hidden tests catch the classic wrong answers', () => {
  const small = problem.hiddenTests.filter((t) => t.args[0].length <= 1000);
  for (const wrong of [intervalScheduling, startDayOnly, earliestStartFirst]) {
    assert.ok(small.some((t) => wrong(...t.args) !== t.expected), `${wrong.name} passes every small hidden case`);
  }
});

test('custom input parser enforces the limits', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,2],[2,3]]').args, [[[1, 2], [2, 3]]]);
  assert.equal(problem.parseCustomInput('[]').ok, false);
  assert.equal(problem.parseCustomInput('[[2,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[0,1]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1,100001]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1]]').ok, false);
});
