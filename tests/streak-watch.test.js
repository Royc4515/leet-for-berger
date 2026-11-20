import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/streak-watch/problem.js';

// Brute force: keep every reading and inspect the last k. Independent of the run counter.
function brute(ops, args) {
  let target = 0;
  let k = 0;
  const seen = [];
  return ops.map((op, i) => {
    if (op === 'observe') {
      seen.push(args[i][0]);
      return seen.length >= k && seen.slice(seen.length - k).every((v) => v === target);
    }
    [target, k] = args[i];
    return null;
  });
}

/** Wrong-answer factory: `step(state, isTarget, k)` returns the answer and updates the counter. */
function withCounter(step) {
  return (ops, args) => {
    let target = 0;
    let k = 0;
    const state = { count: 0 };
    return ops.map((op, i) => {
      if (op === 'observe') return step(state, args[i][0] === target, k);
      [target, k] = args[i];
      return null;
    });
  };
}

// Classic wrong answer: counts all target readings so far, not the current run.
const totalMatches = withCounter((s, isTarget, k) => {
  if (isTarget) s.count++;
  return s.count >= k;
});

// Classic wrong answer: starts the count over once it reaches k, so a long streak answers true
// only every k-th reading.
const resetsAtK = withCounter((s, isTarget, k) => {
  s.count = isTarget ? s.count + 1 : 0;
  if (s.count >= k) {
    s.count = 0;
    return true;
  }
  return false;
});

// Classic wrong answer: only looks at the latest reading.
const latestOnly = (ops, args) => {
  let target = 0;
  return ops.map((op, i) => {
    if (op === 'observe') return args[i][0] === target;
    [target] = args[i];
    return null;
  });
};

function randomCase(rnd) {
  const k = 1 + Math.floor(rnd() * 5);
  const range = 1 + Math.floor(rnd() * 3);
  const target = 1 + Math.floor(rnd() * range);
  const readings = Array.from({ length: 1 + Math.floor(rnd() * 30) }, () => 1 + Math.floor(rnd() * range));
  return [['StreakWatch', ...readings.map(() => 'observe')], [[target, k], ...readings.map((r) => [r])]];
}

test('reference matches brute force on 3000 random sequences', () => {
  const rnd = mulberry32(2526);
  let trues = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    trues += expected.filter((v) => v === true).length;
  }
  assert.ok(trues > 2000, `only ${trues} true answers`);
});

test('every test sequence is valid; visible expectations agree; at least two 10^5-call tests', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
  for (const t of problem.visibleTests) {
    assert.deepEqual(reference(...t.args), t.expected);
    assert.deepEqual(brute(...t.args), t.expected);
  }
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    const raw = `${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`;
    assert.equal(problem.parseCustomInput(raw).ok, true, raw.slice(0, 80));
  }
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length >= 99999).length >= 2);
  // A long run must produce a long stretch of true answers, or a O(k) scan would never be stressed.
  assert.ok(problem.hiddenTests.some((t) => t.expected.filter((v) => v === true).length > 40000));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  for (const wrong of [totalMatches, resetsAtK, latestOnly]) {
    assert.ok(suite.some((t) => !deepEq(wrong(...t.args), t.expected)), `${wrong.name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => !deepEq(wrong(...t.args), t.expected)), `${wrong.name} passes every hidden case`);
  }
});

function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

test('custom input parser rejects invalid sequences', () => {
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4,3],[4]]').ok, true);
  assert.equal(problem.parseCustomInput('["observe"]\n[[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4],[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4,0],[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4,100001],[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[1000000001,3],[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","push"]\n[[4,3],[4]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4,3],[]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch","observe"]\n[[4,3],[0]]').ok, false);
  assert.equal(problem.parseCustomInput('["StreakWatch"]\n[[4,3],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
