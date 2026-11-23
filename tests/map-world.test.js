// The continuous map (owner's request: one map you zoom into, not screens that replace each other).
// One world: each topic is a district, each subtopic a named row of hexes inside it. A camera moves
// over it; names appear by zoom level and never overlap. Pure geometry in data/map-world.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORLD, layoutWorld, fitCamera, zoomAround, clampCamera, flightPath, lodOf, placeLabels, worldToScreen, hexBox, LOD_SUBTOPICS, LOD_PROBLEMS } from '../src/js/data/map-world.js';
import { topicStates, conceptStates } from '../src/js/data/map-layout.js';
import { TOPICS } from '../src/js/data/taxonomy.js';
import { availableEntries } from '../src/js/problems/index.js';

const topics = [
  { id: 'base', title: 'Base', tier: 0, prereqs: [], concepts: ['a', 'b', 'c'] },
  { id: 'mid', title: 'Mid', tier: 1, prereqs: ['base'], concepts: ['d', 'e'] },
  { id: 'side', title: 'Side', tier: 1, prereqs: ['base'], concepts: ['f'] },
  { id: 'top', title: 'Top', tier: 2, prereqs: ['mid'], concepts: ['g', 'h'] },
];
const placed = {
  b1: { topic: 'base', concept: 'a', essential: true },
  b2: { topic: 'base', concept: 'a', essential: false },
  b3: { topic: 'base', concept: 'b', essential: true },
  b4: { topic: 'base', concept: 'c', essential: true },
  b5: { topic: 'base', concept: 'c', essential: false },
  b6: { topic: 'base', concept: 'c', essential: false },
  m1: { topic: 'mid', concept: 'd', essential: true },
  m2: { topic: 'mid', concept: 'e', essential: true },
  s1: { topic: 'side', concept: 'f', essential: true },
  t1: { topic: 'top', concept: 'g', essential: true },
  t2: { topic: 'top', concept: 'h', essential: true },
};
const ids = Object.keys(placed);
const world = (tops = topics, pl = placed, list = ids) => {
  const states = topicStates({ topics: tops, placed: pl, ids: list, progress: {} });
  return layoutWorld(states, (id) => conceptStates({ topic: tops.find((t) => t.id === id), placed: pl, ids: list, progress: {} }));
};
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

test('world: one district per topic, tiers left to right, no two districts overlap', () => {
  const W = world();
  assert.deepEqual(W.districts.map((d) => d.id).sort(), ['base', 'mid', 'side', 'top']);
  const x = (id) => W.districts.find((d) => d.id === id).x;
  assert.ok(x('base') < x('mid') && x('mid') < x('top'), 'tiers read left to right');
  for (let i = 0; i < W.districts.length; i++) for (let j = i + 1; j < W.districts.length; j++) assert.ok(!overlap(W.districts[i], W.districts[j]));
  for (const d of W.districts) assert.ok(d.x >= 0 && d.y >= 0 && d.x + d.w <= W.width && d.y + d.h <= W.height);
  assert.equal(W.roads.length, 3, 'one road per prerequisite');
});

test('world: inside a district, each subtopic is a row of its problems under its name, in reading order', () => {
  const W = world();
  const base = W.districts.find((d) => d.id === 'base');
  const blocks = W.blocks.filter((b) => b.topic === 'base');
  assert.deepEqual(blocks.map((b) => b.concept), ['a', 'b', 'c']);
  // Reading order: further right on the same line, or on a lower line.
  assert.ok(blocks.every((b, i) => i === 0 || (b.y === blocks[i - 1].y ? b.x > blocks[i - 1].x : b.y > blocks[i - 1].y)));
  for (const b of blocks) {
    assert.ok(b.x >= base.x && b.x + b.w <= base.x + base.w && b.y >= base.y && b.y + b.h <= base.y + base.h, `${b.concept} inside its district`);
    assert.ok(b.w >= WORLD.blockMin, 'room for the name');
    const hexes = W.hexes.filter((h) => h.topic === 'base' && h.concept === b.concept);
    assert.equal(hexes.length, b.n);
    assert.equal(hexes.length, Object.values(placed).filter((p) => p.topic === 'base' && p.concept === b.concept).length);
    assert.ok(hexes.every((h) => h.y === hexes[0].y), `${b.concept}: one row`);
    assert.ok(hexes.every((h, i) => i === 0 || h.x > hexes[i - 1].x), `${b.concept}: left to right`);
    for (const h of hexes) {
      const box = hexBox(h);
      assert.ok(box.x >= b.x && box.x + box.w <= b.x + b.w && box.y + box.h <= b.y + b.h, 'hex inside its block');
      assert.ok(box.y >= b.y + WORLD.lab, 'below the name strip');
    }
  }
  assert.equal(W.hexes.length, ids.length, 'every problem is a hex');
  assert.deepEqual(world(), W, 'deterministic');
});

test('world: a problem filed under no subtopic of its topic still gets a hex', () => {
  const W = world(topics, { ...placed, x1: { topic: 'side', concept: 'zz', essential: false } }, [...ids, 'x1']);
  const hx = W.hexes.find((h) => h.pid === 'x1');
  assert.ok(hx && hx.topic === 'side');
  assert.ok(W.blocks.some((b) => b.topic === 'side' && b.concept === null));
});

test('world: the shipped curriculum fits, every published problem placed once, nothing overlaps', () => {
  const pt = JSON.parse(readFileSync('src/js/data/problem-topics.json', 'utf8'));
  const shipped = availableEntries().map((e) => e.id).filter((id) => pt[id]);
  const W = world(TOPICS, pt, shipped);
  assert.equal(W.districts.length, TOPICS.length);
  assert.equal(W.hexes.length, shipped.length);
  assert.equal(new Set(W.hexes.map((h) => h.pid)).size, shipped.length);
  for (let i = 0; i < W.districts.length; i++) for (let j = i + 1; j < W.districts.length; j++) assert.ok(!overlap(W.districts[i], W.districts[j]), `${W.districts[i].id} / ${W.districts[j].id}`);
  for (let i = 0; i < W.blocks.length; i++) for (let j = i + 1; j < W.blocks.length; j++) assert.ok(!overlap(W.blocks[i], W.blocks[j]), `${W.blocks[i].id} / ${W.blocks[j].id}`);
  for (let i = 0; i < W.hexes.length; i++) for (let j = i + 1; j < W.hexes.length; j++) assert.ok(!overlap(hexBox(W.hexes[i]), hexBox(W.hexes[j])), `${W.hexes[i].pid} / ${W.hexes[j].pid}`);
  assert.equal(W.blocks.length, TOPICS.reduce((n, t) => n + t.concepts.length, 0), 'one block per subtopic (131)');
  // The whole curriculum has to read as one map on a laptop screen: roughly the canvas's shape.
  const ratio = W.width / W.height;
  assert.ok(ratio > 1 && ratio < 2.2, `world aspect ${ratio.toFixed(2)}`);
});

const VP = { width: 1000, height: 600 };

test('camera: fit centres a rect and respects the zoom limits', () => {
  const cam = fitCamera({ x: 100, y: 50, w: 200, h: 100 }, VP, { pad: 0, maxK: 100 });
  assert.equal(cam.k, 5);
  const c = worldToScreen(cam, { x: 200, y: 100 });
  assert.deepEqual([c.x, c.y], [500, 300], 'centre of the rect at the centre of the screen');
  assert.equal(fitCamera({ x: 0, y: 0, w: 10, h: 10 }, VP, { maxK: 8 }).k, 8);
  assert.ok(fitCamera({ x: 0, y: 0, w: 100000, h: 10 }, VP, { minK: 0.2 }).k >= 0.2);
});

test('camera: zooming keeps the point under the cursor in place, within limits', () => {
  const cam = { k: 2, x: -100, y: 40 };
  const before = { x: (300 - cam.x) / cam.k, y: (200 - cam.y) / cam.k };
  const z = zoomAround(cam, 1.5, 300, 200, { minK: 0.5, maxK: 10 });
  assert.equal(z.k, 3);
  const after = worldToScreen(z, before);
  assert.ok(Math.abs(after.x - 300) < 1e-9 && Math.abs(after.y - 200) < 1e-9);
  assert.equal(zoomAround(cam, 100, 0, 0, { minK: 0.5, maxK: 10 }).k, 10);
  assert.equal(zoomAround(cam, 0.001, 0, 0, { minK: 0.5, maxK: 10 }).k, 0.5);
});

test('camera: clamping keeps part of the world on screen however far you drag', () => {
  const W = { width: 800, height: 400 };
  const far = clampCamera({ k: 1, x: 5000, y: -5000 }, W, VP, 60);
  assert.ok(far.x <= VP.width - 60 && far.y + W.height * far.k >= 60);
  const ok = { k: 1, x: 10, y: 10 };
  assert.deepEqual(clampCamera(ok, W, VP, 60), ok, 'a camera already in bounds is unchanged');
});

test('camera: a flight starts and ends exactly on its cameras', () => {
  const a = { k: 0.8, x: 0, y: 0 };
  const b = fitCamera({ x: 400, y: 200, w: 40, h: 60 }, VP, { maxK: 9 });
  const f = flightPath(a, b, VP);
  assert.deepEqual(f.at(0), a);
  assert.deepEqual(f.at(1), b);
  const mid = f.at(0.5);
  for (const key of ['k', 'x', 'y']) assert.ok(Number.isFinite(mid[key]), key);
});

test('camera: a zoom on the spot is monotonic; a long pan rises to see both ends, and takes longer', () => {
  const a = { k: 1, x: 0, y: 0 };
  const zoomIn = flightPath(a, zoomAround(a, 4, VP.width / 2, VP.height / 2, { minK: 0.1, maxK: 10 }), VP);
  let last = a.k;
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const k = zoomIn.at(t).k;
    assert.ok(k >= last - 1e-9, 'zoom in never backs off');
    last = k;
  }
  const near = flightPath(a, { k: 1, x: -100, y: 0 }, VP);
  const far = flightPath(a, { k: 1, x: -3000, y: 0 }, VP);
  assert.ok(far.at(0.5).k < a.k, 'a long pan zooms out on the way');
  assert.ok(far.length > near.length && near.length > 0);
  // The centre travels without overshooting: it moves only towards the destination.
  const cx = (c) => (VP.width / 2 - c.x) / c.k;
  let prev = cx(a);
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const now = cx(far.at(t));
    assert.ok(now >= prev - 1e-6);
    prev = now;
  }
});

test('detail by zoom: topics, then subtopic names, then problem names', () => {
  assert.equal(lodOf(1), 0);
  assert.equal(lodOf(LOD_SUBTOPICS), 1);
  assert.equal(lodOf(LOD_PROBLEMS - 0.01), 1);
  assert.equal(lodOf(LOD_PROBLEMS), 2);
  assert.ok(WORLD.r > 0 && LOD_SUBTOPICS < LOD_PROBLEMS);
});

test('labels: placed by priority, never overlapping, never off screen', () => {
  const items = [
    { id: 'low', x: 100, y: 100, w: 80, h: 14, priority: 1 },
    { id: 'high', x: 120, y: 105, w: 80, h: 14, priority: 5 },
    { id: 'apart', x: 400, y: 100, w: 80, h: 14, priority: 1 },
    { id: 'off', x: 990, y: 100, w: 80, h: 14, priority: 9 },
    { id: 'neg', x: -50, y: 100, w: 30, h: 14, priority: 9 },
  ];
  const shown = placeLabels(items, VP);
  assert.ok(shown.has('high') && !shown.has('low'), 'the higher priority label wins a collision');
  assert.ok(shown.has('apart'));
  assert.ok(!shown.has('off') && !shown.has('neg'), 'labels that do not fit on screen are skipped');
  const placedBoxes = items.filter((i) => shown.has(i.id));
  for (let i = 0; i < placedBoxes.length; i++) for (let j = i + 1; j < placedBoxes.length; j++) assert.ok(!overlap(placedBoxes[i], placedBoxes[j]));
});
