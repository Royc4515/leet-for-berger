/**
 * Problem Map: a drill-down from the whole curriculum to one problem (the owner asked for a map
 * that opens up step by step down to a specific problem).
 *
 *   #/map                               all 26 topics as districts of hexes, tiers left to right
 *   #/map/<topic>                       one topic: its subtopics on a winding road, in learning order
 *   #/map/<topic>/<subtopic>            one subtopic: its problems as named hex tiles
 *   #/map/<topic>/<subtopic>/<problem>  one problem picked: its card in the panel, one click to open
 *
 * Every level is a hash, so links, Back and Forward work. The router hands a new map hash to the
 * mounted view (`update` on the cleanup, main.js), which zooms from the element you picked or back
 * out to it. Esc goes one level up. A topic is locked until its prerequisites have READY_SOLVES
 * solves each; locked is advice, so every problem still opens.
 *
 * The List view on the same page (and the Problems page) is the accessible alternative: it holds
 * everything the map shows, as headings, lists and links.
 *
 * Geometry and states are pure (data/map-layout.js); this file draws SVG and HTML and wires input.
 * Data: problem-topics.json and essential-path.json, fetched on demand.
 */
import { h, mount, difficulty, segmented, stateBlock, loadingState, siteFooter } from '../dom.js';
import { availableEntries, catalogEntry } from '../../problems/index.js';
import { TOPICS } from '../../data/taxonomy.js';
import { TIER_TITLES, pathProgress, conceptLabel } from '../../data/learning-path.js';
import { topicStates, layoutMap, layoutTopic, conceptStates, neighbours, problemStatus, parseMapLevel, mapLevelHash, parentLevel, READY_SOLVES } from '../../data/map-layout.js';
import { loadPath } from '../../data/path-loader.js';
import { loadProblemTopics, loadSets } from '../../data/company-loader.js';
import { reducedMotion, DUR, EASE } from '../motion.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_KEY = 'lfb:map-view';
/** Tier labels short enough for a map column; the full names are on the Path page. */
const TIER_SHORT = ['Vocabulary', 'First patterns', 'Built on patterns', 'Core structures', 'Deeper structures', 'Advanced'];
const STATE_WORD = { locked: 'Locked', open: 'Open', started: 'In progress', mastered: 'Mastered' };
const STATUS_WORD = { new: 'Not started', attempted: 'Tried', solved: 'Solved', assisted: 'Solved with help' };
const CONCEPT_WORD = { new: 'Not started', started: 'In progress', done: 'Done' };
const CONCEPT_HEX = { new: 'new', started: 'attempted', done: 'solved' };
const TOP = { topic: null, concept: null, problem: null };

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
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

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

/**
 * Builds the page once data is in. Re-renders on progress changes, on width changes that matter,
 * and on every level change (with a zoom between levels).
 */
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
  let preview = null; // overview: the topic the panel shows (pointer, focus, or your next topic)
  let focusId = null;
  let lastWidth = 0;
  let nbrs = null;
  let keys = []; // overview and topic levels: focusable items in arrow-key order
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
  const concepts = (topicId) => conceptStates({ topic: topicById(topicId), placed, ids, progress: progress() });
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
    h('li', {}, h('span.hexmark.attempted', { 'aria-hidden': 'true' }), 'Tried'),
    h('li', {}, h('span.hexmark', { 'aria-hidden': 'true' }), 'Not started'),
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

  /* ---------- Canvas ---------- */
  const crumbs = h('nav.map-crumbs', { 'aria-label': 'Map levels' });
  const stage = h('div.map-stage');
  const svgHost = h('div.map-canvas');
  const tooltip = h('div.map-tip', { role: 'tooltip', hidden: true });
  const brief = h('aside.map-brief', { 'aria-live': 'polite', 'aria-label': 'Map panel' });
  const main = h('div.map-main', {}, crumbs, svgHost);
  let svg = null;

  function computeStates() {
    states = topicStates({ topics: TOPICS, placed, ids, progress: progress() });
  }

  function nextProblem() {
    const isSolved = (id) => ['solved', 'assisted'].includes(statusOf(id));
    return pathProgress(path, isSolved).next;
  }

  const levelDepth = (l) => (l.problem ? 3 : l.concept ? 2 : l.topic ? 1 : 0);

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
        items.map((it, i) =>
          h(
            'li',
            {},
            i === items.length - 1 ? h('span', { 'aria-current': 'location' }, it.label) : h('a', { href: mapLevelHash(it.lvl) }, it.label),
          ),
        ),
      ),
      levelDepth(level) ? h('span.map-crumb-hint', { 'aria-hidden': 'true' }, h('kbd', {}, 'Esc'), ' up a level') : h('span.map-crumb-hint', { 'aria-hidden': 'true' }, 'Click a topic to zoom in'),
    );
  }

  /* Level 0: every topic */
  function drawOverview() {
    const width = Math.max(300, Math.floor(svgHost.clientWidth || 900) - 32);
    lastWidth = width;
    const layout = layoutMap(states, { width });
    nbrs = neighbours(layout.districts);
    keys = layout.districts.map((d) => d.id);
    const next = nextProblem();
    const nextTopic = next ? placed[next.id]?.topic : null;
    preview ??= nextTopic ?? TOPICS[0].id;
    focusId = keys.includes(focusId) ? focusId : preview;

    const bands = layout.bands.map((b) =>
      layout.narrow
        ? s('text', { class: 'band-label', x: 0, y: b.y + 16 }, `${b.tier + 1} · ${(TIER_TITLES[b.tier] ?? '').toUpperCase()}`)
        : s('text', { class: 'band-label', x: b.x + b.w / 2, y: 14, 'text-anchor': 'middle' }, s('tspan', { class: 'band-num' }, `${b.tier + 1} `), (TIER_SHORT[b.tier] ?? '').toUpperCase()),
    );
    const roads = layout.roads.map((r) => {
      const [a, c1, c2, b] = r.points;
      const lit = states.get(r.from).state !== 'locked' && states.get(r.to).state !== 'locked';
      return s('path', { class: `road${lit ? ' is-lit' : ''}`, d: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`, 'data-from': r.from, 'data-to': r.to });
    });
    const districts = layout.districts.map((d) => {
      const st = states.get(d.id);
      const label = `${st.title}. ${STATE_WORD[st.state]}. ${st.solved} of ${st.total} solved.${st.state === 'locked' ? ` Opens after ${st.blockedBy.map((b) => b.title).join(' and ')}.` : ''}${nextTopic === d.id ? ' Your next problem is here.' : ''} Enter zooms in.`;
      const cells = st.problems.map((pid, j) => hexCell(pid, d.x + d.cells[j].x, d.y + d.cells[j].y, layout.r - 1.1, next?.id));
      const nextCell = next && placed[next.id]?.topic === d.id ? d.cells[st.problems.indexOf(next.id)] : null;
      return s(
        'g',
        {
          class: `district st-${st.state}${nextTopic === d.id ? ' has-next' : ''}${d.id === preview ? ' is-preview' : ''}`,
          'data-id': d.id,
          'data-key': d.id,
          role: 'button',
          tabindex: d.id === focusId ? 0 : -1,
          'aria-label': label,
          style: `--i:${st.tier}`,
        },
        s('rect', { class: 'land', x: d.x + 0.5, y: d.y + 0.5, width: d.w - 1, height: d.h - 1, rx: 12 }),
        s('text', { class: 'd-name', x: d.x + 12, y: d.y + 19 }, fitName(st.title, d.w - 24)),
        s('text', { class: 'd-count', x: d.x + 12, y: d.y + 35 }, `${st.solved}/${st.total}`, st.state === 'locked' ? ' · locked' : st.state === 'mastered' ? ' · mastered' : ''),
        cells,
        nextCell ? s('circle', { class: 'next-ring', cx: d.x + nextCell.x, cy: d.y + nextCell.y, r: layout.r + 3 }) : null,
      );
    });
    svg = s(
      'svg',
      { class: `map-svg${layout.narrow ? ' is-narrow' : ''}`, viewBox: `0 0 ${layout.width} ${layout.height}`, width: layout.width, height: layout.height, role: 'group', 'aria-label': `Problem map: ${TOPICS.length} topics in ${layout.bands.length} tiers. Arrow keys move between topics, Enter zooms into one.` },
      s('g', { class: 'bands', 'aria-hidden': 'true' }, bands),
      s('g', { class: 'roads', 'aria-hidden': 'true' }, roads),
      s('g', { class: 'districts' }, districts),
    );
    mount(stage, svg);
    markChain(preview, 'is-chain');
  }

  /* Level 1: one topic's subtopics, on a winding road in learning order */
  function drawTopic() {
    const st = states.get(level.topic);
    const cs = concepts(level.topic);
    const width = Math.max(300, Math.floor(svgHost.clientWidth || 900) - 32);
    lastWidth = width;
    const L = layoutTopic(cs.map((c) => ({ id: c.id, count: c.total })), { width });
    nbrs = neighbours(L.blocks);
    keys = L.blocks.map((b) => b.id);
    const next = st.next;
    const nextConcept = next ? placed[next]?.concept : null;
    focusId = keys.includes(focusId) ? focusId : (nextConcept ?? keys[0]);
    const byId = new Map(cs.map((c) => [c.id, c]));
    const roads = L.roads.map((r) => {
      const [a, c1, c2, b] = r.points;
      return s('path', { class: `road${byId.get(r.from).state === 'done' ? ' is-chain' : ' is-lit'}`, d: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}` });
    });
    const blocks = L.blocks.map((b) => {
      const c = byId.get(b.id);
      const label = `${c.title}. Subtopic ${b.order + 1} of ${cs.length}. ${CONCEPT_WORD[c.state]}, ${c.solved} of ${c.total} solved.${nextConcept === c.id ? ' Your next problem is here.' : ''} Enter zooms in.`;
      const nextCell = next && c.problems.includes(next) ? b.cells[c.problems.indexOf(next)] : null;
      return s(
        'g',
        { class: `district block c-${c.state}${st.state === 'locked' ? ' st-locked' : ''}${nextConcept === c.id ? ' has-next' : ''}`, 'data-id': c.id, 'data-key': c.id, role: 'button', tabindex: c.id === focusId ? 0 : -1, 'aria-label': label, style: `--i:${b.order}` },
        s('rect', { class: 'land', x: b.x + 0.5, y: b.y + 0.5, width: b.w - 1, height: b.h - 1, rx: 12 }),
        s('text', { class: 'b-order', x: b.x + 12, y: b.y + 18 }, String(b.order + 1).padStart(2, '0')),
        s('text', { class: 'd-name', x: b.x + 36, y: b.y + 18 }, fitName(c.title, b.w - 48)),
        s('text', { class: 'd-count', x: b.x + 36, y: b.y + 35 }, `${c.solved}/${c.total}`, c.state === 'done' ? ' · done' : ''),
        c.problems.map((pid, j) => hexCell(pid, b.x + b.cells[j].x, b.y + b.cells[j].y, L.r - 1.2, next)),
        nextCell ? s('circle', { class: 'next-ring', cx: b.x + nextCell.x, cy: b.y + nextCell.y, r: L.r + 3 }) : null,
      );
    });
    svg = s(
      'svg',
      { class: `map-svg map-topic${L.narrow ? ' is-narrow' : ''}`, viewBox: `0 0 ${L.width} ${L.height}`, width: L.width, height: L.height, role: 'group', 'aria-label': `${st.title}: ${cs.length} subtopics in learning order. Arrow keys move between them, Enter zooms into one, Escape goes back to every topic.` },
      s('g', { class: 'roads', 'aria-hidden': 'true' }, roads),
      s('g', { class: 'districts' }, blocks),
    );
    mount(stage, svg);
  }

  /* Levels 2 and 3: one subtopic's problems as named tiles; a picked problem gets the panel */
  function drawConcept() {
    svg = null;
    nbrs = null;
    keys = [];
    const cs = concepts(level.topic);
    const i = cs.findIndex((c) => c.id === level.concept);
    const c = cs[i];
    const tile = (pid) => {
      const e = catalogEntry(pid);
      const status = statusOf(pid);
      const current = pid === level.problem;
      return h(
        'li',
        {},
        h(
          `a.map-tile${current ? '.is-current' : ''}`,
          { href: mapLevelHash({ ...level, problem: pid }), 'data-key': pid, 'aria-current': current ? 'true' : null },
          s('svg', { class: 'tile-hex', viewBox: '-50 -50 100 100', 'aria-hidden': 'true' }, s('polygon', { class: `hx ${status} d-${(e?.difficulty ?? 'easy').toLowerCase()}${placed[pid].essential ? ' is-path' : ''}${pid === c.next ? ' is-next' : ''}`, points: hexPoints(0, 0, 46), 'data-pid': pid })),
          h('span.tile-title', {}, e?.title ?? pid),
          h('span.tile-meta', {}, difficulty(e?.difficulty ?? 'Easy'), placed[pid].essential ? h('span.tag.tag-muted.path-flag', { title: 'The learning path picks this one' }, 'Path') : null),
          h('span.sr-only', {}, `, ${STATUS_WORD[status]}`),
        ),
      );
    };
    const sibling = (j, dir) => {
      const sib = cs[j];
      if (!sib) return h('span');
      return h(`a.map-sibling.is-${dir}`, { href: mapLevelHash({ topic: level.topic, concept: sib.id, problem: null }) }, h('span.hint-text', {}, dir === 'prev' ? 'Previous subtopic' : 'Next subtopic'), h('strong', {}, dir === 'prev' ? `← ${sib.title}` : `${sib.title} →`));
    };
    mount(
      stage,
      h(
        'div.map-concept',
        {},
        h('ol.map-tiles', { 'aria-label': `${c.title}: ${c.total} ${c.total === 1 ? 'problem' : 'problems'}` }, c.problems.map(tile)),
        h('nav.map-siblings', { 'aria-label': 'Other subtopics' }, sibling(i - 1, 'prev'), sibling(i + 1, 'next')),
      ),
    );
  }

  function hexCell(pid, cx, cy, r, nextId) {
    const entry = catalogEntry(pid);
    return s('polygon', {
      class: `hx ${statusOf(pid)} d-${(entry?.difficulty ?? 'easy').toLowerCase()}${placed[pid].essential ? ' is-path' : ''}${nextId === pid ? ' is-next' : ''}`,
      points: hexPoints(cx, cy, r),
      'data-pid': pid,
    });
  }

  /**
   * District and subtopic names are SVG text and do not wrap: measure with the real font and
   * shorten only when needed (the full name is in the panel and the element's accessible name).
   */
  const measure = document.createElement('canvas').getContext('2d');
  function fitName(title, maxPx) {
    if (!measure) return title;
    measure.font = `650 13px ${getComputedStyle(document.body).getPropertyValue('--display') || 'sans-serif'}`;
    const fits = (t) => measure.measureText(t).width <= maxPx;
    if (fits(title)) return title;
    const short = title.replace('Dynamic Programming', 'DP').replace('Data Structure ', '').replace(' / Priority Queue', '').replace('Sorting & ', '').replace('Advanced ', 'Adv. ').replace('Manipulation', 'Tricks');
    if (fits(short)) return short;
    let cut = short;
    while (cut.length > 3 && !fits(`${cut}…`)) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  }

  function paintLens() {
    svgHost.dataset.lens = lens;
    svgHost.classList.toggle('has-company', Boolean(company));
    svgHost.querySelectorAll('.hx').forEach((p) => p.classList.toggle('in-company', Boolean(company?.ids.has(p.dataset.pid))));
    if (lens === 'company' && company) summary.textContent = `${company.name}: ${[...company.ids].filter((id) => placed[id] && ids.includes(id)).length} of its problems are on the site. Highlighted below.`;
    else renderSummary();
  }

  function markChain(id, cls) {
    if (!svg || level.topic) return;
    const anc = ancestorsOf(id);
    const deps = new Set(dependantsOf(id));
    svg.querySelectorAll('.road').forEach((r) => {
      const inChain = (r.dataset.to === id || anc.has(r.dataset.to)) && (anc.has(r.dataset.from) || r.dataset.from === id);
      r.classList.toggle(cls, inChain);
      r.classList.toggle(`${cls}-out`, r.dataset.from === id && deps.has(r.dataset.to));
    });
    svg.querySelectorAll('.district').forEach((g) => g.classList.toggle(`${cls}-member`, anc.has(g.dataset.id)));
  }

  /** Overview: the panel follows the pointer and the keyboard; a click or Enter zooms in. */
  function previewTopic(id) {
    if (level.topic || !id || id === preview) return;
    preview = id;
    svg?.querySelectorAll('.district').forEach((g) => g.classList.toggle('is-preview', g.dataset.id === id));
    markChain(id, 'is-chain');
    renderBrief();
  }

  /* ---------- Panel ---------- */
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
      h('p.hint-text', {}, 'Pick a problem to see where it is asked, or open it.'),
    );
  }

  let metaToken = 0;
  function briefProblem() {
    const st = states.get(level.topic);
    const cs = concepts(level.topic);
    const c = cs.find((x) => x.id === level.concept);
    const pid = level.problem;
    const e = catalogEntry(pid);
    const status = statusOf(pid);
    const j = c.problems.indexOf(pid);
    const after = c.problems[j + 1] ?? null;
    const asked = h('p.hint-text.brief-asked', {}, ' ');
    mount(
      brief,
      h('span.eyebrow', {}, `${st.title} · ${c.title}`),
      h('h2.brief-title', {}, e?.title ?? pid),
      h('div.brief-meta', {}, difficulty(e?.difficulty ?? 'Easy'), h(`span.status-word.is-${status}`, {}, h('span.hexmark', { class: status, 'aria-hidden': 'true' }), STATUS_WORD[status]), placed[pid].essential ? h('span.tag.tag-muted.path-flag', {}, 'On the learning path') : null),
      asked,
      h('a.btn.btn-primary.btn-block.brief-cta', { href: `#/problem/${pid}` }, status === 'solved' || status === 'assisted' ? 'Open it again' : status === 'attempted' ? 'Continue it' : 'Open problem'),
      after ? h('a.btn.btn-secondary.btn-block', { href: mapLevelHash({ ...level, problem: after }) }, `Next: ${catalogEntry(after)?.title ?? after}`) : null,
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
  function drawLevel() {
    svgHost.dataset.level = String(levelDepth(level));
    if (!level.topic) drawOverview();
    else if (!level.concept) drawTopic();
    else drawConcept();
    paintLens();
  }

  function renderBody() {
    computeStates();
    lensControl.hidden = view === 'list';
    companySelect.hidden = view === 'list' || lens !== 'company';
    legend.hidden = view === 'list';
    if (view === 'list') {
      svg = null;
      mount(body, renderList());
      renderSummary();
      return;
    }
    if (!main.isConnected) {
      mount(svgHost, stage, tooltip);
      mount(body, h('div.map-layout', {}, main, brief));
    }
    renderCrumbs();
    drawLevel();
    renderBrief();
  }

  /**
   * Zoom between levels: going in, the new level grows out of the element you picked; going out,
   * the level above shrinks back into place around the one you left. Transform and opacity only.
   */
  function zoom(direction, origin) {
    if (reducedMotion() || !origin || typeof stage.animate !== 'function') return;
    const box = svgHost.getBoundingClientRect();
    stage.style.transformOrigin = `${Math.round(origin.x - box.left)}px ${Math.round(origin.y - box.top)}px`;
    const from = direction === 'in' ? { transform: 'scale(0.35)', opacity: 0 } : { transform: 'scale(1.9)', opacity: 0 };
    stage.animate([from, { transform: 'scale(1)', opacity: 1 }], { duration: DUR.slow, easing: EASE.out });
  }
  const centreOf = (el) => {
    const r = el?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  };
  const keyEl = (key) => (key ? stage.querySelector(`[data-key="${CSS.escape(key)}"]`) : null);

  /** A new map hash: change level, zoom, and put focus where the keyboard expects it. */
  function goTo(parts2) {
    const prev = level;
    level = parseMapLevel(parts2, known);
    canonical();
    if (view === 'list') {
      renderBody();
      return;
    }
    const dPrev = levelDepth(prev);
    const dNext = levelDepth(level);
    const sameCanvas = dPrev >= 2 && dNext >= 2 && prev.concept === level.concept && prev.topic === level.topic;
    const keyAt = (l, d) => [l.topic, l.concept, l.problem][d - 1];
    // Going in: grow from the picked element, measured before it is replaced.
    const inOrigin = dNext > dPrev && !sameCanvas ? centreOf(keyEl(keyAt(level, dPrev + 1))) : null;
    const hadFocus = svgHost.contains(document.activeElement) || crumbs.contains(document.activeElement);
    if (level.topic !== prev.topic) focusId = null;
    if (!level.topic) {
      focusId = prev.topic ?? focusId;
      preview = prev.topic ?? preview;
    } else if (!level.concept) focusId = prev.concept ?? null;
    renderCrumbs();
    if (!sameCanvas) drawLevel();
    else stage.querySelectorAll('.map-tile').forEach((a) => {
      const on = a.dataset.key === level.problem;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    renderBrief();
    if (!sameCanvas) {
      if (dNext > dPrev) zoom('in', inOrigin ?? centreOf(svgHost));
      else if (dNext < dPrev) zoom('out', centreOf(keyEl(keyAt(prev, dNext + 1))) ?? centreOf(svgHost));
    }
    // Where the panel sits below the map (a phone, a narrow window), a picked problem's card is
    // what you want to see next; otherwise keep the level's top in view.
    // The zoom is the motion; the scroll is instant, so the two never fight.
    const panelBelow = brief.getBoundingClientRect().top > svgHost.getBoundingClientRect().top + 8;
    if (level.problem && panelBelow) brief.scrollIntoView({ block: 'start' });
    else {
      const top = crumbs.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6) crumbs.scrollIntoView({ block: 'start' });
    }
    if (hadFocus) {
      const target = dNext <= 1 ? stage.querySelector('[tabindex="0"]') : (stage.querySelector('.map-tile.is-current') ?? stage.querySelector('.map-tile'));
      target?.focus({ preventScroll: true });
    }
  }

  /* ---------- Input ---------- */
  on(svgHost, 'click', (e) => {
    const g = e.target.closest?.('.district');
    if (!g) return;
    const cell = e.target.closest?.('.hx');
    if (!level.topic) return go({ topic: g.dataset.id, concept: null, problem: null });
    // A hex on the topic level is a shortcut straight to that problem.
    if (cell) return go({ topic: level.topic, concept: g.dataset.id, problem: cell.dataset.pid });
    return go({ topic: level.topic, concept: g.dataset.id, problem: null });
  });
  on(svgHost, 'keydown', (e) => {
    const g = e.target.closest?.('.district');
    if (!g || !nbrs) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      return go(level.topic ? { topic: level.topic, concept: g.dataset.id, problem: null } : { topic: g.dataset.id, concept: null, problem: null });
    }
    const to = e.key === 'Home' ? keys[0] : e.key === 'End' ? keys.at(-1) : nbrs.get(g.dataset.id)?.[e.key];
    if (to === undefined) return;
    e.preventDefault();
    if (!to) return;
    focusId = to;
    svg.querySelectorAll('.district').forEach((d) => d.setAttribute('tabindex', d.dataset.id === to ? '0' : '-1'));
    svg.querySelector(`.district[data-id="${to}"]`)?.focus();
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
  on(svgHost, 'focusin', (e) => {
    const g = e.target.closest?.('.district');
    if (!g || level.topic) return;
    markChain(g.dataset.id, 'is-hover');
    previewTopic(g.dataset.id);
  });
  on(svgHost, 'focusout', () => markChain('', 'is-hover'));
  on(svgHost, 'pointerover', (e) => {
    if (level.topic) return;
    const g = e.target.closest?.('.district');
    markChain(g ? g.dataset.id : '', 'is-hover');
    if (g && e.pointerType === 'mouse') previewTopic(g.dataset.id);
  });
  on(svgHost, 'pointerleave', () => {
    markChain('', 'is-hover');
    tooltip.hidden = true;
  });
  on(svgHost, 'pointermove', (e) => {
    const cell = e.pointerType === 'mouse' ? e.target.closest?.('.map-svg .hx') : null;
    if (!cell) {
      tooltip.hidden = true;
      return;
    }
    const pid = cell.dataset.pid;
    const entry = catalogEntry(pid);
    mount(tooltip, h('strong', {}, entry?.title ?? pid), h('span', {}, `${entry?.difficulty ?? ''} · ${STATUS_WORD[statusOf(pid)]}`));
    const box = svgHost.getBoundingClientRect();
    tooltip.style.transform = `translate(${Math.round(e.clientX - box.left + 14)}px, ${Math.round(e.clientY - box.top + 14)}px)`;
    tooltip.hidden = false;
  });

  // Re-pack when the width changes enough to matter; tiny changes (a scrollbar) are ignored.
  const ro = new ResizeObserver(() => {
    if (view !== 'map' || !svgHost.isConnected || level.concept) return;
    const w = Math.floor(svgHost.clientWidth) - 32;
    if (Math.abs(w - lastWidth) > 24) drawLevel();
  });
  ro.observe(page);

  const unsub = store.subscribe(() => {
    if (!page.isConnected) return;
    renderBody();
  });

  renderBody();
  if (!reducedMotion() && !level.topic) svg?.classList.add('is-entering');
  // Names are fitted with the display font; measure again once it has loaded.
  document.fonts?.ready.then(() => {
    if (page.isConnected && view === 'map' && !level.concept) drawLevel();
  });
  return {
    go: goTo,
    cleanup: () => {
      unsub();
      ro.disconnect();
      listeners.forEach((fn) => fn());
    },
  };
}
