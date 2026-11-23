/**
 * Practice by company: a searchable list of companies (#/companies) and, per company
 * (#/companies/<slug>), the problems it asks, most frequent first, one row per family.
 * Data: src/js/data/company-sets.json (built by scripts/content/build-meta.mjs), fetched on demand.
 */
import { h, mount, difficulty, chip, chipGroup, segmented, ilMark, stateBlock, loadingState, siteFooter } from '../dom.js';
import { expandRows, companyProgress, monogram, frequencyLevel } from '../../data/company-sets.js';
import { filterRanked, findBySlug, israelBadge, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';

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

/**
 * Companies already merged and ordered by Israel relevance (baked into company-sets.json); shared
 * with the mock OA setup.
 * @returns {Promise<{ sets: import('../../data/company-sets.js').CompanySets, ranked: import('../../data/israel-hiring.js').RankedCompany[] }|null>}
 */
export async function loadRankedCompanies() {
  const sets = await loadSets();
  return sets ? { sets, ranked: sets.companies } : null;
}

/**
 * Segmented control for the Israel filter: real buttons with aria-pressed.
 * @param {string} initial
 * @param {(id: string) => void} onChange
 * @param {string} [label]
 * @returns {HTMLElement}
 */
export function israelFilterControl(initial, onChange, label = 'Show companies') {
  return segmented({ label, options: ISRAEL_FILTERS.map((f) => ({ value: f.id, label: f.label })), value: initial, onChange });
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

/** Solved share as a thin bar. Decorative: the text beside it already says "x of y solved". */
const progressBar = (done, total) =>
  h('span.progress-bar', { 'aria-hidden': 'true' }, h('span.progress-fill', { style: { width: `${total ? Math.round((done / total) * 100) : 0}%` } }));

/** "x of y solved", or why there is nothing to count yet. */
const solvedText = (prog) => (prog.onSite ? `${prog.solved} of ${prog.onSite} solved` : 'Nothing to practice here yet');

function loading(root) {
  mount(root, h('div.page', {}, loadingState({ label: 'Loading companies...' })));
}

function loadFailed(root) {
  mount(
    root,
    h(
      'div.page.page-narrow',
      {},
      stateBlock({
        title: 'Could not load companies',
        body: 'Company data could not be loaded. Check your connection and reload.',
        kind: 'error',
        headingTag: 'h1',
        action: { label: 'Reload', onClick: () => location.reload() },
      }),
      siteFooter(),
    ),
  );
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
        // Option card (docs/DESIGN.md): monogram, name, one fact, progress. The Israel level is a
        // line only under "All", where it tells cards apart; in the Israel scopes every card has it.
        return h(
          'a.company-card',
          { href: `#/companies/${c.slug}`, 'data-israel': c.israel },
          h('span.monogram', { 'aria-hidden': 'true' }, monogram(c.name)),
          h('span.company-card-name', {}, c.name, c.israeli ? ilMark() : null),
          h('span.company-card-sub', {}, solvedText(prog)),
          filters.filter === 'all' && israelBadge(c.israel) ? h('span.company-card-sub.company-card-level', {}, israelBadge(c.israel)) : null,
          progressBar(prog.solved, prog.onSite),
        );
      }),
    );
  }

  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) return loadFailed(root);
    data = d;
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
          israelFilterControl(filters.filter, (id) => {
            filters.filter = id;
            renderGrid();
          }),
          search,
        ),
        count,
        grid,
        h('p.hint-text', {}, 'Company tags are crowdsourced from public datasets (content/SOURCES.md). Treat them as a trend, not a promise. Israel hiring labels: content/israel-hiring.md.'),
        siteFooter(),
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
  // Phones start with only what can be practiced here: the off-site rows are long and not actionable.
  const filters = { onSiteOnly: matchMedia('(max-width: 640px)').matches, difficulty: 'All' };
  const body = h('tbody');
  const summary = h('p.page-sub');
  const headProgress = h('div.company-progress');
  const emptyHost = h('div.empty-host', { hidden: true });
  let tableWrap = null;
  let clearFilters = null;
  let sets = null;
  let company = null;

  const STATUS_LABEL = { solved: 'Solved', assisted: 'Assisted', attempted: 'Attempted' };

  /** Frequency as a labelled 3-step meter; the word and recency are the text, the steps decorate. */
  const freqMeter = (r) => {
    const level = frequencyLevel(r.frequency);
    return h(
      'span.freq-meter',
      { title: `Frequency ${r.frequency} of 100` },
      h('span.freq-steps', { 'aria-hidden': 'true' }, [1, 2, 3].map((i) => h(`span.freq-step${i <= level.steps ? '.is-on' : ''}`))),
      h('span.freq-label', {}, level.label),
      h('span.freq-text', {}, RECENCY_LABEL[r.recency]),
    );
  };

  function renderRows() {
    const state = store.get();
    const all = expandRows(sets, company);
    const prog = companyProgress(all, isSolvedIn(state));
    summary.textContent = `${company.total} tagged problems. ${prog.onSite} of the top ${all.length} can be practiced here, ${prog.solved} solved.`;
    mount(headProgress, h('span.company-progress-text', {}, solvedText(prog)), progressBar(prog.solved, prog.onSite));
    const rows = all.filter((r) => (!filters.onSiteOnly || r.practice) && (filters.difficulty === 'All' || r.problem.difficulty === filters.difficulty));
    if (!rows.length) {
      if (tableWrap) tableWrap.hidden = true;
      emptyHost.hidden = false;
      mount(
        emptyHost,
        stateBlock({
          title: 'No matching problems',
          body: 'No problems match these filters. Try another difficulty or include problems not on the site yet.',
          kind: 'empty',
          action: clearFilters ? { label: 'Clear filters', variant: 'btn-secondary', onClick: clearFilters } : null,
        }),
      );
      return;
    }
    if (tableWrap) tableWrap.hidden = false;
    emptyHost.hidden = true;
    mount(
      body,
      rows.map((r) => {
        const entry = r.practice ? state.problems[r.practice.contentId] : null;
        const status = entry?.status === 'solved' ? (entry.revealed ? 'assisted' : 'solved') : entry ? 'attempted' : 'todo';
        const statusLabel = STATUS_LABEL[status];
        const name = r.problem.number ? `${r.problem.number}. ${r.problem.title}` : r.problem.title;
        let practice;
        if (!r.practice) practice = h('span.tag.tag-muted', {}, 'Not on the site yet');
        else
          practice = h(
            'a.btn.btn-secondary.btn-sm.practice-link',
            // The visible word is short; the name says which problem, and whether it is a sibling version.
            { href: `#/problem/${r.practice.contentId}`, 'aria-label': r.similar ? `Practice a similar version of ${name}` : `Practice ${name}` },
            r.similar ? 'Practice similar' : 'Practice',
          );
        return h(
          `tr${r.practice ? '.has-practice' : '.row-offsite'}`,
          {},
          h(
            'td.cell-status',
            {},
            h(`span.status-pill.s-${status}`, {}, h('span.status-dot', { 'aria-hidden': 'true' }), statusLabel ?? h('span.sr-only', {}, 'Not solved')),
          ),
          h('td.cell-title', {}, h('span.company-problem', {}, name), r.versions > 1 ? h('span.tag.tag-muted', { title: 'This company asks several versions of this idea' }, `${r.versions} versions`) : null),
          h('td.cell-diff', {}, difficulty(r.problem.difficulty)),
          h('td.cell-freq', {}, freqMeter(r)),
          h('td.cell-practice', {}, practice),
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
      mount(
        root,
        h(
          'div.page.page-narrow',
          {},
          stateBlock({
            title: 'Not found',
            body: 'No company data for this name.',
            kind: 'empty',
            headingTag: 'h1',
            action: { label: 'All companies', href: '#/companies' },
          }),
          siteFooter(),
        ),
      );
      return;
    }
    const diff = chipGroup({
      label: 'Difficulty',
      options: ['All', 'Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d === 'All' ? 'All difficulties' : d, attrs: { 'data-value': d } })),
      value: filters.difficulty,
      onChange: (d) => {
        filters.difficulty = d;
        renderRows();
      },
    });
    // A filter chip that toggles on its own (not part of an exclusive group).
    const onSite = chip({
      label: 'On the site only',
      pressed: filters.onSiteOnly,
      attrs: { id: 'on-site-only' },
      onClick: () => {
        filters.onSiteOnly = !filters.onSiteOnly;
        onSite.setAttribute('aria-pressed', String(filters.onSiteOnly));
        renderRows();
      },
    });
    clearFilters = () => {
      filters.difficulty = 'All';
      filters.onSiteOnly = false;
      diff.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'All')));
      onSite.setAttribute('aria-pressed', 'false');
      renderRows();
    };
    tableWrap = h(
      'div.table-wrap',
      {},
      h(
        'table.problem-table.company-table',
        {},
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Status'), h('th', { scope: 'col' }, 'Problem'), h('th', { scope: 'col' }, 'Difficulty'), h('th', { scope: 'col' }, 'Frequency'), h('th', { scope: 'col' }, h('span.sr-only', {}, 'Practice')))),
        body,
      ),
    );
    mount(
      root,
      h(
        'div.page',
        {},
        h('a.back-link', { href: '#/companies' }, 'All companies'),
        h('header.page-head', {}, h('h1', {}, company.name, company.israeli ? ilMark() : null), israelBadgeEl(company.israel), summary, headProgress),
        h('div.filters.company-filters', {}, diff, onSite),
        tableWrap,
        emptyHost,
        siteFooter(),
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
