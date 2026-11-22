import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPath, pathOrder, pathProgress, conceptLabel, TIER_TITLES, TIER_SUMMARIES, topicStartsOpen } from '../src/js/data/learning-path.js';
import { TOPICS } from '../src/js/data/taxonomy.js';
import { catalogEntry } from '../src/js/problems/index.js';

const topics = [
  { id: 'a', title: 'A', tier: 0, prereqs: [], concepts: ['first', 'second'] },
  { id: 'b', title: 'B', tier: 1, prereqs: ['a'], concepts: ['only'] },
];
const rec = (slug, topic, concept, order, extra = {}) => ({ slug, topic, concept, contentId: slug, difficulty: 'Easy', essential: { tier: 0, order }, ...extra });

test('buildPath orders tiers, topics and concepts, and skips non-essential or unshipped problems', () => {
  const path = buildPath(
    [rec('b1', 'b', 'only', 1), rec('a2', 'a', 'second', 1), rec('a1', 'a', 'first', 9), rec('x', 'a', 'first', 1, { essential: null }), rec('y', 'a', 'first', 1, { contentId: null })],
    topics,
  );
  assert.deepEqual(path.map((t) => [t.tier, t.title]), [[0, TIER_TITLES[0]], [1, TIER_TITLES[1]]]);
  assert.deepEqual(pathOrder(path).map((p) => p.id), ['a1', 'a2', 'b1']);
  assert.deepEqual(path[1].topics[0].prereqs, ['a']);
});

test('buildPath puts easier problems first inside a topic', () => {
  const path = buildPath([rec('hard-first-concept', 'a', 'first', 1, { difficulty: 'Medium' }), rec('easy-second-concept', 'a', 'second', 1)], topics);
  assert.deepEqual(pathOrder(path).map((p) => p.id), ['easy-second-concept', 'hard-first-concept']);
});

test('buildPath rejects an essential problem in an unknown topic', () => {
  assert.throws(() => buildPath([rec('z', 'nope', 'c', 1)], topics), /unknown topic/);
});

test('pathProgress counts solved and points at the first unsolved problem', () => {
  const path = buildPath([rec('a1', 'a', 'first', 1), rec('a2', 'a', 'second', 1), rec('b1', 'b', 'only', 1)], topics);
  const p = pathProgress(path, (id) => id === 'a1');
  assert.equal(p.total, 3);
  assert.equal(p.solved, 1);
  assert.equal(p.next.id, 'a2');
  assert.equal(pathProgress(path, () => true).next, null);
});

test('conceptLabel', () => {
  assert.equal(conceptLabel('sliding-window-max'), 'Sliding window max');
  assert.equal(conceptLabel(''), '');
});

test('essential-path.json is fresh: 131 shipped problems, each once', () => {
  const raw = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url)));
  const records = Array.isArray(raw) ? raw : raw.problems;
  const shipped = JSON.parse(readFileSync(new URL('../src/js/data/essential-path.json', import.meta.url)));
  assert.deepEqual(shipped, buildPath(records, TOPICS), 'run: node scripts/content/build-meta.mjs');
  const ids = pathOrder(shipped).map((p) => p.id);
  assert.equal(ids.length, 131);
  assert.equal(new Set(ids).size, 131);
  assert.deepEqual(ids.filter((id) => !catalogEntry(id)), []);
});

test('every tier has a one-line summary of what finishing it means', () => {
  assert.equal(TIER_SUMMARIES.length, TIER_TITLES.length);
  for (const line of TIER_SUMMARIES) {
    assert.ok(line.length > 20 && line.length < 120, line);
    assert.ok(!line.includes('\n') && !line.includes('\u2014'), line);
  }
});

test('topics start open only when they hold Next up or are part-way done', () => {
  assert.equal(topicStartsOpen({ done: 0, total: 3, holdsNext: true }), true);
  assert.equal(topicStartsOpen({ done: 1, total: 3, holdsNext: false }), true);
  assert.equal(topicStartsOpen({ done: 0, total: 3, holdsNext: false }), false);
  assert.equal(topicStartsOpen({ done: 3, total: 3, holdsNext: false }), false);
});
