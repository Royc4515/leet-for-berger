/**
 * "Context" block on the problem page: companies that ask the problem, best known complexity,
 * and the other versions of the same idea. Data: src/js/data/problem-meta.json (built by
 * scripts/content/build-meta.mjs), fetched once and shared by every problem page.
 */
import { h, ilMark, miniLogo } from './dom.js';
import { complexityOpenByDefault } from '../data/problem-meta.js';
import { loadLogoManifest, companyLogoByName, loadCompanyPages, companyPageSlug } from '../data/company-loader.js';

const SHOWN_COMPANIES = 8;
const RECENCY_LABEL = { '30d': 'last 30 days', '3m': 'last 3 months', '6m': 'last 6 months', older: 'over 6 months ago' };

let metaPromise = null;

/** @returns {Promise<Record<string, import('../data/problem-meta.js').ProblemMeta>>} */
export function loadProblemMeta() {
  metaPromise ??= fetch(new URL('../data/problem-meta.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : {}))
    // No context is better than a broken page: the block simply stays empty.
    .catch(() => ({}));
  return metaPromise;
}

/**
 * A company that asks the problem: its logo (when it has one), its name, the IL mark; a link to
 * its company page when it has one (a company asked too rarely has none).
 */
function companyChip(c, logos, pages) {
  const logo = companyLogoByName(logos, c.name);
  const slug = companyPageSlug(pages, c.name);
  return h(
    `${slug ? 'a' : 'span'}.tag.company-tag${c.israeli ? '.company-il' : ''}`,
    { href: slug ? `#/companies/${slug}` : null, title: `${c.name}: frequency ${c.frequency}, asked ${RECENCY_LABEL[c.recency] ?? c.recency}${c.israeli ? ', Israeli company' : ''}` },
    logo ? miniLogo(logo, 'sm') : null,
    c.name,
    c.israeli ? ilMark() : null,
  );
}

function companiesBlock(meta, logos, pages) {
  if (!meta.companies.length) return null;
  const israeli = meta.companies.filter((c) => c.israeli);
  const first = [...israeli, ...meta.companies.filter((c) => !c.israeli)].slice(0, SHOWN_COMPANIES);
  const rest = meta.companies.filter((c) => !first.includes(c));
  const unlisted = meta.companyCount - meta.companies.length;
  const chip = (c) => companyChip(c, logos, pages);
  const more = h('span.company-more', { hidden: true }, rest.map(chip), unlisted > 0 ? h('span.hint-text', {}, ` and ${unlisted} more with lower frequency`) : null);
  const toggle = rest.length
    ? h('button.btn-link', { type: 'button', 'aria-expanded': 'false' }, `Show ${rest.length} more`)
    : null;
  toggle?.addEventListener('click', () => {
    const open = more.hidden;
    more.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Show fewer' : `Show ${rest.length} more`;
  });
  return h(
    'div.context-row',
    {},
    h('div.context-label', {}, `Asked at ${meta.companyCount} ${meta.companyCount === 1 ? 'company' : 'companies'}`),
    h('div.company-list', {}, first.map(chip), more, toggle),
  );
}

function complexityBlock(meta, problem, open) {
  const lines = [];
  if (meta.bestKnown) {
    lines.push(
      h(
        'div',
        {},
        `Best known for LeetCode ${meta.number}: `,
        h('code', {}, meta.bestKnown.time),
        ' time',
        meta.bestKnown.space ? [', ', h('code', {}, meta.bestKnown.space), ' space'] : null,
      ),
    );
  }
  if (problem.growth?.target) lines.push(h('div', {}, 'Growth target here: ', h('code', {}, problem.growth.target)));
  if (!lines.length) return null;
  const body = h('div.complexity-body', { hidden: !open }, lines, meta.bestKnown ? h('div.hint-text', {}, 'Source: kamyu104/LeetCode-Solutions (MIT). Our limits can differ from LeetCode’s.') : null);
  const toggle = h('button.btn-link', { type: 'button', 'aria-expanded': String(open) }, open ? 'Hide' : 'Show');
  toggle.addEventListener('click', () => {
    body.hidden = !body.hidden;
    toggle.setAttribute('aria-expanded', String(!body.hidden));
    toggle.textContent = body.hidden ? 'Show' : 'Hide';
  });
  return h('div.context-row', {}, h('div.context-label', {}, 'Complexity ', toggle), body);
}

function familyBlock(meta, titleOf) {
  const f = meta.family;
  if (!f) return null;
  return h(
    'div.context-row.family',
    {},
    h('div.context-label', {}, `Same idea, ${f.versions.length} versions: ${f.title}`),
    h(
      'ol.family-list',
      {},
      f.versions.map((v) => {
        const self = v.slug === f.self;
        const ours = v.contentId ? titleOf(v.contentId) : null;
        const name = self
          ? h('strong', {}, ours ?? v.title)
          : ours
            ? h('a.problem-link', { href: `#/problem/${v.contentId}` }, ours)
            : h('span.planned-title', { title: 'Not on the site yet' }, v.number ? `LeetCode ${v.number}: ${v.title}` : v.title);
        return h(
          `li.family-version${self ? '.is-self' : ''}`,
          { 'aria-current': self ? 'true' : null },
          h('div.family-name', {}, name, self ? h('span.tag.tag-live', {}, 'This version') : null, !self && !ours ? h('span.tag.tag-muted', {}, 'Not on the site yet') : null),
          h('div.family-twist', {}, v.twist),
          v.companies.length ? h('div.family-companies', {}, 'Asked at: ', v.companies.map((c) => c.name).join(', ')) : h('div.family-companies', {}, 'No company data'),
        );
      }),
    ),
  );
}

/**
 * @param {{ problem: any, progress: any, titleOf: (id: string) => string|null, showComplexity?: boolean, showFamily?: boolean }} opts
 * @returns {{ el: HTMLElement, ready: Promise<void> }}
 */
export function createProblemContext({ problem, progress, titleOf, showComplexity = true, showFamily = true }) {
  const el = h('section.problem-context', { 'aria-label': 'Companies and related versions' });
  // Logos are a garnish: without the manifest the chips are names, as before.
  const ready = Promise.all([loadProblemMeta(), loadLogoManifest(), loadCompanyPages()]).then(([all, logos, pages]) => {
    const meta = all[problem.id];
    if (!meta) return;
    el.replaceChildren(
      ...[
        companiesBlock(meta, logos, pages),
        showComplexity ? complexityBlock(meta, problem, complexityOpenByDefault(progress)) : null,
        showFamily ? familyBlock(meta, titleOf) : null,
      ].filter(Boolean),
    );
  });
  return { el, ready };
}
