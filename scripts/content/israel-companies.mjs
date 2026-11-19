/**
 * Build-time Israel hiring step for the company lists: merges alias spellings (X/Twitter,
 * Snap/Snapchat...) into one company, attaches the Israel fields and sorts into display order.
 * build-meta.mjs bakes the result into src/js/data/company-sets.json, so the browser only filters
 * (src/js/data/israel-hiring.js).
 *
 * Data: content/israel-hiring.json (fields in content/israel-hiring.md). Pure: no DOM, no I/O.
 */

/** @typedef {'major'|'present'|'none'} IsraelLevel */
/** @typedef {{ israel: IsraelLevel, tier: 1|2|3, rankIL?: number, aliasOf?: string, unverified?: boolean }} HiringEntry */
/** @typedef {{ companies: Record<string, HiringEntry> }} Hiring */

const LEVEL_ORDER = { major: 0, present: 1, none: 2 };

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
 * Collapses alias spellings into one company and attaches the Israel fields. The spelling with
 * more tagged problems becomes the canonical one (ties: name order). Rows of the merged spellings
 * are unioned by problem, keeping the higher frequency.
 * @param {import('../../src/js/data/company-sets.js').CompanySet[]} companies
 * @param {Hiring|null|undefined} hiring
 * @returns {object[]} canonical companies in input order
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
      name: main.name,
      slug: main.slug,
      israeli: members.some((m) => m.israeli),
      total: members.reduce((n, m) => n + m.total, 0),
      rows,
      israel: level,
      tier: Math.min(...entries.map((e) => e.tier)),
      ...(ranks.length ? { rankIL: Math.min(...ranks) } : {}),
      aliases: others.map((m) => ({ name: m.name, slug: m.slug })),
    });
  }
  const order = new Map(companies.map((c, i) => [c.name, i]));
  return out.sort((a, b) => order.get(a.name) - order.get(b.name));
}

/**
 * Display order: Israel relevance, then prominence. Major by rankIL, tier, problem count; present
 * by tier, problem count; the rest the same. Name breaks ties so the order is stable.
 * @param {{ name: string, israel: IsraelLevel, tier: number, rankIL?: number, total: number }} a
 * @param {{ name: string, israel: IsraelLevel, tier: number, rankIL?: number, total: number }} b
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
 * @param {import('../../src/js/data/company-sets.js').CompanySets} sets output of buildCompanySets
 * @param {Hiring|null|undefined} hiring
 * @returns {{ problems: object[], companies: object[] }}
 */
export function applyIsrael(sets, hiring) {
  return { problems: sets.problems, companies: mergeAliases(sets.companies, hiring).sort(compareCompanies) };
}
