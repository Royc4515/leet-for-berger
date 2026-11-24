#!/usr/bin/env node
/**
 * Writes the preview pages behind shared links, with an image each (scripts/share/pages.mjs says
 * what each one holds; scripts/share/card.html draws the images). Runs on deploy
 * (.github/workflows/pages.yml) into the site being published, so the repository holds no copies.
 *
 * Usage: node scripts/share/build-share-pages.mjs [--out=_site] [--site=URL] [--no-images] [--sample=N] [--match=RE]
 *   --site: the public site (default: SITE_URL in src/js/config.js)
 *   --sample: render only N images (a quick check in CI), pages are still all written
 *   --match: render only the images whose path matches (a look at one kind)
 * The browser: PW_CHANNEL (e.g. chrome) or PW_EXECUTABLE, else Playwright's own Chromium.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sharePages, pageHtml } from './pages.mjs';
import { shareData } from './data.mjs';
import { SITE_URL } from '../../src/js/config.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const OUT = resolve(ROOT, args.out ?? '_site');
const SITE = args.site ?? SITE_URL;
const pages = sharePages(shareData(ROOT));

for (const p of pages) {
  const file = join(OUT, p.page);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, pageHtml(p, SITE));
}
console.log(`${pages.length} preview pages -> ${join(OUT, 's')}`);

if (args['no-images'] !== 'true') {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, executablePath: process.env.PW_EXECUTABLE || undefined });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  // A broken image or a script error would ship a wrong card: fail the build instead.
  const problems = [];
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('requestfailed', (r) => problems.push(`failed to load ${r.url()}`));
  await page.goto(pathToFileURL(join(ROOT, 'scripts/share/card.html')).href);
  const cards = [...new Map(pages.filter((p) => p.card).map((p) => [p.image, p])).values()];
  const matching = args.match ? cards.filter((p) => new RegExp(args.match).test(p.image)) : cards;
  const todo = args.sample ? matching.filter((_, i) => i % Math.ceil(matching.length / Number(args.sample)) === 0) : matching;
  const started = Date.now();
  for (const p of todo) {
    await page.evaluate((c) => window.render(c), p.card);
    const file = join(OUT, p.image);
    mkdirSync(dirname(file), { recursive: true });
    await page.screenshot({ path: file, type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  }
  await browser.close();
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`${todo.length} preview images in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
