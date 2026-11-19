import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyIsrael } from '../scripts/content/israel-companies.mjs';
import { filterRanked, findBySlug, israelBadge, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../src/js/data/israel-hiring.js';
import { companySlug } from '../src/js/data/company-sets.js';

const co = (name, total, rows = []) => ({ name, slug: companySlug(name), israeli: false, total, rows });
const hiring = {
  companies: {
    Nvidia: { israel: 'major', tier: 1, rankIL: 1 },
    Wix: { israel: 'major', tier: 2 },
    Google: { israel: 'major', tier: 1 },
    Microsoft: { israel: 'major', tier: 1 },
    Okta: { israel: 'present', tier: 2 },
    Zeta: { israel: 'present', tier: 3 },
    Uber: { israel: 'none', tier: 1 },
    Acme: { israel: 'none', tier: 3 },
    Snap: { israel: 'present', tier: 2, aliasOf: 'Snapchat' },
    Snapchat: { israel: 'present', tier: 2, aliasOf: 'Snap' },
    Twitter: { israel: 'none', tier: 2, aliasOf: 'X' },
    X: { israel: 'none', tier: 2, aliasOf: 'Twitter' },
  },
};
const companies = [
  co('Acme', 500), co('Uber', 300), co('Zeta', 90), co('Okta', 40), co('Wix', 50), co('Google', 400),
  co('Microsoft', 200), co('Nvidia', 20), co('Snap', 30, [[1, 50, 0, 1, 1], [2, 40, 0, 2, 1]]),
  co('Snapchat', 10, [[2, 70, 0, 2, 1], [3, 30, 0, 3, 1]]), co('Twitter', 60), co('X', 5),
];
/** What build-meta bakes into company-sets.json; the browser only ever sees this shape. */
const rankCompanies = (list, h) => applyIsrael({ problems: [], companies: list }, h).companies;
const names = (list) => list.map((c) => c.name);

test('order: major by rankIL then tier then size, then present, then the rest', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.deepEqual(names(ranked), ['Nvidia', 'Google', 'Microsoft', 'Wix', 'Okta', 'Snap', 'Zeta', 'Uber', 'Twitter', 'Acme']);
});

test('companies that do not hire in Israel sort below present ones whatever their size or tier', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.ok(ranked.findIndex((c) => c.name === 'Uber') > ranked.findIndex((c) => c.name === 'Zeta'));
});

test('filters: hiring is major + present, top is major only, all keeps everyone', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.equal(DEFAULT_ISRAEL_FILTER, 'hiring');
  assert.deepEqual(ISRAEL_FILTERS.map((f) => f.id), ['hiring', 'top', 'all']);
  assert.deepEqual(names(filterRanked(ranked, { filter: 'hiring' })), ['Nvidia', 'Google', 'Microsoft', 'Wix', 'Okta', 'Snap', 'Zeta']);
  assert.deepEqual(names(filterRanked(ranked, { filter: 'top' })), ['Nvidia', 'Google', 'Microsoft', 'Wix']);
  assert.equal(filterRanked(ranked, { filter: 'all' }).length, ranked.length);
});

test('search combines with the filter and matches case-insensitively', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.deepEqual(names(filterRanked(ranked, { filter: 'all', query: ' WIX' })), ['Wix']);
  assert.deepEqual(names(filterRanked(ranked, { filter: 'top', query: 'okta' })), []);
});

test('rankIL is written only when the data has one', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.equal(ranked.find((c) => c.name === 'Nvidia').rankIL, 1);
  assert.equal('rankIL' in ranked.find((c) => c.name === 'Wix'), false);
});

test('aliases collapse into one company: bigger spelling wins, rows merge, search finds the alias', () => {
  const ranked = rankCompanies(companies, hiring);
  assert.equal(ranked.filter((c) => /^snap/i.test(c.name)).length, 1);
  const snap = ranked.find((c) => c.name === 'Snap');
  assert.deepEqual(snap.aliases, [{ name: 'Snapchat', slug: 'snapchat' }]);
  assert.equal(snap.total, 40);
  // Problem 2 appears in both: the higher frequency (70) is kept; rows sorted by frequency.
  assert.deepEqual(snap.rows.map((r) => [r[0], r[1]]), [[2, 70], [1, 50], [3, 30]]);
  const twitter = ranked.find((c) => c.name === 'Twitter');
  assert.deepEqual(twitter.aliases, [{ name: 'X', slug: 'x' }]);
  assert.deepEqual(names(filterRanked(ranked, { filter: 'all', query: 'snapchat' })), ['Snap']);
  assert.equal(findBySlug(ranked, 'snapchat').name, 'Snap');
  assert.equal(findBySlug(ranked, 'snap').name, 'Snap');
  assert.equal(findBySlug(ranked, 'nope'), undefined);
});

test('a company missing from the data counts as none, tier 3', () => {
  const [c] = rankCompanies([co('Unknown', 12)], hiring);
  assert.equal(c.israel, 'none');
  assert.equal(c.tier, 3);
  assert.equal('rankIL' in c, false);
});

test('without hiring data nothing is lost, everything is none', () => {
  const ranked = rankCompanies(companies, null);
  assert.equal(ranked.length, companies.length);
  assert.ok(ranked.every((c) => c.israel === 'none'));
});

test('badges', () => {
  assert.equal(israelBadge('major'), 'Major in Israel');
  assert.equal(israelBadge('present'), 'Israel office');
  assert.equal(israelBadge('none'), '');
});

test('real data: the first company is Nvidia and every shown card is major or present', () => {
  const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
  const ranked = read('src/js/data/company-sets.json').companies;
  assert.equal(ranked[0].name, 'Nvidia');
  assert.equal(ranked[0].israel, 'major');
  const hiringList = filterRanked(ranked, { filter: 'hiring' });
  assert.ok(hiringList.length > 20 && hiringList.length < ranked.length);
  // Aliases never appear twice, and old alias URLs still resolve.
  const all = ranked.flatMap((c) => [c.name, ...c.aliases.map((a) => a.name)]);
  assert.equal(new Set(all).size, all.length);
  assert.equal(findBySlug(ranked, 'snap')?.name, findBySlug(ranked, 'snapchat')?.name);
});
