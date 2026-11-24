#!/usr/bin/env node
/**
 * Finds and checks each company's careers page (content/company-careers.json), shown as a link
 * on its company page (owner's request).
 *
 * For a company with no entry, --discover tries the usual places on its own domain
 * (careerCandidates in careers-pick.mjs) and keeps the first that is a real careers page: a 200,
 * not a redirect to the home page, not a soft 404, careers words in its title or heading. With
 * --write the found ones are saved (the address tried, which the company keeps redirecting to
 * wherever its job board lives). Every saved entry is checked again on each run; a site that
 * turns away scripts is listed under `blocked` (its address was confirmed by a web search
 * instead) and reported as unchecked rather than broken.
 *
 * The Israel job searches (`israel`) are checked too: a search page often draws its results with
 * script, so one that answers 200 without careers words is reported for a look, not as broken.
 *
 * Usage: node scripts/content/check-careers.mjs [--discover] [--write] [--only=slug,slug]
 * Runs by hand; the site reads the result through scripts/content/build-meta.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { careerCandidates, isCareersPage } from './careers-pick.mjs';

const ROOT = new URL('../../', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const FILE = 'content/company-careers.json';

const domains = read('content/company-domains.json').domains;
const data = read(FILE);
const only = args.only ? new Set(args.only.split(',')) : null;
const slugs = Object.keys(domains).filter((s) => !only || only.has(s));

// A plain, honest client name: no browser disguise, no project details.
const HEADERS = { 'user-agent': 'Mozilla/5.0 (compatible; link-check/1.0)', accept: 'text/html,*/*;q=0.8', 'accept-language': 'en' };

async function fetchPage(url) {
  try {
    const r = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const html = (r.headers.get('content-type') ?? '').includes('html') ? await r.text() : '';
    return { status: r.status, finalUrl: r.url || url, html };
  } catch (e) {
    return { status: 0, finalUrl: url, html: '', error: e.cause?.code ?? e.name };
  }
}

async function check(slug) {
  const domain = domains[slug];
  if (!domain) return { slug, state: 'no-domain' };
  const saved = data.careers[slug];
  if (saved) {
    const page = await fetchPage(saved);
    if (isCareersPage(page, domain)) return { slug, state: 'ok', url: saved };
    if (data.blocked.includes(slug)) return { slug, state: 'blocked', url: saved, status: page.status };
    return { slug, state: 'broken', url: saved, status: page.status || page.error };
  }
  if (!args.discover || data.unconfirmed.includes(slug)) return { slug, state: data.unconfirmed.includes(slug) ? 'unconfirmed' : 'missing' };
  const tried = [];
  for (const url of careerCandidates(domain)) {
    const page = await fetchPage(url);
    tried.push(`${url} ${page.status || page.error}`);
    // The company's own address, not where it redirects today: a job board's path changes, the
    // company's entry point stays.
    if (isCareersPage(page, domain)) return { slug, state: 'found', url };
  }
  return { slug, state: 'missing', tried };
}

// A few at a time: polite to the sites, and quick enough for 193 companies.
const results = [];
const queue = [...slugs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));
results.sort((a, b) => a.slug.localeCompare(b.slug));

const by = (state) => results.filter((r) => r.state === state);
for (const r of by('broken')) console.log(`broken  ${r.slug}: ${r.url} (${r.status})`);
for (const r of by('missing')) console.log(`missing ${r.slug}${r.tried ? `\n  ${r.tried.join('\n  ')}` : ''}`);
for (const r of by('found')) console.log(`found   ${r.slug}: ${r.url}`);
console.log(`\n${by('ok').length} ok, ${by('found').length} found, ${by('blocked').length} blocked (search-confirmed), ${by('broken').length} broken, ${by('missing').length} missing, ${by('unconfirmed').length} unconfirmed`);

// The Israel searches: a 404, an error or a redirect home is broken; a 200 is fine.
const israel = Object.entries(data.israel ?? {}).filter(([slug]) => !only || only.has(slug));
const ilQueue = [...israel];
const ilResults = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (ilQueue.length) {
    const [slug, url] = ilQueue.shift();
    const page = await fetchPage(url);
    ilResults.push({ slug, url, status: page.status || page.error, careers: isCareersPage(page, null) });
  }
}));
for (const r of ilResults.sort((a, b) => a.slug.localeCompare(b.slug))) if (r.status !== 200 || !r.careers) console.log(`israel  ${r.slug}: ${r.url} (${r.status}${r.status === 200 ? ', no careers words: check it by eye' : ''})`);
if (israel.length) console.log(`${ilResults.filter((r) => r.status === 200).length} of ${israel.length} Israel searches answer 200`);

if (args.write) {
  for (const r of by('found')) data.careers[r.slug] = r.url;
  data.careers = Object.fromEntries(Object.entries(data.careers).sort(([a], [b]) => a.localeCompare(b)));
  data.blocked = [...new Set(data.blocked)].sort();
  writeFileSync(new URL(FILE, ROOT), JSON.stringify(data, null, 1) + '\n');
  console.log(`saved ${FILE}`);
}
