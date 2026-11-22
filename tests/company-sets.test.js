import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyIsrael } from '../scripts/content/israel-companies.mjs';
import { companySlug, buildCompanySets, expandRows, filterCompanies, companyProgress, monogram, frequencyLevel, MIN_PROBLEMS, PER_COMPANY } from '../src/js/data/company-sets.js';

const rec = (slug, number, companies, extra = {}) => ({ slug, number, platform: 'leetcode', title: slug, difficulty: 'Easy', contentId: null, companies, ...extra });
const ask = (name, frequency, recency = '6m') => ({ name, frequency, recency });
// Enough filler problems that BigCo passes MIN_PROBLEMS.
const filler = Array.from({ length: MIN_PROBLEMS }, (_, i) => rec(`filler-${i}`, 1000 + i, [ask('BigCo', 1)]));

test('companySlug makes URL-safe ids', () => {
  assert.equal(companySlug('monday.com'), 'monday-com');
  assert.equal(companySlug('Check Point'), 'check-point');
  assert.equal(companySlug('  Goldman Sachs!! '), 'goldman-sachs');
});

test('buildCompanySets: one row per family, most asked version first, practice falls back to a shipped sibling', () => {
  const records = [
    rec('two-sum', 1, [ask('BigCo', 40)], { contentId: 'pair-sum-target' }),
    rec('two-sum-ii', 167, [ask('BigCo', 90, '30d')]),
    rec('lonely', 2, [ask('BigCo', 60)]),
    rec('wix-only', 3, [ask('Wix', 50)], { contentId: 'wix-problem' }),
    rec('tiny', 4, [ask('TinyCo', 99)]),
    ...filler,
  ];
  const families = [{ id: 'pair', members: [{ slug: 'two-sum' }, { slug: 'two-sum-ii' }] }];
  const sets = buildCompanySets(records, families, ['Wix']);

  assert.deepEqual(sets.companies.map((c) => c.name), ['BigCo', 'Wix'], 'TinyCo is below the minimum, Wix is kept as Israeli');
  const big = sets.companies[0];
  const rows = expandRows(sets, big);
  assert.equal(rows[0].problem.slug, 'two-sum-ii', 'the version BigCo asks most');
  assert.equal(rows[0].practice.contentId, 'pair-sum-target');
  assert.equal(rows[0].similar, true);
  assert.equal(rows[0].versions, 2);
  assert.equal(rows[0].recency, '30d');
  assert.equal(rows[1].problem.slug, 'lonely');
  assert.equal(rows[1].practice, null);
  assert.equal(rows.filter((r) => r.problem.slug === 'two-sum').length, 0, 'the second version folds into the family row');
  assert.equal(big.total, 3 + MIN_PROBLEMS);

  const wix = expandRows(sets, sets.companies[1]);
  assert.equal(wix[0].similar, false);
  assert.equal(sets.companies[1].israeli, true);
});

test('filterCompanies and companyProgress', () => {
  const companies = [{ name: 'Google', israeli: false }, { name: 'Wix', israeli: true }];
  assert.deepEqual(filterCompanies(companies, 'goo').map((c) => c.name), ['Google']);
  assert.deepEqual(filterCompanies(companies, '', { israeliOnly: true }).map((c) => c.name), ['Wix']);
  const rows = [{ practice: { contentId: 'a' } }, { practice: { contentId: 'b' } }, { practice: null }];
  assert.deepEqual(companyProgress(rows, (id) => id === 'a'), { onSite: 2, solved: 1 });
});

test('company-sets.json is fresh and within limits', () => {
  const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
  const raw = read('../content/index/problems.json');
  const records = Array.isArray(raw) ? raw : raw.problems;
  const rebuilt = applyIsrael(buildCompanySets(records, read('../content/families.json').families, read('../content/companies.json').israeli), read('../content/israel-hiring.json'));
  assert.deepEqual(read('../src/js/data/company-sets.json'), rebuilt, 'run: node scripts/content/build-meta.mjs');
  // A merged alias group unions the rows of its spellings, so the cap applies per spelling.
  for (const c of rebuilt.companies) assert.ok(c.rows.length <= PER_COMPANY * (1 + c.aliases.length), c.name);
  assert.equal(new Set(rebuilt.companies.map((c) => c.slug)).size, rebuilt.companies.length, 'company slugs are unique');
});

test('monogram: two letters from the name, for the company option card', () => {
  assert.equal(monogram('Nvidia'), 'Nv');
  assert.equal(monogram('Check Point'), 'CP');
  assert.equal(monogram('Palo Alto Networks'), 'PA');
  assert.equal(monogram('J.P. Morgan'), 'JM');
  assert.equal(monogram('monday.com'), 'Mo');
  assert.equal(monogram('IBM'), 'IB');
  assert.equal(monogram('X'), 'X');
  assert.equal(monogram('  '), '?');
});

test('frequencyLevel: a 0-100 frequency becomes a 3-step meter with a word', () => {
  assert.deepEqual(frequencyLevel(100), { steps: 3, label: 'High' });
  assert.deepEqual(frequencyLevel(75), { steps: 3, label: 'High' });
  assert.deepEqual(frequencyLevel(74), { steps: 2, label: 'Medium' });
  assert.deepEqual(frequencyLevel(60), { steps: 2, label: 'Medium' });
  assert.deepEqual(frequencyLevel(59), { steps: 1, label: 'Low' });
  assert.deepEqual(frequencyLevel(0), { steps: 1, label: 'Low' });
});
