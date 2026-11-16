/**
 * Learning Path: 4 milestones, progress derived from solved problems.
 */
import { h, mount, difficultyBadge } from '../dom.js';
import { MILESTONES } from '../../data/curriculum.js';
import { catalog } from '../../problems/index.js';

export function renderPath(root, { store }) {
  const state = store.get();
  const solved = (id) => state.problems[id]?.status === 'solved';

  // First milestone that is not complete is "current": the path should point somewhere.
  const milestoneStats = MILESTONES.map((m) => {
    const problems = catalog.filter((p) => p.milestone === m.id);
    const done = problems.filter((p) => solved(p.id)).length;
    return { m, problems, done, pct: problems.length ? Math.round((done / problems.length) * 100) : 0 };
  });
  const currentIdx = milestoneStats.findIndex((x) => x.done < x.problems.length);

  mount(
    root,
    h(
      'div.page',
      {},
      h('header.page-head', {}, h('h1', {}, 'Learning Path'), h('p.page-sub', {}, 'Four milestones from fundamentals to OA-ready. Progress counts accepted submissions.')),
      h(
        'ol.path',
        {},
        milestoneStats.map(({ m, problems, done, pct }, i) =>
          h(
            `li.milestone${i === currentIdx ? '.current' : ''}${pct === 100 ? '.complete' : ''}`,
            {},
            h('div.milestone-marker', { 'aria-hidden': 'true' }, String(m.id)),
            h(
              'div.milestone-card',
              {},
              h('div.milestone-top', {}, h('div', {}, h('div.milestone-kicker', {}, `Milestone ${m.id}${i === currentIdx ? ' · You are here' : ''}`), h('h2', {}, m.title)), h('div.milestone-pct', {}, `${pct}%`)),
              h('p.milestone-summary', {}, m.summary),
              h('div.progress', { role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `${m.title} progress` }, h('div.progress-fill', { style: { width: `${pct}%` } })),
              h('div.milestone-meta', {}, `${done} / ${problems.length} problems`),
              h('div.problem-tags', {}, m.topics.map((t) => h('span.tag', {}, t))),
              h('ul.outcomes', {}, m.outcomes.map((o) => h('li', {}, o))),
              h(
                'ul.milestone-problems',
                {},
                problems.map((p) =>
                  h(
                    'li',
                    {},
                    h(`span.status-icon.s-${solved(p.id) ? 'solved' : 'todo'}`),
                    p.status === 'available' ? h('a.problem-link', { href: `#/problem/${p.id}` }, p.title) : h('span.planned-title', {}, p.title),
                    difficultyBadge(p.difficulty),
                    p.status === 'available' ? null : h('span.tag.tag-muted', {}, 'Coming soon'),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  return () => {};
}
