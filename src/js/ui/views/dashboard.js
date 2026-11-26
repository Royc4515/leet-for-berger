/**
 * Dashboard: progress stats + filterable problem bank. Reads only the catalog: no problem module
 * loads here (docs/adr/0008-lazy-problem-modules.md).
 */
import { h, mount, difficulty, chipGroup, stateBlock, hexMark, tp, pageLang } from '../dom.js';
import { siteFooter } from '../footer.js';
import { catalog, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import { stats, restDayOf } from '../../state/progress.js';
import { weakSpots } from '../../data/recommend.js';
import { loadPath } from '../../data/path-loader.js';
import { dailyCard } from '../daily-card.js';
import { quizCard } from '../quiz-card.js';
import { countUp } from '../motion.js';
import { listPage } from '../../data/list-page.js';
import { nudgeBanner } from '../nudges.js';
import { services } from '../../auth/services.js';
import { QUIZ_STORAGE_KEY } from '../../state/user-data.js';

const HEAD_DATE_OPTS = { weekday: 'long', day: 'numeric', month: 'long' };

// Phone: the list shows this many rows, then "Show more" (owner's request: 225 rows were one
// 21,000 px scroll). The breakpoint is the one where the table turns into list rows (app.css).
const PHONE_PAGE = 30;
const PHONE_QUERY = '(max-width: 640px)';

const STATUS_LABEL = { solved: 'Solved', assisted: 'Assisted', attempted: 'Attempted' };
const STATUS_LABEL_HE = { solved: 'נפתרה', assisted: 'נפתרה עם עזרה', attempted: 'ניסית' };
/** "225 problems" in Hebrew, with its own singular. */
const heProblems = (n) => (n === 1 ? 'בעיה אחת' : `${n} בעיות`);
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
          h('th.cell-status', { scope: 'col' }, h('span.sr-only', {}, tp('Status', 'סטטוס'))),
          h('th', { scope: 'col' }, tp('Title', 'שם')),
          h('th', { scope: 'col' }, tp('Difficulty', 'רמת קושי')),
          h('th', { scope: 'col' }, tp('Topic', 'נושא')),
        ),
      ),
      tableBody,
    ),
  );
  const emptyHost = h('div.dashboard-empty', { hidden: true });
  const statsRow = h('div.stats-row');
  const today = h('section.today-row', { 'aria-label': tp('Practice today', 'תרגול היום') });
  const countLine = h('p.hint-text.filter-count', { role: 'status' });
  const clearInline = h('button.btn.btn-ghost.btn-sm.filter-clear', { type: 'button', hidden: true, onClick: () => clearFilters() }, tp('Clear filters', 'לנקות את הסינון'));
  const moreHost = h('div.list-more', { hidden: true });
  const phone = typeof matchMedia === 'function' ? matchMedia(PHONE_QUERY) : null;
  let shown = PHONE_PAGE;
  let path = null;
  let topicOpen = false;

  function renderToday() {
    if (!path) return;
    const state = store.get();
    const spots = weakSpots(path, state.problems);
    const reasonEn = (s) =>
      [s.unsolved ? `${s.unsolved} attempted, not solved` : null, s.assisted ? `${s.assisted} solved with the solution revealed` : null, s.failedSubmits ? `${s.failedSubmits} rejected ${s.failedSubmits === 1 ? 'submit' : 'submits'}` : null]
        .filter(Boolean)
        .join(', ');
    const reasonHe = (s) =>
      [
        s.unsolved ? (s.unsolved === 1 ? 'בעיה אחת שניסית ועוד לא נפתרה' : `${s.unsolved} בעיות שניסית ועוד לא נפתרו`) : null,
        s.assisted ? (s.assisted === 1 ? 'בעיה אחת נפתרה אחרי חשיפת הפתרון' : `${s.assisted} בעיות נפתרו אחרי חשיפת הפתרון`) : null,
        s.failedSubmits ? (s.failedSubmits === 1 ? 'הגשה אחת שנדחתה' : `${s.failedSubmits} הגשות שנדחו`) : null,
      ]
        .filter(Boolean)
        .join(', ');
    const reason = (s) => tp(reasonEn(s), reasonHe(s));
    mount(
      today,
      dailyCard({ path, state, now: new Date(), compact: true }),
      quizCard({ now: new Date(), restDay: restDayOf(state) }),
      h(
        `section.today-card.today-weak${spots.length ? '' : '.is-empty'}`,
        { 'aria-labelledby': 'weak-title' },
        h('div.today-kicker', { id: 'weak-title' }, tp('Weak spots', 'נקודות חולשה')),
        spots.length
          ? h(
              'ul.weak-list',
              {},
              spots.map((s) =>
                h(
                  'li',
                  {},
                  h('div.weak-copy', {}, h('strong', {}, s.title), h('div.hint-text', {}, reason(s))),
                  s.next
                    ? h('a.btn.btn-secondary.btn-sm', { href: `#/problem/${s.next}` }, tp('Practice', 'לתרגל'))
                    : h('span.hint-text', {}, tp('Every problem here is solved', 'כל הבעיות כאן נפתרו')),
                ),
              ),
            )
          : h(
              'p.hint-text',
              {},
              tp(
                'None yet. Topics show up here when you miss submits, leave a problem unsolved or reveal a solution.',
                'עדיין ריק. נושא יופיע כאן אחרי הגשה שנדחתה, בעיה שנשארה בלי פתרון או פתרון שנחשף.',
              ),
            ),
        h('a.weak-map-link', { href: '#/map' }, tp('See every topic on the map', 'לראות את כל הנושאים במפה')),
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
          h('strong', {}, tp('Start with the learning path or today\'s problem.', 'אפשר להתחיל במסלול הלמידה או בבעיה של היום.')),
          h(
            'span.start-sub',
            {},
            tp(
              `${available} problems ready to practice, ordered easy to hard. Every solve lights a hex on the map.`,
              `${heProblems(available)} מוכנות לתרגול, מהקלה לקשה. כל פתרון מדליק משושה במפה.`,
            ),
          ),
        ),
        h(
          'div.start-actions',
          {},
          h('a.btn.btn-secondary.btn-sm', { href: '#/path' }, tp('Learning path', 'מסלול הלמידה')),
          h('a.btn.btn-ghost.btn-sm', { href: '#/map' }, tp('Open the map', 'לפתוח את המפה')),
        ),
      );
      return;
    }
    const solvedCell = statCell(tp('Solved', 'נפתרו'), `${st.solved}`, tp(`of ${available}`, `מתוך ${available}`));
    mount(
      statsRow,
      solvedCell,
      statCell(tp('Streak', 'רצף'), tp(`${st.streak} ${st.streak === 1 ? 'day' : 'days'}`, st.streak === 1 ? 'יום אחד' : `${st.streak} ימים`)),
      statCell(tp('Accuracy', 'דיוק'), st.accuracy === null ? '-' : `${st.accuracy}%`),
      statCell(tp('Submits', 'הגשות'), `${st.submissions}`),
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
    const label = tp(STATUS_LABEL[status], STATUS_LABEL_HE[status]) ?? tp('Not started', 'עוד לא התחלת');
    return h(`span.status-pill.s-${status}`, { title: label }, hexMark(status), h('span.sr-only', {}, label));
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
    countLine.textContent = tp(active
      ? matchingPlanned > 0
        ? `${matchingAvailable} of ${available} ${available === 1 ? 'problem' : 'problems'}, ${matchingPlanned} coming soon`
        : `${matchingAvailable} of ${available} ${available === 1 ? 'problem' : 'problems'}`
      : planned > 0
        ? `${available} ${available === 1 ? 'problem' : 'problems'}, ${planned} coming soon`
        : `${rows.length} ${rows.length === 1 ? 'problem' : 'problems'}`,
    active
      ? matchingPlanned > 0
        ? `${matchingAvailable} מתוך ${heProblems(available)}, עוד ${matchingPlanned} בדרך`
        : `${matchingAvailable} מתוך ${heProblems(available)}`
      : planned > 0
        ? `${heProblems(available)}, עוד ${planned} בדרך`
        : heProblems(rows.length));

    const page = phone?.matches ? listPage({ total: rows.length, shown, size: PHONE_PAGE }) : { visible: rows.length, left: 0, next: 0 };
    moreHost.hidden = page.left === 0;
    if (page.left) {
      mount(
        moreHost,
        h('button.btn.btn-secondary.list-more-btn', { type: 'button', onClick: () => showMore(page.visible) }, tp(`Show ${page.next} more`, `להציג עוד ${page.next}`)),
        h('p.hint-text', {}, tp(`${page.visible} of ${rows.length} shown`, `מוצגות ${page.visible} מתוך ${rows.length}`)),
      );
    }

    if (!rows.length) {
      tableWrap.hidden = true;
      emptyHost.hidden = false;
      mount(
        emptyHost,
        stateBlock({
          title: tp('No matching problems', 'אין בעיות מתאימות'),
          body: tp(
            'No problems match these filters. Try a broader search or clear the active filters.',
            'אף בעיה לא מתאימה לסינון הזה. כדאי לנסות חיפוש רחב יותר או לנקות את הסינון.',
          ),
          kind: 'empty',
          action: { label: tp('Clear filters', 'לנקות את הסינון'), variant: 'btn-secondary', onClick: clearFilters },
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
          h('td.cell-title', {}, title, isAvailable ? null : h('span.tag.tag-muted', {}, tp('Coming soon', 'בקרוב'))),
          h('td.cell-diff', {}, difficulty(p.difficulty)),
          h('td.cell-topics', {}, p.topics.map((t) => h('span.tag', {}, topicLabel(t)))),
        );
      };
    // The first screenful now, the rest in small chunks between frames: building all 225 rows at
    // once blocked the main thread through a page change. aria-busy says the list is still filling.
    const token = ++fillToken;
    // A paged phone list is drawn whole: it is already short, and showMore focuses its new rows.
    const FIRST = phone?.matches ? page.visible : 40;
    const CHUNK = 60;
    const list = rows.slice(0, page.visible);
    mount(tableBody, list.slice(0, FIRST).map(row));
    if (list.length <= FIRST) {
      tableBody.removeAttribute('aria-busy');
      return;
    }
    tableBody.setAttribute('aria-busy', 'true');
    let at = FIRST;
    const fill = () => {
      if (token !== fillToken) return;
      tableBody.append(...list.slice(at, at + CHUNK).map(row));
      at += CHUNK;
      if (at < list.length) setTimeout(fill, 0);
      else tableBody.removeAttribute('aria-busy');
    };
    setTimeout(fill, 0);
  }

  /** Adds the next page; focus goes to its first problem, so keyboard and screen reader users carry on there. */
  function showMore(from) {
    shown = from + PHONE_PAGE;
    renderRows();
    const first = tableBody.rows[from]?.querySelector('a');
    (first ?? moreHost.querySelector('button'))?.focus();
  }

  /** A new filter starts again from the first page. */
  function refilter() {
    shown = PHONE_PAGE;
    renderRows();
  }

  const diffGroup = chipGroup({
    label: tp('Difficulty', 'רמת קושי'),
    // Easy, Medium and Hard stay in English on the Hebrew site (docs/I18N.md); only "All" is copy.
    options: ['All', ...DIFFICULTIES].map((d) => ({ value: d, label: d === 'All' ? tp('All', 'הכול') : d, attrs: { 'data-value': d } })),
    value: filters.difficulty,
    onChange: (value) => {
      filters.difficulty = value;
      refilter();
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
    tp('Topic', 'נושא'),
  );

  const syncTopicToggle = () => {
    const active = filters.topic !== 'all';
    topicToggle.textContent = active ? tp(`Topic: ${topicLabel(filters.topic)}`, `נושא: ${topicLabel(filters.topic)}`) : tp('Topic', 'נושא');
    topicToggle.classList.toggle('is-active', active);
  };

  const topicGroup = chipGroup({
    label: tp('Topic', 'נושא'),
    options: [{ value: 'all', label: tp('All topics', 'כל הנושאים'), attrs: { 'data-value': 'all' } }, ...TOPICS.map((t) => ({ value: t.id, label: t.label, attrs: { 'data-value': t.id } }))],
    value: filters.topic,
    onChange: (value) => {
      filters.topic = value;
      syncTopicToggle();
      refilter();
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
    placeholder: tp(`Search ${available} problems`, `חיפוש ב-${available} בעיות`),
    'aria-label': tp('Search problems', 'חיפוש בעיות'),
  });
  search.addEventListener('input', () => {
    filters.query = search.value;
    refilter();
  });

  /** Opens a random unsolved problem among those the filters show (AlgoExpert's "pick random"). */
  const randomBtn = h('button.btn.btn-ghost.btn-sm.random-btn', { type: 'button', onClick: () => {
    const state = store.get();
    const q = filters.query.trim().toLowerCase();
    const pool = catalog.filter((p) => p.status === 'available' && state.problems[p.id]?.status !== 'solved' && (filters.difficulty === 'All' || p.difficulty === filters.difficulty) && (filters.topic === 'all' || p.topics.includes(filters.topic)) && (!q || p.title.toLowerCase().includes(q)));
    if (pool.length) location.hash = `#/problem/${pool[Math.floor(Math.random() * pool.length)].id}`;
  }, 'aria-label': tp('Open a random unsolved problem', 'לפתוח בעיה אקראית שעוד לא נפתרה') }, h('span.hexmark', { 'aria-hidden': 'true' }), tp('Random', 'בעיה אקראית'), h('span.random-extra', {}, tp(' unsolved', ' שלא נפתרה')));

  function clearFilters() {
    filters.difficulty = 'All';
    filters.topic = 'all';
    filters.query = '';
    search.value = '';
    diffGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'All')));
    topicGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'all')));
    syncTopicToggle();
    refilter();
    search.focus({ preventScroll: true });
  }

  const nudgeAbort = new AbortController();
  const hasProgress = () => {
    if (store.get().totals.submissions > 0) return true;
    try {
      return Boolean(localStorage.getItem(QUIZ_STORAGE_KEY));
    } catch {
      return false;
    }
  };
  mount(
    root,
    h(
      'div.page.dashboard-page',
      {},
      h(
        'header.page-head',
        {},
        h(
          'div',
          {},
          h('span.eyebrow', {}, new Intl.DateTimeFormat(pageLang() === 'he' ? 'he-IL' : 'en-GB', HEAD_DATE_OPTS).format(new Date())),
          h('h1', {}, tp('Problems', 'בעיות')),
          h(
            'p.page-sub',
            {},
            tp(
              `${available} problems in 26 topics. Every submission runs 15 tests: 5 you can open, 10 hidden.`,
              `${heProblems(available)} ב-26 נושאים. כל הגשה נבדקת מול 15 בדיקות: 5 גלויות ו-10 מוסתרות.`,
            ),
          ),
        ),
        h(
          'nav.view-switch',
          { 'aria-label': tp('Problems view', 'תצוגת הבעיות') },
          h('a.view-switch-item', { href: '#/', 'aria-current': 'page' }, tp('List', 'רשימה')),
          h('a.view-switch-item', { href: '#/map' }, tp('Map', 'מפה')),
        ),
      ),
      // Reminders for a member without them, sign-in for a guest with something to save (owner's request).
      nudgeBanner({ account: services.account, hasProgress, signal: nudgeAbort.signal }),
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
      moreHost,
      emptyHost,
      siteFooter(),
    ),
  );
  renderStats();
  renderRows();
  // Turning a tablet or resizing a window across the breakpoint redraws with or without paging.
  const onWidth = () => renderRows();
  phone?.addEventListener('change', onWidth);
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
    nudgeAbort.abort();
    fillToken++;
    stopCount();
    unsub();
    phone?.removeEventListener('change', onWidth);
  };
}
