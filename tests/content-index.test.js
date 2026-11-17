import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TOPICS, validateIndexRecord } from '../src/js/data/taxonomy.js';

const index = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url), 'utf8'));

test('index header count matches its records', () => {
  assert.equal(index.count, index.problems.length);
});

test('every index record is valid against the taxonomy', () => {
  const errors = index.problems.flatMap((r) => validateIndexRecord(r, TOPICS));
  assert.deepEqual(errors.slice(0, 10), []);
});

test('slugs and content ids are unique', () => {
  const slugs = index.problems.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const ids = index.problems.map((r) => r.contentId).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
});

test('every topic has enough candidates to fill its ladder', () => {
  for (const t of TOPICS) {
    const pool = index.problems.filter((r) => r.topic === t.id);
    const need = t.ladder.easy + t.ladder.medium + t.ladder.hard;
    assert.ok(pool.length >= need, `${t.id}: ${pool.length} candidates, ladder needs ${need}`);
  }
});

test('validateIndexRecord rejects a rating outside the difficulty band', () => {
  const rec = { slug: 'x', title: 'X', topic: 'stack', concept: null, difficulty: 'Easy', rating: 6, estMinutes: 15, status: 'indexed', priority: 0.5 };
  assert.ok(validateIndexRecord(rec, TOPICS).some((e) => e.includes('outside Easy band')));
});

test('validateIndexRecord rejects a concept from another topic', () => {
  const rec = { slug: 'x', title: 'X', topic: 'stack', concept: 'dijkstra', difficulty: 'Medium', rating: 5, estMinutes: 25, status: 'indexed', priority: 0.5 };
  assert.ok(validateIndexRecord(rec, TOPICS).some((e) => e.includes('not in stack')));
});
