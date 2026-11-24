// The map's levels (owner's request): all topics, then one topic's subtopics, then one subtopic's
// problems, then one problem, all on one continuous map (geometry: tests/map-world.test.js).
// Pure model in data/map-layout.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conceptStates, parseMapLevel, mapLevelHash, parentLevel } from '../src/js/data/map-layout.js';
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
