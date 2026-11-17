/**
 * Problem families: problems that share one core solution idea, where each version changes
 * a single thing (sorted input, a circular array, parent pointers, k instead of 1...).
 *
 * The family is what a learner studies; the version is what they are shown. Someone preparing
 * for a specific company gets the version that company asks most, everyone else gets the
 * canonical one (the first member).
 *
 * Pure: no DOM, no I/O. Data lives in content/families.json.
 */

/**
 * @typedef {{ slug: string, twist: string }} FamilyMember
 * @typedef {{ id: string, title: string, members: FamilyMember[] }} Family
 */

/**
 * Structural checks against the problem index.
 * @param {Family[]} families
 * @param {Map<string, { wave: number|null }>} indexBySlug
 * @returns {string[]} errors, empty when valid
 */
export function validateFamilies(families, indexBySlug) {
  const errors = [];
  const ids = new Set();
  const owner = new Map();
  for (const f of families) {
    if (!/^[a-z0-9-]+$/.test(f.id)) errors.push(`${f.id}: bad family id`);
    if (ids.has(f.id)) errors.push(`${f.id}: duplicate family id`);
    ids.add(f.id);
    if (!f.title) errors.push(`${f.id}: missing title`);
    if (!Array.isArray(f.members) || f.members.length < 2) {
      errors.push(`${f.id}: a family needs at least 2 members`);
      continue;
    }
    for (const m of f.members) {
      if (!indexBySlug.has(m.slug)) errors.push(`${f.id}: ${m.slug} is not in the index`);
      if (!m.twist) errors.push(`${f.id}: ${m.slug} needs a twist`);
      if (owner.has(m.slug)) errors.push(`${f.id}: ${m.slug} already belongs to ${owner.get(m.slug)}`);
      owner.set(m.slug, f.id);
    }
    // The canonical version is the default for everyone, so it must be one we author.
    const canonical = indexBySlug.get(f.members[0].slug);
    if (canonical && canonical.wave === null) errors.push(`${f.id}: canonical ${f.members[0].slug} is not in the core bank`);
  }
  return errors;
}

/**
 * The version of a family to show someone preparing for `company`.
 * Picks the member that company asks most often; ties go to the earlier member, and with no
 * company signal (or no company) the canonical version wins.
 *
 * @param {Family} family
 * @param {string|null} company
 * @param {(slug: string, company: string) => number} frequencyOf 0 when the company never asks it
 * @param {(slug: string) => boolean} [isAvailable] limit to versions that are authored
 * @returns {string} slug
 */
export function pickVersion(family, company, frequencyOf, isAvailable = () => true) {
  const candidates = family.members.filter((m) => isAvailable(m.slug));
  if (!candidates.length) return family.members[0].slug;
  if (!company) return candidates[0].slug;
  let best = candidates[0].slug;
  let bestFreq = 0;
  for (const m of candidates) {
    const f = frequencyOf(m.slug, company);
    if (f > bestFreq) {
      best = m.slug;
      bestFreq = f;
    }
  }
  return best;
}

/**
 * Builds a frequency lookup from index records (each with `companies: {name, frequency}[]`).
 * @param {{ slug: string, companies: { name: string, frequency: number }[] }[]} records
 * @returns {(slug: string, company: string) => number}
 */
export function frequencyLookup(records) {
  const table = new Map();
  for (const r of records) table.set(r.slug, new Map(r.companies.map((c) => [c.name, c.frequency])));
  return (slug, company) => table.get(slug)?.get(company) ?? 0;
}

/**
 * Collapses the core bank into distinct problems: every family counts once (its versions are
 * the same problem), every problem outside a family counts once.
 * The representative is the first core member in family order (the canonical one when it is core).
 *
 * @param {Family[]} families
 * @param {{ slug: string, wave: number|null }[]} records
 * @returns {{ representative: string, versions: string[], family: string|null }[]}
 */
export function distinctProblems(families, records) {
  const core = new Map(records.filter((r) => r.wave !== null).map((r) => [r.slug, r]));
  const inFamily = new Set();
  const out = [];
  for (const f of families) {
    const versions = f.members.map((m) => m.slug).filter((s) => core.has(s));
    if (!versions.length) continue;
    versions.forEach((s) => inFamily.add(s));
    out.push({ representative: versions[0], versions, family: f.id });
  }
  for (const slug of core.keys()) {
    if (!inFamily.has(slug)) out.push({ representative: slug, versions: [slug], family: null });
  }
  return out;
}
