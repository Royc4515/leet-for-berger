/**
 * Fetch loader for the company sets JSON, shared by the companies pages, the interview setup,
 * the Problem Map's company lens and the command palette, without pulling any view module
 * (ADR 0008: views load per route).
 */

let setsPromise = null;

/**
 * Company data, fetched once per page load.
 * @returns {Promise<import('./company-sets.js').CompanySets|null>} null when the fetch fails
 */
export function loadSets() {
  setsPromise ??= fetch(new URL('./company-sets.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return setsPromise;
}

let topicsPromise = null;

/**
 * Taxonomy placement of every shipped problem (problem-topics.json), fetched once.
 * @returns {Promise<Record<string, import('./problem-topics.js').ProblemTopic>|null>}
 */
export function loadProblemTopics() {
  topicsPromise ??= fetch(new URL('./problem-topics.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return topicsPromise;
}

let manifestPromise = null;

/**
 * The logo manifest (company-logos.json, scripts/content/fetch-logos.mjs), fetched once: which
 * companies have a logo, and the other names companies go by.
 * @returns {Promise<{ logos: Record<string, { bleed: boolean, color: string|null }>, aliases?: Record<string, string> }|null>} null when the fetch fails
 */
export function loadLogoManifest() {
  manifestPromise ??= fetch(new URL('./company-logos.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  return manifestPromise;
}

/**
 * Which companies have a logo, fetched once.
 * @returns {Promise<Record<string, { bleed: boolean, color: string|null }>|null>} null when the fetch fails (monograms then)
 */
export function loadCompanyLogos() {
  return loadLogoManifest().then((d) => d?.logos ?? null);
}

/**
 * A company's slug from its name, the way company-sets.json makes them ("J.P. Morgan" ->
 * "j-p-morgan", "monday.com" -> "monday-com").
 * @param {string} name
 * @returns {string}
 */
export function slugifyCompany(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * A company's logo by its name, as problem data names it (which can be another name the company
 * goes by: "Snap" for Snapchat, "X" for Twitter).
 * @param {{ logos: Record<string, { bleed: boolean, color: string|null }>, aliases?: Record<string, string> }|null} manifest
 * @param {string} name
 * @returns {{ src: string, bleed: boolean, color: string|null }|null}
 */
export function companyLogoByName(manifest, name) {
  const slug = slugifyCompany(name);
  return companyLogo(manifest?.logos ?? null, manifest?.aliases?.[slug] ?? slug);
}

/**
 * A company's logo for companyMark(), or null for a monogram.
 * @param {Record<string, { bleed: boolean, color: string|null }>|null} logos
 * @param {string} slug
 * @returns {{ src: string, bleed: boolean, color: string|null }|null}
 */
export function companyLogo(logos, slug) {
  const logo = logos?.[slug];
  return logo ? { src: new URL(`../../brand/companies/${slug}.webp`, import.meta.url).href, bleed: logo.bleed, color: logo.color } : null;
}
