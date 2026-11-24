// Share texts (src/js/data/share.js, owner's request): every part of the site that can be shared
// sends a title, one line and the page's link. Spoiler-free: names, levels and counts, never code,
// test cases or an answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareUrl, problemShare, solveShare, companyShare, mapShare, pathShare, dailyShare, interviewShare, battleShare, SITE_NAME } from '../src/js/data/share.js';

const base = { origin: 'https://example.org', pathname: '/leet-for-berger/' };

test('a shared link opens this site at the page it came from', () => {
  assert.equal(shareUrl('#/problem/pair-sum-target', base), 'https://example.org/leet-for-berger/#/problem/pair-sum-target');
  assert.equal(shareUrl('#/daily', { origin: 'http://localhost:5173', pathname: '/' }), 'http://localhost:5173/#/daily');
});

test('every payload has a title naming the site, one line of text and a hash route', () => {
  const all = [
    problemShare({ id: 'p', title: 'Pair Sum Target', difficulty: 'Easy' }),
    solveShare({ id: 'p', title: 'Pair Sum Target', difficulty: 'Easy', language: 'Python 3' }),
    companyShare({ slug: 'google', name: 'Google', onSite: 54 }),
    mapShare({ hash: '#/map/graphs', name: 'Graphs' }),
    pathShare({ solved: 3, total: 131 }),
    dailyShare({ number: 12, title: 'Pair Sum Target' }),
    interviewShare({ score: 82, band: 'Strong', solved: 2, total: 3 }),
    battleShare({ won: true, bot: 'Ada', title: 'Pair Sum Target' }),
  ];
  for (const p of all) {
    assert.ok(p.title.includes(SITE_NAME), p.title);
    assert.ok(p.text && !p.text.includes('\n'), p.text);
    assert.match(p.hash, /^#\//);
    // Plain copy rules: no em dash, no exclamation mark.
    assert.ok(!/[—!]/.test(p.title + p.text), p.title + p.text);
  }
});

test('a solve share names the problem and the language, never the code', () => {
  const p = solveShare({ id: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', language: 'Python 3', code: 'def secret(): return 42', firstSolve: true });
  assert.equal(p.hash, '#/problem/pair-sum-target');
  assert.match(p.text, /^First solve: Pair Sum Target \(Easy\) in Python 3, 15 of 15 tests passed/);
  assert.ok(!JSON.stringify(p).includes('secret'));
  assert.match(solveShare({ id: 'x', title: 'X', difficulty: 'Hard', language: 'Go' }).text, /^Solved: X \(Hard\) in Go/);
});

test('a company share says the progress when there is some, else what there is to practise', () => {
  assert.match(companyShare({ slug: 'google', name: 'Google', onSite: 54, solved: 7 }).text, /^7 of 54 of Google's most asked/);
  assert.match(companyShare({ slug: 'google', name: 'Google', onSite: 54, solved: 0 }).text, /^Google's most asked interview problems: 54 to practise/);
  assert.equal(companyShare({ slug: 'monday-com', name: 'monday.com', onSite: 2 }).hash, '#/companies/monday-com');
});

test('path, daily, interview and battle shares carry their numbers', () => {
  assert.match(pathShare({ solved: 12, total: 131 }).text, /^12 of 131 problems along/);
  assert.match(pathShare({ solved: 0, total: 131 }).text, /131 problems, one per core pattern/);
  assert.equal(dailyShare({ number: 40, title: 'Pair Sum Target' }).text, 'Daily challenge #40: Pair Sum Target. Same problem for everyone today.');
  assert.equal(dailyShare({ number: 40, title: 'Pair Sum Target', solved: true, streak: 5 }).text, 'Daily challenge #40: Pair Sum Target · solved · 5-day streak. Same problem for everyone today.');
  assert.equal(dailyShare({ number: 40, title: 'T', streak: 1 }).text.includes('streak'), false, 'a 1-day streak is not a streak worth saying');
  assert.equal(interviewShare({ score: 82, band: 'Strong', solved: 2, total: 3 }).text, 'Mock interview: 82/100 (Strong), 2 of 3 solved.');
  assert.equal(battleShare({ won: true, bot: 'Ada', title: 'T' }).text, 'Won a race against Ada on T.');
  assert.equal(battleShare({ won: false, bot: 'Ada', title: 'T' }).text, 'Raced Ada on T.');
});
