import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickOaProblems, OA_FORMATS } from '../src/js/modes/mock-oa.js';

const pool = [
  { id: 'e1', difficulty: 'Easy' },
  { id: 'e2', difficulty: 'Easy' },
  { id: 'm1', difficulty: 'Medium' },
  { id: 'm2', difficulty: 'Medium' },
  { id: 'h1', difficulty: 'Hard' },
];
const fmt = (id) => OA_FORMATS.find((f) => f.id === id);

test('each slot gets its difficulty, no repeats', () => {
  const picks = pickOaProblems({ candidates: pool, format: fmt('hard-oa'), seed: 7 });
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks).size, 3);
  assert.ok(picks[0].startsWith('m') && picks[1].startsWith('m'));
  assert.equal(picks[2], 'h1');
});

test('same seed, same problems; different seeds can differ', () => {
  const a = pickOaProblems({ candidates: pool, format: fmt('oa'), seed: 1 });
  assert.deepEqual(pickOaProblems({ candidates: pool, format: fmt('oa'), seed: 1 }), a);
  const seen = new Set(Array.from({ length: 20 }, (_, s) => pickOaProblems({ candidates: pool, format: fmt('oa'), seed: s }).join()));
  assert.ok(seen.size > 1, 'the seed varies the picks');
});

test('unsolved problems win over the exact difficulty', () => {
  const picks = pickOaProblems({ candidates: pool, format: fmt('screen'), seed: 3, solved: new Set(['m1', 'm2']) });
  assert.equal(picks.length, 1);
  assert.ok(!['m1', 'm2'].includes(picks[0]));
});

test('a missing difficulty borrows the nearest one, and a tiny pool yields fewer problems', () => {
  const picks = pickOaProblems({ candidates: [{ id: 'e1', difficulty: 'Easy' }, { id: 'm1', difficulty: 'Medium' }], format: fmt('hard-oa'), seed: 2 });
  assert.deepEqual(picks.sort(), ['e1', 'm1']);
});

test('formats are well formed', () => {
  for (const f of OA_FORMATS) {
    assert.ok(f.minutes > 0 && f.slots.length > 0, f.id);
    for (const s of f.slots) assert.ok(['Easy', 'Medium', 'Hard'].includes(s), f.id);
  }
});
