/**
 * Learning Path: the 131 essential problems by tier and topic, in prerequisite order, with
 * progress derived from solve data and a "Next up" pointer. Data: src/js/data/essential-path.json.
 */
import { shareButton } from '../share.js';
import { pathShare } from '../../data/share.js';
import { h, mount, difficulty, stateBlock, loadingState, hexMark, tp } from '../dom.js';
import { siteFooter } from '../footer.js';
import { catalogEntry } from '../../problems/index.js';
import { pathProgress, conceptLabel, topicStartsOpen, TIER_SUMMARIES } from '../../data/learning-path.js';
import { TOPICS } from '../../data/taxonomy.js';
import { loadPath } from '../../data/path-loader.js';

const topicTitle = (id) => TOPICS.find((t) => t.id === id)?.title ?? id;
const STATUS_LABEL = { solved: 'Solved', assisted: 'Assisted', attempted: 'Attempted' };
const STATUS_LABEL_HE = { solved: 'נפתרה', assisted: 'נפתרה עם עזרה', attempted: 'ניסית' };
// By tier index, beside the English in essential-path.json and TIER_SUMMARIES (data/learning-path.js).
const TIER_TITLES_HE = ['אוצר מילים', 'דפוסים ראשונים', 'דפוסים על גבי דפוסים', 'מבני נתונים מרכזיים', 'מבנים על גבי מבנים', 'מתקדם'];
const TIER_SUMMARIES_HE = [
  'אפשר לשמור, לספור ולחפש במעבר אחד, ולקרוא שאילתת SQL בסיסית.',
  'הדפוסים הראשונים עם שם כבר מוכרים: two pointers, מחסניות, סכומי קידומת, מיון, ביטים ורקורסיה.',
  'אפשר לבנות על הדפוסים האלה: sliding window, חיפוש בינארי, מניפולציות על רשימות מקושרות ובחירות חמדניות.',
  'אפשר לעבוד עם עצים, לחפש עם backtracking ולכתוב תכנות דינמי חד-ממדי.',
  'אפשר להשתמש בערימות וב-tries, לסרוק גרפים ולכתוב תכנות דינמי דו-ממדי.',
  'הכלים המתקדמים כבר בידיים: union find, אלגוריתמים מתקדמים על גרפים ושאילתות טווח.',
];
const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

/** Labelled progress bar for the overall path. */
function progressBar(done, total, label) {
  return h(
    'div.path-bar',
    { role: 'progressbar', 'aria-valuenow': pct(done, total), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label },
    h('div.path-bar-fill', { style: { width: `${pct(done, total)}%` } }),
  );
}

/** A topic's problems as a strip of hexes, lit when solved (decorative: the count is beside it). */
const hexStrip = (statuses) => h('span.path-mini-bar.hex-strip', { 'aria-hidden': 'true' }, statuses.map((st) => h(`span.strip-hex.${st}`)));

/** Shared hex-plus-word status; "not started" is spoken, not shown, as on the Problems page. */
const statusPill = (status) => {
  const word = tp(STATUS_LABEL, STATUS_LABEL_HE)[status];
  return h(`span.status-pill.s-${status}`, {}, hexMark(status), word ? h('span.status-word', {}, word) : h('span.sr-only', {}, tp('Not started', 'עוד לא התחלת')));
};

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderPath(root, { store }) {
  let disposed = false;
  let path = null;
  // Topics the reader opened or closed by hand; survives the re-render on every store change.
  const openOverride = new Map();
  mount(root, h('div.page', {}, loadingState({ label: tp('Loading the path...', 'טוען את המסלול…') })));

  function topicSection(topic, state, overall) {
    const isSolved = (id) => state.problems[id]?.status === 'solved';
    const done = topic.problems.filter((p) => isSolved(p.id)).length;
    const total = topic.problems.length;
    const holdsNext = Boolean(overall.next && topic.problems.includes(overall.next));
    const open = openOverride.get(topic.id) ?? topicStartsOpen({ done, total, holdsNext });
    const bodyId = `path-topic-${topic.id}`;
    const body = h(
      'div.path-topic-body',
      { id: bodyId, hidden: !open },
      topic.prereqs.length ? h('p.hint-text.path-prereqs', {}, tp('Builds on ', 'נשען על '), topic.prereqs.map((id, i) => [i ? ', ' : '', h('a', { href: `#/map/${id}` }, topicTitle(id))])) : null,
      h(
        'ol.path-problems',
        {},
        topic.problems.map((p) => {
          const s = state.problems[p.id];
          const status = s?.status === 'solved' ? (s.revealed ? 'assisted' : 'solved') : s ? 'attempted' : 'todo';
          const title = catalogEntry(p.id)?.title ?? p.id;
          const isNext = p === overall.next;
          return h(
            `li${isNext ? '.is-next' : ''}`,
            {},
            h(
              'a.path-row',
              { href: `#/problem/${p.id}` },
              h('span.path-row-status', {}, statusPill(status)),
              h('span.path-row-title', {}, title, isNext ? h('span.tag.path-next-tag', {}, tp('Next up', 'הבאה בתור')) : null),
              h('span.path-concept', {}, conceptLabel(p.concept)),
              h('span.path-row-diff', {}, difficulty(p.difficulty)),
            ),
          );
        }),
      ),
    );
    const statuses = topic.problems.map((p) => {
      const st = state.problems[p.id];
      return st?.status === 'solved' ? (st.revealed ? 'assisted' : 'solved') : st ? 'attempted' : 'new';
    });
    const toggle = h(
      'button.path-topic-toggle',
      {
        type: 'button',
        'aria-expanded': String(open),
        'aria-controls': bodyId,
        onClick: () => {
          const next = toggle.getAttribute('aria-expanded') !== 'true';
          openOverride.set(topic.id, next);
          toggle.setAttribute('aria-expanded', String(next));
          body.hidden = !next;
        },
      },
      h('span.path-chevron', { 'aria-hidden': 'true' }),
      h('span.path-topic-title', {}, topic.title, done === total ? h('span.sr-only', {}, tp(', complete', ', הושלם')) : null, holdsNext ? h('span.tag.tag-lamp.path-here', {}, tp('You are here', 'אתם כאן')) : null),
      hexStrip(statuses),
      h('span.path-count', {}, `${done} / ${total}`),
    );
    return h(
      `section.path-topic${holdsNext ? '.current' : ''}${done === total ? '.complete' : ''}`,
      {},
      h('h3.path-topic-head', {}, toggle),
      body,
    );
  }

  function render() {
    const state = store.get();
    const isSolved = (id) => state.problems[id]?.status === 'solved';
    const overall = pathProgress(path, isSolved);
    const nextTitle = overall.next ? catalogEntry(overall.next.id)?.title ?? overall.next.id : null;
    const nextTopic = overall.next ? path.flatMap((t) => t.topics).find((t) => t.problems.includes(overall.next)) : null;

    const tierState = (tier) => {
      const ps = tier.topics.flatMap((t) => t.problems);
      const done = ps.filter((p) => isSolved(p.id)).length;
      const holds = Boolean(overall.next && ps.includes(overall.next));
      return { done, total: ps.length, state: done === ps.length ? 'done' : holds ? 'current' : done ? 'started' : 'ahead' };
    };
    mount(
      root,
      h(
        'div.page.path-page',
        {},
        h(
          'header.page-head',
          {},
          h(
            'div',
            {},
            h('span.eyebrow', {}, tp(`${overall.total} problems · ${path.length} tiers`, `${overall.total} בעיות · ${path.length} שלבים`)),
            h('h1', {}, tp('Learning path', 'מסלול הלמידה')),
            h(
              'p.page-sub',
              {},
              tp(
                'The route through the map: one problem per subtopic, in prerequisite order. Finishing it means you have solved every core pattern once.',
                'המסלול שעובר במפה: בעיה אחת לכל תת-נושא, לפי סדר הדרישות המקדימות. בסוף המסלול כל דפוס מרכזי כבר נפתר פעם אחת.',
              ),
            ),
          ),
          h(
            'div.page-head-actions',
            {},
            h('a.btn.btn-ghost.btn-sm', { href: nextTopic ? `#/map/${nextTopic.id}` : '#/map' }, tp('See it on the map', 'לראות במפה')),
            shareButton({ name: tp('Share your learning path progress', 'לשתף את ההתקדמות במסלול הלמידה'), get: (lang) => pathShare({ ...overall, lang }) }),
          ),
        ),
        h(
          'div.path-summary',
          {},
          h(
            'div.path-summary-progress',
            {},
            h('div.path-summary-count', {}, h('strong', {}, tp(`${overall.solved} / ${overall.total} solved`, `${overall.solved} / ${overall.total} נפתרו`)), h('span.path-count', {}, `${pct(overall.solved, overall.total)}%`)),
            progressBar(overall.solved, overall.total, tp('Learning path progress', 'ההתקדמות במסלול הלמידה')),
          ),
          overall.next
            ? h(
                'div.path-next',
                {},
                h('span.eyebrow', {}, tp('Next up', 'הבאה בתור')),
                h('div.path-next-title', {}, nextTitle, ' ', difficulty(overall.next.difficulty)),
                nextTopic ? h('div.hint-text', {}, `${nextTopic.title} · ${conceptLabel(overall.next.concept)}`) : null,
              )
            : h('span.tag.tag-live', {}, tp('Path complete', 'המסלול הושלם')),
          overall.next ? h('a.btn.btn-primary', { href: `#/problem/${overall.next.id}` }, tp(`Next up: ${nextTitle}`, `הבאה בתור: ${nextTitle}`)) : null,
        ),
        h(
          'ol.path-route',
          {},
          path.map((tier) => {
            const ts = tierState(tier);
            return h(
              `li.path-tier.is-${ts.state}`,
              { 'aria-labelledby': `tier-${tier.tier}` },
              h('span.route-node', { 'aria-hidden': 'true' }),
              h(
                'div.path-tier-body',
                {},
                h('h2.path-tier-title', { id: `tier-${tier.tier}` }, h('span.tier-num', {}, tp(`Tier ${tier.tier + 1}`, `שלב ${tier.tier + 1}`)), tp(tier.title, TIER_TITLES_HE[tier.tier] ?? tier.title), h('span.path-count', {}, `${ts.done} / ${ts.total}`)),
                TIER_SUMMARIES[tier.tier]
                  ? h('p.path-tier-desc', {}, h('span.checkpoint', {}, tp('Checkpoint', 'נקודת ביקורת')), ` ${tp(TIER_SUMMARIES[tier.tier], TIER_SUMMARIES_HE[tier.tier] ?? TIER_SUMMARIES[tier.tier])}`)
                  : null,
                h('div.path-topics', {}, tier.topics.map((t) => topicSection(t, state, overall))),
              ),
            );
          }),
        ),
        siteFooter(),
      ),
    );
  }

  loadPath().then((p) => {
    if (disposed) return;
    if (!p) {
      mount(
        root,
        h(
          'div.page.page-narrow',
          {},
          stateBlock({
            title: tp('Could not load the learning path', 'לא הצלחנו לטעון את מסלול הלמידה'),
            body: tp('The path could not be loaded. Check your connection and reload.', 'לא הצלחנו לטעון את המסלול. כדאי לבדוק את החיבור ולטעון מחדש.'),
            kind: 'error',
            headingTag: 'h1',
            action: { label: tp('Reload', 'לטעון מחדש'), onClick: () => location.reload() },
          }),
          siteFooter(),
        ),
      );
      return;
    }
    path = p;
    render();
  });
  const unsub = store.subscribe(() => path && render());
  return () => {
    disposed = true;
    unsub();
  };
}
