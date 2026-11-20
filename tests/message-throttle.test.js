import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/message-throttle/problem.js';

// Brute force: keep every message that was shown and scan for one inside the cooldown. Independent
// of the next-allowed map.
function brute(ops, args) {
  let cooldown = 0;
  const shown = [];
  return ops.map((op, i) => {
    if (op !== 'allow') {
      cooldown = args[i][0];
      return null;
    }
    const [time, message] = args[i];
    if (shown.some((s) => s.message === message && time - s.time < cooldown)) return false;
    shown.push({ time, message });
    return true;
  });
}

/** Wrong-answer factory: `decide(state, time, message, cooldown)` returns the answer and updates state. */
function throttle(decide) {
  return (ops, args) => {
    let cooldown = 0;
    const state = { next: new Map(), last: -Infinity, windowStart: 0, seen: new Set() };
    return ops.map((op, i) => {
      if (op !== 'allow') {
        cooldown = args[i][0];
        return null;
      }
      return decide(state, args[i][0], args[i][1], cooldown);
    });
  };
}

// Wrong answer: refreshes the stored time on every call, refused ones included.
const extendsOnRefuse = throttle((s, t, m, c) => {
  const ok = t >= (s.next.get(m) ?? 0);
  s.next.set(m, t + c);
  return ok;
});

// Wrong answer: strict comparison, so the message is blocked at exactly last + cooldown too.
const strictBoundary = throttle((s, t, m, c) => {
  if (s.next.has(m) && t <= s.next.get(m)) return false;
  s.next.set(m, t + c);
  return true;
});

// Wrong answer: one shared cooldown for all messages.
const sharedCooldown = throttle((s, t, m, c) => {
  if (t < s.last + c) return false;
  s.last = t;
  return true;
});

// Wrong answer: fixed windows of `cooldown` seconds that forget everything when a new one starts.
const fixedWindows = throttle((s, t, m, c) => {
  if (t >= s.windowStart + c) {
    s.windowStart = t;
    s.seen.clear();
  }
  if (s.seen.has(m)) return false;
  s.seen.add(m);
  return true;
});

function randomCase(rnd) {
  const cooldown = 1 + Math.floor(rnd() * 6);
  const pool = 1 + Math.floor(rnd() * 4);
  const calls = [];
  let now = Math.floor(rnd() * 3);
  const n = 1 + Math.floor(rnd() * 40);
  for (let k = 0; k < n; k++) {
    now += Math.floor(rnd() * 4);
    calls.push([now, String.fromCharCode(97 + Math.floor(rnd() * pool))]);
  }
  return [['MessageThrottle', ...calls.map(() => 'allow')], [[cooldown], ...calls]];
}

function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

test('reference matches brute force on 3000 random sessions', () => {
  const rnd = mulberry32(359);
  let trues = 0;
  let falses = 0;
  for (let i = 0; i < 3000; i++) {
    const [ops, args] = randomCase(rnd);
    const expected = brute(ops, args);
    assert.deepEqual(reference(ops, args), expected, JSON.stringify([ops, args]));
    trues += expected.filter((v) => v === true).length;
    falses += expected.filter((v) => v === false).length;
  }
  assert.ok(trues > 3000 && falses > 3000, `${trues} shown, ${falses} dropped`);
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
  // Both answers must be common among the big tests, or one lazy implementation would pass them.
  const big = problem.hiddenTests.filter((x) => x.args[0].length >= 99999);
  const shown = (t) => t.expected.filter((v) => v === true).length;
  assert.ok(big.some((t) => shown(t) > 50000));
  assert.ok(big.some((t) => t.expected.length - shown(t) > 50000));
  // A message with 30 letters and one at the 10^9 timestamp limit are exercised.
  assert.ok(problem.hiddenTests.some((t) => t.args[1].some((a) => typeof a[1] === 'string' && a[1].length === 30)));
  assert.ok(problem.hiddenTests.some((t) => t.args[1].some((a) => a[0] === 1000000000)));
});

test('hidden tests catch the classic wrong answers', () => {
  const suite = [...problem.visibleTests, ...problem.hiddenTests];
  const wrongs = { extendsOnRefuse, strictBoundary, sharedCooldown, fixedWindows };
  for (const [name, wrong] of Object.entries(wrongs)) {
    assert.ok(suite.some((t) => !deepEq(wrong(...t.args), t.expected)), `${name} passes every case`);
    assert.ok(problem.hiddenTests.some((t) => !deepEq(wrong(...t.args), t.expected)), `${name} passes every hidden case`);
  }
});

test('custom input parser rejects invalid sequences', () => {
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow","allow"]\n[[10],[1,"foo"],[1,"bar"]]').ok, true);
  assert.equal(problem.parseCustomInput('["allow"]\n[[1,"foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle"]\n[[0]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle"]\n[[1000000001]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[1]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[1,""]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[1,"Foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[1,"foo bar"]]').ok, false);
  assert.equal(problem.parseCustomInput(`["MessageThrottle","allow"]\n[[10],[1,"${'a'.repeat(31)}"]]`).ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[-1,"foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10],[1000000001,"foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow","allow"]\n[[10],[5,"foo"],[4,"foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","print"]\n[[10],[1,"foo"]]').ok, false);
  assert.equal(problem.parseCustomInput('["MessageThrottle","allow"]\n[[10]]').ok, false);
  assert.equal(problem.parseCustomInput('nope').ok, false);
});
