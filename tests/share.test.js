// Share texts (src/js/data/share.js, owner's request): every part of the site that can be shared
// sends a title, a line written for that button in the reader's language, and the link to the
// item's preview page. Spoiler-free: names, levels and counts, never code, test cases or an answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareUrl, shareLanguage, SHARE_PAGES, problemShare, solveShare, companyShare, mapShare, pathShare, dailyShare, interviewShare, battleShare, quizShare, quizResultShare, quizDailyShare, quizBoardShare, SITE_NAME } from '../src/js/data/share.js';

const SITE = 'https://example.org/leet-for-berger/';
const all = (lang) => [
  problemShare({ id: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', lang }),
  solveShare({ id: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', language: 'Python 3', lang }),
  companyShare({ slug: 'google', name: 'Google', onSite: 54, lang }),
  companyShare({ slug: 'google', name: 'Google', onSite: 54, solved: 7, lang }),
  mapShare({ level: { topic: 'graphs' }, hash: '#/map/graphs', name: 'Graphs', problems: 10, lang }),
  mapShare({ level: { topic: 'graphs', concept: 'topological-sort' }, hash: '#/map/graphs/topological-sort', name: 'Topological sort', where: 'Graphs', problems: 3, lang }),
  pathShare({ solved: 0, total: 131, lang }),
  pathShare({ solved: 3, total: 131, lang }),
  dailyShare({ number: 12, title: 'Pair Sum Target', solved: true, streak: 4, lang }),
  interviewShare({ score: 82, band: 'Strong', solved: 2, total: 3, lang }),
  battleShare({ won: true, bot: 'Ada', title: 'Pair Sum Target', lang }),
  battleShare({ won: false, bot: 'Ada', title: 'Pair Sum Target', lang }),
  quizShare({ lang }),
  quizResultShare({ mode: 'practice', correct: 8, total: 10, lang }),
  quizResultShare({ mode: 'sprint', correct: 6, total: 10, topic: 'OOP', lang }),
  quizResultShare({ mode: 'survival', correct: 14, total: 17, lang }),
  quizDailyShare({ number: 30, lang }),
  quizBoardShare({ number: 30, lang }),
  quizBoardShare({ number: 30, players: 12, lang }),
  quizBoardShare({ number: 30, rank: 3, players: 12, lang }),
];

test('a shared link opens the item\'s preview page on the public site', () => {
  assert.equal(shareUrl('s/problem/pair-sum-target.html', SITE), 'https://example.org/leet-for-berger/s/problem/pair-sum-target.html');
  assert.equal(shareUrl('s/daily.html', 'https://example.org/site'), 'https://example.org/site/s/daily.html');
  assert.equal(SHARE_PAGES.map({ topic: 'graphs', concept: 'topological-sort', problem: 'course-order' }), 's/map/graphs/topological-sort/course-order.html');
  assert.equal(SHARE_PAGES.map({ topic: 'graphs' }), 's/map/graphs.html');
});

test('every payload, in both languages: a title naming the site, one line, a preview page and a route', () => {
  for (const lang of ['en', 'he']) {
    for (const p of all(lang)) {
      assert.ok(p.title.includes(SITE_NAME), p.title);
      assert.ok(p.text && !p.text.includes('\n'), p.text);
      assert.match(p.page, /^s\/[\w/-]+\.html$/);
      assert.match(p.hash, /^#\//);
      // Plain copy rules: no em dash, no exclamation mark.
      assert.ok(!/[\u2014!]/.test(p.title + p.text), p.title + p.text);
    }
  }
});

test('Hebrew texts are Hebrew, and keep names, languages and numbers as they are', () => {
  for (const p of all('he')) assert.match(p.text, /[֐-׿]/, p.text);
  assert.equal(solveShare({ id: 'x', title: 'Pair Sum Target', difficulty: 'Medium', language: 'Python 3', firstSolve: true, lang: 'he' }).text, 'פתרתי עכשיו את Pair Sum Target (בינונית) ב-Python 3: עברו 15 מתוך 15 טסטים. תורך.');
  assert.equal(dailyShare({ number: 40, title: 'T', solved: true, streak: 5, lang: 'he' }).text, 'אתגר יומי #40: T. פתרתי, 5 ימים ברצף. אותה שאלה לכולם היום, מה איתך?');
  assert.match(mapShare({ level: { topic: 't' }, hash: '#/map/t', name: 'Graphs', problems: 1, lang: 'he' }).text, /Graphs, שאלה אחת:/);
});

test('a solve share names the problem and the language, never the code', () => {
  const p = solveShare({ id: 'pair-sum-target', title: 'Pair Sum Target', difficulty: 'Easy', language: 'Python 3', code: 'def secret(): return 42', firstSolve: true });
  assert.equal(p.hash, '#/problem/pair-sum-target');
  assert.equal(p.page, 's/problem/pair-sum-target.html');
  assert.equal(p.text, 'Just solved Pair Sum Target (Easy) in Python 3: 15 of 15 tests passed. Your turn.');
  assert.ok(!JSON.stringify(p).includes('secret'));
  assert.match(solveShare({ id: 'x', title: 'X', difficulty: 'Hard', language: 'Go' }).text, /^Solved X \(Hard\) in Go/);
});

test('each English text is written for its button', () => {
  assert.equal(problemShare({ id: 'p', title: 'Pair Sum Target', difficulty: 'Easy' }).text, 'Can you solve Pair Sum Target? An Easy one, judged on 15 tests right in the browser.');
  assert.match(problemShare({ id: 'p', title: 'T', difficulty: 'Medium' }).text, /\? A Medium one/);
  assert.equal(companyShare({ slug: 'google', name: 'Google', onSite: 54, solved: 7 }).text, 'Practising for Google: 7 of its 54 most asked interview problems solved so far.');
  assert.equal(companyShare({ slug: 'google', name: 'Google', onSite: 54 }).text, 'Interviewing at Google? Its 54 most asked problems, ready to practise in the browser.');
  assert.equal(mapShare({ level: { topic: 'g', concept: 'c' }, hash: '#/map/g/c', name: 'Topological sort', where: 'Graphs', problems: 3 }).text, 'Topological sort, in Graphs, 3 problems, on the Leet-For-Berger map of interview topics.');
  assert.match(pathShare({ solved: 12, total: 131 }).text, /^12 of 131 along the learning path/);
  assert.equal(dailyShare({ number: 40, title: 'T' }).text, 'Daily challenge #40: T. Same problem for everyone today, can you?');
  assert.equal(dailyShare({ number: 40, title: 'T', solved: true, streak: 1 }).text, 'Daily challenge #40: T. Solved. Same problem for everyone today, can you?');
  assert.equal(interviewShare({ score: 82, band: 'Strong', solved: 2, total: 3 }).text, 'Mock interview: 82/100 (Strong), 2 of 3 solved against the clock. Think you can beat it?');
  assert.equal(battleShare({ won: true, bot: 'Ada', title: 'T' }).text, 'Beat Ada in a race on T. Race me?');
});

test('the reader\'s language: their quiz choice, else their browser, Hebrew or English', () => {
  assert.equal(shareLanguage({ stored: 'he', languages: ['en-US'] }), 'he');
  assert.equal(shareLanguage({ stored: 'en', languages: ['he-IL'] }), 'en');
  assert.equal(shareLanguage({ languages: ['he-IL', 'en'] }), 'he');
  assert.equal(shareLanguage({ languages: ['iw'] }), 'he');
  assert.equal(shareLanguage({ languages: ['fr-FR'] }), 'en');
  assert.equal(shareLanguage({ stored: 'xx', languages: [] }), 'en');
});

test('quiz shares: the hub, a free-play score, the daily quiz and the leaderboard, each with its own preview page', () => {
  assert.equal(quizShare().page, 's/quiz.html');
  assert.equal(quizShare().hash, '#/quiz');
  assert.equal(quizResultShare({ mode: 'practice', correct: 8, total: 10 }).text, 'Practice quiz: 8/10 correct. Think you can beat it?');
  assert.equal(quizResultShare({ mode: 'sprint', correct: 6, total: 10, topic: 'OOP' }).text, 'Sprint quiz on OOP: 6/10 correct. Think you can beat it?');
  assert.equal(quizResultShare({ mode: 'survival', correct: 14, total: 17 }).text, 'Survival quiz: 14 right before the third miss. Can you go further?');
  assert.equal(quizResultShare({ mode: 'practice', correct: 9, total: 10, topic: 'מבני נתונים', lang: 'he' }).text, 'חידון תרגול בנושא מבני נתונים: 9/10 נכונות. מי עושה יותר?');
  const daily = quizDailyShare({ number: 30 });
  assert.equal(daily.page, 's/quiz-daily.html');
  assert.equal(daily.hash, '#/quiz/daily');
  assert.equal(daily.text, 'Daily quiz #30: 5 questions, the same for everyone today. How many can you get?');
  const board = quizBoardShare({ number: 30, rank: 3, players: 12 });
  assert.equal(board.page, 's/quiz-board.html');
  assert.equal(board.hash, '#/quiz/board');
  assert.equal(board.text, '#3 of 12 on the daily quiz #30 leaderboard. Think you can beat it?');
  assert.equal(quizBoardShare({ number: 30, players: 12 }).text, 'Daily quiz #30 leaderboard: 12 played today. The same 5 questions for everyone, only the first play counts. Join in?');
  assert.equal(quizBoardShare({ number: 30, rank: 3, players: 12, lang: 'he' }).text, 'מקום 3 מתוך 12 בטבלת המובילים של חידון יומי #30. מי עוקף אותי?');
});
