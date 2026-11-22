/**
 * Learning Path: the 131 essential problems by tier and topic, in prerequisite order, with
 * progress derived from solve data and a "Next up" pointer. Data: src/js/data/essential-path.json.
 */
import { h, mount, difficulty, stateBlock, loadingState, siteFooter } from '../dom.js';
import { catalogEntry } from '../../problems/index.js';
import { pathProgress, conceptLabel, topicStartsOpen, TIER_SUMMARIES } from '../../data/learning-path.js';
import { TOPICS } from '../../data/taxonomy.js';
import { loadPath } from '../../data/path-loader.js';

const topicTitle = (id) => TOPICS.find((t) => t.id === id)?.title ?? id;
const STATUS_LABEL = { solved: 'Solved', assisted: 'Assisted', attempted: 'Attempted' };
const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

/** Labelled progress bar for the overall path; `mini` is the decorative bar in a topic header. */
function progressBar(done, total, label) {
  return h(
    'div.path-bar',
    { role: 'progressbar', 'aria-valuenow': pct(done, total), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label },
    h('div.path-bar-fill', { style: { width: `${pct(done, total)}%` } }),
  );
}
const miniBar = (done, total) =>
  h('span.path-mini-bar', { 'aria-hidden': 'true' }, h('span.path-bar-fill', { style: { width: `${pct(done, total)}%` } }));

/** Shared dot-plus-word status; "not started" is spoken, not shown, as on the dashboard. */
const statusPill = (status) =>
  h(`span.status-pill.s-${status}`, {}, h('span.status-dot', { 'aria-hidden': 'true' }), STATUS_LABEL[status] ?? h('span.sr-only', {}, 'Not started'));

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
  mount(root, h('div.page', {}, loadingState({ label: 'Loading the path...' })));

  function topicSection(tp, state, overall) {
    const isSolved = (id) => state.problems[id]?.status === 'solved';
    const done = tp.problems.filter((p) => isSolved(p.id)).length;
    const total = tp.problems.length;
    const holdsNext = Boolean(overall.next && tp.problems.includes(overall.next));
    const open = openOverride.get(tp.id) ?? topicStartsOpen({ done, total, holdsNext });
    const bodyId = `path-topic-${tp.id}`;
    const body = h(
      'div.path-topic-body',
      { id: bodyId, hidden: !open },
      tp.prereqs.length ? h('p.hint-text.path-prereqs', {}, `Builds on: ${tp.prereqs.map(topicTitle).join(', ')}`) : null,
      h(
        'ol.path-problems',
        {},
        tp.problems.map((p) => {
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
              h('span.path-row-title', {}, title, isNext ? h('span.tag.path-next-tag', {}, 'Next up') : null),
              h('span.path-concept', {}, conceptLabel(p.concept)),
              h('span.path-row-diff', {}, difficulty(p.difficulty)),
            ),
          );
        }),
      ),
    );
    const toggle = h(
      'button.path-topic-toggle',
      {
        type: 'button',
        'aria-expanded': String(open),
        'aria-controls': bodyId,
        onClick: () => {
          const next = toggle.getAttribute('aria-expanded') !== 'true';
          openOverride.set(tp.id, next);
          toggle.setAttribute('aria-expanded', String(next));
          body.hidden = !next;
        },
      },
      h('span.path-chevron', { 'aria-hidden': 'true' }),
      h('span.path-topic-title', {}, tp.title, done === total ? h('span.sr-only', {}, ', complete') : null),
      miniBar(done, total),
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
    const nextTopic = overall.next ? path.flatMap((t) => t.topics).find((tp) => tp.problems.includes(overall.next)) : null;

    mount(
      root,
      h(
        'div.page',
        {},
        h('header.page-head', {}, h('h1', {}, 'Learning Path'), h('p.page-sub', {}, `${overall.total} problems, one per subtopic, in prerequisite order. Finishing it means you have solved every core pattern once. Progress counts accepted submissions.`)),
        h(
          'div.path-summary',
          {},
          h(
            'div.path-summary-top',
            {},
            h('div.path-summary-count', {}, h('strong', {}, `${overall.solved} / ${overall.total} solved`), h('span.path-count', {}, `${pct(overall.solved, overall.total)}%`)),
            overall.next ? h('a.btn.btn-primary', { href: `#/problem/${overall.next.id}` }, `Next up: ${nextTitle}`) : h('span.tag.tag-live', {}, 'Path complete'),
          ),
          progressBar(overall.solved, overall.total, 'Learning path progress'),
          nextTopic ? h('div.hint-text', {}, `${nextTopic.title}: ${conceptLabel(overall.next.concept)}`) : null,
        ),
        path.map((tier) => {
          const tierProblems = tier.topics.flatMap((tp) => tp.problems);
          const tierDone = tierProblems.filter((p) => isSolved(p.id)).length;
          return h(
            'section.path-tier',
            { 'aria-labelledby': `tier-${tier.tier}` },
            h('h2.path-tier-title', { id: `tier-${tier.tier}` }, `Tier ${tier.tier + 1}: ${tier.title}`, h('span.path-count', {}, `${tierDone} / ${tierProblems.length}`)),
            TIER_SUMMARIES[tier.tier] ? h('p.path-tier-desc', {}, `When you finish it: ${TIER_SUMMARIES[tier.tier].charAt(0).toLowerCase()}${TIER_SUMMARIES[tier.tier].slice(1)}`) : null,
            h('div.path-topics', {}, tier.topics.map((tp) => topicSection(tp, state, overall))),
          );
        }),
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
            title: 'Could not load the learning path',
            body: 'The path could not be loaded. Check your connection and reload.',
            kind: 'error',
            headingTag: 'h1',
            action: { label: 'Reload', onClick: () => location.reload() },
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
