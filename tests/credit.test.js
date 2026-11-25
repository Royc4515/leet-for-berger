import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AUTHOR_NAME, AUTHOR_LINKS, EXTERNAL_LINK, creditLinkName, authorPaletteItems } from '../src/js/data/credit.js';
import { searchPalette } from '../src/js/data/palette-search.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the credit links are exactly the owner\'s three, over https, in order', () => {
  assert.equal(AUTHOR_NAME, 'Roy Carmelli');
  assert.deepEqual(
    AUTHOR_LINKS.map((l) => [l.id, l.href]),
    [
      ['portfolio', 'https://roy-carmelli-portfolio.vercel.app/'],
      ['linkedin', 'https://www.linkedin.com/in/roy-carmelli'],
      ['github', 'https://github.com/Royc4515'],
    ],
  );
  for (const l of AUTHOR_LINKS) assert.equal(new URL(l.href).protocol, 'https:');
  assert.ok(Object.isFrozen(AUTHOR_LINKS) && AUTHOR_LINKS.every(Object.isFrozen));
});

test('LinkedIn and GitHub carry a mark; the name does not', () => {
  assert.deepEqual(AUTHOR_LINKS.map((l) => Boolean(l.icon)), [false, true, true]);
  for (const l of AUTHOR_LINKS.filter((x) => x.icon)) assert.match(l.icon, /^M[\d.\s,a-zA-Z-]+$/);
});

test('external links open a new tab with no opener and no referrer', () => {
  assert.equal(EXTERNAL_LINK.target, '_blank');
  assert.deepEqual(EXTERNAL_LINK.rel.split(' ').sort(), ['noopener', 'noreferrer']);
});

test('each accessible name holds the visible words and says it opens a new tab', () => {
  const [portfolio, linkedin, github] = AUTHOR_LINKS;
  assert.equal(creditLinkName(portfolio), "Roy Carmelli's portfolio (opens in a new tab)");
  assert.match(creditLinkName(portfolio), new RegExp(`^${AUTHOR_NAME}`));
  assert.equal(creditLinkName(linkedin), 'Roy Carmelli on LinkedIn (opens in a new tab)');
  assert.equal(creditLinkName(github), 'Roy Carmelli on GitHub (opens in a new tab)');
  for (const l of AUTHOR_LINKS) assert.ok(!/—/.test(creditLinkName(l)), 'no em dashes');
});

test('palette entries open the right page and are found by author, built by, portfolio and hire', () => {
  const opened = [];
  const items = authorPaletteItems((href) => opened.push(href));
  assert.equal(items.length, 3);
  items.forEach((item) => item.run());
  assert.deepEqual(opened, AUTHOR_LINKS.map((l) => l.href));
  assert.ok(items.every((i) => i.kind === 'link' && !i.href), 'runs, never a hash route');

  const pages = [{ kind: 'page', id: 'map', label: 'Map', href: '#/map' }, { kind: 'page', id: 'profile', label: 'Profile', href: '#/me', keywords: 'account settings' }];
  const all = [...pages, ...items];
  for (const q of ['author', 'built by', 'roy', 'portfolio', 'hire', 'linkedin']) {
    assert.ok(searchPalette(all, q).some((i) => i.kind === 'link'), `"${q}" finds the author`);
  }
  // The portfolio leads every general search; a named site leads its own.
  for (const q of ['author', 'built by', 'about', 'hire', 'portfolio', 'roy']) assert.equal(searchPalette(all, q)[0].id, 'author-portfolio', q);
  assert.equal(searchPalette(all, 'linkedin')[0].id, 'author-linkedin');
  assert.equal(searchPalette(all, 'github')[0].id, 'author-github');
  // An empty palette suggests pages, not the author.
  assert.ok(!searchPalette(all, '', 2).some((i) => i.kind === 'link'));
});

test('privacy.html carries the same credit markup as the shared footer', async () => {
  const html = await read('privacy.html');
  const credit = html.match(/<div class="site-links-credit">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(credit, 'privacy.html has a credit line');
  assert.match(credit, /Built by/);
  const anchors = [...credit.matchAll(/<a ([^>]*)>((?:<svg[\s\S]*?<\/svg>)?)([^<]*)<\/a>/g)];
  assert.equal(anchors.length, AUTHOR_LINKS.length);
  AUTHOR_LINKS.forEach((l, i) => {
    const [, attrs, svg, text] = anchors[i];
    // The same mark as the shared footer, decorative, or none for the name.
    if (l.icon) {
      assert.ok(svg.includes(`d="${l.icon}"`), `${l.id} mark`);
      assert.match(svg, /aria-hidden="true"/);
      assert.match(svg, /fill="currentColor"/);
    } else assert.equal(svg, '');
    assert.match(attrs, new RegExp(`href="${l.href.replace(/[.?]/g, '\\$&')}"`));
    assert.match(attrs, /target="_blank"/);
    assert.match(attrs, /rel="noopener noreferrer"/);
    assert.ok(attrs.includes(`aria-label="${creditLinkName(l)}"`), `${l.id} accessible name`);
    assert.ok(attrs.includes(`data-credit="${l.id}"`));
    assert.equal(text, i === 0 ? AUTHOR_NAME : l.label);
  });
});

test('both HTML shells name the author for crawlers', async () => {
  for (const page of ['index.html', 'privacy.html']) {
    assert.match(await read(page), /<meta name="author" content="Roy Carmelli" \/>/, page);
  }
});
