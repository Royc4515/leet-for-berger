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

let logosPromise = null;

/**
 * Which companies have a logo (company-logos.json, scripts/content/fetch-logos.mjs), fetched once.
 * @returns {Promise<Record<string, { bleed: boolean, color: string|null }>|null>} null when the fetch fails (monograms then)
 */
export function loadCompanyLogos() {
  logosPromise ??= fetch(new URL('./company-logos.json', import.meta.url))
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.logos ?? null)
    .catch(() => null);
  return logosPromise;
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
