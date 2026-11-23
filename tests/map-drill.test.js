// The map's drill-down (owner's request): all topics, then one topic's subtopics, then one
// subtopic's problems, then one problem. Pure model and layout in data/map-layout.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conceptStates, layoutTopic, parseMapLevel, mapLevelHash, parentLevel, NARROW_WIDTH } from '../src/js/data/map-layout.js';
import { TOPICS } from '../src/js/data/taxonomy.js';
import { availableEntries } from '../src/js/problems/index.js';

const topic = { id: 'graphs', title: 'Graphs', concepts: ['grid', 'bfs', 'topo'] };
const placed = {
  g1: { topic: 'graphs', concept: 'grid', essential: false },
  g2: { topic: 'graphs', concept: 'grid', essential: true },
  g3: { topic: 'graphs', concept: 'bfs', essential: true },
  g4: { topic: 'graphs', concept: 'topo', essential: true },
  g5: { topic: 'graphs', concept: 'topo', essential: false },
  x1: { topic: 'trees', concept: 'dfs', essential: true },
};
const ids = Object.keys(placed);
const solved = { status: 'solved', submissions: 1, accepted: 1, revealed: false };

test('subtopics come in learning order with their problems, counts and the next one to do', () => {
  const cs = conceptStates({ topic, placed, ids, progress: { g2: solved, g4: { status: 'attempted', submissions: 2 } } });
  assert.deepEqual(cs.map((c) => c.id), ['grid', 'bfs', 'topo']);
  assert.deepEqual(cs[0].problems, ['g1', 'g2']);
  assert.equal(cs[0].title, 'Grid');
  assert.deepEqual([cs[0].solved, cs[0].total, cs[0].state], [1, 2, 'started']);
  assert.equal(cs[0].essential, 'g2');
  assert.equal(cs[0].next, 'g1', 'the path pick is solved, so the next unsolved one');
  assert.equal(cs[1].next, 'g3', 'the path pick comes first');
  assert.equal(cs[1].state, 'new');
  assert.equal(cs[2].state, 'started', 'a tried problem starts a subtopic');
  assert.equal(cs[2].next, 'g4');
  const done = conceptStates({ topic, placed, ids, progress: { g3: solved } });
  assert.equal(done[1].state, 'done');
  assert.equal(done[1].next, null);
});

test('every shipped topic has a subtopic for each of its problems, and no empty subtopic', () => {
  const pt = JSON.parse(readFileSync('src/js/data/problem-topics.json', 'utf8'));
  const shipped = availableEntries().map((e) => e.id);
  for (const t of TOPICS) {
    const cs = conceptStates({ topic: t, placed: pt, ids: shipped, progress: {} });
    const inTopic = shipped.filter((id) => pt[id]?.topic === t.id);
    assert.equal(cs.reduce((n, c) => n + c.total, 0), inTopic.length, `${t.id}: every problem sits in a subtopic`);
    for (const c of cs) assert.ok(c.total > 0, `${t.id}/${c.id} has no problem`);
  }
});

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('topic layout: a winding road through the subtopics, left to right then back', () => {
  const concepts = [5, 2, 7, 1, 3, 4].map((count, i) => ({ id: `c${i}`, count }));
  const L = layoutTopic(concepts, { width: 900 });
  assert.equal(L.blocks.length, 6);
  assert.deepEqual(L.blocks.map((b) => b.id), concepts.map((c) => c.id), 'blocks in learning order');
  for (const b of L.blocks) {
    assert.ok(b.x >= 0 && b.x + b.w <= 900 + 0.5, `${b.id} inside the width`);
    assert.equal(b.cells.length, concepts.find((c) => c.id === b.id).count, `${b.id}: one hex per problem`);
    for (const c of b.cells) assert.ok(c.x > 0 && c.x < b.w && c.y > b.head - L.r && c.y < b.h, `${b.id}: hexes inside the block`);
  }
  for (let i = 0; i < L.blocks.length; i++) for (let j = i + 1; j < L.blocks.length; j++) assert.ok(!overlap(L.blocks[i], L.blocks[j]), `${i} and ${j} overlap`);
  const rows = [...new Set(L.blocks.map((b) => b.y))];
  assert.ok(rows.length >= 2, 'wraps into rows');
  const first = L.blocks.filter((b) => b.y === rows[0]);
  const second = L.blocks.filter((b) => b.y === rows[1]);
  assert.ok(first.every((b, i) => i === 0 || b.x > first[i - 1].x), 'first row runs left to right');
  assert.ok(second.every((b, i) => i === 0 || b.x < second[i - 1].x), 'second row runs right to left');
  assert.equal(L.roads.length, 5, 'one road between each pair in order');
  for (const r of L.roads) {
    const a = L.blocks.find((b) => b.id === r.from);
    const b = L.blocks.find((x) => x.id === r.to);
    const [p, , , q] = r.points;
    const onEdge = (pt, box) => pt.x >= box.x - 0.5 && pt.x <= box.x + box.w + 0.5 && pt.y >= box.y - 0.5 && pt.y <= box.y + box.h + 0.5;
    assert.ok(onEdge(p, a) && onEdge(q, b), `${r.from} -> ${r.to} joins the two blocks`);
  }
  assert.ok(L.height >= Math.max(...L.blocks.map((b) => b.y + b.h)));
});

test('topic layout on a phone: two blocks a row, hexes smaller, nothing wider than the screen', () => {
  const concepts = Array.from({ length: 7 }, (_, i) => ({ id: `c${i}`, count: 1 + (i % 4) }));
  const L = layoutTopic(concepts, { width: 358 });
  assert.ok(358 < NARROW_WIDTH && L.narrow);
  assert.ok(L.r < layoutTopic(concepts, { width: 1000 }).r);
  assert.equal(new Set(L.blocks.map((b) => b.y)).size, 4);
  for (const b of L.blocks) assert.ok(b.x >= 0 && b.x + b.w <= 358 + 0.5);
  assert.deepEqual(layoutTopic(concepts, { width: 358 }), L, 'deterministic');
});

test('a single subtopic is one block and no road', () => {
  const L = layoutTopic([{ id: 'only', count: 2 }], { width: 800 });
  assert.equal(L.blocks.length, 1);
  assert.equal(L.roads.length, 0);
});

const known = { topics: [topic, { id: 'trees', title: 'Trees', concepts: ['dfs'] }], placed, published: new Set(ids) };

test('map URLs: each level parses, and anything unknown falls back to the deepest valid level', () => {
  assert.deepEqual(parseMapLevel([], known), { topic: null, concept: null, problem: null });
  assert.deepEqual(parseMapLevel(['graphs'], known), { topic: 'graphs', concept: null, problem: null });
  assert.deepEqual(parseMapLevel(['graphs', 'bfs'], known), { topic: 'graphs', concept: 'bfs', problem: null });
  assert.deepEqual(parseMapLevel(['graphs', 'topo', 'g5'], known), { topic: 'graphs', concept: 'topo', problem: 'g5' });
  assert.deepEqual(parseMapLevel(['nope', 'bfs'], known), { topic: null, concept: null, problem: null });
  assert.deepEqual(parseMapLevel(['graphs', 'dfs'], known), { topic: 'graphs', concept: null, problem: null }, 'a subtopic of another topic');
  assert.deepEqual(parseMapLevel(['graphs', 'grid', 'g3'], known), { topic: 'graphs', concept: 'grid', problem: null }, 'a problem of another subtopic');
  assert.deepEqual(parseMapLevel([undefined, undefined, undefined], known), { topic: null, concept: null, problem: null });
});

test('map URLs: hash for a level, and the level above it', () => {
  assert.equal(mapLevelHash({ topic: null, concept: null, problem: null }), '#/map');
  assert.equal(mapLevelHash({ topic: 'graphs', concept: null, problem: null }), '#/map/graphs');
  assert.equal(mapLevelHash({ topic: 'graphs', concept: 'grid', problem: 'g1' }), '#/map/graphs/grid/g1');
  assert.deepEqual(parentLevel({ topic: 'graphs', concept: 'grid', problem: 'g1' }), { topic: 'graphs', concept: 'grid', problem: null });
  assert.deepEqual(parentLevel({ topic: 'graphs', concept: 'grid', problem: null }), { topic: 'graphs', concept: null, problem: null });
  assert.deepEqual(parentLevel({ topic: 'graphs', concept: null, problem: null }), { topic: null, concept: null, problem: null });
  assert.equal(parentLevel({ topic: null, concept: null, problem: null }), null, 'the top has nothing above');
});
