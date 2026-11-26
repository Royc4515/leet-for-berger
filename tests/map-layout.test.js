import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { topicStates, problemStatus, READY_SOLVES, lockReason, topicStateText, layoutMap, hexCells, orderTiers, neighbours, NARROW_WIDTH } from '../src/js/data/map-layout.js';
import { TIER_TITLES, TIER_TITLES_HE } from '../src/js/data/learning-path.js';
import { TOPICS } from '../src/js/data/taxonomy.js';
import { availableEntries } from '../src/js/problems/index.js';

const topics = [
  { id: 'base', title: 'Base', tier: 0, prereqs: [] },
  { id: 'mid', title: 'Mid', tier: 1, prereqs: ['base'] },
  { id: 'top', title: 'Top', tier: 2, prereqs: ['mid', 'base'] },
];
const placed = {
  b1: { topic: 'base', concept: 'c1', essential: true },
  b2: { topic: 'base', concept: 'c2', essential: true },
  b3: { topic: 'base', concept: 'c3', essential: false },
  m1: { topic: 'mid', concept: 'c1', essential: true },
  m2: { topic: 'mid', concept: 'c2', essential: false },
  t1: { topic: 'top', concept: 'c1', essential: true },
};
const ids = Object.keys(placed);
const solved = (...xs) => Object.fromEntries(xs.map((x) => [x, { status: 'solved', submissions: 1, accepted: 1, revealed: false }]));

test('problemStatus separates solved, assisted, attempted and new', () => {
  assert.equal(problemStatus(undefined), 'new');
  assert.equal(problemStatus({ status: 'attempted', submissions: 2 }), 'attempted');
  assert.equal(problemStatus({ status: 'solved', revealed: false }), 'solved');
  assert.equal(problemStatus({ status: 'solved', revealed: true }), 'assisted');
});

test('a fresh learner sees roots open and everything else locked, with the reason', () => {
  const s = topicStates({ topics, placed, ids, progress: {} });
  assert.equal(s.get('base').state, 'open');
  assert.equal(s.get('mid').state, 'locked');
  assert.deepEqual(s.get('mid').blockedBy, [{ id: 'base', title: 'Base', need: READY_SOLVES, have: 0 }]);
  assert.equal(s.get('top').state, 'locked');
  assert.deepEqual(
    s.get('top').blockedBy.map((b) => b.id),
    ['mid', 'base'],
  );
});

test('READY_SOLVES solves in every prerequisite open a topic; mastery means every essential solved', () => {
  let s = topicStates({ topics, placed, ids, progress: solved('b1') });
  assert.equal(s.get('base').state, 'started');
  assert.equal(s.get('mid').state, 'locked');
  assert.deepEqual(s.get('mid').blockedBy, [{ id: 'base', title: 'Base', need: 2, have: 1 }]);
  s = topicStates({ topics, placed, ids, progress: solved('b1', 'b3') });
  assert.equal(s.get('mid').state, 'open', 'any solved problem in the topic counts toward opening');
  assert.equal(s.get('base').state, 'started', 'b2 is essential and unsolved');
  s = topicStates({ topics, placed, ids, progress: solved('b1', 'b2') });
  assert.equal(s.get('base').state, 'mastered');
  assert.equal(s.get('top').state, 'locked');
  assert.deepEqual(s.get('top').blockedBy, [{ id: 'mid', title: 'Mid', need: 2, have: 0 }]);
});

test('a prerequisite with fewer problems than READY_SOLVES needs all of them', () => {
  // With m2 unpublished, mid holds one problem: solving it is enough.
  const few = ids.filter((id) => id !== 'm2');
  const s = topicStates({ topics, placed, ids: few, progress: solved('b1', 'b2', 'm1') });
  assert.equal(s.get('mid').state, 'mastered');
  assert.equal(s.get('top').state, 'open');
  // With m2 published, mid needs two solves even though its only essential is done.
  const s2 = topicStates({ topics, placed, ids, progress: solved('b1', 'b2', 'm1') });
  assert.equal(s2.get('top').state, 'locked');
  assert.deepEqual(s2.get('top').blockedBy, [{ id: 'mid', title: 'Mid', need: 2, have: 1 }]);
});

test('attempts make a topic started without opening anything', () => {
  const s = topicStates({ topics, placed, ids, progress: { b1: { status: 'attempted', submissions: 3, accepted: 0 } } });
  assert.equal(s.get('base').state, 'started');
  assert.equal(s.get('base').attempted, 1);
  assert.equal(s.get('mid').state, 'locked');
});

test('counts, essential counts and the next problem per topic (essential first, unsolved, in id order given)', () => {
  const s = topicStates({ topics, placed, ids, progress: solved('b1') });
  const base = s.get('base');
  assert.deepEqual([base.total, base.solved, base.essentialTotal, base.essentialSolved], [3, 1, 2, 1]);
  assert.equal(base.next, 'b2');
  assert.deepEqual(base.problems, ['b1', 'b2', 'b3']);
});

test('only listed ids count: unpublished problems are left out', () => {
  const s = topicStates({ topics, placed, ids: ['b1', 'm1', 't1'], progress: {} });
  assert.equal(s.get('base').total, 1);
  assert.deepEqual(s.get('mid').blockedBy, [{ id: 'base', title: 'Base', need: 1, have: 0 }]);
});

test('real data: every taxonomy topic gets a state and the roots start open', () => {
  const placedReal = JSON.parse(readFileSync(new URL('../src/js/data/problem-topics.json', import.meta.url)));
  const idsReal = availableEntries().map((e) => e.id);
  const s = topicStates({ topics: TOPICS, placed: placedReal, ids: idsReal, progress: {} });
  assert.equal(s.size, TOPICS.length);
  for (const t of TOPICS) {
    const st = s.get(t.id);
    assert.ok(st.total > 0, `${t.id} has problems`);
    assert.equal(st.state, t.prereqs.length ? 'locked' : 'open', t.id);
  }
});

/* ---------- Layout ---------- */

const realStates = (progress = {}) => {
  const placedReal = JSON.parse(readFileSync(new URL('../src/js/data/problem-topics.json', import.meta.url)));
  return topicStates({ topics: TOPICS, placed: placedReal, ids: availableEntries().map((e) => e.id), progress });
};
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('hexCells packs n cells in rows and reports its size', () => {
  const { cells, w, h } = hexCells(7, 3, 10);
  assert.equal(cells.length, 7);
  assert.equal(new Set(cells.map((c) => `${c.x},${c.y}`)).size, 7);
  assert.ok(cells.every((c) => c.x > 0 && c.x < w && c.y > 0 && c.y < h));
  assert.deepEqual(hexCells(0, 3, 10).cells, []);
});

test('orderTiers keeps every topic once, tiers ascending, and is deterministic', () => {
  const states = [...realStates().values()];
  const a = orderTiers(states);
  const b = orderTiers(states);
  assert.deepEqual(a.map((l) => l.map((t) => t.id)), b.map((l) => l.map((t) => t.id)));
  assert.deepEqual(a.flat().map((t) => t.id).sort(), TOPICS.map((t) => t.id).sort());
  for (let i = 1; i < a.length; i++) assert.ok(a[i][0].tier > a[i - 1][0].tier);
});

for (const width of [1100, 1400, 358, 600]) {
  test(`layoutMap at ${width}px: every topic and problem placed, no overlaps, inside the width, prerequisites before dependants`, () => {
    const states = realStates();
    const L = layoutMap(states, { width });
    assert.equal(L.narrow, width < NARROW_WIDTH);
    assert.equal(L.districts.length, TOPICS.length);
    for (const d of L.districts) {
      assert.equal(d.cells.length, states.get(d.id).total, `${d.id} has one hex per problem`);
      assert.ok(d.x >= 0 && d.x + d.w <= width + 0.5, `${d.id} fits the width`);
      for (const c of d.cells) assert.ok(c.x > 0 && c.x < d.w && c.y > d.head - 1 && c.y < d.h, `${d.id} cell inside its box`);
    }
    for (let i = 0; i < L.districts.length; i++) for (let j = i + 1; j < L.districts.length; j++) assert.ok(!overlaps(L.districts[i], L.districts[j]), `${L.districts[i].id} overlaps ${L.districts[j].id}`);
    const edges = TOPICS.reduce((n, t) => n + t.prereqs.length, 0);
    assert.equal(L.roads.length, edges);
    for (const road of L.roads) {
      const a = L.byId.get(road.from);
      const b = L.byId.get(road.to);
      if (L.narrow) assert.ok(a.y + a.h <= b.y, `${road.from} above ${road.to}`);
      else assert.ok(a.x + a.w <= b.x, `${road.from} left of ${road.to}`);
    }
    assert.ok(L.height >= Math.max(...L.districts.map((d) => d.y + d.h)));
  });
}

test('layoutMap is stable: same input, same output; progress does not move anything', () => {
  const a = layoutMap(realStates(), { width: 1200 });
  const b = layoutMap(realStates({ 'pair-sum-target': { status: 'solved', submissions: 1, accepted: 1 } }), { width: 1200 });
  assert.deepEqual(JSON.stringify(a.districts), JSON.stringify(b.districts));
  assert.deepEqual(JSON.stringify(a.roads), JSON.stringify(b.roads));
});

test('neighbours: arrow keys reach every district and move the way the map looks', () => {
  const L = layoutMap(realStates(), { width: 1200 });
  const n = neighbours(L.districts);
  // Everything is reachable from the first root by arrows.
  const seen = new Set(['arrays-hashing']);
  const queue = ['arrays-hashing'];
  while (queue.length) {
    const id = queue.shift();
    for (const next of Object.values(n.get(id))) if (next && !seen.has(next)) (seen.add(next), queue.push(next));
  }
  assert.equal(seen.size, TOPICS.length);
  for (const d of L.districts) {
    const right = n.get(d.id).ArrowRight;
    if (right) assert.ok(L.byId.get(right).x > d.x, `${d.id} -> ${right} goes right`);
    const down = n.get(d.id).ArrowDown;
    if (down) assert.ok(L.byId.get(down).y > d.y, `${d.id} -> ${down} goes down`);
  }
});

test('lockReason and topicStateText: English is byte-identical, Hebrew isolates English topic titles and has no em dashes or exclamation marks', () => {
  const one = [{ id: 'two-pointers', title: 'Two Pointers', have: 1, need: 2 }];
  const two = [
    { id: 'arrays-hashing', title: 'Arrays & Hashing', have: 0, need: 2 },
    { id: 'two-pointers', title: 'Two Pointers', have: 1, need: 2 },
  ];
  assert.equal(lockReason([]), '');
  assert.equal(lockReason([], { lang: 'he' }), '');
  assert.equal(lockReason(one), 'Opens after Two Pointers (1 of 2 solved). You can still practice it now.');
  assert.equal(lockReason(two), 'Opens after Arrays & Hashing (0 of 2 solved) and Two Pointers (1 of 2 solved). You can still practice it now.');
  assert.equal(lockReason(one, { detail: 'short' }), 'Opens after Two Pointers (1 of 2).');
  assert.equal(lockReason(two, { detail: 'names' }), 'Opens after Arrays & Hashing and Two Pointers.');

  assert.equal(lockReason(one, { lang: 'he' }), 'נפתח אחרי \u2066Two Pointers\u2069 (1 מתוך 2 נפתרו). אפשר לתרגל את הנושא גם עכשיו.');
  assert.equal(lockReason(two, { lang: 'he' }), 'נפתח אחרי \u2066Arrays & Hashing\u2069 (0 מתוך 2 נפתרו) ו-\u2066Two Pointers\u2069 (1 מתוך 2 נפתרו). אפשר לתרגל את הנושא גם עכשיו.');
  assert.equal(lockReason(one, { detail: 'short', lang: 'he' }), 'נפתח אחרי \u2066Two Pointers\u2069 (1 מתוך 2).');
  assert.equal(lockReason(two, { detail: 'names', lang: 'he' }), 'נפתח אחרי \u2066Arrays & Hashing\u2069 ו-\u2066Two Pointers\u2069.');

  assert.equal(topicStateText({ state: 'open', blockedBy: [], essentialSolved: 0, essentialTotal: 4 }), 'Everything it builds on is in place.');
  assert.equal(topicStateText({ state: 'started', blockedBy: [], essentialSolved: 2, essentialTotal: 4 }), '2 of 4 learning path problems solved.');
  assert.equal(topicStateText({ state: 'mastered', blockedBy: [], essentialSolved: 4, essentialTotal: 4 }), 'Every learning path problem here is solved.');
  assert.equal(topicStateText({ state: 'locked', blockedBy: one, essentialSolved: 0, essentialTotal: 4 }), lockReason(one));

  for (const state of ['open', 'started', 'mastered', 'locked']) {
    const he = topicStateText({ state, blockedBy: one, essentialSolved: 2, essentialTotal: 4 }, 'he');
    assert.match(he, /[\u0590-\u05FF]/, `${state} has Hebrew`);
    assert.doesNotMatch(he, /[\u2014!]/, `${state} has no em dash or exclamation mark`);
  }
  assert.equal(TIER_TITLES_HE.length, TIER_TITLES.length);
  for (const t of TIER_TITLES_HE) assert.match(t, /[\u0590-\u05FF]/);
});

