/**
 * Dashboard: progress stats + filterable problem bank. Reads only the catalog: no problem module
 * loads here (docs/adr/0008-lazy-problem-modules.md).
 */
import { h, mount, difficulty, chipGroup, stateBlock, siteFooter, hexMark } from '../dom.js';
import { catalog, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import { stats } from '../../state/progress.js';
import { weakSpots } from '../../data/recommend.js';
import { loadPath } from '../../data/path-loader.js';
import { dailyCard } from '../daily-card.js';
import { countUp } from '../motion.js';

const HEAD_DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

const STATUS_LABEL = { solved: 'Solved', assisted: 'Assisted', attempted: 'Attempted' };
const topicLabel = (id) => TOPICS.find((t) => t.id === id)?.label ?? id;

/**
 * Render the Problem Bank dashboard: compact progress strip (or new-visitor start block),
 * Problem of the day with primary Solve CTA, Weak spots, search-first filters with Topic
 * disclosure and result count, and full-row problem table (stacked list rows under 640 px).
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderDashboard(root, { store }) {
  const filters = { difficulty: 'All', topic: 'all', query: '' };
  const available = catalog.filter((p) => p.status === 'available').length;
  const planned = catalog.length - available;
  const tableBody = h('tbody');
  const tableWrap = h(
    'div.table-wrap.dashboard-table-wrap',
    {},
    h(
      'table.problem-table.dashboard-table',
      {},
      h(
        'thead',
        {},
        h(
          'tr',
          {},
          h('th.cell-status', { scope: 'col' }, h('span.sr-only', {}, 'Status')),
          h('th', { scope: 'col' }, 'Title'),
          h('th', { scope: 'col' }, 'Difficulty'),
          h('th', { scope: 'col' }, 'Topic'),
        ),
      ),
      tableBody,
    ),
  );
  const emptyHost = h('div.dashboard-empty', { hidden: true });
  const statsRow = h('div.stats-row');
  const today = h('section.today-row', { 'aria-label': 'Practice today' });
  const countLine = h('p.hint-text.filter-count', { role: 'status' });
  const clearInline = h('button.btn.btn-ghost.btn-sm.filter-clear', { type: 'button', hidden: true, onClick: () => clearFilters() }, 'Clear filters');
  let path = null;
  let topicOpen = false;

  function renderToday() {
    if (!path) return;
    const state = store.get();
    const spots = weakSpots(path, state.problems);
    const reason = (s) =>
      [s.unsolved ? `${s.unsolved} attempted, not solved` : null, s.assisted ? `${s.assisted} solved with the solution revealed` : null, s.failedSubmits ? `${s.failedSubmits} rejected ${s.failedSubmits === 1 ? 'submit' : 'submits'}` : null]
        .filter(Boolean)
        .join(', ');
    mount(
      today,
      dailyCard({ path, state, now: new Date(), compact: true }),
      h(
        `section.today-card.today-weak${spots.length ? '' : '.is-empty'}`,
        { 'aria-labelledby': 'weak-title' },
        h('div.today-kicker', { id: 'weak-title' }, 'Weak spots'),
        spots.length
          ? h(
              'ul.weak-list',
              {},
              spots.map((s) =>
                h(
                  'li',
                  {},
                  h('div.weak-copy', {}, h('strong', {}, s.title), h('div.hint-text', {}, reason(s))),
                  s.next ? h('a.btn.btn-secondary.btn-sm', { href: `#/problem/${s.next}` }, 'Practice') : h('span.hint-text', {}, 'Every problem here is solved'),
                ),
              ),
            )
          : h('p.hint-text', {}, 'None yet. Topics show up here when you miss submits, leave a problem unsolved or reveal a solution.'),
        h('a.weak-map-link', { href: '#/map' }, 'See every topic on the map'),
      ),
    );
  }

  const statCell = (label, value, sub) =>
    h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label, sub ? h('span.stat-sub', {}, ` ${sub}`) : null));
  // The solved count ticks up from the number this tab last showed (one moving number, once), so
  // coming back after a solve shows the step you just made. Never from zero: the text is always true.
  const SEEN_KEY = 'lfb:seen-solved';
  let stopCount = () => {};

  function renderStats() {
    const state = store.get();
    const st = stats(state);
    const hasActivity = st.submissions > 0 || st.solved > 0 || Object.keys(state.problems).length > 0;
    statsRow.classList.toggle('stats-empty', !hasActivity);
    if (!hasActivity) {
      mount(
        statsRow,
        h('span.start-hex', { 'aria-hidden': 'true' }),
        h(
          'div.start-copy',
          {},
          h('strong', {}, 'Start with the learning path or today\'s problem.'),
          h('span.start-sub', {}, `${available} problems ready to practice, ordered easy to hard. Every solve lights a hex on the map.`),
        ),
        h('div.start-actions', {}, h('a.btn.btn-secondary.btn-sm', { href: '#/path' }, 'Learning path'), h('a.btn.btn-ghost.btn-sm', { href: '#/map' }, 'Open the map')),
      );
      return;
    }
    const solvedCell = statCell('Solved', `${st.solved}`, `of ${available}`);
    mount(
      statsRow,
      solvedCell,
      statCell('Streak', `${st.streak} ${st.streak === 1 ? 'day' : 'days'}`),
      statCell('Accuracy', st.accuracy === null ? '-' : `${st.accuracy}%`),
      statCell('Submits', `${st.submissions}`),
    );
    let seen = null;
    try {
      seen = sessionStorage.getItem(SEEN_KEY);
      sessionStorage.setItem(SEEN_KEY, String(st.solved));
    } catch {
      /* storage blocked: no tick, the number is already right */
    }
    const from = seen === null ? NaN : Number(seen);
    if (Number.isFinite(from) && from < st.solved) {
      stopCount();
      stopCount = countUp(solvedCell.querySelector('.stat-value'), st.solved, { from });
    }
  }

  const statusCell = (status) => {
    const label = STATUS_LABEL[status];
    return h(`span.status-pill.s-${status}`, { title: label ?? 'Not started' }, hexMark(status), h('span.sr-only', {}, label ?? 'Not started'));
  };

  function hasActiveFilters() {
    return filters.difficulty !== 'All' || filters.topic !== 'all' || filters.query.trim() !== '';
  }

  // Bumped by every render and by cleanup: a fill still streaming rows for an old render stops.
  let fillToken = 0;

  function renderRows() {
    const state = store.get();
    const q = filters.query.trim().toLowerCase();
    const rows = catalog.filter(
      (p) =>
        (filters.difficulty === 'All' || p.difficulty === filters.difficulty) &&
        (filters.topic === 'all' || p.topics.includes(filters.topic)) &&
        (!q || p.title.toLowerCase().includes(q)),
    );
    const active = hasActiveFilters();
    clearInline.hidden = !active;
    const matchingAvailable = rows.filter((p) => p.status === 'available').length;
    const matchingPlanned = rows.length - matchingAvailable;
    countLine.textContent = active
      ? matchingPlanned > 0
        ? `${matchingAvailable} of ${available} ${available === 1 ? 'problem' : 'problems'}, ${matchingPlanned} coming soon`
        : `${matchingAvailable} of ${available} ${available === 1 ? 'problem' : 'problems'}`
      : planned > 0
        ? `${available} ${available === 1 ? 'problem' : 'problems'}, ${planned} coming soon`
        : `${rows.length} ${rows.length === 1 ? 'problem' : 'problems'}`;

    if (!rows.length) {
      tableWrap.hidden = true;
      emptyHost.hidden = false;
      mount(
        emptyHost,
        stateBlock({
          title: 'No matching problems',
          body: 'No problems match these filters. Try a broader search or clear the active filters.',
          kind: 'empty',
          action: { label: 'Clear filters', variant: 'btn-secondary', onClick: clearFilters },
        }),
      );
      return;
    }

    tableWrap.hidden = false;
    emptyHost.hidden = true;
    const row = (p) => {
        const prog = state.problems[p.id];
        const status = prog?.status === 'solved' ? (prog.revealed ? 'assisted' : 'solved') : prog ? 'attempted' : 'todo';
        const isAvailable = p.status === 'available';
        const title = isAvailable ? h('a.problem-link.row-link-target', { href: `#/problem/${p.id}` }, p.title) : h('span.planned-title', {}, p.title);
        return h(
          `tr${isAvailable ? '.row-link' : '.row-planned'}.s-${status}`,
          {},
          h('td.cell-status', {}, statusCell(status)),
          h('td.cell-title', {}, title, isAvailable ? null : h('span.tag.tag-muted', {}, 'Coming soon')),
          h('td.cell-diff', {}, difficulty(p.difficulty)),
          h('td.cell-topics', {}, p.topics.map((t) => h('span.tag', {}, topicLabel(t)))),
        );
      };
    // The first screenful now, the rest in small chunks between frames: building all 225 rows at
    // once blocked the main thread through a page change. aria-busy says the list is still filling.
    const token = ++fillToken;
    const FIRST = 40;
    const CHUNK = 60;
    mount(tableBody, rows.slice(0, FIRST).map(row));
    if (rows.length <= FIRST) {
      tableBody.removeAttribute('aria-busy');
      return;
    }
    tableBody.setAttribute('aria-busy', 'true');
    let at = FIRST;
    const fill = () => {
      if (token !== fillToken) return;
      tableBody.append(...rows.slice(at, at + CHUNK).map(row));
      at += CHUNK;
      if (at < rows.length) setTimeout(fill, 0);
      else tableBody.removeAttribute('aria-busy');
    };
    setTimeout(fill, 0);
  }

  const diffGroup = chipGroup({
    label: 'Difficulty',
    options: ['All', ...DIFFICULTIES].map((d) => ({ value: d, label: d, attrs: { 'data-value': d } })),
    value: filters.difficulty,
    onChange: (value) => {
      filters.difficulty = value;
      renderRows();
    },
  });

  const topicToggle = h(
    'button.chip.topic-toggle',
    {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'dashboard-topics',
      onClick: () => setTopicOpen(!topicOpen),
    },
    'Topic',
  );

  const syncTopicToggle = () => {
    const active = filters.topic !== 'all';
    topicToggle.textContent = active ? `Topic: ${topicLabel(filters.topic)}` : 'Topic';
    topicToggle.classList.toggle('is-active', active);
  };

  const topicGroup = chipGroup({
    label: 'Topic',
    options: [{ value: 'all', label: 'All topics', attrs: { 'data-value': 'all' } }, ...TOPICS.map((t) => ({ value: t.id, label: t.label, attrs: { 'data-value': t.id } }))],
    value: filters.topic,
    onChange: (value) => {
      filters.topic = value;
      syncTopicToggle();
      renderRows();
    },
  });

  const topicPanel = h('div#dashboard-topics.topic-panel', { hidden: true }, topicGroup);

  function setTopicOpen(next) {
    topicOpen = next;
    topicPanel.hidden = !topicOpen;
    topicToggle.setAttribute('aria-expanded', String(topicOpen));
  }

  topicToggle.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !topicOpen) return;
    e.preventDefault();
    setTopicOpen(false);
  });

  topicPanel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    setTopicOpen(false);
    topicToggle.focus({ preventScroll: true });
  });

  const search = h('input.search.dashboard-search', {
    type: 'search',
    placeholder: `Search ${available} problems`,
    'aria-label': 'Search problems',
  });
  search.addEventListener('input', () => {
    filters.query = search.value;
    renderRows();
  });

  /** Opens a random unsolved problem among those the filters show (AlgoExpert's "pick random"). */
  const randomBtn = h('button.btn.btn-ghost.btn-sm.random-btn', { type: 'button', onClick: () => {
    const state = store.get();
    const q = filters.query.trim().toLowerCase();
    const pool = catalog.filter((p) => p.status === 'available' && state.problems[p.id]?.status !== 'solved' && (filters.difficulty === 'All' || p.difficulty === filters.difficulty) && (filters.topic === 'all' || p.topics.includes(filters.topic)) && (!q || p.title.toLowerCase().includes(q)));
    if (pool.length) location.hash = `#/problem/${pool[Math.floor(Math.random() * pool.length)].id}`;
  }, 'aria-label': 'Open a random unsolved problem' }, h('span.hexmark', { 'aria-hidden': 'true' }), 'Random', h('span.random-extra', {}, ' unsolved'));

  function clearFilters() {
    filters.difficulty = 'All';
    filters.topic = 'all';
    filters.query = '';
    search.value = '';
    diffGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'All')));
    topicGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'all')));
    syncTopicToggle();
    renderRows();
    search.focus({ preventScroll: true });
  }

  mount(
    root,
    h(
      'div.page.dashboard-page',
      {},
      h(
        'header.page-head',
        {},
        h('div', {}, h('span.eyebrow', {}, HEAD_DATE.format(new Date())), h('h1', {}, 'Problems'), h('p.page-sub', {}, `${available} problems in 26 topics. Every submission runs 15 tests: 5 you can open, 10 hidden.`)),
        h('nav.view-switch', { 'aria-label': 'Problems view' }, h('a.view-switch-item', { href: '#/', 'aria-current': 'page' }, 'List'), h('a.view-switch-item', { href: '#/map' }, 'Map')),
      ),
      statsRow,
      today,
      h(
        'div.dashboard-controls',
        {},
        h('div.filters.dashboard-filters', {}, search, diffGroup, topicToggle),
        topicPanel,
        h('div.filter-meta', {}, countLine, clearInline, randomBtn),
      ),
      tableWrap,
      emptyHost,
      siteFooter(),
    ),
  );
  renderStats();
  renderRows();
  let disposed = false;
  loadPath().then((p) => {
    if (disposed || !p) return;
    path = p;
    renderToday();
  });
  const unsub = store.subscribe(() => {
    renderStats();
    renderRows();
    renderToday();
  });
  return () => {
    disposed = true;
    fillToken++;
    stopCount();
    unsub();
  };
}
