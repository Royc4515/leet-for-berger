// Preview pages behind shared links (scripts/share/pages.mjs, owner's request: each link shows its
// own preview). Every address a share button can send must have its page, every page an image
// that gets drawn, and the HTML must carry the preview and forward to the page safely.
// CI draws a sample of the images whenever this test is picked, so the drawing counts too:
// ci-deps: scripts/share/card.html scripts/share/build-share-pages.mjs src/brand/logo.svg
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sharePages, pageHtml } from '../scripts/share/pages.mjs';
import { shareData } from '../scripts/share/data.mjs';
import { SHARE_PAGES } from '../src/js/data/share.js';

const SITE = 'https://example.org/leet-for-berger/';
const data = shareData();
const pages = sharePages(data);
const byPage = new Map(pages.map((p) => [p.page, p]));

test('one page per address, each with a title, a description and an image', () => {
  assert.equal(byPage.size, pages.length, 'two pages share an address');
  for (const p of pages) {
    assert.match(p.page, /^s\/[\w/-]+\.html$/, p.page);
    assert.match(p.image, /^s\/img\/[\w/-]+\.jpg$/, p.image);
    assert.ok(p.title && p.description && p.alt, p.page);
    assert.match(p.hash, /^#\//, p.page);
    assert.ok(!/[\u2014!]/.test(p.title + p.description), p.title);
  }
});

test('every address a share button can send has its page', () => {
  const want = [SHARE_PAGES.path, SHARE_PAGES.daily, SHARE_PAGES.interview, SHARE_PAGES.battle, SHARE_PAGES.quiz, SHARE_PAGES.quizDaily, SHARE_PAGES.quizBoard];
  for (const p of data.problems) {
    want.push(SHARE_PAGES.problem(p.id));
    const at = data.placed[p.id];
    if (at) want.push(SHARE_PAGES.map({ topic: at.topic }), SHARE_PAGES.map({ topic: at.topic, concept: at.concept }), SHARE_PAGES.map({ topic: at.topic, concept: at.concept, problem: p.id }));
  }
  for (const c of data.companies) want.push(SHARE_PAGES.company(c.slug));
  for (const page of want) assert.ok(byPage.has(page), `no preview page for ${page}`);
});

test('every image a page shows is drawn by exactly one page with a card', () => {
  const drawn = new Map();
  for (const p of pages) if (p.card) drawn.set(p.image, (drawn.get(p.image) ?? 0) + 1);
  for (const p of pages) assert.equal(drawn.get(p.image), 1, `${p.page}: ${p.image}`);
  // A problem on the map shows the problem's own card.
  const onMap = pages.find((p) => p.page.startsWith('s/map/') && p.page.split('/').length === 5);
  assert.ok(onMap && onMap.card === null && onMap.image.startsWith('s/img/problem/'), JSON.stringify(onMap));
});

test('the page carries an absolute preview and forwards to the site page', () => {
  const p = byPage.get(SHARE_PAGES.problem(data.problems[0].id));
  const html = pageHtml(p, SITE);
  assert.ok(html.includes(`<meta property="og:image" content="${SITE}${p.image}">`));
  assert.ok(html.includes(`<meta property="og:url" content="${SITE}${p.page}">`));
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
  assert.ok(html.includes(`<meta http-equiv="refresh" content="0; url=${SITE}${p.hash}">`));
  assert.ok(html.includes(`location.replace("${SITE}${p.hash}")`));
});

test('text from the data cannot break out of the page', () => {
  const html = pageHtml({ page: 's/x.html', hash: '#/x', title: 'A "quoted" <b>title</b> & </script>', description: 'd', image: 's/img/x.png', alt: 'a', card: null }, SITE);
  assert.ok(!html.includes('<b>title</b>'));
  assert.ok(html.includes('A &quot;quoted&quot; &lt;b&gt;title&lt;/b&gt; &amp; &lt;/script&gt;'));
  assert.equal(html.match(/<\/script>/g).length, 1, 'only the page\'s own script closes');
});
