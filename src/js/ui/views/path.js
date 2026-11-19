/**
 * Learning Path: the 131 essential problems by tier and topic, in prerequisite order, with
 * progress derived from solve data and a "Next up" pointer. Data: src/js/data/essential-path.json.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { catalogEntry } from '../../problems/index.js';
import { pathProgress, conceptLabel } from '../../data/learning-path.js';
import { TOPICS } from '../../data/taxonomy.js';
import { loadPath } from '../../data/path-loader.js';

const topicTitle = (id) => TOPICS.find((t) => t.id === id)?.title ?? id;

function progressBar(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return h('div.progress', { role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label }, h('div.progress-fill', { style: { width: `${pct}%` } }));
}

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderPath(root, { store }) {
  let disposed = false;
  let path = null;
  mount(root, h('div.page', {}, h('p.page-sub', { role: 'status' }, 'Loading the path...')));

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
          h('div.path-summary-top', {}, h('strong', {}, `${overall.solved} / ${overall.total} solved`), overall.next ? h('a.btn.btn-primary', { href: `#/problem/${overall.next.id}` }, `Next up: ${nextTitle}`) : h('span.tag.tag-live', {}, 'Path complete')),
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
            h(
              'div.path-topics',
              {},
              tier.topics.map((tp) => {
                const done = tp.problems.filter((p) => isSolved(p.id)).length;
                const holdsNext = overall.next && tp.problems.includes(overall.next);
                return h(
                  `details.path-topic${holdsNext ? '.current' : ''}${done === tp.problems.length ? '.complete' : ''}`,
                  { open: holdsNext || (done > 0 && done < tp.problems.length) },
                  h('summary', {}, h('span.path-topic-title', {}, tp.title), h('span.path-count', {}, `${done} / ${tp.problems.length}`)),
                  tp.prereqs.length ? h('div.hint-text', {}, `Builds on: ${tp.prereqs.map(topicTitle).join(', ')}`) : null,
                  progressBar(done, tp.problems.length, `${tp.title} progress`),
                  h(
                    'ol.path-problems',
                    {},
                    tp.problems.map((p) => {
                      const s = state.problems[p.id];
                      const status = s?.status === 'solved' ? (s.revealed ? 'assisted' : 'solved') : s ? 'attempted' : 'todo';
                      return h(
                        `li${p === overall.next ? '.is-next' : ''}`,
                        {},
                        h(`span.status-icon.s-${status}`, { title: status, 'aria-label': status }),
                        h('a.problem-link', { href: `#/problem/${p.id}` }, catalogEntry(p.id)?.title ?? p.id),
                        h('span.path-concept', {}, conceptLabel(p.concept)),
                        difficultyBadge(p.difficulty),
                      );
                    }),
                  ),
                );
              }),
            ),
          );
        }),
      ),
    );
  }

  loadPath().then((p) => {
    if (disposed) return;
    if (!p) {
      mount(root, h('div.page.page-narrow', {}, h('h1', {}, 'Learning Path'), h('p.page-sub', {}, 'The path could not be loaded. Check your connection and reload.')));
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
