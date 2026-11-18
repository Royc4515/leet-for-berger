/**
 * Dashboard: progress stats + filterable problem bank.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { catalog, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import { stats, dayKey } from '../../state/progress.js';
import { getProblem } from '../../problems/index.js';
import { dailyProblem, dailyCandidates, weakSpots } from '../../data/recommend.js';
import { loadPath } from './path.js';

export function renderDashboard(root, { store }) {
  const filters = { difficulty: 'All', topic: 'all', query: '' };
  const tableBody = h('tbody');
  const statsRow = h('div.stats-row');
  const today = h('div.today-row', { 'aria-label': 'Practice today' });
  let path = null;

  function renderToday() {
    if (!path) return;
    const state = store.get();
    const dailyId = dailyProblem(dailyCandidates(path), dayKey());
    const daily = dailyId ? getProblem(dailyId) : null;
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
            'section.today-card',
            { 'aria-labelledby': 'daily-title' },
            h('div.today-kicker', { id: 'daily-title' }, 'Problem of the day'),
            h('div.today-main', {}, h('a.problem-link', { href: `#/problem/${daily.id}` }, daily.title), difficultyBadge(daily.difficulty), dailyDone ? h('span.tag.tag-live', {}, 'Solved') : null),
            h('div.hint-text', {}, 'The same problem for everyone today. A new one at midnight.'),
          )
        : null,
      h(
        'section.today-card',
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
      mount(tableBody, h('tr', {}, h('td.empty', { colspan: 4 }, 'No problems match these filters.')));
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
      today,
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
          h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'Title'), h('th', { scope: 'col' }, 'Difficulty'), h('th', { scope: 'col' }, 'Topics'))),
          tableBody,
        ),
      ),
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
