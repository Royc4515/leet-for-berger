/**
 * Problem Map model: topic states (locked, open, started, mastered), the reason a topic is
 * locked, subtopic states, map level URLs and keyboard neighbours. The map view's world is laid out
 * by data/map-world.js; layoutMap here still draws the social preview image.
 *
 * Locked is advice, never a wall: a locked topic still opens and its problems still run. It only
 * says what to solve first, so a first-time visitor can read "why" in one line.
 *
 * Pure: no DOM, no I/O, no Math.random. Progress is a parameter (state.problems).
 */

import { conceptLabel } from './learning-path.js';

/** Solved problems a prerequisite needs before the topics built on it open. */
export const READY_SOLVES = 2;

/**
 * @typedef {{ topic: string, concept: string|null, essential: boolean }} Placement
 * @typedef {{ status?: string, submissions?: number, revealed?: boolean }} ProblemProgress
 * @typedef {'new'|'attempted'|'solved'|'assisted'} ProblemStatus
 * @typedef {'locked'|'open'|'started'|'mastered'} TopicStateName
 * @typedef {{ id: string, title: string, need: number, have: number }} Blocker
 * @typedef {{
 *   id: string, title: string, tier: number, prereqs: string[], problems: string[],
 *   total: number, solved: number, attempted: number, essentialTotal: number, essentialSolved: number,
 *   state: TopicStateName, blockedBy: Blocker[], next: string|null,
 * }} TopicState
 */

/**
 * One problem's status as the map shows it. Assisted (solved after revealing the solution) is
 * kept apart from solved, as everywhere else in the app.
 * @param {ProblemProgress|undefined} p
 * @returns {ProblemStatus}
 */
export function problemStatus(p) {
  if (!p) return 'new';
  if (p.status === 'solved') return p.revealed ? 'assisted' : 'solved';
  return (p.submissions ?? 0) > 0 || p.status === 'attempted' ? 'attempted' : 'new';
}

const isSolvedStatus = (s) => s === 'solved' || s === 'assisted';

/**
 * Every topic's state from progress.
 * - mastered: every essential (path) problem in the topic is solved
 * - started: something solved or attempted, not mastered
 * - open: every prerequisite has READY_SOLVES solves (or all its problems, if it has fewer)
 * - locked: otherwise; `blockedBy` lists each prerequisite still short, in taxonomy order
 *
 * A started or mastered topic is never shown as locked: work already done stays visible.
 *
 * @param {{
 *   topics: { id: string, title: string, tier: number, prereqs: string[] }[],
 *   placed: Record<string, Placement>,
 *   ids: string[],
 *   progress: Record<string, ProblemProgress>,
 * }} input  ids: the published problems, in the order the map lists them
 * @returns {Map<string, TopicState>} in taxonomy order
 */
export function topicStates({ topics, placed, ids, progress }) {
  /** @type {Map<string, string[]>} */
  const byTopic = new Map(topics.map((t) => [t.id, []]));
  for (const id of ids) {
    const p = placed[id];
    if (p && byTopic.has(p.topic)) byTopic.get(p.topic).push(id);
  }
  const statusOf = (id) => problemStatus(progress[id]);

  /** @type {Map<string, TopicState>} */
  const out = new Map();
  for (const t of topics) {
    const problems = byTopic.get(t.id);
    const essential = problems.filter((id) => placed[id].essential);
    const solved = problems.filter((id) => isSolvedStatus(statusOf(id))).length;
    const attempted = problems.filter((id) => statusOf(id) === 'attempted').length;
    const essentialSolved = essential.filter((id) => isSolvedStatus(statusOf(id))).length;
    // Essential problems first: they are the path's pick for each subtopic.
    const next = essential.find((id) => !isSolvedStatus(statusOf(id))) ?? problems.find((id) => !isSolvedStatus(statusOf(id))) ?? null;
    out.set(t.id, {
      id: t.id,
      title: t.title,
      tier: t.tier,
      prereqs: t.prereqs,
      problems,
      total: problems.length,
      solved,
      attempted,
      essentialTotal: essential.length,
      essentialSolved,
      state: 'open',
      blockedBy: [],
      next,
    });
  }
  for (const st of out.values()) {
    st.blockedBy = st.prereqs
      .map((pid) => out.get(pid))
      .filter(Boolean)
      .map((pre) => ({ id: pre.id, title: pre.title, need: Math.min(READY_SOLVES, pre.total), have: pre.solved }))
      .filter((b) => b.have < b.need);
    if (st.essentialTotal > 0 && st.essentialSolved === st.essentialTotal) st.state = 'mastered';
    else if (st.solved > 0 || st.attempted > 0) st.state = 'started';
    else st.state = st.blockedBy.length ? 'locked' : 'open';
  }
  return out;
}

/* ---------- Layout ---------- */

/** Below this width the map stacks tiers as rows; above it tiers are columns read left to right. */
export const NARROW_WIDTH = 720;

const SQRT3 = Math.sqrt(3);

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{
 *   id: string, tier: number, x: number, y: number, w: number, h: number,
 *   cells: Point[], head: number,
 * }} District  cells are hex centres relative to the district's top-left corner; head = label band height
 * @typedef {{ from: string, to: string, points: [Point, Point, Point, Point] }} Road  cubic Bezier: start, two controls, end
 * @typedef {{ tier: number, x: number, y: number, w: number, h: number }} Band
 * @typedef {{
 *   narrow: boolean, width: number, height: number, r: number,
 *   districts: District[], byId: Map<string, District>, roads: Road[], bands: Band[],
 * }} MapLayout
 */

/**
 * Hex centres for `n` cells packed in rows of `cols` (pointy-top, odd rows shifted half a cell).
 * @param {number} n
 * @param {number} cols
 * @param {number} r hex radius
 * @returns {{ cells: Point[], w: number, h: number }}
 */
export function hexCells(n, cols, r) {
  const cw = SQRT3 * r;
  const rows = Math.max(1, Math.ceil(n / cols));
  const cells = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    cells.push({ x: round(col * cw + (row % 2 ? cw / 2 : 0) + cw / 2), y: round(row * 1.5 * r + r) });
  }
  const usedCols = Math.min(cols, Math.max(1, n));
  return { cells, w: round(usedCols * cw + (rows > 1 ? cw / 2 : 0)), h: round((rows - 1) * 1.5 * r + 2 * r) };
}

const round = (v) => Math.round(v * 10) / 10;

/**
 * Orders each tier's topics by the mean position of their prerequisites (one barycentre pass,
 * taxonomy order breaking ties), so roads cross as little as a single pass allows. Deterministic.
 * @param {TopicState[]} topics in taxonomy order
 * @returns {TopicState[][]} one list per tier, tiers ascending
 */
export function orderTiers(topics) {
  const tiers = [...new Set(topics.map((t) => t.tier))].sort((a, b) => a - b);
  const rank = new Map();
  return tiers.map((tier) => {
    const list = topics
      .filter((t) => t.tier === tier)
      .map((t, i) => {
        const known = t.prereqs.filter((p) => rank.has(p));
        const key = known.length ? known.reduce((s, p) => s + rank.get(p), 0) / known.length : i;
        return { t, key, i };
      })
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .map((x) => x.t);
    list.forEach((t, i) => rank.set(t.id, list.length > 1 ? i / (list.length - 1) : 0.5));
    return list;
  });
}

/**
 * The map's geometry for a given width. Wide: one column per tier, districts stacked and
 * centred, roads run left to right. Narrow: one band per tier, two districts per row, roads run
 * top to bottom. Every problem gets one hex; no two districts overlap.
 *
 * @param {Map<string, TopicState>} states from topicStates()
 * @param {{ width: number }} opts available width in CSS pixels
 * @returns {MapLayout}
 */
export function layoutMap(states, { width }) {
  const narrow = width < NARROW_WIDTH;
  const r = narrow ? 7 : 8.5;
  const cw = SQRT3 * r;
  const head = 44;
  const pad = 10;
  const tiers = orderTiers([...states.values()]);
  /** @type {District[]} */
  const districts = [];
  /** @type {Band[]} */
  const bands = [];

  if (!narrow) {
    const gutter = 28;
    const colW = Math.floor((width - gutter * (tiers.length - 1)) / tiers.length);
    const boxW = Math.min(colW, 220);
    const cols = Math.max(4, Math.floor((boxW - 2 * pad - cw / 2) / cw));
    const columns = tiers.map((list, ti) => {
      let y = 0;
      const items = list.map((t) => {
        const shape = hexCells(t.total, cols, r);
        const d = { id: t.id, tier: t.tier, x: round(ti * (colW + gutter) + (colW - boxW) / 2), y, w: boxW, h: round(head + shape.h + pad), cells: shape.cells.map((c) => ({ x: round(c.x + pad), y: round(c.y + head) })), head };
        y = round(y + d.h + 18);
        return d;
      });
      return { items, h: y - 18, ti };
    });
    const top = 30;
    const tallest = Math.max(...columns.map((c) => c.h));
    for (const c of columns) {
      const off = round(top + (tallest - c.h) / 2);
      for (const d of c.items) {
        d.y = round(d.y + off);
        districts.push(d);
      }
      bands.push({ tier: tiers[c.ti][0].tier, x: round(c.ti * (colW + gutter)), y: 0, w: colW, h: round(top + tallest) });
    }
  } else {
    const gap = 12;
    const boxW = Math.floor((width - gap) / 2);
    const cols = Math.max(4, Math.floor((boxW - 2 * pad - cw / 2) / cw));
    let y = 0;
    for (const list of tiers) {
      const bandTop = y;
      y += 28;
      for (let i = 0; i < list.length; i += 2) {
        const pair = list.slice(i, i + 2).map((t) => ({ t, shape: hexCells(t.total, cols, r) }));
        const rowH = round(head + Math.max(...pair.map((p) => p.shape.h)) + pad);
        pair.forEach(({ t, shape }, j) => {
          // A lone last district centres in its row so the band does not look unfinished.
          const x = pair.length === 1 ? round((width - boxW) / 2) : round(j * (boxW + gap));
          districts.push({ id: t.id, tier: t.tier, x, y: round(y), w: boxW, h: rowH, cells: shape.cells.map((c) => ({ x: round(c.x + pad), y: round(c.y + head) })), head });
        });
        y = round(y + rowH + gap);
      }
      bands.push({ tier: list[0].tier, x: 0, y: round(bandTop), w: width, h: round(y - bandTop) });
      y = round(y + 14);
    }
  }

  const byId = new Map(districts.map((d) => [d.id, d]));
  /** @type {Road[]} */
  const roads = [];
  for (const t of states.values()) {
    const to = byId.get(t.id);
    for (const p of t.prereqs) {
      const from = byId.get(p);
      if (!from || !to) continue;
      if (!narrow) {
        const a = { x: from.x + from.w, y: round(from.y + from.h / 2) };
        const b = { x: to.x, y: round(to.y + to.h / 2) };
        const mx = round((a.x + b.x) / 2);
        roads.push({ from: p, to: t.id, points: [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b] });
      } else {
        const a = { x: round(from.x + from.w / 2), y: from.y + from.h };
        const b = { x: round(to.x + to.w / 2), y: to.y };
        const my = round((a.y + b.y) / 2);
        roads.push({ from: p, to: t.id, points: [a, { x: a.x, y: my }, { x: b.x, y: my }, b] });
      }
    }
  }
  const height = round(Math.max(...districts.map((d) => d.y + d.h)) + 8);
  return { narrow, width, height, r, districts, byId, roads, bands };
}

/**
 * Arrow-key neighbours: for each district, the nearest district whose centre lies in that
 * direction (within a 45 degree cone either side), or null. Lets the map be walked with the
 * keyboard the way it looks.
 * @param {District[]} districts
 * @returns {Map<string, { ArrowUp: string|null, ArrowDown: string|null, ArrowLeft: string|null, ArrowRight: string|null }>}
 */
export function neighbours(districts) {
  const centre = (d) => ({ x: d.x + d.w / 2, y: d.y + d.h / 2 });
  const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const out = new Map();
  for (const d of districts) {
    const c = centre(d);
    const entry = {};
    for (const [key, [dx, dy]] of Object.entries(dirs)) {
      let best = null;
      let bestScore = Infinity;
      for (const o of districts) {
        if (o === d) continue;
        const oc = centre(o);
        const vx = oc.x - c.x;
        const vy = oc.y - c.y;
        const along = vx * dx + vy * dy;
        const across = Math.abs(vx * dy - vy * dx);
        if (along <= 0 || across > along) continue;
        // Prefer straight ahead: sideways distance costs double.
        const score = along + 2 * across;
        if (score < bestScore) {
          bestScore = score;
          best = o.id;
        }
      }
      entry[key] = best;
    }
    out.set(d.id, entry);
  }
  return out;
}

/* ---------- Map levels: topic, subtopic, problem (owner's request; drawn on one world, map-world.js) ---------- */

/**
 * @typedef {{
 *   id: string, title: string, problems: string[], total: number, solved: number, attempted: number,
 *   essential: string|null, next: string|null, state: 'new'|'started'|'done',
 * }} ConceptState  essential: the learning path's pick here; next: the path pick if unsolved, else the first unsolved
 */

/**
 * One topic's subtopics (taxonomy `concepts`) in learning order, with their problems in map order.
 * @param {{ topic: { id: string, concepts: string[] }, placed: Record<string, Placement>, ids: string[], progress: Record<string, ProblemProgress> }} input
 * @returns {ConceptState[]} only subtopics that hold at least one published problem
 */
export function conceptStates({ topic, placed, ids, progress }) {
  const statusOf = (id) => problemStatus(progress[id]);
  return (topic.concepts ?? [])
    .map((c) => {
      const problems = ids.filter((id) => placed[id]?.topic === topic.id && placed[id].concept === c);
      const solved = problems.filter((id) => isSolvedStatus(statusOf(id))).length;
      const attempted = problems.filter((id) => statusOf(id) === 'attempted').length;
      const essential = problems.find((id) => placed[id].essential) ?? null;
      const open = (id) => !isSolvedStatus(statusOf(id));
      const next = essential && open(essential) ? essential : (problems.find(open) ?? null);
      const state = problems.length && solved === problems.length ? 'done' : solved || attempted ? 'started' : 'new';
      return { id: c, title: conceptLabel(c), problems, total: problems.length, solved, attempted, essential, next, state };
    })
    .filter((c) => c.total > 0);
}

/**
 * @typedef {{ topic: string|null, concept: string|null, problem: string|null }} MapLevel
 */

/**
 * Reads `#/map/<topic>/<subtopic>/<problem>`. Anything unknown, or a subtopic or problem that
 * belongs elsewhere, falls back to the deepest valid level above it, so an old link still lands.
 * @param {(string|undefined)[]} parts the route's captured segments
 * @param {{ topics: { id: string, concepts?: string[] }[], placed: Record<string, Placement>, published: Set<string> }} known
 * @returns {MapLevel}
 */
export function parseMapLevel(parts, { topics, placed, published }) {
  const [t, c, p] = parts;
  const out = { topic: null, concept: null, problem: null };
  const topic = topics.find((x) => x.id === t);
  if (!topic) return out;
  out.topic = topic.id;
  if (!c || !(topic.concepts ?? []).includes(c)) return out;
  out.concept = c;
  if (p && published.has(p) && placed[p]?.topic === topic.id && placed[p].concept === c) out.problem = p;
  return out;
}

/**
 * @param {MapLevel} level
 * @returns {string} the level's hash
 */
export function mapLevelHash(level) {
  return ['#/map', level.topic, level.topic && level.concept, level.topic && level.concept && level.problem].filter(Boolean).join('/');
}

/**
 * The level one step up (what Esc and the breadcrumb go back to).
 * @param {MapLevel} level
 * @returns {MapLevel|null} null at the top
 */
export function parentLevel(level) {
  if (level.problem) return { ...level, problem: null };
  if (level.concept) return { ...level, concept: null };
  if (level.topic) return { topic: null, concept: null, problem: null };
  return null;
}
