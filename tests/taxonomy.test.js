import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, PRACTICE_MODES, validateTaxonomy, ladderTotals, bandOf } from '../src/js/data/taxonomy.js';

test('taxonomy is structurally valid', () => {
  assert.deepEqual(validateTaxonomy(TOPICS), []);
});

test('validator catches a prereq that is not in a lower tier', () => {
  const broken = [
    { id: 'a', title: 'A', tier: 1, prereqs: ['b'], concepts: ['x', 'y', 'z'], ladder: { easy: 1, medium: 3, hard: 1 } },
    { id: 'b', title: 'B', tier: 1, prereqs: ['a'], concepts: ['x', 'y', 'z'], ladder: { easy: 1, medium: 3, hard: 1 } },
  ];
  const errors = validateTaxonomy(broken);
  assert.ok(errors.some((e) => e.includes('not in a lower tier')));
});

test('validator catches unknown prereqs and thin ladders', () => {
  const errors = validateTaxonomy([
    { id: 'a', title: 'A', tier: 1, prereqs: ['ghost'], concepts: ['x', 'y', 'z'], ladder: { easy: 0, medium: 1, hard: 0 } },
  ]);
  assert.ok(errors.some((e) => e.includes('unknown prereq')));
  assert.ok(errors.some((e) => e.includes('at least 2 medium')));
  assert.ok(errors.some((e) => e.includes('at least 1 hard')));
});

test('the network targets a broad bank, weighted toward medium', () => {
  const t = ladderTotals(TOPICS);
  assert.ok(t.all >= 150, `only ${t.all} problems targeted`);
  assert.ok(t.medium > t.easy && t.medium > t.hard);
});

test('every practice mode selects on known problem fields', () => {
  const known = new Set(['topic', 'concept', 'rating', 'difficulty', 'estMinutes', 'companies']);
  for (const m of PRACTICE_MODES) for (const f of m.selectsOn) assert.ok(known.has(f), `${m.id}: ${f}`);
});

test('bandOf maps ratings to labels and rejects out-of-range', () => {
  assert.equal(bandOf(1), 'Easy');
  assert.equal(bandOf(4), 'Medium');
  assert.equal(bandOf(10), 'Hard');
  assert.equal(bandOf(0), null);
  assert.equal(bandOf(11), null);
});
