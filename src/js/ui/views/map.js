/**
 * Problem Map (#/map, #/map/<topic>): the 26 topics as districts of hexes, one hex per problem,
 * tiers read left to right, roads for prerequisites. A topic is locked until its prerequisites
 * have READY_SOLVES solves each; locked is advice, so every problem still opens.
 *
 * The list view on the same page (and the Problems page) is the accessible alternative: it holds
 * everything the map shows, as headings, lists and links.
 *
 * Geometry and states are pure (data/map-layout.js); this file draws SVG and wires input.
 * Data: problem-topics.json and essential-path.json, fetched on demand.
 */
import { h, mount, difficulty, segmented, stateBlock, loadingState, siteFooter } from '../dom.js';
import { availableEntries, catalogEntry } from '../../problems/index.js';
import { TOPICS } from '../../data/taxonomy.js';
import { TIER_TITLES, pathProgress, conceptLabel } from '../../data/learning-path.js';
import { topicStates, layoutMap, neighbours, problemStatus, READY_SOLVES } from '../../data/map-layout.js';
import { loadPath } from '../../data/path-loader.js';
import { loadProblemTopics, loadSets } from '../../data/company-loader.js';
import { reducedMotion } from '../motion.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_KEY = 'lfb:map-view';
/** Tier labels short enough for a map column; the full names are on the Path page. */
const TIER_SHORT = ['Vocabulary', 'First patterns', 'Built on patterns', 'Core structures', 'Deeper structures', 'Advanced'];
const STATE_WORD = { locked: 'Locked', open: 'Open', started: 'In progress', mastered: 'Mastered' };
const STATUS_WORD = { new: 'Not started', attempted: 'Tried', solved: 'Solved', assisted: 'Solved with help' };

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
 * @param {{ store: any, topic: string|null }} opts
 * @returns {() => void} cleanup
 */
export function renderMap(root, { store, topic }) {
  let disposed = false;
  const cleanups = [];
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
    cleanups.push(mountMap(root, { store, placed, path, initialTopic: topic }));
  });

  return () => {
    disposed = true;
    cleanups.forEach((fn) => fn());
  };
}

/**
 * Builds the page once data is in. Re-renders the map on progress changes and on width changes
 * that cross the wide/narrow switch (or change the width enough to re-pack the columns).
 */
function mountMap(root, { store, placed, path, initialTopic }) {
  const entries = availableEntries();
  // Path order first, so each topic's "next" is the one the learning path would give.
  const inPath = path.flatMap((t) => t.topics.flatMap((tp) => tp.problems.map((p) => p.id)));
  const published = new Set(entries.map((e) => e.id));
  const ids = [...inPath.filter((id) => published.has(id)), ...entries.map((e) => e.id).filter((id) => !inPath.includes(id))];
  const topicIds = new Set(TOPICS.map((t) => t.id));
  let selected = topicIds.has(initialTopic) ? initialTopic : null;
  let view = readView();
  let lens = 'status';
  let company = null; // { name, ids: Set<string> }
  let states = null;
  let layout = null;
  let focusId = null;
  let lastWidth = 0;
  const listeners = [];
  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    listeners.push(() => el.removeEventListener(type, fn, opts));
  };

  const dependantsOf = (id) => TOPICS.filter((t) => t.prereqs.includes(id)).map((t) => t.id);
  const ancestorsOf = (id) => {
    const out = new Set();
    const walk = (x) => {
      for (const p of TOPICS.find((t) => t.id === x)?.prereqs ?? []) if (!out.has(p)) (out.add(p), walk(p));
    };
    walk(id);
    return out;
  };

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

  /* ---------- Map ---------- */
  const svgHost = h('div.map-canvas');
  const tooltip = h('div.map-tip', { role: 'tooltip', hidden: true });
  const brief = h('aside.map-brief', { 'aria-live': 'polite', 'aria-label': 'Selected topic' });
  let svg = null;
  let nbrs = null;

  function computeStates() {
    states = topicStates({ topics: TOPICS, placed, ids, progress: store.get().problems });
  }

  function nextProblem() {
    const isSolved = (id) => ['solved', 'assisted'].includes(problemStatus(store.get().problems[id]));
    return pathProgress(path, isSolved).next;
  }

  function drawMap() {
    const width = Math.max(300, Math.floor(svgHost.clientWidth || 900));
    lastWidth = width;
    layout = layoutMap(states, { width });
    nbrs = neighbours(layout.districts);
    const next = nextProblem();
    const nextTopic = next ? placed[next.id]?.topic : null;
    if (!selected) selected = nextTopic ?? TOPICS[0].id;
    focusId ??= selected;

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
    const districts = layout.districts.map((d, i) => {
      const st = states.get(d.id);
      const label = `${st.title}. ${STATE_WORD[st.state]}. ${st.solved} of ${st.total} solved.${st.state === 'locked' ? ` Opens after ${st.blockedBy.map((b) => b.title).join(' and ')}.` : ''}${nextTopic === d.id ? ' Your next problem is here.' : ''}`;
      const cells = st.problems.map((pid, j) => {
        const c = d.cells[j];
        const status = problemStatus(store.get().problems[pid]);
        const entry = catalogEntry(pid);
        return s('polygon', {
          class: `hx ${status} d-${(entry?.difficulty ?? 'easy').toLowerCase()}${placed[pid].essential ? ' is-path' : ''}${next?.id === pid ? ' is-next' : ''}`,
          points: hexPoints(d.x + c.x, d.y + c.y, layout.r - 1.1),
          'data-pid': pid,
        });
      });
      const nextCell = next && placed[next.id]?.topic === d.id ? d.cells[st.problems.indexOf(next.id)] : null;
      return s(
        'g',
        {
          class: `district st-${st.state}${nextTopic === d.id ? ' has-next' : ''}`,
          'data-id': d.id,
          role: 'button',
          tabindex: d.id === focusId ? 0 : -1,
          'aria-pressed': String(d.id === selected),
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
      { class: `map-svg${layout.narrow ? ' is-narrow' : ''}`, viewBox: `0 0 ${layout.width} ${layout.height}`, width: layout.width, height: layout.height, role: 'group', 'aria-label': `Problem map: ${TOPICS.length} topics in ${layout.bands.length} tiers. Arrow keys move between topics, Enter selects one.` },
      s('g', { class: 'bands', 'aria-hidden': 'true' }, bands),
      s('g', { class: 'roads', 'aria-hidden': 'true' }, roads),
      s('g', { class: 'districts' }, districts),
    );
    mount(svgHost, svg, tooltip);
    if (!reducedMotion()) svg.classList.add('is-entering');
    paintLens();
    markChain(selected, 'is-chain');
  }

  /**
   * District names are SVG text and do not wrap: measure with the real font and shorten only
   * when needed (the full name is in the brief panel and the district's accessible name).
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
    if (!svg) return;
    svg.dataset.lens = lens;
    svg.classList.toggle('has-company', Boolean(company));
    svg.querySelectorAll('.hx').forEach((p) => p.classList.toggle('in-company', Boolean(company?.ids.has(p.dataset.pid))));
    if (lens === 'company' && company) summary.textContent = `${company.name}: ${[...company.ids].filter((id) => placed[id] && ids.includes(id)).length} of its problems are on the site. Highlighted below.`;
    else renderSummary();
  }

  function markChain(id, cls) {
    if (!svg) return;
    const anc = ancestorsOf(id);
    const deps = new Set(dependantsOf(id));
    svg.querySelectorAll('.road').forEach((r) => {
      const inChain = (r.dataset.to === id || anc.has(r.dataset.to)) && (anc.has(r.dataset.from) || r.dataset.from === id);
      r.classList.toggle(cls, inChain);
      r.classList.toggle(`${cls}-out`, r.dataset.from === id && deps.has(r.dataset.to));
    });
    svg.querySelectorAll('.district').forEach((g) => g.classList.toggle(`${cls}-member`, anc.has(g.dataset.id)));
  }

  function select(id, { focus = false, fromUser = false } = {}) {
    selected = id;
    focusId = id;
    svg?.querySelectorAll('.district').forEach((g) => {
      const on = g.dataset.id === id;
      g.setAttribute('aria-pressed', String(on));
      g.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focus) g.focus();
    });
    markChain(id, 'is-chain');
    renderBrief();
    // Deep link without re-routing: replaceState does not fire hashchange.
    if (fromUser) history.replaceState(null, '', `#/map/${id}`);
    if (fromUser && layout?.narrow) brief.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Brief panel ---------- */
  function renderBrief(highlightPid = null) {
    const st = states.get(selected);
    if (!st) return;
    const progress = store.get().problems;
    const next = st.next;
    const nextTitle = next ? catalogEntry(next)?.title ?? next : null;
    const builds = st.prereqs.map((p) => states.get(p));
    const leads = dependantsOf(st.id).map((d) => states.get(d));
    const stateLine =
      st.state === 'locked'
        ? `Opens after ${st.blockedBy.map((b) => `${b.title} (${b.have} of ${b.need} solved)`).join(' and ')}. You can still practice it now.`
        : st.state === 'mastered'
          ? 'Mastered: every learning path problem here is solved.'
          : st.state === 'started'
            ? `In progress: ${st.essentialSolved} of ${st.essentialTotal} learning path problems solved.`
            : 'Open: everything it builds on is in place.';
    const companyCount = company ? st.problems.filter((p) => company.ids.has(p)).length : null;
    const topicLink = (t) => h('a.topic-link', { href: `#/map/${t.id}`, onClick: (e) => (e.preventDefault(), select(t.id, { fromUser: true })) }, h('span.hexmark', { class: `t-${t.state}`, 'aria-hidden': 'true' }), t.title);
    mount(
      brief,
      h('span.eyebrow', {}, `Tier ${st.tier + 1} · ${TIER_TITLES[st.tier] ?? ''}`),
      h('h2.brief-title', {}, st.title),
      h(
        'div.brief-progress',
        {},
        h('span.progress-bar', { 'aria-hidden': 'true' }, h('span.progress-fill', { style: { width: `${st.total ? Math.round((st.solved / st.total) * 100) : 0}%` } })),
        h('p.hint-text', {}, `${st.solved} of ${st.total} solved`, companyCount !== null ? ` · ${companyCount} asked by ${company.name}` : ''),
      ),
      h(`p.brief-state.is-${st.state}`, {}, h('strong', {}, `${STATE_WORD[st.state]}. `), stateLine.replace(/^(Mastered|In progress|Open): /, '')),
      builds.length || leads.length
        ? h(
            'dl.brief-links',
            {},
            builds.length ? [h('dt', {}, 'Builds on'), h('dd', {}, builds.map(topicLink))] : null,
            leads.length ? [h('dt', {}, 'Leads to'), h('dd', {}, leads.map(topicLink))] : null,
          )
        : null,
      next ? h('a.btn.btn-primary.btn-block.brief-cta', { href: `#/problem/${next}` }, st.solved || st.attempted ? `Continue: ${nextTitle}` : `Start: ${nextTitle}`) : h('p.hint-text', {}, 'Every problem here is solved.'),
      h(
        'ol.brief-problems',
        { 'aria-label': `${st.title} problems` },
        st.problems.map((pid) => {
          const e = catalogEntry(pid);
          const status = problemStatus(progress[pid]);
          return h(
            `li.brief-row${pid === highlightPid ? '.is-highlight' : ''}${company && !company.ids.has(pid) ? '.is-dim' : ''}`,
            { 'data-pid': pid },
            h('span.hexmark', { class: status, 'aria-hidden': 'true' }),
            h('a.brief-link', { href: `#/problem/${pid}` }, e?.title ?? pid, h('span.sr-only', {}, `, ${STATUS_WORD[status]}`)),
            placed[pid].essential ? h('span.tag.tag-muted.path-flag', { title: 'On the learning path' }, 'Path') : null,
            difficulty(e?.difficulty ?? 'Easy'),
          );
        }),
      ),
    );
    if (highlightPid) brief.querySelector('.is-highlight')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
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
    const progress = store.get().problems;
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
              { open: t.id === selected },
              h(
                'summary',
                {},
                h('span.map-list-name', {}, t.title),
                h(`span.state-tag.is-${st.state}`, {}, STATE_WORD[st.state]),
                h('span.map-list-count', {}, `${st.solved} of ${st.total} solved`),
              ),
              st.state === 'locked' ? h('p.hint-text', {}, `Opens after ${st.blockedBy.map((b) => `${b.title} (${b.have} of ${b.need})`).join(' and ')}.`) : null,
              h(
                'ul.map-list-problems',
                {},
                st.problems.map((pid) => {
                  const e = catalogEntry(pid);
                  const status = problemStatus(progress[pid]);
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
    mount(body, h('div.map-layout', {}, svgHost, brief));
    drawMap();
    renderBrief();
  }

  /* ---------- Input ---------- */
  on(svgHost, 'click', (e) => {
    const cell = e.target.closest?.('.hx');
    const g = e.target.closest?.('.district');
    if (!g) return;
    select(g.dataset.id, { fromUser: true });
    if (cell) renderBrief(cell.dataset.pid);
  });
  on(svgHost, 'keydown', (e) => {
    const g = e.target.closest?.('.district');
    if (!g || !nbrs) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(g.dataset.id, { focus: true, fromUser: true });
      return;
    }
    const to = e.key === 'Home' ? layout.districts[0].id : e.key === 'End' ? layout.districts.at(-1).id : nbrs.get(g.dataset.id)?.[e.key];
    if (to === undefined) return;
    e.preventDefault();
    if (!to) return;
    focusId = to;
    svg.querySelectorAll('.district').forEach((d) => d.setAttribute('tabindex', d.dataset.id === to ? '0' : '-1'));
    svg.querySelector(`.district[data-id="${to}"]`)?.focus();
  });
  on(svgHost, 'focusin', (e) => {
    const g = e.target.closest?.('.district');
    if (g) markChain(g.dataset.id, 'is-hover');
  });
  on(svgHost, 'focusout', () => markChain('', 'is-hover'));
  on(svgHost, 'pointerover', (e) => {
    const g = e.target.closest?.('.district');
    markChain(g ? g.dataset.id : '', 'is-hover');
  });
  on(svgHost, 'pointerleave', () => {
    markChain('', 'is-hover');
    tooltip.hidden = true;
  });
  on(svgHost, 'pointermove', (e) => {
    const cell = e.pointerType === 'mouse' ? e.target.closest?.('.hx') : null;
    if (!cell) {
      tooltip.hidden = true;
      return;
    }
    const pid = cell.dataset.pid;
    const entry = catalogEntry(pid);
    mount(tooltip, h('strong', {}, entry?.title ?? pid), h('span', {}, `${entry?.difficulty ?? ''} · ${STATUS_WORD[problemStatus(store.get().problems[pid])]}`));
    const box = svgHost.getBoundingClientRect();
    tooltip.style.transform = `translate(${Math.round(e.clientX - box.left + 14)}px, ${Math.round(e.clientY - box.top + 14)}px)`;
    tooltip.hidden = false;
  });

  // Re-pack when the width changes enough to matter; tiny changes (a scrollbar) are ignored.
  const ro = new ResizeObserver(() => {
    if (view !== 'map' || !svgHost.isConnected) return;
    const w = Math.floor(svgHost.clientWidth);
    if (Math.abs(w - lastWidth) > 24) drawMap();
  });
  ro.observe(page);

  const unsub = store.subscribe(() => {
    if (!page.isConnected) return;
    renderBody();
  });

  renderBody();
  // Names are fitted with the display font; measure again once it has loaded.
  document.fonts?.ready.then(() => {
    if (page.isConnected && view === 'map') drawMap();
  });
  return () => {
    unsub();
    ro.disconnect();
    listeners.forEach((fn) => fn());
  };
}
