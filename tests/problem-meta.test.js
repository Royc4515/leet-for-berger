import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { companySizes, rankCompanies, buildProblemMeta, complexityOpenByDefault, COMPANY_LIMIT } from '../src/js/data/problem-meta.js';
import { availableProblems } from '../src/js/problems/index.js';

const c = (name, frequency, recency = '6m') => ({ name, frequency, recency });

test('rankCompanies sorts by frequency, then recency, then name, and flags Israeli companies', () => {
  const out = rankCompanies([c('B', 50), c('Wix', 50, '30d'), c('A', 90), c('C', 50)], new Set(['Wix']));
  assert.deepEqual(out.map((x) => x.name), ['A', 'Wix', 'B', 'C']);
  assert.equal(out[1].israeli, true);
  assert.equal('israeli' in out[0], false);
});

test('rankCompanies weights frequency by how many problems the company has tagged', () => {
  const sizes = new Map([['Google', 1500], ['TinyCo', 3]]);
  const out = rankCompanies([c('TinyCo', 100), c('Google', 60)], new Set(), Infinity, sizes);
  assert.deepEqual(out.map((x) => x.name), ['Google', 'TinyCo']);
});

test('rankCompanies keeps Israeli companies past the limit', () => {
  const out = rankCompanies([c('A', 90), c('B', 80), c('Wix', 10)], new Set(['Wix']), 1);
  assert.deepEqual(out.map((x) => x.name), ['A', 'Wix']);
});

test('buildProblemMeta joins companies, best known complexity and family versions', () => {
  const records = [
    { slug: 'two-sum', number: 1, platform: 'leetcode', url: 'u1', contentId: 'pair-sum-target', companyCount: 2, companies: [c('Google', 90), c('Wix', 40)] },
    { slug: 'two-sum-ii', number: 167, platform: 'leetcode', title: 'Two Sum II', contentId: null, companies: [c('Amazon', 70)] },
    { slug: 'other', number: 2, platform: 'leetcode', contentId: 'other-one', companies: [] },
  ];
  const families = [{ id: 'pair', title: 'Pair sum', members: [{ slug: 'two-sum', twist: 'unsorted' }, { slug: 'two-sum-ii', twist: 'sorted' }] }];
  const meta = buildProblemMeta(records, families, { 1: { time: 'O(n)', space: 'O(n)' } }, ['Wix']);

  assert.deepEqual(Object.keys(meta).sort(), ['other-one', 'pair-sum-target']);
  const m = meta['pair-sum-target'];
  assert.equal(m.number, 1);
  assert.deepEqual(m.bestKnown, { time: 'O(n)', space: 'O(n)' });
  assert.equal(m.companies.find((x) => x.name === 'Wix').israeli, true);
  assert.equal(m.family.self, 'two-sum');
  assert.deepEqual(m.family.versions.map((v) => [v.slug, v.twist, v.contentId]), [['two-sum', 'unsorted', 'pair-sum-target'], ['two-sum-ii', 'sorted', null]]);
  assert.deepEqual(m.family.versions[1].companies.map((x) => x.name), ['Amazon']);
  assert.equal(meta['other-one'].bestKnown, null);
  assert.equal(meta['other-one'].family, null);
});

test('companySizes counts tagged problems per company', () => {
  const sizes = companySizes([{ companies: [c('A', 1), c('B', 1)] }, { companies: [c('A', 1)] }, {}]);
  assert.deepEqual([...sizes], [['A', 2], ['B', 1]]);
});

test('complexity stays behind a toggle until the problem is solved', () => {
  assert.equal(complexityOpenByDefault(undefined), false);
  assert.equal(complexityOpenByDefault({ status: 'attempted' }), false);
  assert.equal(complexityOpenByDefault({ status: 'solved' }), true);
});

test('problem-meta.json is fresh and covers every shipped problem', () => {
  const shipped = JSON.parse(readFileSync(new URL('../src/js/data/problem-meta.json', import.meta.url)));
  const raw = JSON.parse(readFileSync(new URL('../content/index/problems.json', import.meta.url)));
  const records = Array.isArray(raw) ? raw : raw.problems;
  const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
  const rebuilt = buildProblemMeta(records, read('../content/families.json').families, read('../content/index/complexity.json').problems, read('../content/companies.json').israeli);
  assert.deepEqual(shipped, rebuilt, 'run: node scripts/content/build-meta.mjs');
  const missing = availableProblems().map((p) => p.id).filter((id) => !shipped[id]);
  assert.deepEqual(missing, []);
  for (const m of Object.values(shipped)) assert.ok(m.companies.filter((x) => !x.israeli).length <= COMPANY_LIMIT);
});
