import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/js/engine/rng.js';
import problem, { reference } from '../src/js/problems/notify-recipients/problem.js';

// Brute force: scan every user for every request. Independent of the indexed reference.
function brute(users, requests) {
  const out = [];
  for (const r of requests) {
    const [kind, raw] = r.split(':');
    const id = Number(raw);
    for (const [uid, ...groups] of users) {
      const hit = kind === 'user' ? uid === id : groups.includes(id);
      if (hit && !out.includes(uid)) out.push(uid);
    }
  }
  return out.sort((a, b) => a - b);
}

function randomSmall(rnd) {
  const pick = (n) => Math.floor(rnd() * n);
  const n = 1 + pick(8);
  const ids = new Set();
  while (ids.size < n) ids.add(1 + pick(20));
  const users = [...ids].map((id) => {
    const row = [id];
    const k = pick(4);
    for (let j = 0; j < k; j++) {
      const g = 1 + pick(6);
      if (!row.slice(1).includes(g)) row.push(g);
    }
    return row;
  });
  const requests = Array.from({ length: pick(7) }, () => (rnd() < 0.5 ? `user:${1 + pick(22)}` : `group:${1 + pick(8)}`));
  return [users, requests];
}

test('reference matches brute force on 2000 random cases', () => {
  const rnd = mulberry32(2026);
  for (let i = 0; i < 2000; i++) {
    const [users, requests] = randomSmall(rnd);
    assert.deepEqual(reference(users, requests), brute(users, requests), JSON.stringify([users, requests]));
  }
});

test('authored visible expectations agree with the reference', () => {
  for (const t of problem.visibleTests) assert.deepEqual(reference(...t.args), t.expected);
});

test('exactly 5 visible and 10 hidden tests', () => {
  assert.equal(problem.visibleTests.length, 5);
  assert.equal(problem.hiddenTests.length, 10);
});

test('at least two hidden tests are at maximum size', () => {
  const big = problem.hiddenTests.filter((t) => t.args[0].length === 100000 && t.args[1].length === 100000);
  assert.ok(big.length >= 2, `${big.length} max-size tests`);
});

test('ids sort numerically, not as text', () => {
  assert.deepEqual(reference([[1000000000, 1], [2, 1], [30, 1]], ['group:1']), [2, 30, 1000000000]);
});

test('custom input parser accepts two JSON lines and rejects bad input', () => {
  assert.deepEqual(problem.parseCustomInput('[[1,2]]\n["group:2"]'), { ok: true, args: [[[1, 2]], ['group:2']] });
  assert.equal(problem.parseCustomInput('[[1,2]]').ok, false);
  assert.equal(problem.parseCustomInput('[[1],[1]]\n[]').ok, false);
  assert.equal(problem.parseCustomInput('[[1]]\n["team:1"]').ok, false);
  assert.equal(problem.parseCustomInput('[[0]]\n[]').ok, false);
});
