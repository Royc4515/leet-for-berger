// Company logos (owner's request: logos look better than monograms, in the best quality we can
// find). The pipeline's rules are pure (scripts/content/logo-pick.mjs); the shipped manifest must
// match the files and the company list, and stay small.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { iconLinksFromHtml, iconsFromManifest, sizeFromAttr, parseIco, scoreCandidate, rankCandidates, clearWhiteBackground, isBleedTile, brandColor, whiteShare, inkWhite, cleanLogo } from '../scripts/content/logo-pick.mjs';

test('icon links: icons, touch icons, the mask icon and the manifest, resolved against the page', () => {
  const html = `<head>
    <link rel="icon" href="/favicon.ico" sizes="32x32">
    <link rel='icon' type='image/svg+xml' href='/brand/icon.svg'>
    <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.example.com/touch.png">
    <link rel="mask-icon" href="/mask.svg" color="#5bbad5">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="stylesheet" href="/app.css">
    <link rel="icon" href="data:image/png;base64,AAAA">
  </head>`;
  const { icons, manifest } = iconLinksFromHtml(html, 'https://www.example.com/en/');
  assert.equal(manifest, 'https://www.example.com/site.webmanifest');
  assert.deepEqual(
    icons.map((i) => [i.kind, i.url, i.size]),
    [
      ['site-icon', 'https://www.example.com/favicon.ico', 32],
      ['site-svg', 'https://www.example.com/brand/icon.svg', Infinity],
      ['apple-touch', 'https://cdn.example.com/touch.png', 180],
      ['mask-icon', 'https://www.example.com/mask.svg', Infinity],
    ],
  );
  assert.equal(icons[3].color, '#5bbad5');
  assert.equal(sizeFromAttr('16x16 48x48 32x32'), 48);
  assert.equal(sizeFromAttr('any'), Infinity);
  assert.equal(sizeFromAttr(null), 0);
});

test('manifest icons: sizes read, maskable-only icons skipped (their glyph is padded for cropping)', () => {
  const icons = iconsFromManifest(
    {
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512-mask.png', sizes: '512x512', purpose: 'maskable' },
        { src: 'logo.svg', type: 'image/svg+xml', purpose: 'any maskable' },
        { sizes: '64x64' },
      ],
    },
    'https://example.com/static/manifest.json',
  );
  assert.deepEqual(icons.map((i) => [i.url, i.size, i.vector]), [
    ['https://example.com/static/icon-192.png', 192, false],
    ['https://example.com/static/logo.svg', Infinity, true],
  ]);
  assert.deepEqual(iconsFromManifest(null, 'https://x.y/'), []);
});

/** A .ico with one PNG frame (64 px) and one 32-bit BMP frame (2 x 1). */
function icoFixture() {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
  const bmpHeader = new Uint8Array(40);
  new DataView(bmpHeader.buffer).setUint32(0, 40, true);
  new DataView(bmpHeader.buffer).setUint16(14, 32, true);
  // BGRA, bottom-up: one row, left pixel blue, right pixel red.
  const bmp = Uint8Array.from([...bmpHeader, 255, 0, 0, 255, 0, 0, 255, 255]);
  const head = new Uint8Array(6 + 32);
  const v = new DataView(head.buffer);
  v.setUint16(2, 1, true);
  v.setUint16(4, 2, true);
  head[6] = 64;
  head[7] = 64;
  v.setUint32(6 + 8, png.length, true);
  v.setUint32(6 + 12, head.length, true);
  head[22] = 2;
  head[23] = 1;
  v.setUint32(22 + 8, bmp.length, true);
  v.setUint32(22 + 12, head.length + png.length, true);
  return Uint8Array.from([...head, ...png, ...bmp]);
}

test('.ico: PNG frames pass through, 32-bit BMP frames decode to RGBA, junk gives nothing', () => {
  const frames = parseIco(icoFixture());
  assert.equal(frames.length, 2);
  assert.deepEqual([frames[0].width, frames[0].height, frames[0].png[0]], [64, 64, 0x89]);
  assert.deepEqual([...frames[1].rgba], [0, 0, 255, 255, 255, 0, 0, 255]);
  assert.deepEqual(parseIco(Uint8Array.from([1, 2, 3])), []);
});

test('ranking: a colour vector, then big rasters, then Simple Icons, then small rasters; tiny ones dropped', () => {
  const c = (kind, size, vector = false) => ({ url: `${kind}-${size}`, kind, size, vector });
  const ranked = rankCandidates([c('google', 32), c('site-icon', 64), c('simple-icons', Infinity, true), c('apple-touch', 180), c('site-svg', Infinity, true), c('mask-icon', Infinity, true), c('manifest', 512), c('duckduckgo', 16)]);
  assert.deepEqual(ranked.map((x) => x.kind), ['site-svg', 'apple-touch', 'manifest', 'simple-icons', 'site-icon', 'mask-icon']);
  assert.equal(scoreCandidate(c('google', 47)), 0);
  assert.ok(scoreCandidate(c('google', 48)) > 0);
});

/** w x h RGBA filled with one colour. */
const fill = (w, h, [r, g, b, a = 255]) => {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < d.length; i += 4) d.set([r, g, b, a], i);
  return d;
};

test('white background: cleared from the corners, white inside the glyph kept', () => {
  // 7 x 7 white, a dark ring around a white centre pixel.
  const w = 7;
  const d = fill(w, w, [255, 255, 255]);
  for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) if (!(x === 3 && y === 3)) d.set([20, 20, 20, 255], (y * w + x) * 4);
  const { rgba, cleared } = clearWhiteBackground(d, w, w);
  assert.equal(cleared, 49 - 9);
  assert.equal(rgba[(3 * w + 3) * 4 + 3], 255, 'the counter inside the ring stays');
  assert.equal(rgba[3], 0, 'a corner is transparent');
  const dark = fill(4, 4, [10, 10, 10]);
  assert.equal(clearWhiteBackground(dark, 4, 4).cleared, 0, 'no white corners, nothing cleared');
});

test('bleed tiles: a coloured full square is one, a white or transparent background is not', () => {
  const blue = fill(10, 10, [0, 118, 206]);
  blue.set([255, 255, 255, 255], (5 * 10 + 5) * 4);
  assert.equal(isBleedTile(blue, 10, 10), true);
  assert.equal(isBleedTile(fill(10, 10, [255, 255, 255]), 10, 10), false);
  assert.equal(isBleedTile(fill(10, 10, [0, 118, 206, 0]), 10, 10), false);
});

test('brand colour: the main saturated colour; none for black and white', () => {
  const d = fill(10, 10, [255, 255, 255]);
  for (let i = 0; i < 60; i++) d.set([118, 185, 0, 255], i * 4);
  assert.equal(brandColor(d), '#76b900');
  assert.equal(brandColor(fill(10, 10, [0, 0, 0])), null);
});

test('a logo drawn for a dark page: its white parts are inked, its colours kept', () => {
  assert.equal(whiteShare(fill(6, 6, [250, 250, 250])), 1);
  assert.equal(whiteShare(fill(6, 6, [0, 0, 0, 0])), 1, 'nothing visible at all');
  assert.equal(whiteShare(fill(6, 6, [16, 163, 127])), 0);
  const mixed = fill(2, 1, [255, 255, 255]);
  mixed.set([230, 60, 40, 255], 4);
  assert.deepEqual([...inkWhite(mixed, '#3a352d')], [0x3a, 0x35, 0x2d, 255, 230, 60, 40, 255]);
});

test('cleaning for the plate: a white disc behind a logo goes, a white logo is inked, colours stay', () => {
  const w = 9;
  // Transparent canvas, a white disc (3..5 ring), a coloured centre: Google's favicon shape.
  const disc = fill(w, w, [0, 0, 0, 0]);
  for (let y = 1; y <= 7; y++) for (let x = 1; x <= 7; x++) disc.set([255, 255, 255, 255], (y * w + x) * 4);
  for (let y = 3; y <= 5; y++) for (let x = 3; x <= 5; x++) disc.set([66, 133, 244, 255], (y * w + x) * 4);
  // Its rim is anti-aliased: half transparent, light.
  for (let x = 1; x <= 7; x++) disc.set([240, 240, 240, 120], (1 * w + x) * 4);
  const a = cleanLogo(disc, w, w, '#3a352d');
  assert.equal(a[(1 * w + 1) * 4 + 3], 0, 'the white disc is gone');
  assert.deepEqual([...a.subarray((4 * w + 4) * 4, (4 * w + 4) * 4 + 4)], [66, 133, 244, 255], 'the colour stays');
  // A white glyph on a transparent canvas: nothing else to show, so it is inked, not erased.
  const glyph = fill(w, w, [0, 0, 0, 0]);
  for (let x = 1; x <= 7; x++) glyph.set([255, 255, 255, 255], (4 * w + x) * 4);
  const b = cleanLogo(glyph, w, w, '#3a352d');
  assert.deepEqual([...b.subarray((4 * w + 2) * 4, (4 * w + 2) * 4 + 4)], [0x3a, 0x35, 0x2d, 255]);
  assert.equal(cleanLogo(fill(4, 4, [0, 0, 0, 0]), 4, 4, '#3a352d'), null, 'nothing visible');
  // Black text on a big white square (Deloitte): the square goes, the text stays black.
  const square = fill(w, w, [255, 255, 255]);
  square.set([4, 4, 4, 255], (4 * w + 4) * 4);
  const c = cleanLogo(square, w, w, '#3a352d');
  assert.equal(c[3], 0, 'the white square is gone');
  assert.deepEqual([...c.subarray((4 * w + 4) * 4, (4 * w + 4) * 4 + 4)], [4, 4, 4, 255]);
  // White text beside a coloured dot (Fractal): the text is part of the logo, so it is inked.
  const side = fill(w, w, [0, 0, 0, 0]);
  for (let x = 0; x <= 5; x++) side.set([255, 255, 255, 255], (4 * w + x) * 4);
  side.set([240, 160, 0, 255], (4 * w + 8) * 4);
  const d = cleanLogo(side, w, w, '#3a352d');
  assert.deepEqual([...d.subarray((4 * w + 2) * 4, (4 * w + 2) * 4 + 4)], [0x3a, 0x35, 0x2d, 255], 'white text inked');
  assert.deepEqual([...d.subarray((4 * w + 8) * 4, (4 * w + 8) * 4 + 4)], [240, 160, 0, 255], 'the dot kept');
});

/* ---------- The shipped set ---------- */

const manifest = JSON.parse(readFileSync('src/js/data/company-logos.json', 'utf8'));
const sets = JSON.parse(readFileSync('src/js/data/company-sets.json', 'utf8'));
const domains = JSON.parse(readFileSync('content/company-domains.json', 'utf8')).domains;

test('every company has a domain entry; every logo belongs to a company and its file exists', () => {
  const slugs = new Set(sets.companies.map((c) => c.slug));
  assert.deepEqual(Object.keys(domains).sort(), [...slugs].sort());
  for (const [slug, logo] of Object.entries(manifest.logos)) {
    assert.ok(slugs.has(slug), `${slug} is not a company`);
    assert.ok(domains[slug], `${slug} has a logo but no domain`);
    assert.ok(existsSync(`src/brand/companies/${slug}.webp`), `${slug}.webp missing`);
    assert.equal(typeof logo.bleed, 'boolean');
    assert.ok(logo.color === null || /^#[0-9a-f]{6}$/.test(logo.color), `${slug} colour`);
  }
});

test('logos stay small: each file under 16 KB, all of them under 1.5 MB', () => {
  let total = 0;
  for (const slug of Object.keys(manifest.logos)) {
    const size = statSync(`src/brand/companies/${slug}.webp`).size;
    assert.ok(size < 16 * 1024, `${slug}.webp is ${size} bytes`);
    total += size;
  }
  assert.ok(total < 1.5 * 1024 * 1024, `${total} bytes in all`);
});

test('a company kept out of the logo set has no logo', () => {
  for (const [slug, domain] of Object.entries(domains)) if (domain === null) assert.ok(!manifest.logos[slug], slug);
});

/* ---------- Finding a logo by a company's name ("Asked at" lists names, not slugs) ---------- */

test('a company name turns into its slug the way the sets name them', async () => {
  const { slugifyCompany } = await import('../src/js/data/company-loader.js');
  for (const c of sets.companies) assert.equal(slugifyCompany(c.name), c.slug, c.name);
  assert.equal(slugifyCompany('Pony.ai'), 'pony-ai');
  assert.equal(slugifyCompany('  AT&T '), 'at-t');
});

test('the manifest maps alias slugs to companies with a logo; a name finds its logo through them', async () => {
  const { companyLogoByName } = await import('../src/js/data/company-loader.js');
  const expected = {};
  for (const c of sets.companies) for (const a of c.aliases) if (manifest.logos[c.slug]) expected[a.slug] = c.slug;
  assert.deepEqual(manifest.aliases, expected);
  for (const [alias, slug] of Object.entries(manifest.aliases)) {
    const logo = companyLogoByName(manifest, sets.companies.find((c) => c.slug === slug).aliases.find((a) => a.slug === alias).name);
    assert.ok(logo?.src.endsWith(`/brand/companies/${slug}.webp`), `${alias} -> ${slug}`);
  }
  assert.ok(companyLogoByName(manifest, 'Google')?.src.endsWith('/google.webp'));
  assert.equal(companyLogoByName(manifest, 'No Such Company'), null);
  assert.equal(companyLogoByName(null, 'Google'), null);
});
