#!/usr/bin/env node
/**
 * Company logos (owner's request: logos instead of monograms, in the best quality available).
 *
 * For every company in content/company-domains.json, collect every icon it publishes and every
 * icon the public services hold, keep the best one, clean it and write a small square WebP:
 *
 *   1. the home page's icons (an SVG favicon, the Apple touch icon, the web manifest's icons),
 *      plus the usual root paths (/apple-touch-icon.png, /favicon.svg, /favicon.ico);
 *   2. Simple Icons (CC0 vectors, drawn in the brand's colour) when the brand is there;
 *   3. Google's and DuckDuckGo's favicon services, as a fallback.
 *
 * Ranking (scripts/content/logo-pick.mjs): a colour vector, then rasters of 180 px and up, then
 * Simple Icons, then smaller rasters down to 48 px; anything smaller keeps the monogram. Cleaning:
 * a white background is made transparent from the corners, empty margins are trimmed, an app-icon
 * style square is marked `bleed` (drawn edge to edge), and the brand colour is measured.
 *
 * Writes src/brand/companies/<slug>.webp and src/js/data/company-logos.json, and a contact sheet
 * to review by eye (--report, default in the system temp folder).
 *
 * Overrides (content/company-domains.json `overrides`), set after reviewing that sheet: a URL is
 * the only candidate for that company (an official logo file); a source name (`google`,
 * `simple-icons`, `apple-touch`...) is tried before the others, for a site whose own icon is wrong
 * (a framework's default icon in its manifest, a mascot instead of the logo); `none` keeps the
 * monogram when no source is good; a path under
 * content/logo-sources/ is an official file saved by hand (a logo the site only inlines).
 *
 * A logo drawn in white for a dark page is recoloured in the tile's ink, so it shows on the plate.
 *
 * Usage: npm i --no-save sharp@0.34.4 && node scripts/content/fetch-logos.mjs [--only=slug,slug]
 * Runs by hand when companies change; the site only reads its output.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { iconLinksFromHtml, iconsFromManifest, parseIco, rankCandidates, isBleedTile, brandColor, cleanLogo } from './logo-pick.mjs';

const ROOT = new URL('../../', import.meta.url);
const OUT_DIR = new URL('src/brand/companies/', ROOT);
const MANIFEST = new URL('src/js/data/company-logos.json', ROOT);
const SIMPLE_ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@16.38.1';
/** Output edge in px: the largest tile is 64 CSS px, so 128 keeps it sharp on a 2x screen. */
const EDGE = 128;
/** The tile's ink (--logo-ink in app.css), for logos drawn in white. */
const INK = '#3a352d';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const only = args.only ? new Set(args.only.split(',')) : null;
const reportPath = args.report ? pathToFileURL(args.report) : pathToFileURL(`${tmpdir()}/logos-report.html`);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('This script needs sharp: npm i --no-save sharp@0.34.4');
  process.exit(1);
}

async function get(url, { type = 'buffer', timeout = 12000 } = {}) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (type === 'text') return { body: await res.text(), url: res.url, ct };
    const body = new Uint8Array(await res.arrayBuffer());
    if (body.length > 3 * 1024 * 1024) return null;
    return { body, url: res.url, ct };
  } catch {
    return null;
  }
}

/** Decodes any candidate to RGBA at up to 512 px; vectors are rendered large, then measured. */
async function decode(c, bytes) {
  const looksSvg = c.vector || /<svg[\s>]/i.test(new TextDecoder().decode(bytes.subarray(0, 512)));
  try {
    let input = bytes;
    if (!looksSvg && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) {
      const frames = parseIco(bytes).sort((a, b) => b.width - a.width);
      const f = frames[0];
      if (!f) return null;
      input = f.png ?? null;
      if (!input) {
        const img = sharp(Buffer.from(f.rgba), { raw: { width: f.width, height: f.height, channels: 4 } });
        const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        return { rgba: new Uint8Array(data), width: info.width, height: info.height, size: f.width, vector: false };
      }
    }
    let img = sharp(Buffer.from(input), { animated: false });
    if (looksSvg) {
      // Render a vector at about 512 px whatever its declared size (a huge viewBox at a fixed
      // density would allocate a huge bitmap).
      const declared = Math.max((await img.metadata()).width ?? 0, (await img.metadata()).height ?? 0) || 512;
      img = sharp(Buffer.from(input), { density: Math.min(2400, Math.max(36, (72 * 512) / declared)) });
    }
    const meta = await img.metadata();
    const natural = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (!natural) return null;
    if (looksSvg || natural > 512) img = img.resize(512, 512, { fit: 'inside' });
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { rgba: new Uint8Array(data), width: info.width, height: info.height, size: looksSvg ? Infinity : natural, vector: looksSvg };
  } catch {
    return null;
  }
}

/** Every icon a company publishes, plus Simple Icons and the favicon services. */
async function candidates(slug, domain, simple, override) {
  if (override && /^(https?:|content\/)/.test(override)) return [{ url: override, kind: 'override', size: Infinity, vector: /\.svg(\?|$)/i.test(override) }];
  const list = [];
  const home = await get(`https://${domain}/`, { type: 'text' });
  const base = home?.url ?? `https://${domain}/`;
  if (home) {
    const { icons, manifest } = iconLinksFromHtml(home.body, base);
    list.push(...icons);
    if (manifest) {
      const m = await get(manifest, { type: 'text' });
      try {
        if (m) list.push(...iconsFromManifest(JSON.parse(m.body), m.url));
      } catch {
        /* not JSON */
      }
    }
  }
  const origin = new URL(base).origin;
  list.push(
    { url: `${origin}/apple-touch-icon.png`, kind: 'apple-touch', size: 180, vector: false },
    { url: `${origin}/favicon.svg`, kind: 'site-svg', size: Infinity, vector: true },
    { url: `${origin}/favicon.ico`, kind: 'site-icon', size: 0, vector: false },
  );
  if (simple) list.push({ url: `${SIMPLE_ICONS}/icons/${simple.slug}.svg`, kind: 'simple-icons', size: Infinity, vector: true, color: `#${simple.hex}` });
  list.push(
    { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`, kind: 'google', size: 0, vector: false },
    { url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, kind: 'duckduckgo', size: 0, vector: false },
  );
  const seen = new Set();
  const unique = list.filter((c) => !seen.has(c.url) && seen.add(c.url));
  // A source named in the overrides is the only one tried; the rest stay as the fallback.
  return override ? [...unique.filter((c) => c.kind === override), ...unique.filter((c) => c.kind !== override).map((c) => ({ ...c, fallback: true }))] : unique;
}

/** Downloads and measures candidates, then returns the best decoded one. */
async function best(list) {
  const measured = [];
  for (const c of list) {
    const res = c.url.startsWith('content/') ? { body: new Uint8Array(await readFile(new URL(c.url, ROOT))), url: c.url, ct: '' } : await get(c.url);
    if (!res) continue;
    // Some sites answer a missing icon with their HTML page.
    if (/text\/html/.test(res.ct) && !c.vector) continue;
    const img = await decode(c, res.body);
    if (!img) continue;
    // Simple Icons and Safari mask icons are one flat shape: paint it in the brand's colour.
    if ((c.kind === 'simple-icons' || c.kind === 'mask-icon') && /^#[0-9a-f]{6}$/i.test(c.color ?? '')) img.rgba = tintRgba(img.rgba, c.color);
    // White backgrounds off, white logos (drawn for a dark page) in the ink (logo-pick.mjs).
    const cleaned = cleanLogo(img.rgba, img.width, img.height, INK);
    if (!cleaned) continue;
    img.rgba = cleaned;
    measured.push({ ...c, size: img.size, vector: img.vector, img });
  }
  if (args.debug) console.log(JSON.stringify(measured.map((c) => [c.kind, Number.isFinite(c.size) ? c.size : 'vector', c.url])));
  const preferred = rankCandidates(measured.filter((c) => !c.fallback));
  return preferred[0] ?? rankCandidates(measured)[0] ?? null;
}

/** A one-colour shape painted in the brand's colour (alpha kept). */
function tintRgba(rgba, hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = new Uint8Array(rgba);
  for (let i = 0; i < out.length; i += 4) out.set([r, g, b], i);
  return out;
}

/** Clean, trim and square the chosen icon; returns WebP bytes and what the page needs to know. */
async function finish(pick) {
  const { rgba, width, height } = pick.img;
  const bleed = isBleedTile(rgba, width, height);
  const color = brandColor(rgba);
  let img = sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } });
  if (!bleed) {
    // Trim empty margins so every logo fills its plate the same way.
    const trimmed = await img.png().toBuffer();
    img = sharp(trimmed).trim({ threshold: 1 });
  }
  const square = await img
    .resize(EDGE, EDGE, { fit: bleed ? 'cover' : 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .webp({ quality: 88, alphaQuality: 90, effort: 6 })
    .toBuffer();
  return { bytes: square, bleed, color };
}

const { domains, overrides = {} } = JSON.parse(await readFile(new URL('content/company-domains.json', ROOT), 'utf8'));
const simpleData = (await get(`${SIMPLE_ICONS}/data/simple-icons.json`, { type: 'text' })) ?? { body: '[]' };
const simpleList = JSON.parse(simpleData.body);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const simpleBy = new Map(simpleList.map((i) => [norm(i.title), { slug: i.slug ?? norm(i.title), hex: i.hex }]));
const sets = JSON.parse(await readFile(new URL('src/js/data/company-sets.json', ROOT), 'utf8'));
const names = new Map(sets.companies.map((c) => [c.slug, c.name]));

const previous = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{"logos":{}}'));
const logos = only ? { ...previous.logos } : {};
const report = [];
await mkdir(OUT_DIR, { recursive: true });

const queue = Object.entries(domains).filter(([slug]) => !only || only.has(slug));
let done = 0;
async function work() {
  for (let next = queue.shift(); next; next = queue.shift()) {
    const [slug, domain] = next;
    const name = names.get(slug) ?? slug;
    if (!domain) {
      delete logos[slug];
      await rm(new URL(`${slug}.webp`, OUT_DIR), { force: true });
      report.push({ slug, name, source: 'kept as a monogram' });
      continue;
    }
    // An override of "none": no source is good enough, the monogram reads better.
    const list = overrides[slug] === 'none' ? [] : await candidates(slug, domain, simpleBy.get(norm(name)), overrides[slug]);
    const pick = await best(list);
    if (!pick) {
      delete logos[slug];
      await rm(new URL(`${slug}.webp`, OUT_DIR), { force: true });
      report.push({ slug, name, source: 'nothing usable: monogram' });
    } else {
      const out = await finish(pick);
      await writeFile(new URL(`${slug}.webp`, OUT_DIR), out.bytes);
      logos[slug] = { bleed: out.bleed, color: out.color };
      report.push({ slug, name, source: `${pick.kind}${Number.isFinite(pick.size) ? ` ${pick.size}px` : ' vector'}`, url: pick.url, bleed: out.bleed, color: out.color, bytes: out.bytes.length });
    }
    done++;
    if (done % 10 === 0) console.log(`${done} companies`);
  }
}
await Promise.all(Array.from({ length: 6 }, work));

const sorted = Object.fromEntries(Object.entries(logos).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(
  MANIFEST,
  `${JSON.stringify({ _doc: 'Company logos in src/brand/companies/<slug>.webp (scripts/content/fetch-logos.mjs). bleed: an app-icon square drawn edge to edge; color: the brand colour, for the company page. A company missing here keeps its monogram.', logos: sorted }, null, 1)}\n`,
);

report.sort((a, b) => a.slug.localeCompare(b.slug));
const rows = report
  .map((r) => `<figure><div class="t${r.bleed ? ' b' : ''}">${logos[r.slug] ? `<img src="../../src/brand/companies/${r.slug}.webp">` : '<span>-</span>'}</div><figcaption><b>${r.name}</b><br>${r.source}${r.color ? ` <i style="background:${r.color}"></i>` : ''}</figcaption></figure>`)
  .join('');
await mkdir(new URL('.', reportPath), { recursive: true });
await writeFile(
  reportPath,
  `<!doctype html><meta charset="utf-8"><title>Logos</title><style>body{background:#1c1a17;color:#ddd;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:16px}figure{width:120px;margin:0}.t{width:56px;height:56px;border-radius:12px;background:#f3eee6;display:grid;place-items:center}.t img{width:40px;height:40px;object-fit:contain}.t.b{background:none}.t.b img{width:56px;height:56px;border-radius:12px}i{display:inline-block;width:10px;height:10px;border-radius:5px}</style>${rows}`,
);
const used = report.filter((r) => logos[r.slug]).length;
console.log(`${used} of ${report.length} companies have a logo; report: ${reportPath.pathname}`);
