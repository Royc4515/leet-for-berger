/**
 * Practice by company: a searchable list of companies (#/companies) and, per company
 * (#/companies/<slug>), the problems it asks, most frequent first, one row per family.
 * Data: src/js/data/company-sets.json (built by scripts/content/build-meta.mjs), fetched on demand.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { expandRows, companyProgress } from '../../data/company-sets.js';
import { rankCompanies, filterRanked, findBySlug, israelBadge, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';

const RECENCY_LABEL = { '30d': 'Last 30 days', '3m': 'Last 3 months', '6m': 'Last 6 months', older: 'Older' };

let setsPromise = null;

/**
 * Company data, fetched once and shared by the companies pages and the mock OA setup.
 * @returns {Promise<import('../../data/company-sets.js').CompanySets|null>}
 */
export function loadSets() {
  setsPromise ??= fetch(new URL('../../data/company-sets.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return setsPromise;
}

let hiringPromise = null;

/**
 * Israel hiring data (content/israel-hiring.json, copied to the site by the Pages workflow), fetched
 * once. Null when it cannot be loaded: lists then fall back to "All" instead of showing nothing.
 * @returns {Promise<import('../../data/israel-hiring.js').Hiring|null>}
 */
export function loadHiring() {
  hiringPromise ??= fetch(new URL('../../../../content/israel-hiring.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return hiringPromise;
}

/**
 * Companies merged, ordered by Israel relevance and ready to filter; shared with the mock OA setup.
 * @returns {Promise<{ sets: import('../../data/company-sets.js').CompanySets, ranked: import('../../data/israel-hiring.js').RankedCompany[], hasHiring: boolean }|null>}
 */
export async function loadRankedCompanies() {
  const [sets, hiring] = await Promise.all([loadSets(), loadHiring()]);
  if (!sets) return null;
  return { sets, ranked: rankCompanies(sets.companies, hiring), hasHiring: Boolean(hiring) };
}

/**
 * Segmented control for the Israel filter: real buttons with aria-pressed.
 * @param {string} initial
 * @param {(id: string) => void} onChange
 * @param {string} [label]
 * @returns {HTMLElement}
 */
export function israelFilterControl(initial, onChange, label = 'Show companies') {
  const group = h('div.segmented', { role: 'group', 'aria-label': label });
  for (const f of ISRAEL_FILTERS) {
    group.append(
      h(
        'button.segmented-btn',
        {
          type: 'button',
          'data-filter': f.id,
          'aria-pressed': String(f.id === initial),
          onClick: () => {
            group.querySelectorAll('.segmented-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === group.querySelector(`[data-filter="${f.id}"]`))));
            onChange(f.id);
          },
        },
        f.label,
      ),
    );
  }
  return group;
}

/**
 * Badge element for a company's Israel level, or null when it has none.
 * @param {import('../../data/israel-hiring.js').IsraelLevel} level
 * @returns {HTMLElement|null}
 */
export function israelBadgeEl(level) {
  const text = israelBadge(level);
  return text ? h(`span.tag.il-badge.il-${level}`, {}, text) : null;
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
  const filters = { query: '', filter: DEFAULT_ISRAEL_FILTER };
  const grid = h('div.company-grid');
  const count = h('p.hint-text.company-count', { role: 'status' });
  let data = null;

  function renderGrid() {
    const state = store.get();
    const list = filterRanked(data.ranked, filters);
    count.textContent = `${list.length} ${list.length === 1 ? 'company' : 'companies'}`;
    if (!list.length) {
      mount(grid, h('p.empty', {}, 'No companies match.'));
      return;
    }
    mount(
      grid,
      list.map((c) => {
        const prog = companyProgress(expandRows(data.sets, c), isSolvedIn(state));
        return h(
          'a.company-card',
          { href: `#/companies/${c.slug}` },
          h('div.company-card-name', {}, c.name, c.israeli ? h('span.il-mark', { 'aria-label': 'Israeli company' }, 'IL') : null),
          israelBadgeEl(c.israel),
          h('div.company-card-sub', {}, `${c.total} tagged problems`),
          h('div.company-card-sub', {}, `${prog.onSite} to practice here`, prog.solved ? `, ${prog.solved} solved` : ''),
        );
      }),
    );
  }

  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) return loadFailed(root);
    data = d;
    if (!d.hasHiring) filters.filter = 'all';
    const search = h('input.search', { type: 'search', placeholder: 'Search companies', 'aria-label': 'Search companies' });
    search.addEventListener('input', () => {
      filters.query = search.value;
      renderGrid();
    });
    mount(
      root,
      h(
        'div.page',
        {},
        h('header.page-head', {}, h('h1', {}, 'Practice by Company'), h('p.page-sub', {}, 'Pick a company to see the problems it asks most, and practice the version it asks.')),
        h(
          'div.filters',
          {},
          d.hasHiring
            ? israelFilterControl(filters.filter, (id) => {
                filters.filter = id;
                renderGrid();
              })
            : null,
          search,
        ),
        count,
        grid,
        h('p.hint-text', {}, 'Company tags are crowdsourced from public datasets (content/SOURCES.md). Treat them as a trend, not a promise. Israel hiring labels: content/israel-hiring.md.'),
      ),
    );
    renderGrid();
  });
  const unsub = store.subscribe(() => data && renderGrid());
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

  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) return loadFailed(root);
    sets = d.sets;
    company = findBySlug(d.ranked, slug);
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
        h('header.page-head', {}, h('h1', {}, company.name, company.israeli ? h('span.il-mark', { 'aria-label': 'Israeli company' }, 'IL') : null), israelBadgeEl(company.israel), summary),
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
