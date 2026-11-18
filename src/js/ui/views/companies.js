/**
 * Practice by company: a searchable list of companies (#/companies) and, per company
 * (#/companies/<slug>), the problems it asks, most frequent first, one row per family.
 * Data: src/js/data/company-sets.json (built by scripts/content/build-meta.mjs), fetched on demand.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { expandRows, filterCompanies, companyProgress } from '../../data/company-sets.js';

const RECENCY_LABEL = { '30d': 'Last 30 days', '3m': 'Last 3 months', '6m': 'Last 6 months', older: 'Older' };

let setsPromise = null;

/** @returns {Promise<import('../../data/company-sets.js').CompanySets|null>} */
function loadSets() {
  setsPromise ??= fetch(new URL('../../data/company-sets.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return setsPromise;
}

const isSolvedIn = (state) => (id) => state.problems[id]?.status === 'solved';

function loading(root) {
  mount(root, h('div.page', {}, h('p.page-sub', { role: 'status' }, 'Loading companies...')));
}

function loadFailed(root) {
  mount(root, h('div.page.page-narrow', {}, h('h1', {}, 'Companies'), h('p.page-sub', {}, 'Company data could not be loaded. Check your connection and reload.')));
}

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderCompanies(root, { store }) {
  let disposed = false;
  loading(root);
  const filters = { query: '', israeliOnly: false };
  const grid = h('div.company-grid');
  let sets = null;

  function renderGrid() {
    const state = store.get();
    const list = filterCompanies(sets.companies, filters.query, filters);
    if (!list.length) {
      mount(grid, h('p.empty', {}, 'No companies match.'));
      return;
    }
    mount(
      grid,
      list.map((c) => {
        const prog = companyProgress(expandRows(sets, c), isSolvedIn(state));
        return h(
          'a.company-card',
          { href: `#/companies/${c.slug}` },
          h('div.company-card-name', {}, c.name, c.israeli ? h('span.il-mark', { 'aria-label': 'Israeli company' }, 'IL') : null),
          h('div.company-card-sub', {}, `${c.total} tagged problems`),
          h('div.company-card-sub', {}, `${prog.onSite} to practice here`, prog.solved ? `, ${prog.solved} solved` : ''),
        );
      }),
    );
  }

  loadSets().then((s) => {
    if (disposed) return;
    if (!s) return loadFailed(root);
    sets = s;
    const search = h('input.search', { type: 'search', placeholder: 'Search companies', 'aria-label': 'Search companies' });
    search.addEventListener('input', () => {
      filters.query = search.value;
      renderGrid();
    });
    const il = h('input', { type: 'checkbox', id: 'israeli-only' });
    il.addEventListener('change', () => {
      filters.israeliOnly = il.checked;
      renderGrid();
    });
    mount(
      root,
      h(
        'div.page',
        {},
        h('header.page-head', {}, h('h1', {}, 'Practice by Company'), h('p.page-sub', {}, 'Pick a company to see the problems it asks most, and practice the version it asks.')),
        h('div.filters', {}, search, h('label.switch', { for: 'israeli-only' }, il, h('span', {}, 'Israeli companies only'))),
        grid,
        h('p.hint-text', {}, 'Company tags are crowdsourced from public datasets (content/SOURCES.md). Treat them as a trend, not a promise.'),
      ),
    );
    renderGrid();
  });
  const unsub = store.subscribe(() => sets && renderGrid());
  return () => {
    disposed = true;
    unsub();
  };
}

/**
 * @param {HTMLElement} root
 * @param {{ store: any, slug: string }} opts
 * @returns {() => void} cleanup
 */
export function renderCompany(root, { store, slug }) {
  let disposed = false;
  loading(root);
  const filters = { onSiteOnly: false, difficulty: 'All' };
  const body = h('tbody');
  const summary = h('p.page-sub');
  let sets = null;
  let company = null;

  function renderRows() {
    const state = store.get();
    const all = expandRows(sets, company);
    const prog = companyProgress(all, isSolvedIn(state));
    summary.textContent = `${company.total} tagged problems. ${prog.onSite} of the top ${all.length} can be practiced here, ${prog.solved} solved.`;
    const rows = all.filter((r) => (!filters.onSiteOnly || r.practice) && (filters.difficulty === 'All' || r.problem.difficulty === filters.difficulty));
    if (!rows.length) {
      mount(body, h('tr', {}, h('td.empty', { colspan: 5 }, 'No problems match these filters.')));
      return;
    }
    mount(
      body,
      rows.map((r) => {
        const solved = r.practice && isSolvedIn(state)(r.practice.contentId);
        const name = r.problem.number ? `${r.problem.number}. ${r.problem.title}` : r.problem.title;
        let practice;
        if (!r.practice) practice = h('span.tag.tag-muted', {}, 'Not on the site yet');
        else if (r.similar) practice = [h('span.hint-text', {}, 'Similar version: '), h('a.problem-link', { href: `#/problem/${r.practice.contentId}` }, 'Practice')];
        else practice = h('a.problem-link', { href: `#/problem/${r.practice.contentId}` }, 'Practice');
        return h(
          'tr',
          {},
          h('td', {}, h(`span.status-icon.s-${solved ? 'solved' : 'todo'}`, { title: solved ? 'solved' : 'not solved', 'aria-label': solved ? 'solved' : 'not solved' })),
          h('td', {}, name, r.versions > 1 ? h('span.tag.tag-muted', { title: 'This company asks several versions of this idea' }, `${r.versions} versions`) : null),
          h('td', {}, difficultyBadge(r.problem.difficulty)),
          h('td', {}, h('span.freq-bar', { style: `--freq: ${r.frequency}%`, title: `Frequency ${r.frequency}` }), h('span.freq-text', {}, RECENCY_LABEL[r.recency])),
          h('td', {}, practice),
        );
      }),
    );
  }

  loadSets().then((s) => {
    if (disposed) return;
    if (!s) return loadFailed(root);
    sets = s;
    company = s.companies.find((c) => c.slug === slug);
    if (!company) {
      mount(root, h('div.page.page-narrow', {}, h('h1', {}, 'Not found'), h('p.page-sub', {}, 'No company data for this name.'), h('a.btn.btn-primary', { href: '#/companies' }, 'All companies')));
      return;
    }
    const onSite = h('input', { type: 'checkbox', id: 'on-site-only' });
    onSite.addEventListener('change', () => {
      filters.onSiteOnly = onSite.checked;
      renderRows();
    });
    const diff = h(
      'select.select',
      { 'aria-label': 'Difficulty' },
      ['All', 'Easy', 'Medium', 'Hard'].map((d) => h('option', { value: d }, d === 'All' ? 'All difficulties' : d)),
    );
    diff.addEventListener('change', () => {
      filters.difficulty = diff.value;
      renderRows();
    });
    mount(
      root,
      h(
        'div.page',
        {},
        h('a.back-link', { href: '#/companies' }, 'All companies'),
        h('header.page-head', {}, h('h1', {}, company.name, company.israeli ? h('span.il-mark', { 'aria-label': 'Israeli company' }, 'IL') : null), summary),
        h('div.filters', {}, diff, h('label.switch', { for: 'on-site-only' }, onSite, h('span', {}, 'On the site only'))),
        h(
          'div.table-wrap',
          {},
          h(
            'table.problem-table',
            {},
            h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'Problem'), h('th', { scope: 'col' }, 'Difficulty'), h('th', { scope: 'col' }, 'Frequency'), h('th', { scope: 'col' }, ''))),
            body,
          ),
        ),
      ),
    );
    renderRows();
  });
  const unsub = store.subscribe(() => company && renderRows());
  return () => {
    disposed = true;
    unsub();
  };
}
