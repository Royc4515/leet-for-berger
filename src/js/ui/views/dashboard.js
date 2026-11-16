/**
 * Dashboard: progress stats + filterable problem bank.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { catalog, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import { stats } from '../../state/progress.js';

export function renderDashboard(root, { store }) {
  const filters = { difficulty: 'All', topic: 'all', query: '' };
  const tableBody = h('tbody');
  const statsRow = h('div.stats-row');

  const statCard = (label, value, sub) => h('div.stat-card', {}, h('div.stat-label', {}, label), h('div.stat-value', {}, value), sub ? h('div.stat-sub', {}, sub) : null);

  function renderStats() {
    const st = stats(store.get());
    const available = catalog.filter((p) => p.status === 'available').length;
    mount(
      statsRow,
      statCard('Solved', `${st.solved}`, `of ${available} available · ${catalog.length} planned total`),
      statCard('Streak', `${st.streak} ${st.streak === 1 ? 'day' : 'days'}`, 'Days in a row with an accepted submit'),
      statCard('Accuracy', st.accuracy === null ? '-' : `${st.accuracy}%`, 'Accepted / total submissions'),
      statCard('Submissions', `${st.submissions}`, 'Runs are free, submits count'),
    );
  }

  function renderRows() {
    const state = store.get();
    const q = filters.query.toLowerCase();
    const rows = catalog.filter(
      (p) =>
        (filters.difficulty === 'All' || p.difficulty === filters.difficulty) &&
        (filters.topic === 'all' || p.topics.includes(filters.topic)) &&
        (!q || p.title.toLowerCase().includes(q)),
    );
    if (!rows.length) {
      mount(tableBody, h('tr', {}, h('td.empty', { colspan: 5 }, 'No problems match these filters.')));
      return;
    }
    mount(
      tableBody,
      rows.map((p) => {
        const prog = state.problems[p.id];
        const status = prog?.status === 'solved' ? (prog.revealed ? 'assisted' : 'solved') : prog ? 'attempted' : 'todo';
        const available = p.status === 'available';
        const title = available ? h('a.problem-link', { href: `#/problem/${p.id}` }, p.title) : h('span.planned-title', {}, p.title);
        return h(
          `tr${available ? '' : '.row-planned'}`,
          {},
          h('td', {}, h(`span.status-icon.s-${status}`, { title: status, 'aria-label': status })),
          h('td', {}, title, available ? null : h('span.tag.tag-muted', {}, 'Coming soon')),
          h('td', {}, difficultyBadge(p.difficulty)),
          h('td', {}, p.topics.map((t) => h('span.tag', {}, TOPICS.find((x) => x.id === t)?.label ?? t))),
          h('td.num', {}, `M${p.milestone}`),
        );
      }),
    );
  }

  const chip = (group, value, label) =>
    h(
      'button.chip',
      {
        type: 'button',
        'aria-pressed': String(filters[group] === value),
        onClick: (e) => {
          filters[group] = value;
          e.currentTarget.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
          e.currentTarget.setAttribute('aria-pressed', 'true');
          renderRows();
        },
      },
      label,
    );

  const search = h('input.search', { type: 'search', placeholder: 'Search problems', 'aria-label': 'Search problems' });
  search.addEventListener('input', () => {
    filters.query = search.value;
    renderRows();
  });

  mount(
    root,
    h(
      'div.page',
      {},
      h('header.page-head', {}, h('h1', {}, 'Problem Bank'), h('p.page-sub', {}, 'Practice by topic and difficulty. Every submission runs 15 tests: 5 detailed, 10 hidden.')),
      statsRow,
      h(
        'div.filters',
        {},
        h('div.chip-group', { role: 'group', 'aria-label': 'Difficulty' }, ['All', ...DIFFICULTIES].map((d) => chip('difficulty', d, d))),
        h('div.chip-group', { role: 'group', 'aria-label': 'Topic' }, chip('topic', 'all', 'All topics'), TOPICS.map((t) => chip('topic', t.id, t.label))),
        search,
      ),
      h(
        'div.table-wrap',
        {},
        h(
          'table.problem-table',
          {},
          h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'Title'), h('th', { scope: 'col' }, 'Difficulty'), h('th', { scope: 'col' }, 'Topics'), h('th.num', { scope: 'col' }, 'Path'))),
          tableBody,
        ),
      ),
    ),
  );
  renderStats();
  renderRows();
  const unsub = store.subscribe(() => {
    renderStats();
    renderRows();
  });
  return () => unsub();
}
