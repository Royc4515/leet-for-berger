// Every problem's 15 cases, hashed. A refactor of problem loading (or of a shared generator in
// engine/) must not move a single test; a deliberate content change regenerates the fixture with
// `node scripts/content/suite-hashes.mjs --write` and the diff shows which problems moved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSuiteHashes, readFixture, problemIds } from '../scripts/content/suite-hashes.mjs';

test('every problem directory has a committed suite hash, and no stale ones remain', () => {
  assert.deepEqual(Object.keys(readFixture()).sort(), problemIds());
});

test('every suite (5 visible + 10 hidden, args and expected) matches its committed hash', async () => {
  const saved = readFixture();
  const now = await computeSuiteHashes();
  const changed = Object.keys(now).filter((id) => saved[id] !== now[id]);
  assert.deepEqual(changed, [], `suites changed: ${changed.join(', ')}. If deliberate, run node scripts/content/suite-hashes.mjs --write`);
});
