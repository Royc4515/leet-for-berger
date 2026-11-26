/**
 * Practice by company: a searchable list of companies (#/companies) and, per company
 * (#/companies/<slug>), the problems it asks, most frequent first, one row per family.
 * Data: src/js/data/company-sets.json (built by scripts/content/build-meta.mjs), fetched on demand.
 */
import { shareButton } from '../share.js';
import { companyShare } from '../../data/share.js';
import { h, mount, difficulty, chip, chipGroup, segmented, ilMark, stateBlock, loadingState, hexMark, companyMark, tp, pageLang } from '../dom.js';
import { siteFooter } from '../footer.js';
import { loadSets, loadProblemTopics, loadCompanyLogos, companyLogo } from '../../data/company-loader.js';
import { TOPICS } from '../../data/taxonomy.js';
import { expandRows, companyProgress, monogram, frequencyLevel } from '../../data/company-sets.js';
import { filterRanked, findBySlug, israelBadge, israelFilterLabel, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';

const RECENCY_LABEL = { '30d': 'Last 30 days', '3m': 'Last 3 months', '6m': 'Last 6 months', older: 'Older' };
const RECENCY_LABEL_HE = { '30d': 'ב-30 הימים האחרונים', '3m': 'ב-3 החודשים האחרונים', '6m': 'ב-6 החודשים האחרונים', older: 'לפני יותר מחצי שנה' };

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
export function israelFilterControl(initial, onChange, label = tp('Show companies', 'אילו חברות להציג')) {
  return segmented({ label, options: ISRAEL_FILTERS.map((f) => ({ value: f.id, label: israelFilterLabel(f.id, pageLang()) })), value: initial, onChange });
}

/**
 * Badge element for a company's Israel level, or null when it has none.
 * @param {import('../../data/israel-hiring.js').IsraelLevel} level
 * @returns {HTMLElement|null}
 */
export function israelBadgeEl(level) {
  const text = israelBadge(level, pageLang());
  return text ? h(`span.tag.il-badge.il-${level}`, {}, text) : null;
}

const isSolvedIn = (state) => (id) => state.problems[id]?.status === 'solved';

/** The company page's outside link: jobs in Israel when the company has that search, else its careers site. */
function careersLink(company) {
  const href = company.careersIL ?? company.careers;
  if (!href) return null;
  const [text, label] = company.careersIL
    ? [tp('Jobs in Israel', 'משרות בישראל'), tp(`${company.name} jobs in Israel (opens in a new tab)`, `משרות ב-${company.name} בישראל (נפתח בכרטיסייה חדשה)`)]
    : [tp('Careers site', 'אתר הקריירה'), tp(`${company.name} careers site (opens in a new tab)`, `אתר הקריירה של ${company.name} (נפתח בכרטיסייה חדשה)`)];
  return h('a.btn.btn-secondary.btn-sm.company-careers', { href, target: '_blank', rel: 'noopener noreferrer', 'aria-label': label }, text, h('span.company-careers-arrow', { 'aria-hidden': 'true' }, '↗'));
}

/** Names identify which companies asked a problem; no logos ship (docs/research/DESIGN_DIRECTIONS.md). */
const TRADEMARK_NOTE = 'Company names and logos are trademarks of their owners, used here only to say which companies asked a problem. No affiliation or endorsement.';
const TRADEMARK_NOTE_HE = 'שמות החברות והלוגואים שלהן הם סימנים מסחריים של בעליהם, ומופיעים כאן רק כדי לציין אילו חברות שאלו בעיה. אין כאן קשר או המלצה מצד החברות.';
// Read at render time: the page language is known only then.
const trademarkNote = () => tp(TRADEMARK_NOTE, TRADEMARK_NOTE_HE);
const ISRAEL_LINE = {
  major: 'Major engineering presence in Israel',
  present: 'Hires engineers in Israel',
  none: 'No Israeli engineering hiring found',
};
const ISRAEL_LINE_HE = {
  major: 'מרכז פיתוח גדול בישראל',
  present: 'מגייסת מהנדסים בישראל',
  none: 'לא מצאנו גיוס מהנדסים בישראל',
};
const topicTitle = (id) => TOPICS.find((t) => t.id === id)?.title ?? id;

/** Solved share as a thin bar. Decorative: the text beside it already says "x of y solved". */
const progressBar = (done, total) =>
  h('span.progress-bar', { 'aria-hidden': 'true' }, h('span.progress-fill', { style: { width: `${total ? Math.round((done / total) * 100) : 0}%` } }));

/** "x of y solved", or why there is nothing to count yet. */
const solvedText = (prog) => (prog.onSite ? tp(`${prog.solved} of ${prog.onSite} solved`, `${prog.solved} מתוך ${prog.onSite} נפתרו`) : tp('Nothing to practice here yet', 'עוד אין כאן מה לתרגל'));

function loading(root) {
  mount(root, h('div.page', {}, loadingState({ label: tp('Loading companies...', 'טוען חברות…') })));
}

function loadFailed(root) {
  mount(
    root,
    h(
      'div.page.page-narrow',
      {},
      stateBlock({
        title: tp('Could not load companies', 'לא הצלחנו לטעון את החברות'),
        body: tp('Company data could not be loaded. Check your connection and reload.', 'לא הצלחנו לטעון את נתוני החברות. כדאי לבדוק את החיבור ולטעון מחדש.'),
        kind: 'error',
        headingTag: 'h1',
        action: { label: tp('Reload', 'לטעון מחדש'), onClick: () => location.reload() },
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
  // What "Jobs in Israel" means, said where the list is: a link, checked once, not a live count.
  const jobsNote = h('p.hint-text.company-jobs-note', { hidden: true }, tp('Companies whose page links straight to their own job search in Israel. Open roles change daily: the search shows what is open now.', 'חברות שהדף שלהן מקשר ישר לחיפוש המשרות שלהן בישראל. המשרות הפתוחות משתנות כל יום: החיפוש מראה מה פתוח עכשיו.'));
  let data = null;

  function renderGrid() {
    const state = store.get();
    const list = filterRanked(data.ranked, filters);
    count.textContent = tp(`${list.length} ${list.length === 1 ? 'company' : 'companies'}`, list.length === 1 ? 'חברה אחת' : `${list.length} חברות`);
    jobsNote.hidden = filters.filter !== 'jobs';
    if (!list.length) {
      mount(grid, h('p.empty', {}, tp('No companies match.', 'אין חברות מתאימות.')));
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
            filters.filter === 'all' && israelBadge(c.israel) ? h('span.company-card-sub.company-card-level', {}, israelBadge(c.israel, pageLang())) : null,
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
    const search = h('input.search', { type: 'search', placeholder: tp('Search companies', 'חיפוש חברות'), 'aria-label': tp('Search companies', 'חיפוש חברות') });
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
            h(
              'span.eyebrow',
              {},
              tp(
                `${data.ranked.length} companies · ${data.ranked.filter((c) => c.israel === 'major' || c.israel === 'present').length} hire engineers in Israel`,
                `${data.ranked.length} חברות · ${data.ranked.filter((c) => c.israel === 'major' || c.israel === 'present').length} מגייסות מהנדסים בישראל`,
              ),
            ),
            h('h1', {}, tp('Companies', 'חברות')),
            h('p.page-sub', {}, tp('Pick a company to see the problems it asks most, and practice the version it asks.', 'אפשר לבחור חברה, לראות את הבעיות שהיא שואלת הכי הרבה ולתרגל את הגרסה שלה.')),
          ),
        ),
        h(
          'div.filters',
          {},
          Object.assign(
            israelFilterControl(filters.filter, (id) => {
              filters.filter = id;
              renderGrid();
            }),
            { className: 'segmented company-scope' },
          ),
          search,
        ),
        count,
        jobsNote,
        grid,
        h('p.hint-text.company-source', {}, tp('Company tags are crowdsourced from public datasets (content/SOURCES.md). Treat them as a trend, not a promise. Israel hiring labels: content/israel-hiring.md.', 'המידע על החברות ששאלו כל בעיה נאסף ממאגרי מידע ציבוריים שהקהילה מעדכנת (content/SOURCES.md). כדאי לקרוא אותו כמגמה, לא כהבטחה. תוויות הגיוס בישראל: content/israel-hiring.md.')),
        siteFooter({ note: trademarkNote() }),
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
  const STATUS_LABEL_HE = { solved: 'נפתרה', assisted: 'נפתרה עם עזרה', attempted: 'ניסית' };

  /** Frequency as a labelled 3-step meter; the word and recency are the text, the steps decorate. */
  const freqMeter = (r) => {
    const level = frequencyLevel(r.frequency, pageLang());
    return h(
      'span.freq-meter',
      { title: tp(`Frequency ${r.frequency} of 100`, `תדירות ${r.frequency} מתוך 100`) },
      h('span.freq-steps', { 'aria-hidden': 'true' }, [1, 2, 3].map((i) => h(`span.freq-step${i <= level.steps ? '.is-on' : ''}`))),
      h('span.freq-label', {}, level.label),
      h('span.freq-text', {}, tp(RECENCY_LABEL, RECENCY_LABEL_HE)[r.recency]),
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
      big(`${prog.solved} / ${prog.onSite}`, tp('solved of what you can practice here', 'נפתרו מתוך מה שאפשר לתרגל כאן')),
      big(`${high}`, tp('asked often (high frequency)', 'נשאלות לעיתים קרובות (תדירות גבוהה)')),
      h(
        'div.company-fact.company-mix',
        {},
        h('div.company-fact-label', {}, tp(`Difficulty of its top ${all.length}`, `רמת הקושי של ${all.length} המובילות`)),
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
      h('h2.section-title', { id: 'asks-title' }, tp('What it asks most', 'מה היא שואלת הכי הרבה')),
      top.length
        ? h('ul.asks-list', {}, top.map(([t, n]) => h('li', {}, h('a.asks-topic', { href: `#/map/${t}` }, hexMark('new'), topicTitle(t)), h('span.asks-count', {}, tp(`${n} ${n === 1 ? 'problem' : 'problems'}`, n === 1 ? 'בעיה אחת' : `${n} בעיות`)))))
        : h('p.hint-text', {}, tp('None of its problems are on the site yet.', 'עוד אין באתר אף אחת מהבעיות שלה.')),
    );
  }

  function renderRows() {
    const state = store.get();
    const all = expandRows(sets, company);
    const prog = companyProgress(all, isSolvedIn(state));
    summary.textContent = tp(
      `${company.total} tagged problems. ${prog.onSite} of the top ${all.length} can be practiced here, ${prog.solved} solved.`,
      `${company.total} בעיות בסך הכול. ${prog.onSite} מתוך ${all.length} המובילות זמינות כאן לתרגול, ו-${prog.solved} מהן נפתרו.`,
    );
    mount(headProgress, h('span.company-progress-text', {}, solvedText(prog)), progressBar(prog.solved, prog.onSite));
    renderBriefing();
    const rows = all.filter((r) => (!filters.onSiteOnly || r.practice) && (filters.difficulty === 'All' || r.problem.difficulty === filters.difficulty));
    if (!rows.length) {
      if (tableWrap) tableWrap.hidden = true;
      emptyHost.hidden = false;
      mount(
        emptyHost,
        stateBlock({
          title: tp('No matching problems', 'אין בעיות מתאימות'),
          body: tp('No problems match these filters. Try another difficulty or include problems not on the site yet.', 'אין בעיות שמתאימות לסינון הזה. אפשר לבחור רמת קושי אחרת או להציג גם בעיות שעוד אין באתר.'),
          kind: 'empty',
          action: clearFilters ? { label: tp('Clear filters', 'לנקות את הסינון'), variant: 'btn-secondary', onClick: clearFilters } : null,
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
        const statusLabel = tp(STATUS_LABEL, STATUS_LABEL_HE)[status];
        const name = r.problem.number ? `${r.problem.number}. ${r.problem.title}` : r.problem.title;
        let practice;
        if (!r.practice) practice = h('span.tag.tag-muted', {}, tp('Not on the site yet', 'עוד לא באתר'));
        else
          practice = h(
            'a.btn.btn-secondary.btn-sm.practice-link',
            // The visible word is short; the name says which problem, and whether it is a sibling version.
            {
              href: `#/problem/${r.practice.contentId}`,
              'aria-label': r.similar ? tp(`Practice a similar version of ${name}`, `לתרגל גרסה דומה של ${name}`) : tp(`Practice ${name}`, `לתרגל את ${name}`),
            },
            r.similar ? tp('Practice similar', 'לתרגל גרסה דומה') : tp('Practice', 'לתרגל'),
          );
        return h(
          `tr${r.practice ? '.has-practice' : '.row-offsite'}`,
          {},
          h(
            'td.cell-status',
            {},
            h(`span.status-pill.s-${status}`, {}, hexMark(status), h('span.sr-only', {}, statusLabel ?? tp('Not solved', 'לא נפתרה'))),
          ),
          h('td.cell-title', {}, h('span.company-problem', {}, name), r.versions > 1 ? h('span.tag.tag-muted', { title: tp('This company asks several versions of this idea', 'החברה שואלת כמה גרסאות של הרעיון הזה') }, tp(`${r.versions} versions`, `${r.versions} גרסאות`)) : null),
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
            title: tp('Not found', 'לא נמצא'),
            body: tp('No company data for this name.', 'אין נתונים על חברה בשם הזה.'),
            kind: 'empty',
            headingTag: 'h1',
            action: { label: tp('All companies', 'לכל החברות'), href: '#/companies' },
          }),
          siteFooter(),
        ),
      );
      return;
    }
    const diff = chipGroup({
      label: tp('Difficulty', 'רמת קושי'),
      options: ['All', 'Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d === 'All' ? tp('All difficulties', 'כל הרמות') : d, attrs: { 'data-value': d } })),
      value: filters.difficulty,
      onChange: (d) => {
        filters.difficulty = d;
        renderRows();
      },
    });
    // A filter chip that toggles on its own (not part of an exclusive group).
    const onSite = chip({
      label: tp('On the site only', 'רק מה שיש באתר'),
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
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th.cell-status', { scope: 'col' }, h('span.sr-only', {}, tp('Status', 'סטטוס'))),
            h('th', { scope: 'col' }, tp('Problem', 'בעיה')),
            h('th', { scope: 'col' }, tp('Difficulty', 'רמת קושי')),
            h('th', { scope: 'col' }, tp('Frequency', 'תדירות')),
            h('th', { scope: 'col' }, h('span.sr-only', {}, tp('Practice', 'תרגול'))),
          ),
        ),
        body,
      ),
    );
    mount(
      root,
      h(
        'div.page',
        {},
        h('a.back-link', { href: '#/companies' }, tp('All companies', 'כל החברות')),
        h(
          'header.page-head.company-head',
          // The brand's own colour glows faintly behind the header (measured from its logo).
          logos?.[company.slug]?.color ? { class: 'has-brand', style: { '--brand': logos[company.slug].color } } : {},
          companyMark({ letters: monogram(company.name), logo: companyLogo(logos, company.slug), tile: Boolean(logos), israel: company.israel, tier: company.tier, size: 'lg' }),
          h(
            'div.company-head-copy',
            {},
            h('span.eyebrow', {}, tp(ISRAEL_LINE, ISRAEL_LINE_HE)[company.israel] ?? tp('Company', 'חברה')),
            h('h1', {}, company.name, company.israeli ? ilMark() : null),
            summary,
            headProgress,
          ),
          h(
            'div.company-head-side',
            {},
            israelBadgeEl(company.israel),
            // Its job search filtered to Israel where it has one (owner's request), else its careers
            // site (content/company-careers.json, checked by check-careers.mjs).
            careersLink(company),
            shareButton({
              name: tp(`Share ${company.name}'s practice set`, `לשתף את רשימת התרגול של ${company.name}`),
              get: (lang) => companyShare({ ...company, ...companyProgress(expandRows(sets, company), isSolvedIn(store.get())), lang }),
            }),
          ),
        ),
        facts,
        asks,
        h('h2.section-title.company-list-title', {}, tp('The problems, most asked first', 'הבעיות לפי תדירות, מהנפוצה ביותר')),
        h('div.filters.company-filters', {}, diff, onSite),
        tableWrap,
        emptyHost,
        siteFooter({ note: trademarkNote() }),
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
