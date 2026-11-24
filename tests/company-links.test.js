// Company links (owner's request): a problem's company chips open the company's page, and each
// company page links to the company's careers site. The rules for finding a careers page are pure
// (scripts/content/careers-pick.mjs); the shipped data must cover every company and stay in sync.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { careerCandidates, isCareersPage, applyCareers } from '../scripts/content/careers-pick.mjs';
import { companyPageSlug, slugifyCompany } from '../src/js/data/company-loader.js';

const page = (finalUrl, title, h1 = '', status = 200) => ({ status, finalUrl, html: `<html><head><title>${title}</title></head><body><h1>${h1}</h1></body></html>` });

test('careers candidates: the usual places on the company domain, most likely first', () => {
  const c = careerCandidates('www.example.com');
  assert.equal(c[0], 'https://careers.example.com/');
  assert.ok(c.includes('https://www.example.com/careers'));
  assert.ok(c.includes('https://jobs.example.com/'));
  assert.ok(c.every((u) => u.startsWith('https://') && u.includes('example.com')));
});

test('a careers page: real answers pass, soft 404s, home page redirects and sign-in walls do not', () => {
  assert.ok(isCareersPage(page('https://www.example.com/careers', 'Careers at Example'), 'example.com'));
  assert.ok(isCareersPage(page('https://careers.example.com/', 'Example'), 'example.com'));
  assert.ok(isCareersPage(page('https://www.example.com/join/overview/', 'Overview', 'Work where your mind matters'), 'example.com'));
  // Its own careers domain answers at the root.
  assert.ok(isCareersPage(page('https://www.lifeatexample.com/', 'Join the Band | Life at Example'), 'example.com'));
  assert.ok(isCareersPage(page('https://www.examplecareers.com/', 'Search Jobs'), 'example.com'));
  assert.ok(isCareersPage(page('https://team.example.ru/', 'Карьера'), 'example.ru'));
  // Sent home, not found, behind a login, or an error.
  assert.ok(!isCareersPage(page('https://www.example.com/', 'Example: the best product'), 'example.com'));
  assert.ok(!isCareersPage(page('https://www.example.com/careers', 'Page not found'), 'example.com'));
  assert.ok(!isCareersPage(page('https://careers.example.com/login', 'Careers'), 'example.com'));
  assert.ok(!isCareersPage(page('https://www.example.com/careers', 'Careers', '', 403), 'example.com'));
  assert.ok(!isCareersPage(page('https://www.example.com/us/', 'Payments for banks'), 'example.com'));
});

test('a company name finds its page, through an alias; a company without a set has none', () => {
  const pages = { slugs: ['google', 'snapchat', 'j-p-morgan'], aliases: { snap: 'snapchat' } };
  assert.equal(companyPageSlug(pages, 'Google'), 'google');
  assert.equal(companyPageSlug(pages, 'Snap'), 'snapchat');
  assert.equal(companyPageSlug(pages, 'J.P. Morgan'), 'j-p-morgan');
  assert.equal(companyPageSlug(pages, 'Tiny Startup'), null);
  assert.equal(companyPageSlug(null, 'Google'), null);
});

/* ---------- The shipped data ---------- */

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const careers = read('content/company-careers.json');
const sets = read('src/js/data/company-sets.json');
const pages = read('src/js/data/company-pages.json');
const domains = read('content/company-domains.json').domains;

test('every company has a careers link, or is listed as unconfirmed, or is kept out on purpose', () => {
  for (const c of sets.companies) {
    const has = Boolean(careers.careers[c.slug]);
    const unconfirmed = careers.unconfirmed.includes(c.slug);
    const keptOut = domains[c.slug] === null;
    assert.equal([has, unconfirmed, keptOut].filter(Boolean).length, 1, `${c.slug}: exactly one of link, unconfirmed, kept out`);
  }
  for (const slug of [...Object.keys(careers.careers), ...careers.blocked, ...careers.unconfirmed]) assert.ok(sets.companies.some((c) => c.slug === slug), `${slug} is not a company`);
  for (const slug of careers.blocked) assert.ok(careers.careers[slug], `${slug} is blocked but has no link`);
});

test('careers links are https addresses with no tracking query', () => {
  for (const [slug, url] of Object.entries(careers.careers)) {
    const u = new URL(url);
    assert.equal(u.protocol, 'https:', slug);
    assert.equal(u.search, '', `${slug} keeps a query`);
    assert.equal(u.hash, '', `${slug} keeps a fragment`);
  }
});

test('the company sets carry the careers links (scripts/content/build-meta.mjs was run)', () => {
  for (const c of sets.companies) {
    assert.equal(c.careers ?? null, careers.careers[c.slug] ?? null, c.slug);
    assert.equal(c.careersIL ?? null, careers.israel[c.slug] ?? null, c.slug);
  }
});

test('applyCareers adds the careers site and, where there is one, the Israel search', () => {
  const out = applyCareers({ companies: [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }] }, { careers: { a: 'https://a.com/careers', b: 'https://b.com/jobs' }, israel: { a: 'https://a.com/jobs?country=Israel' } });
  assert.deepEqual(out.companies, [{ slug: 'a', careers: 'https://a.com/careers', careersIL: 'https://a.com/jobs?country=Israel' }, { slug: 'b', careers: 'https://b.com/jobs' }, { slug: 'c' }]);
});

test('Israel job searches: only for companies that hire engineers in Israel, https, no fragment', () => {
  const inIsrael = new Set(sets.companies.filter((c) => c.israel === 'major' || c.israel === 'present').map((c) => c.slug));
  for (const [slug, url] of Object.entries(careers.israel)) {
    assert.ok(inIsrael.has(slug), `${slug} has an Israel search but no Israeli engineering hiring on record`);
    const u = new URL(url);
    assert.equal(u.protocol, 'https:', slug);
    assert.equal(u.hash, '', `${slug} keeps a fragment`);
  }
});

test('the company page index lists every company and its aliases, and names map to them', () => {
  assert.deepEqual(pages.slugs, sets.companies.map((c) => c.slug).sort());
  const aliases = Object.fromEntries(sets.companies.flatMap((c) => c.aliases.map((a) => [a.slug, c.slug])));
  assert.deepEqual(pages.aliases, aliases);
  for (const c of sets.companies) {
    assert.equal(companyPageSlug(pages, c.name), c.slug, c.name);
    for (const a of c.aliases) assert.equal(companyPageSlug(pages, a.name), c.slug, a.name);
  }
  assert.ok(JSON.stringify(pages).length < 4096, 'company-pages.json stays small: the problem page loads it');
  assert.equal(slugifyCompany('Snap'), 'snap');
});
