/**
 * Per-problem context shown on the problem page: which companies ask it, the best known
 * complexity of the LeetCode version, and the other versions of the same idea (its family).
 *
 * Built at content time from the index (scripts/content/build-meta.mjs) into
 * src/js/data/problem-meta.json, for shipped problems only, so the page never loads the 3 MB index.
 *
 * Pure: no DOM, no I/O.
 */

const RECENCY_RANK = { '30d': 0, '3m': 1, '6m': 2, older: 3 };

/** Companies kept per problem; the page shows the top ones and the total count. */
export const COMPANY_LIMIT = 30;

/**
 * @typedef {{ name: string, frequency: number, recency: string, israeli?: true }} CompanyTag
 * @typedef {{ slug: string, number: number|null, title: string, twist: string, contentId: string|null, companies: CompanyTag[] }} FamilyVersion
 * @typedef {{ number: number|null, url: string|null, companies: CompanyTag[], companyCount: number,
 *   bestKnown: { time: string, space: string|null }|null,
 *   family: { id: string, title: string, self: string, versions: FamilyVersion[] }|null }} ProblemMeta
 */

/**
 * How many problems each company has tagged in the index. Frequency is relative within one
 * company (its most asked problem is 100), so a company with three tagged problems scores 100 as
 * easily as Google; weighting by this count puts the companies with real data first.
 * @param {{ companies?: { name: string }[] }[]} records
 * @returns {Map<string, number>}
 */
export function companySizes(records) {
  const sizes = new Map();
  for (const r of records) for (const c of r.companies ?? []) sizes.set(c.name, (sizes.get(c.name) ?? 0) + 1);
  return sizes;
}

/**
 * Companies by frequency weighted by company size, then recency, cut to `limit` except Israeli
 * ones, which are flagged so the UI can mark them.
 * @param {{ name: string, frequency: number, recency: string }[]} companies
 * @param {Set<string>} israeli
 * @param {number} [limit]
 * @param {Map<string, number>} [sizes] from companySizes; without it every company weighs the same
 * @returns {CompanyTag[]}
 */
export function rankCompanies(companies = [], israeli = new Set(), limit = Infinity, sizes = new Map()) {
  const score = (c) => c.frequency * Math.log10(1 + (sizes.get(c.name) ?? 9));
  const ranked = [...companies].sort((a, b) => score(b) - score(a) || (RECENCY_RANK[a.recency] ?? 9) - (RECENCY_RANK[b.recency] ?? 9) || a.name.localeCompare(b.name));
  // Israeli companies survive the cut: practicing for them is a core use of the site.
  const kept = ranked.filter((c, i) => i < limit || israeli.has(c.name));
  return kept
    .map((c) => ({ name: c.name, frequency: Math.round(c.frequency), recency: c.recency, ...(israeli.has(c.name) ? { israeli: true } : {}) }));
}

/**
 * @param {object[]} records index records (content/index/problems.json)
 * @param {{ id: string, title: string, members: { slug: string, twist: string }[] }[]} families
 * @param {Record<string, { time: string|null, space: string|null }>} complexity keyed by LeetCode number
 * @param {string[]} israeliNames
 * @returns {Record<string, ProblemMeta>} keyed by our problem id (contentId)
 */
export function buildProblemMeta(records, families, complexity, israeliNames) {
  const israeli = new Set(israeliNames);
  const sizes = companySizes(records);
  const bySlug = new Map(records.map((r) => [r.slug, r]));
  const familyOf = new Map();
  for (const f of families) for (const m of f.members) familyOf.set(m.slug, f);

  /** @type {Record<string, ProblemMeta>} */
  const out = {};
  for (const r of records) {
    if (!r.contentId || out[r.contentId]) continue;
    const ck = r.platform === 'leetcode' && r.number ? complexity[r.number] : null;
    const f = familyOf.get(r.slug);
    out[r.contentId] = {
      number: r.platform === 'leetcode' ? r.number ?? null : null,
      url: r.url ?? null,
      companies: rankCompanies(r.companies, israeli, COMPANY_LIMIT, sizes),
      companyCount: r.companyCount ?? (r.companies?.length ?? 0),
      bestKnown: ck?.time ? { time: ck.time, space: ck.space ?? null } : null,
      family: f
        ? {
            id: f.id,
            title: f.title,
            self: r.slug,
            versions: f.members.map((m) => {
              const v = bySlug.get(m.slug);
              return {
                slug: m.slug,
                number: v?.platform === 'leetcode' ? v.number ?? null : null,
                title: v?.title ?? m.slug,
                twist: m.twist,
                contentId: v?.contentId ?? null,
                // Three is enough to tell versions apart; the full list is on that version's own page.
                companies: rankCompanies(v?.companies, new Set(), 3, sizes),
              };
            }),
          }
        : null,
    };
  }
  return out;
}

/**
 * Which complexity to show. Before the first Accepted it stays behind a toggle, since the
 * target is a strong hint (docs/PLAN.md decision log).
 * @param {{ status?: string }|undefined} progress this problem's progress entry
 * @returns {boolean} true when shown without a click
 */
export function complexityOpenByDefault(progress) {
  return progress?.status === 'solved';
}
