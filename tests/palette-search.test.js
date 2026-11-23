import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchScore, searchPalette } from '../src/js/data/palette-search.js';

const items = [
  { kind: 'page', id: 'map', label: 'Map', href: '#/map' },
  { kind: 'problem', id: 'pair-sum-target', label: 'Pair Sum Target', href: '#/problem/pair-sum-target' },
  { kind: 'problem', id: 'two-wall-tank', label: 'Two Wall Tank', href: '#/problem/two-wall-tank' },
  { kind: 'topic', id: 'two-pointers', label: 'Two Pointers', href: '#/map?topic=two-pointers' },
  { kind: 'company', id: 'wix', label: 'Wix', hint: 'Israel', href: '#/companies/wix', keywords: 'israel' },
  { kind: 'company', id: 'palo-alto-networks', label: 'Palo Alto Networks', href: '#/companies/palo-alto-networks' },
];

test('matchScore: exact > prefix > substring > subsequence; non-matches are -1', () => {
  assert.equal(matchScore('map', 'Map'), 1000);
  assert.ok(matchScore('two', 'Two Pointers') > matchScore('poi', 'Two Pointers'));
  assert.ok(matchScore('poi', 'Two Pointers') > matchScore('tps', 'Two Pointers'));
  assert.ok(matchScore('tps', 'Two Pointers') > 0);
  assert.equal(matchScore('xyz', 'Two Pointers'), -1);
  assert.equal(matchScore('   ', 'Anything'), 0);
});

test('matchScore rewards word starts over scattered letters', () => {
  assert.ok(matchScore('pst', 'Pair Sum Target') > matchScore('pst', 'Repost Item'));
});

test('searchPalette ranks, filters and caps; empty query keeps the suggested order', () => {
  assert.deepEqual(searchPalette(items, '', 3).map((i) => i.id), ['map', 'pair-sum-target', 'two-wall-tank']);
  assert.deepEqual(searchPalette(items, 'two').map((i) => i.id), ['two-pointers', 'two-wall-tank'], 'shorter prefix match first; Palo Alto neTWOrks is not a match');
  assert.deepEqual(searchPalette(items, 'pan').map((i) => i.id), ['palo-alto-networks']);
  assert.deepEqual(searchPalette(items, 'qqq'), []);
});

test('searchPalette also matches keywords, below a direct label match', () => {
  assert.deepEqual(searchPalette(items, 'israel').map((i) => i.id), ['wix']);
});

test('searchPalette ties break by kind order, then label', () => {
  const tie = [
    { kind: 'company', id: 'c', label: 'Alpha', href: '#' },
    { kind: 'problem', id: 'p', label: 'Alpha', href: '#' },
  ];
  assert.deepEqual(searchPalette(tie, 'alpha').map((i) => i.kind), ['problem', 'company']);
});
