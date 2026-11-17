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
  const rec = { slug: 'x', title: 'X', topic: 'stack', concept: null, difficulty: 'Easy', rating: 6, estMinutes: 15, status: 'indexed', priority: 0.5, ladderStep: null, wave: null };
  assert.ok(validateIndexRecord(rec, TOPICS).some((e) => e.includes('outside Easy band')));
});

test('validateIndexRecord rejects a concept from another topic', () => {
  const rec = { slug: 'x', title: 'X', topic: 'stack', concept: 'dijkstra', difficulty: 'Medium', rating: 5, estMinutes: 25, status: 'indexed', priority: 0.5, ladderStep: null, wave: null };
  assert.ok(validateIndexRecord(rec, TOPICS).some((e) => e.includes('not in stack')));
});

test('selected problems fill every ladder exactly to its target', () => {
  for (const t of TOPICS) {
    const mine = index.problems.filter((r) => r.topic === t.id && r.ladderStep !== null);
    const got = { easy: 0, medium: 0, hard: 0 };
    for (const r of mine) got[r.difficulty.toLowerCase()]++;
    assert.deepEqual(got, t.ladder, t.id);
  }
});

test('ladder steps are a contiguous sequence per topic', () => {
  for (const t of TOPICS) {
    const steps = index.problems.filter((r) => r.topic === t.id && r.ladderStep !== null).map((r) => r.ladderStep).sort((a, b) => a - b);
    assert.deepEqual(steps, steps.map((_, i) => i), t.id);
  }
});

test('every authored or planned problem sits on a ladder', () => {
  for (const r of index.problems.filter((p) => p.contentId)) {
    assert.notEqual(r.status, 'indexed', `${r.contentId} (${r.slug}) is not on any ladder`);
  }
});

test('every classic and every easy classic is in the core bank', () => {
  for (const r of index.problems) {
    if (r.lists.includes('blind75') || r.lists.includes('neetcode150')) assert.notEqual(r.wave, null, r.slug);
    if (r.difficulty === 'Easy' && r.lists.includes('neetcode-all')) assert.notEqual(r.wave, null, r.slug);
  }
});

test('wave 1 is the learning core, wave 2 is company coverage only', () => {
  for (const r of index.problems.filter((p) => p.wave !== null)) {
    const coverageOnly = ['company-common', 'company-version', 'israeli-company', 'platform-practice'];
    const learning = r.core.some((c) => !coverageOnly.includes(c));
    assert.equal(r.wave, learning ? 1 : 2, r.slug);
  }
});

test('validateIndexRecord rejects a ladder problem without a concept', () => {
  const rec = { slug: 'x', title: 'X', topic: 'stack', concept: null, difficulty: 'Medium', rating: 5, estMinutes: 25, status: 'selected', priority: 0.5, ladderStep: 0, wave: 1 };
  assert.ok(validateIndexRecord(rec, TOPICS).some((e) => e.includes('needs a concept')));
});

test('essential path has exactly one core problem per subtopic', () => {
  const essentials = index.problems.filter((r) => r.essential);
  const subtopics = TOPICS.reduce((n, t) => n + t.concepts.length, 0);
  assert.equal(essentials.length, subtopics);
  const seen = new Set();
  for (const r of essentials) {
    assert.notEqual(r.wave, null, `${r.slug} is essential but not in the core bank`);
    const key = `${r.topic}/${r.concept}`;
    assert.ok(!seen.has(key), `two essentials for ${key}`);
    seen.add(key);
  }
});
