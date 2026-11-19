/**
 * Israel hiring relevance for company lists: ordering, filtering, alias merging.
 *
 * Data: content/israel-hiring.json (fields in content/israel-hiring.md), passed in as `hiring`
 * so this module stays pure: no DOM, no I/O, no clock.
 */

/** @typedef {'major'|'present'|'none'} IsraelLevel */
/** @typedef {{ israel: IsraelLevel, tier: 1|2|3, rankIL?: number, aliasOf?: string, unverified?: boolean }} HiringEntry */
/** @typedef {{ companies: Record<string, HiringEntry> }} Hiring */
/**
 * A company-sets company plus its Israel fields. `aliases` lists the other spellings merged into it.
 * @typedef {import('./company-sets.js').CompanySet & { israel: IsraelLevel, tier: number, rankIL: number|null, aliases: string[], aliasSlugs: string[] }} RankedCompany
 */

/** Filter options of the company lists, in display order. */
export const ISRAEL_FILTERS = [
  { id: 'hiring', label: 'Hiring in Israel' },
  { id: 'top', label: 'Top in Israel' },
  { id: 'all', label: 'All' },
];
export const DEFAULT_ISRAEL_FILTER = 'hiring';

const LEVEL_ORDER = { major: 0, present: 1, none: 2 };
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
 * @param {Hiring|null|undefined} hiring
 * @param {string} name
 * @returns {HiringEntry}
 */
export function entryOf(hiring, name) {
  // Unknown companies default to the safest reading: no Israeli hiring, lowest tier.
  return hiring?.companies?.[name] ?? { israel: 'none', tier: 3 };
}

/**
 * Collapses alias spellings (X/Twitter, Snap/Snapchat...) into one company and attaches the Israel
 * fields. The spelling with more tagged problems becomes the canonical one (ties: name order).
 * Rows of the merged spellings are unioned by problem, keeping the higher frequency.
 * @param {import('./company-sets.js').CompanySet[]} companies
 * @param {Hiring|null|undefined} hiring
 * @returns {RankedCompany[]} in input order, canonical companies only
 */
export function mergeAliases(companies, hiring) {
  const byName = new Map(companies.map((c) => [c.name, c]));
  // Union-find over aliasOf links; the data lists links both ways but one way is enough.
  const parent = new Map(companies.map((c) => [c.name, c.name]));
  const find = (n) => {
    while (parent.get(n) !== n) n = parent.get(n);
    return n;
  };
  for (const c of companies) {
    const target = entryOf(hiring, c.name).aliasOf;
    if (target && byName.has(target)) parent.set(find(c.name), find(target));
  }
  const groups = new Map();
  for (const c of companies) {
    const root = find(c.name);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(c);
  }
  const better = (a, b) => b.total - a.total || a.name.localeCompare(b.name);
  const out = [];
  for (const members of groups.values()) {
    const [main, ...others] = [...members].sort(better);
    const entries = members.map((m) => entryOf(hiring, m.name));
    const level = entries.reduce((best, e) => (LEVEL_ORDER[e.israel] < LEVEL_ORDER[best] ? e.israel : best), 'none');
    const ranks = entries.map((e) => e.rankIL).filter((r) => r !== undefined);
    let rows = main.rows;
    if (others.length) {
      const byProblem = new Map();
      for (const r of members.flatMap((m) => m.rows)) {
        const prev = byProblem.get(r[0]);
        if (!prev || r[1] > prev[1]) byProblem.set(r[0], r);
      }
      rows = [...byProblem.values()].sort((a, b) => b[1] - a[1]);
    }
    out.push({
      ...main,
      rows,
      total: members.reduce((n, m) => n + m.total, 0),
      israeli: members.some((m) => m.israeli),
      israel: level,
      tier: Math.min(...entries.map((e) => e.tier)),
      rankIL: ranks.length ? Math.min(...ranks) : null,
      aliases: others.map((m) => m.name),
      aliasSlugs: others.map((m) => m.slug),
    });
  }
  const order = new Map(companies.map((c, i) => [c.name, i]));
  return out.sort((a, b) => order.get(a.name) - order.get(b.name));
}

/**
 * Display order: Israel relevance, then prominence. Major by rankIL, tier, problem count; present
 * by tier, problem count; the rest the same. Name breaks ties so the order is stable.
 * @param {RankedCompany} a
 * @param {RankedCompany} b
 * @returns {number}
 */
export function compareCompanies(a, b) {
  return (
    LEVEL_ORDER[a.israel] - LEVEL_ORDER[b.israel] ||
    (a.israel === 'major' ? (a.rankIL ?? Infinity) - (b.rankIL ?? Infinity) || 0 : 0) ||
    a.tier - b.tier ||
    b.total - a.total ||
    a.name.localeCompare(b.name)
  );
}

/**
 * Merge aliases, attach Israel fields and sort for display.
 * @param {import('./company-sets.js').CompanySet[]} companies
 * @param {Hiring|null|undefined} hiring
 * @returns {RankedCompany[]}
 */
export function rankCompanies(companies, hiring) {
  return mergeAliases(companies, hiring).sort(compareCompanies);
}

/**
 * Companies passing the Israel filter and the search (name or an alias spelling), order preserved.
 * @param {RankedCompany[]} ranked output of rankCompanies
 * @param {{ filter?: string, query?: string }} [opts]
 * @returns {RankedCompany[]}
 */
export function filterRanked(ranked, { filter = DEFAULT_ISRAEL_FILTER, query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return ranked.filter((c) => {
    if (filter === 'top' && c.israel !== 'major') return false;
    if (filter === 'hiring' && c.israel === 'none') return false;
    return !q || [c.name, ...c.aliases].some((n) => n.toLowerCase().includes(q));
  });
}

/**
 * Finds a company page by slug, also when the slug belongs to a merged alias.
 * @param {RankedCompany[]} ranked
 * @param {string} slug
 * @returns {RankedCompany|undefined}
 */
export function findBySlug(ranked, slug) {
  return ranked.find((c) => c.slug === slug || c.aliasSlugs.includes(slug));
}
