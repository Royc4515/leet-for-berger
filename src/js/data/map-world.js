/**
 * The continuous Problem Map (the owner asked for one map you zoom into, not screens that replace
 * each other). One world in world units: every topic is a district, and inside it each subtopic
 * is a column of hexes, one hex per problem, in learning order. A camera ({ k, x, y }: screen =
 * world * k + (x, y)) moves over it; what is labelled depends on the zoom (lodOf), and labels that
 * would collide are dropped by priority (placeLabels), like street names on a map.
 *
 * Pure: no DOM, no I/O, no randomness. ui/views/map.js draws it and moves the camera.
 */
import { orderTiers } from './map-layout.js';

/**
 * World geometry, in world units (1 unit = 1 CSS px at zoom 1). A subtopic is a block: a strip for
 * its name, then a row of hexes. Blocks flow left to right, then onto the next line, in learning
 * order, so a topic reads like a paragraph. A block is at least `blockMin` wide so its name has room
 * once you zoom in far enough to read it.
 */
export const WORLD = { r: 7, step: 16, lab: 10, row: 16, blockMin: 48, blockGap: 6, lineGap: 4, perLine: 3, pad: 10, head: 30, gutter: 44, vgap: 16, top: 58 };

/** From this zoom, subtopic names show (a block is about 84 px wide); from LOD_PROBLEMS, problem names, inside their hexes. */
export const LOD_SUBTOPICS = 1.75;
export const LOD_PROBLEMS = 5;

const round = (v) => Math.round(v * 10) / 10;

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {Rect & { id: string, tier: number }} District
 * @typedef {Rect & { id: string, topic: string, concept: string|null, order: number, n: number }} Block  a subtopic: name strip on top, its hexes in a row below
 * @typedef {{ pid: string, topic: string, concept: string|null, x: number, y: number }} Hex
 * @typedef {{ from: string, to: string, points: [Point, Point, Point, Point] }} Road
 * @typedef {{ width: number, height: number, districts: District[], blocks: Block[], hexes: Hex[], roads: Road[], bands: { tier: number, x: number, w: number }[] }} World
 * @typedef {{ k: number, x: number, y: number }} Camera
 */

/**
 * Lays out the whole curriculum once. Tiers are columns read left to right (barycentre order
 * inside a tier, as the topic graph wants); districts stack in their tier and centre vertically.
 * Progress never moves anything: only which problems exist and where they are filed.
 * @param {Map<string, { id: string, tier: number, prereqs: string[], problems: string[] }>} states from topicStates()
 * @param {(topicId: string) => { id: string, problems: string[] }[]} conceptsOf subtopics in learning order (conceptStates())
 * @returns {World}
 */
export function layoutWorld(states, conceptsOf) {
  const { r, step, lab, row, blockMin, blockGap, lineGap, perLine, pad, head, gutter, vgap, top } = WORLD;
  const tiers = orderTiers([...states.values()]);
  // Each topic's blocks: its subtopics, then anything not filed under one (kept, never lost).
  const groupsOf = new Map();
  for (const t of states.values()) {
    const cs = conceptsOf(t.id).map((c) => ({ concept: c.id, problems: c.problems }));
    const filed = new Set(cs.flatMap((c) => c.problems));
    const rest = t.problems.filter((p) => !filed.has(p));
    if (rest.length) cs.push({ concept: null, problems: rest });
    groupsOf.set(t.id, cs);
  }
  /** Blocks of one topic relative to its inner top-left, flowed into lines. */
  const flow = (groups) => {
    const widthOf = (g) => Math.max(blockMin, Math.max(1, g.problems.length) * step);
    const inner = Math.max(perLine * blockMin + (perLine - 1) * blockGap, ...groups.map(widthOf));
    const out = [];
    let x = 0;
    let y = 0;
    for (const g of groups) {
      const w = widthOf(g);
      if (x > 0 && x + w > inner) {
        x = 0;
        y += lab + row + lineGap;
      }
      out.push({ g, x, y, w });
      x += w + blockGap;
    }
    return { out, inner, h: groups.length ? y + lab + row : row };
  };
  const shapes = new Map([...states.values()].map((t) => [t.id, flow(groupsOf.get(t.id))]));

  /** @type {District[]} */
  const districts = [];
  const bands = [];
  let x = 0;
  const stacks = tiers.map((list) => {
    const sized = list.map((t) => ({ t, w: shapes.get(t.id).inner + 2 * pad, h: round(head + shapes.get(t.id).h + pad) }));
    const colWidth = Math.max(...sized.map((s) => s.w));
    let y = 0;
    const items = sized.map((s) => {
      const d = { id: s.t.id, tier: s.t.tier, x: round(x + (colWidth - s.w) / 2), y, w: s.w, h: s.h };
      y = round(y + s.h + vgap);
      return d;
    });
    bands.push({ tier: list[0]?.tier ?? 0, x, w: colWidth });
    x = round(x + colWidth + gutter);
    return { items, h: y - vgap };
  });
  const tallest = Math.max(...stacks.map((s) => s.h));
  for (const s of stacks) {
    const off = round(top + (tallest - s.h) / 2);
    for (const d of s.items) districts.push({ ...d, y: round(d.y + off) });
  }

  /** @type {Block[]} */
  const blocks = [];
  /** @type {Hex[]} */
  const hexes = [];
  for (const d of districts) {
    shapes.get(d.id).out.forEach(({ g, x: bx, y: by, w }, i) => {
      const b = { id: `${d.id}/${g.concept ?? 'other'}`, topic: d.id, concept: g.concept, order: i, x: round(d.x + pad + bx), y: round(d.y + head + by), w, h: lab + row, n: g.problems.length };
      blocks.push(b);
      g.problems.forEach((pid, j) => hexes.push({ pid, topic: d.id, concept: g.concept, x: round(b.x + step / 2 + j * step), y: round(b.y + lab + row / 2) }));
    });
  }

  const byId = new Map(districts.map((d) => [d.id, d]));
  /** @type {Road[]} */
  const roads = [];
  for (const t of states.values()) {
    const to = byId.get(t.id);
    for (const p of t.prereqs) {
      const from = byId.get(p);
      if (!from || !to) continue;
      const a = { x: from.x + from.w, y: round(from.y + from.h / 2) };
      const b = { x: to.x, y: round(to.y + to.h / 2) };
      const mx = round((a.x + b.x) / 2);
      roads.push({ from: p, to: t.id, points: [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b] });
    }
  }
  return { width: round(x - gutter), height: round(top + tallest + top / 2), districts, blocks, hexes, roads, bands };
}

/** Hex `r` around a centre as a box (for neighbours() and hit tests). */
export function hexBox(hx) {
  return { id: hx.pid, x: hx.x - WORLD.r, y: hx.y - WORLD.r, w: 2 * WORLD.r, h: 2 * WORLD.r };
}

/* ---------- Camera ---------- */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * @param {Camera} cam
 * @param {Point} p world point
 * @returns {Point} screen point
 */
export function worldToScreen(cam, p) {
  return { x: p.x * cam.k + cam.x, y: p.y * cam.k + cam.y };
}

/**
 * The camera that shows `rect` centred, as large as fits with `pad` around it.
 * @param {Rect} rect world rect
 * @param {{ width: number, height: number }} viewport
 * @param {{ pad?: number, minK?: number, maxK?: number }} [opts]
 * @returns {Camera}
 */
export function fitCamera(rect, viewport, { pad = 32, minK = 0.05, maxK = 10 } = {}) {
  const k = clamp(Math.min((viewport.width - 2 * pad) / Math.max(rect.w, 1), (viewport.height - 2 * pad) / Math.max(rect.h, 1)), minK, maxK);
  return { k, x: viewport.width / 2 - (rect.x + rect.w / 2) * k, y: viewport.height / 2 - (rect.y + rect.h / 2) * k };
}

/**
 * Zooms by `factor` keeping the world point under the screen point (sx, sy) where it is: the
 * wheel, a pinch and double-click all zoom towards what you point at.
 * @param {Camera} cam
 * @param {number} factor
 * @param {number} sx
 * @param {number} sy
 * @param {{ minK: number, maxK: number }} limits
 * @returns {Camera}
 */
export function zoomAround(cam, factor, sx, sy, { minK, maxK }) {
  const k = clamp(cam.k * factor, minK, maxK);
  const wx = (sx - cam.x) / cam.k;
  const wy = (sy - cam.y) / cam.k;
  return { k, x: sx - wx * k, y: sy - wy * k };
}

/**
 * Keeps at least `margin` px of the world on screen on each axis, so the map can never be dragged
 * away and lost.
 * @param {Camera} cam
 * @param {{ width: number, height: number }} world
 * @param {{ width: number, height: number }} viewport
 * @param {number} [margin]
 * @returns {Camera}
 */
export function clampCamera(cam, world, viewport, margin = 80) {
  const w = world.width * cam.k;
  const h = world.height * cam.k;
  return { k: cam.k, x: clamp(cam.x, margin - w, viewport.width - margin), y: clamp(cam.y, margin - h, viewport.height - margin) };
}

const cosh = (v) => (Math.exp(v) + Math.exp(-v)) / 2;
const sinh = (v) => (Math.exp(v) - Math.exp(-v)) / 2;
const tanh = (v) => 1 - 2 / (Math.exp(2 * v) + 1);

/**
 * The flight from camera a to b: zoom out a little, travel, zoom in, along the path that feels
 * shortest (van Wijk and Nuij, "Smooth and efficient zooming and panning", 2003). A short hop is
 * almost a straight pan; a long one rises to see both ends. `length` grows with the distance, so
 * the caller can turn it into a duration.
 * @param {Camera} a
 * @param {Camera} b
 * @param {{ width: number, height: number }} viewport
 * @param {number} [rho] how much the flight rises (sqrt 2 is the paper's sweet spot)
 * @returns {{ at: (t: number) => Camera, length: number }}
 */
export function flightPath(a, b, viewport, rho = Math.SQRT2) {
  const { width: vw, height: vh } = viewport;
  const ux0 = (vw / 2 - a.x) / a.k;
  const uy0 = (vh / 2 - a.y) / a.k;
  const ux1 = (vw / 2 - b.x) / b.k;
  const uy1 = (vh / 2 - b.y) / b.k;
  const w0 = vw / a.k;
  const w1 = vw / b.k;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  const cam = (ux, uy, w) => {
    const k = vw / w;
    return { k, x: vw / 2 - ux * k, y: vh / 2 - uy * k };
  };
  let point;
  let S;
  if (d2 < 1e-9) {
    // Same centre: a pure zoom, even in log scale.
    S = Math.log(w1 / w0) / rho;
    point = (t) => cam(ux0, uy0, w0 * Math.exp(rho * t * S));
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho ** 4 * d2) / (2 * w0 * rho ** 2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho ** 4 * d2) / (2 * w1 * rho ** 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    point = (t) => {
      const s = t * S;
      const u = (w0 / (rho ** 2 * d1)) * (cosh(r0) * tanh(rho * s + r0) - sinh(r0));
      return cam(ux0 + u * dx, uy0 + u * dy, (w0 * cosh(r0)) / cosh(rho * s + r0));
    };
  }
  return {
    // don't touch / exact endpoints: the float path lands a hair off, and the camera must settle
    // exactly where fitCamera put it (labels and hit tests read it).
    at: (t) => (t <= 0 ? { ...a } : t >= 1 ? { ...b } : point(t)),
    length: Math.abs(S),
  };
}

/**
 * How much detail a zoom shows: 0 topics, 1 also subtopic names, 2 also problem names.
 * @param {number} k
 * @returns {0|1|2}
 */
export function lodOf(k) {
  return k >= LOD_PROBLEMS ? 2 : k >= LOD_SUBTOPICS ? 1 : 0;
}

/**
 * Greedy label placement: highest priority first, a label shows only if it fits on screen and
 * does not touch one already placed. Ties keep the input order (learning order).
 * @param {{ id: string, x: number, y: number, w: number, h: number, priority: number }[]} items screen boxes
 * @param {{ width: number, height: number }} viewport
 * @param {number} [gap] px kept free around each label
 * @returns {Set<string>} ids to show
 */
export function placeLabels(items, viewport, gap = 2) {
  const order = items.map((it, i) => ({ it, i })).sort((a, b) => b.it.priority - a.it.priority || a.i - b.i);
  const placed = [];
  const shown = new Set();
  for (const { it } of order) {
    if (it.x < 0 || it.y < 0 || it.x + it.w > viewport.width || it.y + it.h > viewport.height) continue;
    const hit = placed.some((p) => it.x < p.x + p.w + gap && p.x < it.x + it.w + gap && it.y < p.y + p.h + gap && p.y < it.y + it.h + gap);
    if (hit) continue;
    placed.push(it);
    shown.add(it.id);
  }
  return shown;
}
