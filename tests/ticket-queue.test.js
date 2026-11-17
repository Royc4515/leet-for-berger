import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/ticket-queue/problem.js';

// Brute force: run the queue second by second.
function brute(tickets, k) {
  const queue = tickets.map((t, i) => ({ t, i }));
  for (let time = 1; ; time++) {
    const p = queue.shift();
    p.t--;
    if (p.t === 0 && p.i === k) return time;
    if (p.t > 0) queue.push(p);
  }
}

test('reference matches a literal simulation on 2000 random queues', () => {
  const rnd = mulberry32(6);
  for (let i = 0; i < 2000; i++) {
    const tickets = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => 1 + Math.floor(rnd() * 6));
    const k = Math.floor(rnd() * tickets.length);
    assert.equal(reference(tickets, k), brute(tickets, k));
  }
});

test('visible expectations agree; an answer exceeds 32 bits; inputs are valid', () => {
  for (const t of problem.visibleTests) assert.equal(reference(...t.args), t.expected);
  assert.ok(problem.hiddenTests.some((t) => t.expected > 2 ** 31));
  for (const t of [...problem.visibleTests, ...problem.hiddenTests]) assert.equal(problem.parseCustomInput(`${JSON.stringify(t.args[0])}\n${t.args[1]}`).ok, true);
});

test('custom input parser', () => {
  assert.equal(problem.parseCustomInput('[1,2]\n2').ok, false);
  assert.equal(problem.parseCustomInput('[0]\n0').ok, false);
});
