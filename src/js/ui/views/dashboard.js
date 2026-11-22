/**
 * Dashboard: progress stats + filterable problem bank. Reads only the catalog: no problem module
 * loads here (docs/adr/0008-lazy-problem-modules.md).
 */
import { h, mount, difficulty, chipGroup, stateBlock, siteFooter } from '../dom.js';
import { catalog, catalogEntry, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import { stats, dayKey } from '../../state/progress.js';
import { dailyProblem, dailyCandidates, weakSpots } from '../../data/recommend.js';
import { loadPath } from '../../data/path-loader.js';

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
          h('th', { scope: 'col' }, 'Title'),
          h('th', { scope: 'col' }, 'Status'),
          h('th', { scope: 'col' }, 'Difficulty'),
          h('th', { scope: 'col' }, 'Topics'),
        ),
      ),
      tableBody,
    ),
  );
  const emptyHost = h('div.dashboard-empty', { hidden: true });
  const statsRow = h('div.stats-row');
  const today = h('div.today-row', { 'aria-label': 'Practice today' });
  const countLine = h('p.hint-text.filter-count', { role: 'status' });
  const clearInline = h('button.btn.btn-ghost.btn-sm.filter-clear', { type: 'button', hidden: true, onClick: () => clearFilters() }, 'Clear filters');
  let path = null;
  let topicOpen = false;

  function renderToday() {
    if (!path) return;
    const state = store.get();
    const dailyId = dailyProblem(dailyCandidates(path), dayKey());
    const daily = dailyId ? catalogEntry(dailyId) : null;
    const dailyDone = daily && state.problems[daily.id]?.status === 'solved';
    const spots = weakSpots(path, state.problems);
    const reason = (s) =>
      [s.unsolved ? `${s.unsolved} attempted, not solved` : null, s.assisted ? `${s.assisted} solved with the solution revealed` : null, s.failedSubmits ? `${s.failedSubmits} rejected ${s.failedSubmits === 1 ? 'submit' : 'submits'}` : null]
        .filter(Boolean)
        .join(', ');
    mount(
      today,
      daily
        ? h(
            'section.today-card.today-daily',
            { 'aria-labelledby': 'daily-title' },
            h(
              'div.today-daily-copy',
              {},
              h('div.today-kicker', { id: 'daily-title' }, 'Problem of the day'),
              h('div.today-main', {}, h('a.problem-link', { href: `#/problem/${daily.id}` }, daily.title), difficulty(daily.difficulty), dailyDone ? h('span.tag.tag-live', {}, 'Solved') : null),
              h('div.hint-text', {}, 'The same problem for everyone today. A new one at midnight.'),
            ),
            h('a.btn.btn-primary.today-cta', { href: `#/problem/${daily.id}` }, dailyDone ? 'Review' : 'Solve'),
          )
        : null,
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
                  h('div', {}, h('strong', {}, s.title), h('div.hint-text', {}, reason(s))),
                  s.next ? h('a.btn.btn-secondary.btn-sm', { href: `#/problem/${s.next}` }, 'Practice') : h('span.hint-text', {}, 'Every problem here is solved'),
                ),
              ),
            )
          : h('p.hint-text', {}, 'None yet. Topics show up here when you miss submits, leave a problem unsolved or reveal a solution.'),
      ),
    );
  }

  const statCell = (label, value, sub) =>
    h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label), sub ? h('div.stat-sub', {}, sub) : null);

  function renderStats() {
    const state = store.get();
    const st = stats(state);
    const hasActivity = st.submissions > 0 || st.solved > 0 || Object.keys(state.problems).length > 0;
    statsRow.classList.toggle('stats-empty', !hasActivity);
    if (!hasActivity) {
      mount(
        statsRow,
        h(
          'div.start-copy',
          {},
          h('strong', {}, 'Start with the learning path or today\'s problem.'),
          h('span.start-sub', {}, `${available} problems ready to practice, ordered easy to hard.`),
        ),
        h('a.btn.btn-secondary.btn-sm', { href: '#/path' }, 'Learning path'),
      );
      return;
    }
    mount(
      statsRow,
      statCell('Solved', `${st.solved}`, `of ${available}`),
      statCell('Streak', `${st.streak} ${st.streak === 1 ? 'day' : 'days'}`),
      statCell('Accuracy', st.accuracy === null ? '-' : `${st.accuracy}%`),
      statCell('Submits', `${st.submissions}`),
    );
  }

  const statusCell = (status) => {
    const label = STATUS_LABEL[status];
    return h(
      `span.status-pill.s-${status}`,
      {},
      h('span.status-dot', { 'aria-hidden': 'true' }),
      label ? label : h('span.sr-only', {}, 'Not started'),
    );
  };

  function hasActiveFilters() {
    return filters.difficulty !== 'All' || filters.topic !== 'all' || filters.query.trim() !== '';
  }

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
    countLine.textContent = active
      ? `${rows.length} of ${catalog.length} ${catalog.length === 1 ? 'problem' : 'problems'}`
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
    mount(
      tableBody,
      rows.map((p) => {
        const prog = state.problems[p.id];
        const status = prog?.status === 'solved' ? (prog.revealed ? 'assisted' : 'solved') : prog ? 'attempted' : 'todo';
        const isAvailable = p.status === 'available';
        const title = isAvailable ? h('a.problem-link', { href: `#/problem/${p.id}` }, p.title) : h('span.planned-title', {}, p.title);
        return h(
          `tr${isAvailable ? '.row-link' : '.row-planned'}`,
          {},
          h('td.cell-title', {}, title, isAvailable ? null : h('span.tag.tag-muted', {}, 'Coming soon')),
          h('td.cell-status', {}, statusCell(status)),
          h('td.cell-diff', {}, difficulty(p.difficulty)),
          h('td.cell-topics', {}, p.topics.map((t) => h('span.tag', {}, topicLabel(t)))),
        );
      }),
    );
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
      'aria-pressed': 'false',
      onClick: () => setTopicOpen(!topicOpen),
    },
    'Topic',
  );

  const syncTopicToggle = () => {
    const active = filters.topic !== 'all';
    topicToggle.textContent = active ? `Topic: ${topicLabel(filters.topic)}` : 'Topic';
    topicToggle.setAttribute('aria-pressed', String(active));
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
      'div.page',
      {},
      h('header.page-head', {}, h('h1', {}, 'Problem Bank'), h('p.page-sub', {}, 'Practice by topic and difficulty. Every submission runs 15 tests: 5 detailed, 10 hidden.')),
      statsRow,
      today,
      h(
        'div.dashboard-controls',
        {},
        h('div.filters.dashboard-filters', {}, search, diffGroup, topicToggle),
        topicPanel,
        h('div.filter-meta', {}, countLine, clearInline),
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
    unsub();
  };
}
