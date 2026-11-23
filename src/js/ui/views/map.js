/**
 * Problem Map: one continuous map you zoom into, like a real map (the owner asked for a map that
 * grows towards a specific problem, then for it to be one map, not screens that replace each other).
 *
 * One world (data/map-world.js): every topic is a district, every subtopic a named row of hexes in
 * it, every problem a hex. A camera moves over it: scroll or pinch to zoom at the pointer, drag to
 * move, the + / - / Show all buttons, or the keyboard. Names appear as you get closer: topics, then
 * subtopics, then problem names inside their hexes. Clicking flies one step closer, and the address
 * follows the choice, so links, Back and Forward work:
 *
 *   #/map                               the whole map
 *   #/map/<topic>                       flown to a topic, its subtopics named
 *   #/map/<topic>/<subtopic>            flown to a subtopic, its problems named
 *   #/map/<topic>/<subtopic>/<problem>  a problem picked: its card in the panel, one click to open
 *
 * The router hands a new map hash to the mounted view (`update` on the cleanup, main.js), which
 * flies there. Esc goes one level up. A topic is locked until its prerequisites have READY_SOLVES
 * solves each; locked is advice, so every problem still opens.
 *
 * The List view on the same page (and the Problems page) is the accessible alternative: it holds
 * everything the map shows, as headings, lists and links. The panel lists what the camera shows.
 *
 * Geometry, camera maths and label placement are pure (data/map-world.js, data/map-layout.js); this
 * file draws SVG and HTML, moves the camera and wires input.
 * Data: problem-topics.json and essential-path.json, fetched on demand.
 */
import { h, mount, difficulty, segmented, stateBlock, loadingState, siteFooter } from '../dom.js';
import { availableEntries, catalogEntry } from '../../problems/index.js';
import { TOPICS } from '../../data/taxonomy.js';
import { TIER_TITLES, pathProgress, conceptLabel } from '../../data/learning-path.js';
import { topicStates, conceptStates, neighbours, problemStatus, parseMapLevel, mapLevelHash, parentLevel, READY_SOLVES } from '../../data/map-layout.js';
import { WORLD, layoutWorld, fitCamera, zoomAround, clampCamera, flightPath, lodOf, placeLabels, worldToScreen, hexBox, LOD_SUBTOPICS, LOD_PROBLEMS } from '../../data/map-world.js';
import { loadPath } from '../../data/path-loader.js';
import { loadProblemTopics, loadSets } from '../../data/company-loader.js';
import { reducedMotion } from '../motion.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_KEY = 'lfb:map-view';
/** Tier labels short enough for a map column; the full names are on the Path page. */
const TIER_SHORT = ['Vocabulary', 'First patterns', 'Built on patterns', 'Core structures', 'Deeper structures', 'Advanced'];
const STATE_WORD = { locked: 'Locked', open: 'Open', started: 'In progress', mastered: 'Mastered' };
const STATUS_WORD = { new: 'Not started', attempted: 'Tried', solved: 'Solved', assisted: 'Solved with help' };
const CONCEPT_WORD = { new: 'Not started', started: 'In progress', done: 'Done' };
const CONCEPT_HEX = { new: 'new', started: 't-started', done: 'solved' };
const TOP = { topic: null, concept: null, problem: null };
/** Shorter topic names for when the full one does not fit its district at this zoom. */
const SHORT = [
  ['Dynamic Programming', 'DP'],
  ['Data Structure Design', 'Design'],
  ['Heap / Priority Queue', 'Heap'],
  ['Sorting & Intervals', 'Intervals'],
  ['Bit Manipulation', 'Bits'],
  ['Advanced ', 'Adv. '],
];

/* Camera limits and the zoom each level flies to. */
/** The least zoom at which a topic's name reads in its district; a phone starts here. */
const K_READ = 0.6;
const MAX_K = 9;
/** A topic flies to fit, but not so close that you lose the topics around it. */
const TOPIC_MAX_K = 3.4;
/** A subtopic flies close enough to read its problems' names. */
const CONCEPT_K = { min: LOD_PROBLEMS * 1.08, max: 7.5 };
/** A problem name's box inside its hex, in world units: the hex's width across its flat sides. */
const PROBLEM_LABEL_W = 11;
/** Where tier names hang, in world units from the top (inside WORLD.top). */
const TIER_Y = 6;
/** How much of the world stays on screen however far you drag (px). */
const KEEP = 72;
const WHEEL_ZOOM = 0.0022;
const PINCH_WHEEL_ZOOM = 0.012;
const DRAG_SLOP = 5;

/** Minimal SVG element factory (h() builds HTML elements only). */
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined && v !== false) el.setAttribute(k, String(v));
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

/** Pointy-top hexagon points around a centre. */
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'map';
  } catch {
    return 'map';
  }
};
const writeView = (v) => {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* private mode: the map view is the default next time */
  }
};

/**
 * @param {HTMLElement} root
 * @param {{ store: any, parts?: (string|undefined)[] }} opts parts: the hash's topic, subtopic and problem
 * @returns {(() => void) & { update: (groups: string[]) => void }} cleanup, with `update` for a new map hash
 */
export function renderMap(root, { store, parts = [] }) {
  let disposed = false;
  let api = null;
  let pending = parts;
  mount(root, h('div.page.page-wide', {}, loadingState({ label: 'Loading the map...' })));

  Promise.all([loadProblemTopics(), loadPath()]).then(([placed, path]) => {
    if (disposed) return;
    if (!placed || !path) {
      mount(
        root,
        h(
          'div.page.page-narrow',
          {},
          stateBlock({ title: 'Could not load the map', body: 'The map data did not load. Check your connection and reload.', kind: 'error', headingTag: 'h1', action: { label: 'Reload', onClick: () => location.reload() } }),
          siteFooter(),
        ),
      );
      return;
    }
    api = mountMap(root, { store, placed, path, parts: pending });
  });

  const cleanup = () => {
    disposed = true;
    api?.cleanup();
  };
  cleanup.update = (groups) => {
    const next = groups.slice(1);
    if (api) api.go(next);
    else pending = next;
  };
  return cleanup;
}

/** Builds the page once data is in: the world is drawn once, then only the camera and classes change. */
function mountMap(root, { store, placed, path, parts }) {
  const entries = availableEntries();
  // Path order first, so each topic's "next" is the one the learning path would give.
  const inPath = path.flatMap((t) => t.topics.flatMap((tp) => tp.problems.map((p) => p.id)));
  const published = new Set(entries.map((e) => e.id));
  const ids = [...inPath.filter((id) => published.has(id)), ...entries.map((e) => e.id).filter((id) => !inPath.includes(id))];
  const known = { topics: TOPICS, placed, published };
  let level = parseMapLevel(parts, known);
  canonical();
  let view = readView();
  let lens = 'status';
  let company = null; // { name, ids: Set<string> }
  let states = null;
  let conceptCache = new Map();
  let preview = null; // overview: the topic the panel shows (pointer, focus, or your next topic)
  const listeners = [];
  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    listeners.push(() => el.removeEventListener(type, fn, opts));
  };

  const topicById = (id) => TOPICS.find((t) => t.id === id);
  const dependantsOf = (id) => TOPICS.filter((t) => t.prereqs.includes(id)).map((t) => t.id);
  const ancestorsOf = (id) => {
    const out = new Set();
    const walk = (x) => {
      for (const p of topicById(x)?.prereqs ?? []) if (!out.has(p)) (out.add(p), walk(p));
    };
    walk(id);
    return out;
  };
  const progress = () => store.get().problems;
  const statusOf = (pid) => problemStatus(progress()[pid]);
  const concepts = (topicId) => {
    if (!conceptCache.has(topicId)) conceptCache.set(topicId, conceptStates({ topic: topicById(topicId), placed, ids, progress: progress() }));
    return conceptCache.get(topicId);
  };
  function computeStates() {
    states = topicStates({ topics: TOPICS, placed, ids, progress: progress() });
    conceptCache = new Map();
  }
  computeStates();
  /** Keeps the address bar on the level actually shown (an old or mistyped link lands one level up). */
  function canonical() {
    const want = mapLevelHash(level);
    if ((location.hash || '#/map') !== want && location.hash.startsWith('#/map')) history.replaceState(null, '', want);
  }
  const go = (lvl) => {
    location.hash = mapLevelHash(lvl);
  };
  /** The level the address shows right now (may be ahead of `level` until hashchange lands). */
  const levelFromHash = () => parseMapLevel((location.hash.match(/^#\/map(?:\/([\w-]+)(?:\/([\w-]+)(?:\/([\w-]+))?)?)?$/) ?? []).slice(1), known);
  const levelDepth = (l) => (l.problem ? 3 : l.concept ? 2 : l.topic ? 1 : 0);
  function nextProblem() {
    const isSolved = (id) => ['solved', 'assisted'].includes(statusOf(id));
    return pathProgress(path, isSolved).next;
  }

  /* ---------- The world (laid out once: progress never moves anything) ---------- */
  const W = layoutWorld(states, concepts);
  const WORLD_RECT = { x: 0, y: 0, w: W.width, h: W.height };
  const districtOf = new Map(W.districts.map((d) => [d.id, d]));
  const blockOf = new Map(W.blocks.map((b) => [b.id, b]));
  const hexOf = new Map(W.hexes.map((x) => [x.pid, x]));
  const blockId = (topic, concept) => `${topic}/${concept ?? 'other'}`;
  const distNbrs = neighbours(W.districts);
  const blockNbrs = new Map();
  const hexNbrs = new Map();
  for (const d of W.districts) {
    const bs = W.blocks.filter((b) => b.topic === d.id);
    for (const [k, v] of neighbours(bs)) blockNbrs.set(k, v);
    for (const [k, v] of neighbours(W.hexes.filter((x) => x.topic === d.id).map(hexBox))) hexNbrs.set(k, v);
  }

  /* ---------- Static frame ---------- */
  const summary = h('p.page-sub.map-summary');
  const viewToggle = segmented({
    label: 'Show as',
    options: [
      { value: 'map', label: 'Map' },
      { value: 'list', label: 'List' },
    ],
    value: view,
    onChange: (v) => {
      view = v;
      writeView(v);
      renderBody();
    },
  });
  viewToggle.classList.add('map-view-toggle');
  const lensControl = segmented({
    label: 'Colour hexes by',
    options: [
      { value: 'status', label: 'Status' },
      { value: 'difficulty', label: 'Difficulty' },
      { value: 'company', label: 'Company' },
    ],
    value: lens,
    onChange: (v) => {
      lens = v;
      companySelect.hidden = v !== 'company';
      if (v === 'company') ensureCompanies();
      else company = null;
      paintLens();
    },
  });
  const companySelect = h('select.select.map-company', { 'aria-label': 'Company', hidden: true }, h('option', { value: '' }, 'Loading companies...'));
  const toolbar = h('div.map-toolbar', {}, h('div.map-lens', { role: 'group', 'aria-label': 'Map lens' }, lensControl, companySelect), viewToggle);
  const body = h('div.map-body');
  const legend = h(
    'ul.map-legend',
    { 'aria-label': 'Legend' },
    h('li', {}, h('span.hexmark.solved', { 'aria-hidden': 'true' }), 'Solved'),
    h('li', {}, h('span.hexmark.assisted', { 'aria-hidden': 'true' }), 'Solved with help'),
    h('li', {}, h('span.hexmark.attempted', { 'aria-hidden': 'true' }), 'Tried, not solved yet'),
    h('li', {}, h('span.hexmark', { 'aria-hidden': 'true' }), 'Not started'),
    h('li', {}, h('span.hexmark.next', { 'aria-hidden': 'true' }), 'Your next problem'),
    h('li', {}, h('span.legend-path', { 'aria-hidden': 'true' }), 'On the learning path'),
    h('li', {}, h('span.legend-lock', { 'aria-hidden': 'true' }), `Locked: solve ${READY_SOLVES} in each topic before it`),
  );
  const page = h(
    'div.page.page-wide.map-page',
    {},
    h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, `${TOPICS.length} topics · ${ids.length} problems`), h('h1', {}, 'Map'), summary), toolbar),
    body,
    legend,
    siteFooter(),
  );
  mount(root, page);

  /* ---------- Company lens ---------- */
  let companiesLoaded = false;
  function ensureCompanies() {
    if (companiesLoaded) return;
    companiesLoaded = true;
    loadSets().then((sets) => {
      if (!sets || !page.isConnected) {
        mount(companySelect, h('option', { value: '' }, 'Companies did not load'));
        return;
      }
      const options = sets.companies.filter((c) => c.rows.some((r) => r[3] !== null && placed[sets.problems[r[3]]?.contentId]));
      mount(companySelect, h('option', { value: '' }, 'Pick a company'), options.map((c) => h('option', { value: c.slug }, c.name)));
      companySelect.onchange = () => {
        const c = options.find((x) => x.slug === companySelect.value);
        company = c ? { name: c.name, ids: new Set(c.rows.filter((r) => r[3] !== null).map((r) => sets.problems[r[3]].contentId)) } : null;
        paintLens();
        renderBrief();
      };
    });
  }

  /* ---------- Canvas: the world, its labels, the controls ---------- */
  const crumbs = h('nav.map-crumbs', { 'aria-label': 'Map levels' });
  // The camera: one SVG group whose transform is the only thing a move changes.
  const camG = s('g', { class: 'map-cam' });
  // Names: a clipping layer, and inside it one layer the camera's pan moves as a whole (a
  // composited transform: a drag restyles nothing); each name is placed by the zoom alone.
  const labels = h('div.map-labels-pan');
  const labelClip = h('div.map-labels', { 'aria-hidden': 'true' }, labels);
  const tooltip = h('div.map-tip', { role: 'tooltip', hidden: true });
  const ctl = (label, text, onClick, key) => h('button.map-ctl', { type: 'button', 'aria-label': label, title: `${label} (${key})`, onClick }, text);
  const fitIcon = () => {
    const icon = s('svg', { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': 'true' }, s('path', { d: 'M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    return icon;
  };
  const controls = h(
    'div.map-controls',
    { role: 'group', 'aria-label': 'Zoom' },
    ctl('Zoom in', '+', () => zoomBy(1.6), '+'),
    ctl('Zoom out', '−', () => zoomBy(1 / 1.6), '-'),
    ctl('Show all', fitIcon(), () => (level.topic ? go(TOP) : fly(homeCamera())), '0'),
  );
  const canvas = h('div.map-canvas', {}, labelClip, controls, tooltip);
  const brief = h('aside.map-brief', { 'aria-live': 'polite', 'aria-label': 'Map panel' });
  const main = h('div.map-main', {}, crumbs, canvas);
  const layout = h('div.map-layout', {}, main, brief);

  /** @type {Map<string, SVGGElement>} */ const distEl = new Map();
  /** @type {Map<string, SVGGElement>} */ const blockEl = new Map();
  /** @type {Map<string, SVGPolygonElement>} */ const hexEl = new Map();
  let nextRing = null;
  let svg = null;

  function buildWorld() {
    const bands = W.bands.map((b) => s('rect', { class: 'band', x: b.x - WORLD.gutter / 2, y: 0, width: b.w + WORLD.gutter, height: W.height }));
    const roads = W.roads.map((r) => {
      const [a, c1, c2, b] = r.points;
      return s('path', { class: 'road', d: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`, 'data-from': r.from, 'data-to': r.to });
    });
    const districts = W.districts.map((d) => {
      const st = states.get(d.id);
      const blocks = W.blocks
        .filter((b) => b.topic === d.id)
        .map((b) => {
          const cells = W.hexes
            .filter((x) => x.topic === b.topic && x.concept === b.concept)
            .map((x) => {
              const el = s('polygon', { class: 'hx', points: hexPoints(x.x, x.y, WORLD.r - 0.6), 'data-pid': x.pid, 'data-key': x.pid });
              hexEl.set(x.pid, el);
              return el;
            });
          const g = s('g', { class: 'block', 'data-id': b.id, 'data-key': b.id }, s('rect', { class: 'block-land', x: b.x - 2, y: b.y, width: b.w + 4, height: b.h + 1, rx: 3 }), cells);
          blockEl.set(b.id, g);
          return g;
        });
      const g = s('g', { class: 'district', 'data-id': d.id, 'data-key': d.id, style: `--i:${st.tier}` }, s('rect', { class: 'land', x: d.x, y: d.y, width: d.w, height: d.h, rx: 8 }), blocks);
      distEl.set(d.id, g);
      return g;
    });
    nextRing = s('circle', { class: 'next-ring', r: WORLD.r + 2.5, hidden: true });
    camG.append(s('g', { class: 'bands', 'aria-hidden': 'true' }, bands), s('g', { class: 'roads', 'aria-hidden': 'true' }, roads), s('g', { class: 'districts' }, districts), nextRing);
    // The SVG is the canvas's size; the world moves inside it. A transform inside the SVG keeps
    // strokes non-scaling (app.css) and changes one attribute per frame, no style recalculation.
    svg = s('svg', { class: 'map-svg', role: 'group', 'aria-label': `Problem map: ${TOPICS.length} topics in ${W.bands.length} tiers. Arrow keys move, Enter goes closer, Escape goes back out, plus and minus zoom.` }, camG);
    canvas.prepend(svg);
  }

  /** Writes a class only when it changed: a level change then restyles a handful of shapes, not all 400. */
  const setClass = (el, cls) => {
    if (el.getAttribute('class') !== cls) el.setAttribute('class', cls);
  };

  /** Statuses, states, the next ring and the selection: classes only, nothing moves. */
  function paint() {
    const next = nextProblem();
    const nextTopic = next ? placed[next.id]?.topic : null;
    // The whole map's panel shows your next topic until you point at another.
    preview ??= nextTopic ?? TOPICS[0].id;
    for (const d of W.districts) {
      const st = states.get(d.id);
      const g = distEl.get(d.id);
      setClass(g, `district st-${st.state}${nextTopic === d.id ? ' has-next' : ''}${level.topic === d.id ? ' is-selected' : ''}${!level.topic && preview === d.id ? ' is-preview' : ''}`);
      for (const c of concepts(d.id)) {
        const el = blockEl.get(blockId(d.id, c.id));
        if (el) setClass(el, `block c-${c.state}${level.topic === d.id && level.concept === c.id ? ' is-selected' : ''}`);
      }
    }
    for (const x of W.hexes) {
      const e = catalogEntry(x.pid);
      setClass(hexEl.get(x.pid), `hx ${statusOf(x.pid)} d-${(e?.difficulty ?? 'easy').toLowerCase()}${placed[x.pid]?.essential ? ' is-path' : ''}${next?.id === x.pid ? ' is-next' : ''}${level.problem === x.pid ? ' is-selected' : ''}${company?.ids.has(x.pid) ? ' in-company' : ''}`);
    }
    const nx = next ? hexOf.get(next.id) : null;
    nextRing.toggleAttribute('hidden', !nx);
    if (nx) {
      nextRing.setAttribute('cx', nx.x);
      nextRing.setAttribute('cy', nx.y);
    }
    canvas.dataset.level = String(levelDepth(level));
    canvas.dataset.at = mapLevelHash(level);
    markChain(level.topic ?? preview, 'is-chain');
    setRoles();
  }

  function paintLens() {
    canvas.dataset.lens = lens;
    canvas.classList.toggle('has-company', Boolean(company));
    hexEl.forEach((p, pid) => p.classList.toggle('in-company', Boolean(company?.ids.has(pid))));
    if (lens === 'company' && company) summary.textContent = `${company.name}: ${[...company.ids].filter((id) => placed[id] && ids.includes(id)).length} of its problems are on the site. Highlighted below.`;
    else renderSummary();
  }

  function markChain(id, cls) {
    if (!svg) return;
    const anc = id ? ancestorsOf(id) : new Set();
    const deps = new Set(id ? dependantsOf(id) : []);
    svg.querySelectorAll('.road').forEach((r) => {
      const inChain = Boolean(id) && (r.dataset.to === id || anc.has(r.dataset.to)) && (anc.has(r.dataset.from) || r.dataset.from === id);
      r.classList.toggle(cls, inChain);
      r.classList.toggle(`${cls}-out`, Boolean(id) && r.dataset.from === id && deps.has(r.dataset.to));
    });
    distEl.forEach((g, gid) => g.classList.toggle(`${cls}-member`, anc.has(gid)));
  }

  /* ---------- Keyboard: one kind of thing is focusable at a time ---------- */
  // Overview: the topics. A topic: its subtopics. A subtopic or problem: that topic's problems.
  // Only that kind carries a role and a tabindex, so buttons never nest.
  let focusKey = null;
  const kindKeys = () => {
    if (!level.topic) return W.districts.map((d) => d.id);
    if (!level.concept) return W.blocks.filter((b) => b.topic === level.topic).map((b) => b.id);
    return W.hexes.filter((x) => x.topic === level.topic).map((x) => x.pid);
  };
  const kindNbrs = () => (!level.topic ? distNbrs : !level.concept ? blockNbrs : hexNbrs);
  const itemEl = (key) => distEl.get(key) ?? blockEl.get(key) ?? hexEl.get(key) ?? null;
  const clearRole = (el) => {
    el.removeAttribute('role');
    el.removeAttribute('tabindex');
    el.removeAttribute('aria-label');
    el.removeAttribute('aria-current');
  };

  function defaultFocus() {
    if (!level.topic) return preview ?? W.districts[0].id;
    if (!level.concept) {
      const nextC = placed[states.get(level.topic).next]?.concept;
      return blockOf.has(blockId(level.topic, nextC)) ? blockId(level.topic, nextC) : W.blocks.find((b) => b.topic === level.topic).id;
    }
    if (level.problem) return level.problem;
    const c = concepts(level.topic).find((x) => x.id === level.concept);
    return c?.next ?? c?.problems[0] ?? W.hexes.find((x) => x.topic === level.topic).pid;
  }

  function setRoles() {
    distEl.forEach(clearRole);
    blockEl.forEach(clearRole);
    hexEl.forEach(clearRole);
    const keys = kindKeys();
    if (!keys.includes(focusKey)) focusKey = defaultFocus();
    for (const key of keys) {
      const el = itemEl(key);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', key === focusKey ? '0' : '-1');
      el.setAttribute('aria-label', accessibleName(key));
      if (key === level.problem) el.setAttribute('aria-current', 'true');
    }
  }

  function accessibleName(key) {
    if (distEl.has(key)) {
      const st = states.get(key);
      const next = nextProblem();
      return `${st.title}. ${STATE_WORD[st.state]}. ${st.solved} of ${st.total} solved.${st.state === 'locked' ? ` Opens after ${st.blockedBy.map((b) => b.title).join(' and ')}.` : ''}${next && placed[next.id]?.topic === key ? ' Your next problem is here.' : ''} Enter goes closer.`;
    }
    if (blockEl.has(key)) {
      const b = blockOf.get(key);
      const cs = concepts(b.topic);
      const c = cs.find((x) => x.id === b.concept);
      if (!c) return `Other problems in ${states.get(b.topic).title}. Enter goes closer.`;
      return `${c.title}. Subtopic ${b.order + 1} of ${cs.length}. ${CONCEPT_WORD[c.state]}, ${c.solved} of ${c.total} solved. Enter goes closer.`;
    }
    const e = catalogEntry(key);
    return `${e?.title ?? key}. ${e?.difficulty ?? ''}. ${STATUS_WORD[statusOf(key)]}.${key === level.problem ? ' Picked.' : ' Enter picks it.'}`;
  }

  /* ---------- Camera ---------- */
  let cam = { k: 1, x: 0, y: 0 };
  let vp = { width: 0, height: 0 };
  let limits = { minK: 0.3, maxK: MAX_K };
  let lod = -1;
  let lastK = 0;
  let flight = 0; // requestAnimationFrame id
  let moving = false;
  let settleTimer = 0;
  let lastRefresh = 0;
  let touched = false; // the reader moved the camera themselves (a resize then keeps their view)

  function measureViewport() {
    vp = { width: canvas.clientWidth || 800, height: canvas.clientHeight || 520 };
    const fit = fitCamera(WORLD_RECT, vp, { pad: 20, minK: 0.05, maxK: MAX_K });
    limits = { minK: Math.min(fit.k, K_READ) * 0.85, maxK: MAX_K };
  }

  /** Where the map opens: all of it when it reads, else your next topic at reading zoom. */
  function homeCamera() {
    const fit = fitCamera(WORLD_RECT, vp, { pad: 20, minK: limits.minK, maxK: MAX_K });
    if (fit.k >= K_READ) return fit;
    const next = nextProblem();
    const d = districtOf.get((next && placed[next.id]?.topic) ?? preview ?? W.districts[0].id);
    const k = K_READ;
    // Centred on that topic, but with no empty space beyond the map's edges where the map is bigger.
    const fill = (pos, size, view) => (size * k > view ? Math.min(12, Math.max(view - size * k - 12, pos)) : pos);
    return { k, x: fill(vp.width / 2 - (d.x + d.w / 2) * k, W.width, vp.width), y: fill(vp.height / 2 - (d.y + d.h / 2) * k, W.height, vp.height) };
  }

  /** The camera a level flies to. */
  function cameraFor(lvl) {
    if (!lvl.topic) return homeCamera();
    const d = districtOf.get(lvl.topic);
    if (!lvl.concept) {
      const fit = fitCamera(d, vp, { pad: 28, minK: LOD_SUBTOPICS * 1.05, maxK: TOPIC_MAX_K });
      // Taller than the screen at reading zoom (a phone): start at the district's top.
      if (d.h * fit.k > vp.height - 24) fit.y = 16 - d.y * fit.k;
      return fit;
    }
    const b = blockOf.get(blockId(lvl.topic, lvl.concept));
    let c = fitCamera(b, vp, { pad: 36, minK: CONCEPT_K.min, maxK: CONCEPT_K.max });
    // Wider than the screen (a long row on a phone): centre on the problem you want instead.
    const focus = lvl.problem ? hexOf.get(lvl.problem) : null;
    if (b.w * c.k > vp.width - 32) {
      const pick = focus ?? hexOf.get(concepts(lvl.topic).find((x) => x.id === lvl.concept)?.next ?? '') ?? W.hexes.find((x) => x.topic === lvl.topic && x.concept === lvl.concept);
      c = { k: c.k, x: vp.width / 2 - pick.x * c.k, y: c.y };
    }
    // A picked problem that is already in view at a readable zoom: stay put, only the panel changes.
    if (focus && lodOf(cam.k) === 2 && inView(hexBox(focus), 24)) return { ...cam };
    return c;
  }

  const inView = (rect, margin = 0) => {
    const a = worldToScreen(cam, rect);
    const w = rect.w * cam.k;
    const hgt = rect.h * cam.k;
    return a.x >= margin && a.y >= margin && a.x + w <= vp.width - margin && a.y + hgt <= vp.height - margin;
  };

  function setCam(next) {
    cam = clampCamera(next, W, vp, KEEP);
    // don't touch / translate then scale, origin top left: screen = world * k + (x, y), the same
    // formula data/map-world.js uses for labels, hit tests and fitting.
    camG.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${cam.k})`);
    labels.style.transform = `translate(${cam.x}px, ${cam.y}px)`;
    if (cam.k !== lastK) {
      lastK = cam.k;
      labels.style.setProperty('--k', String(cam.k));
    }
    const l = lodOf(cam.k);
    if (l !== lod) {
      lod = l;
      canvas.dataset.lod = String(l);
    }
    const now = performance.now();
    if (now - lastRefresh > 110) refreshLabels();
    markMoving();
  }

  function markMoving() {
    if (!moving) {
      moving = true;
      canvas.classList.add('is-moving');
    }
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 140);
  }

  function settle() {
    if (flight) {
      settleTimer = setTimeout(settle, 140);
      return;
    }
    moving = false;
    canvas.classList.remove('is-moving');
    refreshLabels();
  }

  function stopFlight() {
    if (flight) cancelAnimationFrame(flight);
    flight = 0;
  }

  /** Flies the camera along the smooth zoom-and-pan path; instant under reduced motion. */
  function fly(target, { instant = false } = {}) {
    stopFlight();
    const goal = clampCamera(target, W, vp, KEEP);
    if (instant || reducedMotion()) {
      setCam(goal);
      return;
    }
    const path = flightPath(cam, goal, vp);
    // Moving from this instant, not the first frame: anything waiting for the map to rest waits.
    markMoving();
    const ms = Math.min(1100, Math.max(320, 260 + path.length * 300));
    // The clock starts on the first frame, so a slow frame before it (a page being built) does
    // not make the flight jump ahead.
    let t0 = 0;
    const step = (now) => {
      t0 ||= now;
      const t = Math.min(1, (now - t0) / ms);
      setCam(path.at(easeInOut(t)));
      flight = t < 1 ? requestAnimationFrame(step) : 0;
    };
    flight = requestAnimationFrame(step);
  }

  function zoomBy(factor, sx = vp.width / 2, sy = vp.height / 2) {
    touched = true;
    fly(zoomAround(cam, factor, sx, sy, limits));
  }

  /* ---------- Labels: names appear as you get closer, never overlapping ---------- */
  // Widths come from hidden labels with the same classes, so they match what the page draws.
  const rulers = h('div.map-rulers');
  labels.append(rulers);
  const widths = new Map();
  /** Measures many names in one layout pass (one pass per name cost a long frame at first zoom). */
  function prime(items) {
    const todo = [...new Map(items.filter(([text, kind]) => !widths.has(`${kind}|${text}`)).map(([text, kind]) => [`${kind}|${text}`, [text, kind]])).values()];
    if (!todo.length) return;
    const spans = todo.map(([text, kind]) => h(`span.map-label.map-ruler.is-${kind}`, {}, text));
    rulers.append(...spans);
    todo.forEach(([text, kind], i) => widths.set(`${kind}|${text}`, spans[i].getBoundingClientRect().width));
    rulers.replaceChildren();
  }
  function textWidth(text, kind) {
    if (!widths.has(`${kind}|${text}`)) prime([[text, kind]]);
    return widths.get(`${kind}|${text}`);
  }
  /**
   * Names are measured once (and again after the fonts load). The whole map's names first; the
   * subtopic and problem names, needed only close up, a slice at a time while the browser is idle,
   * or all at once on first need, so no single frame pays for all 700.
   */
  let later = [];
  const primeRest = (deadline) => {
    if (!page.isConnected) return;
    // At least one slice each time, so a browser that is never idle still gets there.
    do prime(later.splice(0, 40));
    while (later.length && deadline.timeRemaining() > 4);
    if (later.length) requestIdleCallback(primeRest, { timeout: 2000 });
  };
  const primeNow = () => {
    if (later.length) prime(later.splice(0));
  };
  function primeAll() {
    const items = W.bands.map((b) => [`${b.tier + 1} \u00b7 ${TIER_SHORT[b.tier] ?? ''}`, 'tier']);
    for (const st of states.values()) {
      let short = st.title;
      for (const [from, to] of SHORT) short = short.replace(from, to);
      items.push([st.title, 'district'], [short, 'district'], [`${st.solved}/${st.total}`, 'count']);
    }
    prime(items);
    later = W.blocks.map((b) => [concepts(b.topic).find((x) => x.id === b.concept)?.title ?? 'Other', 'block']);
    for (const x of W.hexes) for (const word of (catalogEntry(x.pid)?.title ?? x.pid).split(/\s+/)) later.push([word, 'problem']);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(primeRest, { timeout: 2000 });
  }
  const longestWord = (text) => Math.max(...text.split(/\s+/).map((word) => textWidth(word, 'problem')));
  function topicName(title, maxPx) {
    if (textWidth(title, 'district') <= maxPx) return title;
    let short = title;
    for (const [from, to] of SHORT) short = short.replace(from, to);
    return short;
  }

  /** @type {Map<string, HTMLElement>} */
  const pool = new Map();
  const shownLabels = new Set();
  function labelEl(id, cls, wx, wy) {
    let el = pool.get(id);
    if (!el) {
      el = h(`span.map-label.${cls}`);
      el.style.setProperty('--wx', String(wx));
      el.style.setProperty('--wy', String(wy));
      pool.set(id, el);
    }
    return el;
  }

  function refreshLabels() {
    lastRefresh = performance.now();
    if (view !== 'map' || !svg) return;
    if (!widths.size) primeAll();
    const L = lodOf(cam.k);
    const M = 48; // a label whose anchor is this close outside the screen still counts
    const box = { width: vp.width + 2 * M, height: vp.height + 2 * M };
    const cands = [];
    const add = (c) => {
      const x = c.x + M;
      const y = c.y + M;
      if (x + c.w < 0 || y + c.h < 0 || x > box.width || y > box.height) return;
      cands.push({ ...c, x: Math.max(0, x), y: Math.max(0, y), w: Math.min(c.w, box.width - Math.max(0, x)), h: Math.min(c.h, box.height - Math.max(0, y)) });
    };
    for (const b of W.bands) {
      if (L !== 0) break;
      // A tier's name wraps onto two lines when its column is narrow on screen.
      const room = (b.w + WORLD.gutter * 0.8) * cam.k;
      const text = `${b.tier + 1} \u00b7 ${TIER_SHORT[b.tier] ?? ''}`;
      const full = textWidth(text, 'tier');
      const w = Math.min(full, room);
      const lines = full > room ? 2 : 1;
      const p = worldToScreen(cam, { x: b.x + b.w / 2, y: TIER_Y });
      add({ id: `tier:${b.tier}`, x: p.x - w / 2, y: p.y, w, h: 16 * lines, priority: 5, text, room, kind: 'tier', wx: b.x + b.w / 2, wy: TIER_Y });
    }
    for (const d of W.districts) {
      const room = (d.w - 2 * WORLD.pad) * cam.k;
      if (room < 40) continue;
      const st = states.get(d.id);
      const p = worldToScreen(cam, { x: d.x + WORLD.pad, y: d.y + WORLD.head / 2 });
      const name = topicName(st.title, room);
      const count = `${st.solved}/${st.total}`;
      const nameW = textWidth(name, 'district');
      const countW = textWidth(count, 'count');
      const withCount = nameW + countW + 8 <= room;
      const w = Math.min(room, nameW + (withCount ? countW + 8 : 0));
      add({ id: `d:${d.id}`, x: p.x, y: p.y - 8, w, h: 16, priority: d.id === level.topic || d.id === preview ? 6 : 4, kind: 'district', name, count: withCount ? count : '', room, wx: d.x + WORLD.pad, wy: d.y + WORLD.head / 2, state: st.state });
    }
    if (L >= 1) {
      primeNow();
      for (const b of W.blocks) {
        const room = b.w * cam.k;
        const c = concepts(b.topic).find((x) => x.id === b.concept);
        const text = c ? c.title : 'Other';
        const p = worldToScreen(cam, { x: b.x, y: b.y + WORLD.lab / 2 });
        add({ id: `b:${b.id}`, x: p.x, y: p.y - 8, w: Math.min(room, textWidth(text, 'block')), h: 16, priority: 3, kind: 'block', text, room, wx: b.x, wy: b.y + WORLD.lab / 2, state: c?.state ?? 'new' });
      }
    }
    if (L >= 2) {
      const side = PROBLEM_LABEL_W * cam.k;
      for (const x of W.hexes) {
        const text = catalogEntry(x.pid)?.title ?? x.pid;
        // A name shows once its longest word fits the hex: never broken mid-word.
        if (longestWord(text) > side) continue;
        const p = worldToScreen(cam, x);
        add({ id: `p:${x.pid}`, x: p.x - side / 2, y: p.y - side / 2, w: side, h: side, priority: 2, kind: 'problem', text, wx: x.x, wy: x.y });
      }
    }
    const show = placeLabels(cands, box, 1);
    for (const c of cands) {
      if (!show.has(c.id)) continue;
      const el = labelEl(c.id, `is-${c.kind}`, c.wx, c.wy);
      if (c.kind === 'district') {
        if (el.dataset.text !== `${c.name}|${c.count}`) {
          el.dataset.text = `${c.name}|${c.count}`;
          mount(el, h('span.ml-name', {}, c.name), c.count ? h('span.ml-count', {}, c.count) : null);
        }
        el.style.setProperty('--room', `${Math.floor(c.room)}px`);
        el.dataset.state = c.state;
      } else if (c.kind === 'tier') {
        if (el.dataset.text !== c.text) {
          el.dataset.text = c.text;
          const [num, name] = c.text.split(' \u00b7 ');
          mount(el, h('span.ml-num', {}, num), ` ${name}`);
        }
        el.style.setProperty('--room', `${Math.floor(c.room)}px`);
      } else if (c.kind === 'block') {
        if (el.textContent !== c.text) el.textContent = c.text;
        el.style.setProperty('--room', `${Math.floor(c.room)}px`);
        el.dataset.state = c.state;
      } else if (el.textContent !== c.text) el.textContent = c.text;
      if (!shownLabels.has(c.id)) {
        shownLabels.add(c.id);
        // Only shown names are in the page: a camera move restyles these few, not every name.
        labels.append(el);
        // The fade needs one frame with the label present but transparent (none without motion).
        if (reducedMotion()) el.classList.add('is-on');
        else requestAnimationFrame(() => shownLabels.has(c.id) && el.classList.add('is-on'));
      }
    }
    for (const id of [...shownLabels]) {
      if (show.has(id)) continue;
      shownLabels.delete(id);
      const el = pool.get(id);
      el.classList.remove('is-on');
      el.remove();
    }
  }

  /* ---------- Crumbs and panel ---------- */
  function renderCrumbs() {
    const items = [{ label: 'All topics', lvl: TOP }];
    if (level.topic) items.push({ label: states.get(level.topic).title, lvl: { topic: level.topic, concept: null, problem: null } });
    if (level.concept) items.push({ label: conceptLabel(level.concept), lvl: { ...level, problem: null } });
    if (level.problem) items.push({ label: catalogEntry(level.problem)?.title ?? level.problem, lvl: level });
    mount(
      crumbs,
      h(
        'ol',
        {},
        items.map((it, i) => h('li', {}, i === items.length - 1 ? h('span', { 'aria-current': 'location' }, it.label) : h('a', { href: mapLevelHash(it.lvl) }, it.label))),
      ),
      levelDepth(level) ? h('span.map-crumb-hint', { 'aria-hidden': 'true' }, h('kbd', {}, 'Esc'), ' back out') : h('span.map-crumb-hint', { 'aria-hidden': 'true' }, 'Scroll to zoom, drag to move'),
    );
  }

  const topicLink = (t) => h('a.topic-link', { href: mapLevelHash({ topic: t.id, concept: null, problem: null }) }, h('span.hexmark', { class: `t-${t.state}`, 'aria-hidden': 'true' }), t.title);
  const progressBlock = (solved, total, extra = '') =>
    h(
      'div.brief-progress',
      {},
      h('span.progress-bar', { 'aria-hidden': 'true' }, h('span.progress-fill', { style: { width: `${total ? Math.round((solved / total) * 100) : 0}%` } })),
      h('p.hint-text', {}, `${solved} of ${total} solved`, extra),
    );
  const nextCta = (pid, started) =>
    pid ? h('a.btn.btn-primary.btn-block.brief-cta', { href: `#/problem/${pid}` }, `${started ? 'Continue' : 'Start'}: ${catalogEntry(pid)?.title ?? pid}`) : h('p.hint-text', {}, 'Every problem here is solved.');

  function stateLine(st) {
    const text =
      st.state === 'locked'
        ? `Opens after ${st.blockedBy.map((b) => `${b.title} (${b.have} of ${b.need} solved)`).join(' and ')}. You can still practice it now.`
        : st.state === 'mastered'
          ? 'Every learning path problem here is solved.'
          : st.state === 'started'
            ? `${st.essentialSolved} of ${st.essentialTotal} learning path problems solved.`
            : 'Everything it builds on is in place.';
    return h(`p.brief-state.is-${st.state}`, {}, h('strong', {}, `${STATE_WORD[st.state]}. `), text);
  }

  function topicLinks(st) {
    const builds = st.prereqs.map((p) => states.get(p));
    const leads = dependantsOf(st.id).map((d) => states.get(d));
    if (!builds.length && !leads.length) return null;
    return h('dl.brief-links', {}, builds.length ? [h('dt', {}, 'Builds on'), h('dd', {}, builds.map(topicLink))] : null, leads.length ? [h('dt', {}, 'Leads to'), h('dd', {}, leads.map(topicLink))] : null);
  }

  function renderBrief() {
    if (!states) return;
    if (!level.topic) return briefOverview();
    if (!level.concept) return briefTopic();
    if (!level.problem) return briefConcept();
    return briefProblem();
  }

  function briefOverview() {
    const st = states.get(preview);
    if (!st) return;
    const companyCount = company ? st.problems.filter((p) => company.ids.has(p)).length : null;
    const cs = concepts(st.id);
    mount(
      brief,
      h('span.eyebrow', {}, `Tier ${st.tier + 1} · ${TIER_TITLES[st.tier] ?? ''}`),
      h('h2.brief-title', {}, st.title),
      progressBlock(st.solved, st.total, companyCount !== null ? ` · ${companyCount} asked by ${company.name}` : ''),
      stateLine(st),
      topicLinks(st),
      nextCta(st.next, st.solved || st.attempted),
      h('a.btn.btn-secondary.btn-block.brief-zoom', { href: mapLevelHash({ topic: st.id, concept: null, problem: null }) }, `Zoom in: ${cs.length} subtopics`),
    );
  }

  function briefTopic() {
    const st = states.get(level.topic);
    const cs = concepts(level.topic);
    mount(
      brief,
      h('span.eyebrow', {}, `Tier ${st.tier + 1} · ${TIER_TITLES[st.tier] ?? ''}`),
      h('h2.brief-title', {}, st.title),
      progressBlock(st.solved, st.total),
      stateLine(st),
      topicLinks(st),
      nextCta(st.next, st.solved || st.attempted),
      h(
        'ol.brief-concepts',
        { 'aria-label': `${st.title} subtopics, in learning order` },
        cs.map((c, i) =>
          h(
            `li.brief-row${placed[st.next]?.concept === c.id ? '.is-highlight' : ''}`,
            {},
            h('span.hexmark', { class: CONCEPT_HEX[c.state], 'aria-hidden': 'true' }),
            h('a.brief-link', { href: mapLevelHash({ topic: st.id, concept: c.id, problem: null }) }, `${i + 1}. ${c.title}`, h('span.sr-only', {}, `, ${CONCEPT_WORD[c.state]}`)),
            h('span.brief-count', {}, `${c.solved}/${c.total}`),
          ),
        ),
      ),
    );
  }

  /** The subtopic's problems as links: what the hexes show, for every reader. */
  const problemRows = (c, current = null) =>
    h(
      'ol.brief-concepts.brief-problems',
      { 'aria-label': `${c.title}: ${c.total} ${c.total === 1 ? 'problem' : 'problems'}` },
      c.problems.map((pid) => {
        const status = statusOf(pid);
        const e = catalogEntry(pid);
        return h(
          `li.brief-row${pid === current ? '.is-highlight' : ''}`,
          {},
          h('span.hexmark', { class: status, 'aria-hidden': 'true' }),
          h('a.brief-link', { href: mapLevelHash({ topic: level.topic, concept: c.id, problem: pid }), 'aria-current': pid === current ? 'true' : null }, e?.title ?? pid, h('span.sr-only', {}, `, ${STATUS_WORD[status]}`)),
          difficulty(e?.difficulty ?? 'Easy'),
        );
      }),
    );

  function briefConcept() {
    const st = states.get(level.topic);
    const cs = concepts(level.topic);
    const i = cs.findIndex((c) => c.id === level.concept);
    const c = cs[i];
    const pick = c.essential ? catalogEntry(c.essential)?.title : null;
    mount(
      brief,
      h('span.eyebrow', {}, `${st.title} · Subtopic ${i + 1} of ${cs.length}`),
      h('h2.brief-title', {}, c.title),
      progressBlock(c.solved, c.total),
      pick ? h('p.brief-state', {}, h('strong', {}, 'The path picks '), `${pick} here: start with it.`) : null,
      nextCta(c.next, c.solved || c.attempted),
      problemRows(c),
    );
  }

  let metaToken = 0;
  function briefProblem() {
    const st = states.get(level.topic);
    const c = concepts(level.topic).find((x) => x.id === level.concept);
    const pid = level.problem;
    const e = catalogEntry(pid);
    const status = statusOf(pid);
    const j = c.problems.indexOf(pid);
    const after = c.problems[j + 1] ?? null;
    const asked = h('p.hint-text.brief-asked', {}, ' ');
    mount(
      brief,
      h('span.eyebrow', {}, `${st.title} · ${c.title}`),
      h('h2.brief-title', {}, e?.title ?? pid),
      h('div.brief-meta', {}, difficulty(e?.difficulty ?? 'Easy'), h(`span.status-word.is-${status}`, {}, h('span.hexmark', { class: status, 'aria-hidden': 'true' }), STATUS_WORD[status]), placed[pid].essential ? h('span.tag.tag-muted.path-flag', {}, 'On the learning path') : null),
      asked,
      h('a.btn.btn-primary.btn-block.brief-cta', { href: `#/problem/${pid}` }, status === 'solved' || status === 'assisted' ? 'Open it again' : status === 'attempted' ? 'Continue it' : 'Open problem'),
      after ? h('a.btn.btn-secondary.btn-block', { href: mapLevelHash({ ...level, problem: after }) }, `Next: ${catalogEntry(after)?.title ?? after}`) : null,
      c.problems.length > 1 ? problemRows(c, pid) : null,
    );
    // Where it is asked comes from problem-meta.json, loaded once and only at this level.
    const token = ++metaToken;
    import('../problem-context.js')
      .then((m) => m.loadProblemMeta())
      .then((meta) => {
        if (token !== metaToken || !asked.isConnected) return;
        const names = (meta?.[pid]?.companies ?? []).map((x) => x.name);
        asked.textContent = names.length ? `Asked at ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}.` : 'No company data for this one.';
      })
      .catch(() => {});
  }

  function renderSummary() {
    const all = [...states.values()];
    const solved = all.reduce((n, t) => n + t.solved, 0);
    const open = all.filter((t) => t.state !== 'locked').length;
    const next = nextProblem();
    summary.textContent = `${solved} of ${ids.length} solved · ${open} of ${all.length} topics open${next ? ` · Next on the path: ${catalogEntry(next.id)?.title ?? next.id}` : ''}`;
  }

  /** Overview: the panel follows the pointer and the keyboard; a click or Enter flies in. */
  function previewTopic(id) {
    if (level.topic || !id || id === preview) return;
    preview = id;
    distEl.forEach((g, gid) => g.classList.toggle('is-preview', gid === id));
    markChain(id, 'is-chain');
    renderBrief();
  }

  /* ---------- List view (accessible alternative) ---------- */
  function renderList() {
    const tiers = [...new Set(TOPICS.map((t) => t.tier))].sort((a, b) => a - b);
    return h(
      'div.map-list',
      {},
      tiers.map((tier) =>
        h(
          'section.map-list-tier',
          { 'aria-labelledby': `map-tier-${tier}` },
          h('h2.map-list-tier-title', { id: `map-tier-${tier}` }, h('span.eyebrow', {}, `Tier ${tier + 1}`), TIER_TITLES[tier] ?? ''),
          TOPICS.filter((t) => t.tier === tier).map((t) => {
            const st = states.get(t.id);
            return h(
              'details.map-list-topic',
              { open: t.id === level.topic },
              h('summary', {}, h('span.map-list-name', {}, t.title), h(`span.state-tag.is-${st.state}`, {}, STATE_WORD[st.state]), h('span.map-list-count', {}, `${st.solved} of ${st.total} solved`)),
              st.state === 'locked' ? h('p.hint-text', {}, `Opens after ${st.blockedBy.map((b) => `${b.title} (${b.have} of ${b.need})`).join(' and ')}.`) : null,
              h(
                'ul.map-list-problems',
                {},
                st.problems.map((pid) => {
                  const e = catalogEntry(pid);
                  const status = statusOf(pid);
                  return h(
                    'li',
                    {},
                    h('span.hexmark', { class: status, 'aria-hidden': 'true' }),
                    h('a.brief-link', { href: `#/problem/${pid}` }, e?.title ?? pid),
                    h('span.hint-text', {}, conceptLabel(placed[pid].concept ?? '')),
                    h('span.sr-only', {}, STATUS_WORD[status]),
                    difficulty(e?.difficulty ?? 'Easy'),
                  );
                }),
              ),
            );
          }),
        ),
      ),
    );
  }

  /* ---------- Body ---------- */
  let entered = false;
  function renderBody() {
    lensControl.hidden = view === 'list';
    companySelect.hidden = view === 'list' || lens !== 'company';
    legend.hidden = view === 'list';
    if (view === 'list') {
      stopFlight();
      mount(body, renderList());
      renderSummary();
      return;
    }
    if (!layout.isConnected) mount(body, layout);
    if (!svg) buildWorld();
    renderCrumbs();
    paint();
    paintLens();
    renderBrief();
    // The canvas may not be laid out yet (the page swaps in during a view transition): the
    // ResizeObserver below enters once it has a size.
    if (!entered && canvas.clientWidth) enter();
    else if (entered) {
      measureViewport();
      refreshLabels();
    }
  }

  /**
   * First view: the map settles in from a little further out; a deep link flies on from there to
   * its place in one move, so you see where it is on the whole map.
   */
  function enter() {
    entered = true;
    measureViewport();
    const home = homeCamera();
    const goal = level.topic ? cameraFor(level) : home;
    if (reducedMotion()) {
      setCam(goal);
      return;
    }
    svg.classList.add('is-entering');
    setCam(zoomAround(home, 0.82, vp.width / 2, vp.height / 2, { minK: 0.01, maxK: MAX_K }));
    fly(goal);
  }

  /** A new map hash: change the selection and fly there. */
  function goTo(parts2) {
    const prev = level;
    level = parseMapLevel(parts2, known);
    canonical();
    if (!level.topic && prev.topic) preview = prev.topic;
    if (view === 'list') {
      renderBody();
      return;
    }
    const hadFocus = canvas.contains(document.activeElement) || crumbs.contains(document.activeElement);
    // Coming back out, the keyboard lands on the thing you were in.
    focusKey = !level.topic ? prev.topic : !level.concept ? (prev.topic === level.topic && prev.concept ? blockId(prev.topic, prev.concept) : null) : (level.problem ?? prev.problem ?? null);
    renderCrumbs();
    paint();
    renderBrief();
    if (level.topic || levelDepth(prev) > 0) {
      touched = false;
      fly(cameraFor(level));
    }
    // On a phone the panel sits below the map: a picked problem's card is what you want next.
    const panelBelow = brief.getBoundingClientRect().top > canvas.getBoundingClientRect().bottom - 8;
    if (level.problem && panelBelow) brief.scrollIntoView({ block: 'nearest' });
    if (hadFocus) {
      // The flight already brings it into view; focusin must not start a second one.
      quietFocus = true;
      itemEl(focusKey)?.focus({ preventScroll: true });
      quietFocus = false;
    }
  }

  /* ---------- Input: pointer, wheel, pinch, keyboard ---------- */
  const pointers = new Map();
  let drag = null; // { x, y, cam, moved }
  let pinch = null; // { d, mx, my, cam }
  let suppressClick = false;
  let quietFocus = false;
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  on(canvas, 'pointerdown', (e) => {
    suppressClick = false;
    if (e.button !== 0 || e.target.closest('.map-controls')) return;
    pointers.set(e.pointerId, local(e));
    stopFlight();
    if (pointers.size === 1) {
      const p = local(e);
      drag = { x: p.x, y: p.y, cam, moved: false, id: e.pointerId };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cam };
      drag = null;
    }
  });
  on(canvas, 'pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, local(e));
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const z = zoomAround(pinch.cam, d / pinch.d, pinch.mx, pinch.my, limits);
      touched = true;
      suppressClick = true;
      setCam({ k: z.k, x: z.x + mx - pinch.mx, y: z.y + my - pinch.my });
      return;
    }
    if (drag && e.pointerId === drag.id) {
      const p = local(e);
      const dx = p.x - drag.x;
      const dy = p.y - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
      if (!drag.moved) {
        drag.moved = true;
        canvas.setPointerCapture?.(e.pointerId);
        canvas.classList.add('is-dragging');
        tooltip.hidden = true;
      }
      touched = true;
      setCam({ k: drag.cam.k, x: drag.cam.x + dx, y: drag.cam.y + dy });
      return;
    }
    hover(e);
  });
  const release = (e) => {
    pointers.delete(e.pointerId);
    if (drag?.moved) suppressClick = true;
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) drag = null;
    canvas.classList.remove('is-dragging');
  };
  on(canvas, 'pointerup', release);
  on(canvas, 'pointercancel', release);

  on(
    canvas,
    'wheel',
    (e) => {
      e.preventDefault();
      stopFlight();
      touched = true;
      const p = local(e);
      const px = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.height : 1;
      // A trackpad pinch arrives as a wheel with ctrlKey and small deltas: zoom it more per unit.
      const factor = Math.exp(-e.deltaY * px * (e.ctrlKey ? PINCH_WHEEL_ZOOM : WHEEL_ZOOM));
      setCam(zoomAround(cam, factor, p.x, p.y, limits));
    },
    { passive: false },
  );

  on(canvas, 'dblclick', (e) => {
    if (e.target.closest('.district, .map-controls')) return;
    const p = local(e);
    zoomBy(2, p.x, p.y);
  });

  /** What a click picks: one step closer than what the zoom shows. */
  function pickAt(target) {
    const hx = target.closest?.('.hx');
    const bl = target.closest?.('.block');
    const g = target.closest?.('.district');
    if (!g) return null;
    const topic = g.dataset.id;
    const b = bl ? blockOf.get(bl.dataset.id) : null;
    if (hx && (lodOf(cam.k) === 2 || (level.topic === topic && level.concept === b?.concept && level.concept))) return { topic, concept: b.concept, problem: hx.dataset.pid };
    if (b && b.concept && (lodOf(cam.k) >= 1 || level.topic === topic)) return { topic, concept: b.concept, problem: null };
    return { topic, concept: null, problem: null };
  }

  on(canvas, 'click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const lvl = pickAt(e.target);
    if (!lvl) return;
    if (mapLevelHash(lvl) === mapLevelHash(level)) fly(cameraFor(level));
    else go(lvl);
  });

  function hover(e) {
    if (e.pointerType !== 'mouse') return;
    const g = e.target.closest?.('.district');
    if (!level.topic) {
      markChain(g ? g.dataset.id : '', 'is-hover');
      if (g) previewTopic(g.dataset.id);
    }
    const cell = lodOf(cam.k) < 2 ? e.target.closest?.('.hx') : null;
    if (!cell) {
      tooltip.hidden = true;
      return;
    }
    const pid = cell.dataset.pid;
    const entry = catalogEntry(pid);
    mount(tooltip, h('strong', {}, entry?.title ?? pid), h('span', {}, `${entry?.difficulty ?? ''} · ${STATUS_WORD[statusOf(pid)]}`));
    const p = local(e);
    tooltip.style.transform = `translate(${Math.round(Math.min(p.x + 14, vp.width - 200))}px, ${Math.round(p.y + 14)}px)`;
    tooltip.hidden = false;
  }
  on(canvas, 'pointerleave', () => {
    if (!level.topic) markChain('', 'is-hover');
    tooltip.hidden = true;
  });

  on(canvas, 'keydown', (e) => {
    if (e.target.closest('.map-controls') && e.key !== '+' && e.key !== '=' && e.key !== '-' && e.key !== '0') return;
    if (e.key === '+' || e.key === '=') return (e.preventDefault(), zoomBy(1.6));
    if (e.key === '-' || e.key === '_') return (e.preventDefault(), zoomBy(1 / 1.6));
    if (e.key === '0') return (e.preventDefault(), level.topic ? go(TOP) : fly(homeCamera()));
    const el = e.target.closest?.('[data-key][role="button"]');
    if (!el) return;
    const key = el.dataset.key;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!level.topic) return go({ topic: key, concept: null, problem: null });
      if (!level.concept) return go({ topic: level.topic, concept: blockOf.get(key).concept, problem: null });
      const x = hexOf.get(key);
      return go({ topic: level.topic, concept: x.concept, problem: key });
    }
    const keys = kindKeys();
    const to = e.key === 'Home' ? keys[0] : e.key === 'End' ? keys.at(-1) : kindNbrs().get(key)?.[e.key];
    if (to === undefined) return;
    e.preventDefault();
    if (!to) return;
    focusKey = to;
    itemEl(key).setAttribute('tabindex', '-1');
    const next = itemEl(to);
    next.setAttribute('tabindex', '0');
    next.focus({ preventScroll: true });
  });
  on(canvas, 'focusin', (e) => {
    const el = e.target.closest?.('[data-key][role="button"]');
    if (!el) return;
    const key = el.dataset.key;
    if (!level.topic) {
      markChain(key, 'is-hover');
      previewTopic(key);
    }
    // Keep what the keyboard is on in view, at the zoom you chose.
    if (quietFocus || flight) return;
    const rect = distEl.has(key) ? districtOf.get(key) : blockEl.has(key) ? blockOf.get(key) : hexBox(hexOf.get(key));
    if (!inView(rect, 12)) {
      const c = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      fly({ k: cam.k, x: vp.width / 2 - c.x * cam.k, y: vp.height / 2 - c.y * cam.k });
    }
  });
  on(canvas, 'focusout', () => {
    if (!level.topic) markChain('', 'is-hover');
  });
  // Esc goes one level up, unless something else owns the key (a dialog, a text field, a select).
  on(document, 'keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || view !== 'map' || !page.isConnected) return;
    if (document.querySelector('dialog[open]') || e.target.closest?.('input, textarea, select')) return;
    // don't touch / from the address, not `level`: the hash changes at once but hashchange lands a
    // task later, so a quick second Esc would read the old level and go nowhere.
    const up = parentLevel(levelFromHash());
    if (!up) return;
    e.preventDefault();
    go(up);
  });

  // A new canvas size keeps the same place in the middle (or re-fits a map nobody has moved yet).
  const ro = new ResizeObserver(() => {
    if (view !== 'map' || !canvas.isConnected || !canvas.clientWidth) return;
    if (!entered) return enter();
    const before = vp;
    measureViewport();
    if (Math.abs(before.width - vp.width) < 1 && Math.abs(before.height - vp.height) < 1) return;
    if (!touched) return fly(level.topic ? cameraFor(level) : homeCamera(), { instant: !flight });
    const cx = (before.width / 2 - cam.x) / cam.k;
    const cy = (before.height / 2 - cam.y) / cam.k;
    setCam({ k: cam.k, x: vp.width / 2 - cx * cam.k, y: vp.height / 2 - cy * cam.k });
  });
  ro.observe(canvas);

  const unsub = store.subscribe(() => {
    if (!page.isConnected) return;
    computeStates();
    if (view === 'list') return renderBody();
    paint();
    paintLens();
    renderBrief();
    refreshLabels();
  });

  renderBody();
  // Names are measured with the display font; measure again once it has loaded.
  document.fonts?.ready.then(() => {
    if (!page.isConnected) return;
    widths.clear();
    refreshLabels();
  });
  return {
    go: goTo,
    cleanup: () => {
      stopFlight();
      clearTimeout(settleTimer);
      unsub();
      ro.disconnect();
      listeners.forEach((fn) => fn());
    },
  };
}
