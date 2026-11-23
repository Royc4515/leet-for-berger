import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildProblemTopics } from '../src/js/data/problem-topics.js';
import { TOPICS } from '../src/js/data/taxonomy.js';
import { availableEntries } from '../src/js/problems/index.js';

const topics = [{ id: 'a' }, { id: 'b' }];

test('buildProblemTopics keeps shipped records, first record wins, sorted by id', () => {
  const out = buildProblemTopics(
    [
      { slug: 'z', contentId: 'zeta', topic: 'b', concept: 'c2', essential: { tier: 0, order: 1 } },
      { slug: 'y', contentId: null, topic: 'a', concept: 'c1' },
      { slug: 'x', contentId: 'alpha', topic: 'a', concept: null },
      { slug: 'w', contentId: 'alpha', topic: 'b', concept: 'other' },
    ],
    topics,
  );
  assert.deepEqual(Object.keys(out), ['alpha', 'zeta']);
  assert.deepEqual(out.alpha, { topic: 'a', concept: null, essential: false });
  assert.deepEqual(out.zeta, { topic: 'b', concept: 'c2', essential: true });
});

test('buildProblemTopics rejects a record in an unknown topic', () => {
  assert.throws(() => buildProblemTopics([{ slug: 's', contentId: 'q', topic: 'nope' }], topics), /unknown topic nope/);
});

test('problem-topics.json is fresh and places every published problem', () => {
  const raw = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url)));
  const records = Array.isArray(raw) ? raw : raw.problems;
  const shipped = JSON.parse(readFileSync(new URL('../src/js/data/problem-topics.json', import.meta.url)));
  assert.deepEqual(shipped, buildProblemTopics(records, TOPICS), 'run: node scripts/content/build-meta.mjs');
  const missing = availableEntries().filter((e) => !shipped[e.id]).map((e) => e.id);
  assert.deepEqual(missing, []);
  assert.equal(Object.values(shipped).filter((t) => t.essential).length, 131);
});
