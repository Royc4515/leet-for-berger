/**
 * Israel hiring relevance for company lists: filter, search and lookup.
 *
 * The alias merge and the display order are baked into company-sets.json at build time
 * (scripts/content/israel-companies.mjs), so this module only filters. Pure: no DOM, no I/O.
 */

/** @typedef {'major'|'present'|'none'} IsraelLevel */
/**
 * A company-sets company plus its Israel fields. `aliases` lists the other spellings merged into it.
 * @typedef {import('./company-sets.js').CompanySet & { israel: IsraelLevel, tier: number, rankIL?: number, aliases: { name: string, slug: string }[] }} RankedCompany
 */

/** Filter options of the company lists, in display order. */
export const ISRAEL_FILTERS = [
  { id: 'hiring', label: 'Hiring in Israel' },
  { id: 'top', label: 'Top in Israel' },
  { id: 'all', label: 'All' },
];
export const DEFAULT_ISRAEL_FILTER = 'hiring';

const BADGES = { major: 'Major in Israel', present: 'Israel office', none: '' };

/**
 * Short label for the badge on a company card; empty when the company does not hire in Israel.
 * @param {IsraelLevel} level
 * @returns {string}
 */
export function israelBadge(level) {
  return BADGES[level] ?? '';
}

/**
 * Companies passing the Israel filter and the search (name or an alias spelling), order preserved.
 * @param {RankedCompany[]} ranked companies from company-sets.json, already in display order
 * @param {{ filter?: string, query?: string }} [opts]
 * @returns {RankedCompany[]}
 */
export function filterRanked(ranked, { filter = DEFAULT_ISRAEL_FILTER, query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return ranked.filter((c) => {
    if (filter === 'top' && c.israel !== 'major') return false;
    if (filter === 'hiring' && c.israel === 'none') return false;
    return !q || [c.name, ...c.aliases.map((a) => a.name)].some((n) => n.toLowerCase().includes(q));
  });
}

/**
 * Finds a company page by slug, also when the slug belongs to a merged alias (old links keep working).
 * @param {RankedCompany[]} ranked
 * @param {string} slug
 * @returns {RankedCompany|undefined}
 */
export function findBySlug(ranked, slug) {
  return ranked.find((c) => c.slug === slug || c.aliases.some((a) => a.slug === slug));
}
