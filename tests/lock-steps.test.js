import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/lock-steps/problem.js';

// Brute force on a lock with `wheels` wheels: relax distances over every code until nothing
// changes (Bellman-Ford on unit edges), never entering a dead code.
function brute(deadends, target, wheels) {
  const size = 10 ** wheels;
  const dead = new Set(deadends.map(Number));
  const dist = new Array(size).fill(Infinity);
  if (!dead.has(0)) dist[0] = 0;
  for (let changed = true; changed; ) {
    changed = false;
    for (let code = 0; code < size; code++) {
      if (dist[code] === Infinity) continue;
      for (let place = 1; place < size; place *= 10) {
        const digit = Math.floor(code / place) % 10;
        for (const nd of [(digit + 1) % 10, (digit + 9) % 10]) {
          const next = code + (nd - digit) * place;
          if (!dead.has(next) && dist[code] + 1 < dist[next]) {
            dist[next] = dist[code] + 1;
            changed = true;
          }
        }
      }
    }
  }
  const d = dist[Number(target)];
  return d === Infinity ? -1 : d;
}

function randomCase(rnd, wheels, deadCount) {
  const code = () => String(Math.floor(rnd() * 10 ** wheels)).padStart(wheels, '0');
  const target = code();
  const deadends = [];
  while (deadends.length < deadCount) {
    const c = code();
    if (c !== target) deadends.push(c);
  }
  return [deadends, target];
}

test('reference matches brute force on 1500 random 2-wheel locks', () => {
  const rnd = mulberry32(85);
  let blocked = 0;
  for (let i = 0; i < 1500; i++) {
    const [deadends, target] = randomCase(rnd, 2, 1 + Math.floor(rnd() * 40));
    const want = brute(deadends, target, 2);
    assert.equal(reference(deadends, target), want);
    if (want === -1) blocked++;
  }
  assert.ok(blocked > 50 && blocked < 1200);
});

test('reference matches brute force on 60 random 4-wheel locks', () => {
  const rnd = mulberry32(86);
  for (let i = 0; i < 60; i++) {
    const [deadends, target] = randomCase(rnd, 4, 1 + Math.floor(rnd() * 3000));
    assert.equal(reference(deadends, target), brute(deadends, target, 4));
  }
});

test('visible expectations agree; two max-size cases; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.filter((t) => t.args[0].length === 5000).length >= 2);
  // The farthest code is 20 moves away; at least one hidden test needs all 20.
  assert.ok(problem.hiddenTests.some((t) => t.expected === 20));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) {
    assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${JSON.stringify(t.args[1])}`).ok, true);
  }
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('["1234"]').ok, false);
  assert.equal(problem.parseCustomInput('[]\n"1234"').ok, false);
  assert.equal(problem.parseCustomInput('["123"]\n"1234"').ok, false);
  assert.equal(problem.parseCustomInput('["1234"]\n"1234"').ok, false);
  assert.equal(problem.parseCustomInput('["1234"]\n1234').ok, false);
  assert.equal(problem.parseCustomInput(`${JSON.stringify(Array(5001).fill('1111'))}\n"0000"`).ok, false);
  assert.deepEqual(problem.parseCustomInput('["1234","1234"]\n"0009"').args, [['1234', '1234'], '0009']);
});
