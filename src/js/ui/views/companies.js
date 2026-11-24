/**
 * Practice by company: a searchable list of companies (#/companies) and, per company
 * (#/companies/<slug>), the problems it asks, most frequent first, one row per family.
 * Data: src/js/data/company-sets.json (built by scripts/content/build-meta.mjs), fetched on demand.
 */
import { h, mount, difficulty, chip, chipGroup, segmented, ilMark, stateBlock, loadingState, siteFooter, hexMark, companyMark } from '../dom.js';
import { loadSets, loadProblemTopics, loadCompanyLogos, companyLogo } from '../../data/company-loader.js';
import { TOPICS } from '../../data/taxonomy.js';
import { expandRows, companyProgress, monogram, frequencyLevel } from '../../data/company-sets.js';
import { filterRanked, findBySlug, israelBadge, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';

const RECENCY_LABEL = { '30d': 'Last 30 days', '3m': 'Last 3 months', '6m': 'Last 6 months', older: 'Older' };

export { loadSets };

/**
 * Companies already merged and ordered by Israel relevance (baked into company-sets.json); shared
 * with the mock OA setup.
 * Logos load beside them; without logos the marks are monograms.
 * @returns {Promise<{ sets: import('../../data/company-sets.js').CompanySets, ranked: import('../../data/israel-hiring.js').RankedCompany[], logos: Record<string, { bleed: boolean, color: string|null }>|null }|null>}
 */
export async function loadRankedCompanies() {
  const [sets, logos] = await Promise.all([loadSets(), loadCompanyLogos()]);
  return sets ? { sets, ranked: sets.companies, logos } : null;
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

/** Names identify which companies asked a problem; no logos ship (docs/research/DESIGN_DIRECTIONS.md). */
const TRADEMARK_NOTE = 'Company names and logos are trademarks of their owners, used here only to say which companies asked a problem. No affiliation or endorsement.';
const ISRAEL_LINE = {
  major: 'Major engineering presence in Israel',
  present: 'Hires engineers in Israel',
  none: 'No Israeli engineering hiring found',
};
const topicTitle = (id) => TOPICS.find((t) => t.id === id)?.title ?? id;

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
          companyMark({ letters: monogram(c.name), logo: companyLogo(data.logos, c.slug), tile: Boolean(data.logos), israel: c.israel, tier: c.tier, fill: prog.onSite ? prog.solved / prog.onSite : 0 }),
          h(
            'span.company-card-body',
            {},
            h('span.company-card-name', {}, c.name, c.israeli ? ilMark() : null),
            h('span.company-card-sub', {}, solvedText(prog)),
            filters.filter === 'all' && israelBadge(c.israel) ? h('span.company-card-sub.company-card-level', {}, israelBadge(c.israel)) : null,
            progressBar(prog.solved, prog.onSite),
          ),
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
        h(
          'header.page-head',
          {},
          h(
            'div',
            {},
            h('span.eyebrow', {}, `${data.ranked.length} companies · ${data.ranked.filter((c) => c.israel === 'major' || c.israel === 'present').length} hire engineers in Israel`),
            h('h1', {}, 'Companies'),
            h('p.page-sub', {}, 'Pick a company to see the problems it asks most, and practice the version it asks.'),
          ),
        ),
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
        h('p.hint-text.company-source', {}, 'Company tags are crowdsourced from public datasets (content/SOURCES.md). Treat them as a trend, not a promise. Israel hiring labels: content/israel-hiring.md.'),
        siteFooter({ note: TRADEMARK_NOTE }),
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
  const facts = h('div.company-facts');
  const asks = h('section.company-asks', { 'aria-labelledby': 'asks-title' });
  let placed = null;
  loadProblemTopics().then((p) => {
    placed = p;
    if (company && !disposed) renderBriefing();
  });
  const emptyHost = h('div.empty-host', { hidden: true });
  let tableWrap = null;
  let clearFilters = null;
  let sets = null;
  let company = null;
  let logos = null;

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

  /** Big numbers, difficulty mix and the topics this company asks most (ESPN / YC briefing anatomy). */
  function renderBriefing() {
    const state = store.get();
    const all = expandRows(sets, company);
    const prog = companyProgress(all, isSolvedIn(state));
    const onSite = all.filter((r) => r.practice);
    const high = all.filter((r) => frequencyLevel(r.frequency).steps === 3).length;
    const mix = ['Easy', 'Medium', 'Hard'].map((d) => ({ d, n: all.filter((r) => r.problem.difficulty === d).length }));
    const mixTotal = mix.reduce((n, m) => n + m.n, 0) || 1;
    const big = (value, label) => h('div.company-fact', {}, h('div.company-fact-value', {}, value), h('div.company-fact-label', {}, label));
    mount(
      facts,
      big(`${prog.solved} / ${prog.onSite}`, 'solved of what you can practice here'),
      big(`${high}`, 'asked often (high frequency)'),
      h(
        'div.company-fact.company-mix',
        {},
        h('div.company-fact-label', {}, `Difficulty of its top ${all.length}`),
        h('div.mix-bar', { 'aria-hidden': 'true' }, mix.map((m) => h(`span.mix-seg.mix-${m.d.toLowerCase()}`, { style: { flexGrow: String(m.n) } }))),
        h('div.mix-legend', {}, mix.map((m) => h('span', {}, difficulty(m.d), ` ${Math.round((m.n / mixTotal) * 100)}%`))),
      ),
    );
    if (!placed) return;
    const counts = new Map();
    for (const r of onSite) {
      const t = placed[r.practice.contentId]?.topic;
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const top = [...counts].sort((a, b) => b[1] - a[1] || topicTitle(a[0]).localeCompare(topicTitle(b[0]))).slice(0, 6);
    mount(
      asks,
      h('h2.section-title', { id: 'asks-title' }, 'What it asks most'),
      top.length
        ? h('ul.asks-list', {}, top.map(([t, n]) => h('li', {}, h('a.asks-topic', { href: `#/map/${t}` }, hexMark('new'), topicTitle(t)), h('span.asks-count', {}, `${n} ${n === 1 ? 'problem' : 'problems'}`))))
        : h('p.hint-text', {}, 'None of its problems are on the site yet.'),
    );
  }

  function renderRows() {
    const state = store.get();
    const all = expandRows(sets, company);
    const prog = companyProgress(all, isSolvedIn(state));
    summary.textContent = `${company.total} tagged problems. ${prog.onSite} of the top ${all.length} can be practiced here, ${prog.solved} solved.`;
    mount(headProgress, h('span.company-progress-text', {}, solvedText(prog)), progressBar(prog.solved, prog.onSite));
    renderBriefing();
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
            h(`span.status-pill.s-${status}`, {}, hexMark(status), h('span.sr-only', {}, statusLabel ?? 'Not solved')),
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
    logos = d.logos;
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
        h('thead', {}, h('tr', {}, h('th.cell-status', { scope: 'col' }, h('span.sr-only', {}, 'Status')), h('th', { scope: 'col' }, 'Problem'), h('th', { scope: 'col' }, 'Difficulty'), h('th', { scope: 'col' }, 'Frequency'), h('th', { scope: 'col' }, h('span.sr-only', {}, 'Practice')))),
        body,
      ),
    );
    mount(
      root,
      h(
        'div.page',
        {},
        h('a.back-link', { href: '#/companies' }, 'All companies'),
        h(
          'header.page-head.company-head',
          // The brand's own colour glows faintly behind the header (measured from its logo).
          logos?.[company.slug]?.color ? { class: 'has-brand', style: { '--brand': logos[company.slug].color } } : {},
          companyMark({ letters: monogram(company.name), logo: companyLogo(logos, company.slug), tile: Boolean(logos), israel: company.israel, tier: company.tier, size: 'lg' }),
          h(
            'div.company-head-copy',
            {},
            h('span.eyebrow', {}, ISRAEL_LINE[company.israel] ?? 'Company'),
            h('h1', {}, company.name, company.israeli ? ilMark() : null),
            summary,
            headProgress,
          ),
          israelBadgeEl(company.israel),
        ),
        facts,
        asks,
        h('h2.section-title.company-list-title', {}, 'The problems, most asked first'),
        h('div.filters.company-filters', {}, diff, onSite),
        tableWrap,
        emptyHost,
        siteFooter({ note: TRADEMARK_NOTE }),
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
