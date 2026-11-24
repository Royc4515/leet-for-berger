/**
 * Pure rules for finding and checking a company's careers page (scripts/content/check-careers.mjs).
 * No network here: the script fetches, these decide. Unit-tested in tests/company-careers.test.js.
 */

/**
 * Where a careers page usually lives on a company's own site, most likely first.
 * @param {string} domain e.g. "nvidia.com" (a "www." prefix is ignored)
 * @returns {string[]}
 */
export function careerCandidates(domain) {
  const d = String(domain).replace(/^www\./, '');
  return [`https://careers.${d}/`, `https://www.${d}/careers`, `https://jobs.${d}/`, `https://www.${d}/jobs`, `https://${d}/careers`, `https://www.${d}/company/careers`, `https://www.${d}/about/careers`];
}

const CAREERS_WORDS = /\b(careers?|jobs?|join (us|our team|the)|open (positions|roles)|opportunities|hiring|work with us|life at)\b|карьера|вакансии/i;
const NOT_FOUND = /\b(404|not found|page (doesn.?t|does not|cannot be) (exist|found)|no longer available)\b/i;

/**
 * Whether a fetched page is a careers page and not a soft 404 or a redirect to the home page.
 * A company's own careers domain (metacareers.com, lifeatspotify.com) may answer at its root; the
 * root of its main domain is its home page.
 * @param {{ status: number, finalUrl: string, html: string }} page
 * @param {string|null} [domain] the company's main domain
 * @returns {boolean}
 */
export function isCareersPage({ status, finalUrl, html }, domain = null) {
  if (status !== 200) return false;
  let url;
  try {
    url = new URL(finalUrl);
  } catch {
    return false;
  }
  const host = url.hostname.replace(/^www\./, '');
  const careersHost = /^(careers?|jobs|join|work|team|talent)\./i.test(host) || /careers|jobs/i.test(host.split('.')[0]);
  const mainSite = !domain || host === String(domain).replace(/^www\./, '');
  // Sent back to the home page: the path did not exist.
  if (!careersHost && mainSite && (url.pathname === '/' || url.pathname === '')) return false;
  // A sign-in wall is not a page a reader can use.
  if (/\/(log-?in|sign-?in|sso)\b/i.test(url.pathname)) return false;
  const text = String(html).slice(0, 200_000);
  const title = (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  if (NOT_FOUND.test(title)) return false;
  const heading = (text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '').replace(/<[^>]+>/g, ' ');
  return careersHost || CAREERS_WORDS.test(title) || CAREERS_WORDS.test(heading) || /\/(careers?|jobs|join|life-?at)/i.test(url.pathname);
}

/**
 * Puts each company's careers link on its entry in the company sets (scripts/content/build-meta.mjs).
 * @template {{ companies: Array<{ slug: string, careers?: string }> }} T
 * @param {T} sets
 * @param {{ careers: Record<string, string> }} data content/company-careers.json
 * @returns {T} the same sets, companies with a link carrying `careers`
 */
export function applyCareers(sets, data) {
  for (const c of sets.companies) if (data.careers[c.slug]) c.careers = data.careers[c.slug];
  return sets;
}
