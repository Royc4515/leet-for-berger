import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeHealth, EXPECTED_RUNTIMES } from '../scripts/runner-health.mjs';

const up = { ok: true, worker: true, gate: { runtimes: EXPECTED_RUNTIMES, active: 1, queued: 0, error: null } };

test('expected runtimes cover the 5 server languages', () => {
  assert.equal(EXPECTED_RUNTIMES.length, 5);
  assert.ok(EXPECTED_RUNTIMES.includes('java-21.0.13'));
});

test('judgeHealth: up, down, missing runtimes, and an old Worker', () => {
  assert.equal(judgeHealth(200, up).state, 'up');
  assert.match(judgeHealth(503, { ok: false, gate: { error: 'Piston unreachable' } }).message, /Piston unreachable/);
  assert.equal(judgeHealth(502, { ok: false, error: 'Code server unreachable' }).state, 'down');
  assert.equal(judgeHealth(0, { error: 'request failed: timeout' }).state, 'down');
  const missing = judgeHealth(200, { ...up, gate: { ...up.gate, runtimes: EXPECTED_RUNTIMES.slice(1) } });
  assert.equal(missing.state, 'down');
  assert.match(missing.message, /missing runtimes: java/);
  // The Worker before this change answers { ok: true } without asking the VM: a warning, not an outage.
  assert.equal(judgeHealth(200, { ok: true }).state, 'old-worker');
});
