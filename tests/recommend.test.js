import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashString, dailyProblem, weakSpots, dailyCandidates } from '../src/js/data/recommend.js';

const path = [
  {
    tier: 0,
    title: 'T',
    topics: [
      { id: 'a', title: 'Arrays', prereqs: [], problems: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] },
      { id: 'b', title: 'Binary Search', prereqs: [], problems: [{ id: 'b1' }, { id: 'b2' }] },
      { id: 'c', title: 'Calm', prereqs: [], problems: [{ id: 'c1' }] },
    ],
  },
];
const p = (status, submissions, accepted, revealed = false) => ({ status, submissions, accepted, revealed });

test('hashString is stable and spreads nearby keys', () => {
  assert.equal(hashString('abc'), hashString('abc'));
  assert.notEqual(hashString('daily:2026-11-18'), hashString('daily:2026-11-19'));
});

test('dailyProblem: same day same problem, independent of input order, varies across days', () => {
  const ids = ['x', 'y', 'z', 'w', 'v'];
  assert.equal(dailyProblem(ids, '2026-11-18'), dailyProblem([...ids].reverse(), '2026-11-18'));
  const days = new Set(Array.from({ length: 30 }, (_, i) => dailyProblem(ids, `2026-12-${String(i + 1).padStart(2, '0')}`)));
  assert.ok(days.size > 1);
  assert.equal(dailyProblem([], '2026-11-18'), null);
  assert.deepEqual(dailyCandidates(path), ['a1', 'a2', 'a3', 'b1', 'b2', 'c1']);
});

test('weakSpots: no practice, no weak spots', () => {
  assert.deepEqual(weakSpots(path, {}), []);
  assert.deepEqual(weakSpots(path, { a1: p('solved', 1, 1) }), []);
});

test('weakSpots ranks unsolved attempts and assisted solves, and points at the attempted problem', () => {
  const progress = {
    a1: p('solved', 1, 1),
    a2: p('solved', 1, 1, true), // assisted: 2
    b2: p('attempted', 3, 0), // unsolved 2 + failed 1.5
    c1: p('solved', 2, 1), // one failed submit: 0.5
  };
  const spots = weakSpots(path, progress);
  assert.deepEqual(spots.map((s) => s.topic), ['b', 'a', 'c']);
  assert.equal(spots[0].next, 'b2', 'the attempted problem comes before untouched ones');
  assert.equal(spots[0].unsolved, 1);
  assert.equal(spots[1].assisted, 1);
  assert.equal(spots[1].next, 'a3');
  assert.equal(spots[2].next, null, 'nothing left to practice in that topic');
  assert.equal(weakSpots(path, progress, 1).length, 1);
});

test('weakSpots caps one stubborn problem', () => {
  const spots = weakSpots(path, { a1: p('solved', 40, 1) });
  assert.equal(spots[0].score, 2);
});
