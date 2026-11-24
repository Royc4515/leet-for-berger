/**
 * Pure helpers for the company logo pipeline (scripts/content/fetch-logos.mjs): find a company's
 * icons in its home page and web manifest, read .ico files, rank what was found, clean a white
 * background, decide whether an icon is a full-bleed tile, and pick a brand colour. No I/O here, so
 * every rule is unit-tested (tests/company-logos.test.js).
 */

/**
 * @typedef {{ url: string, kind: string, size: number, vector: boolean, color?: string|null }} Candidate
 *   size: the larger side in px as declared or measured (Infinity for a vector); kind: where it came from
 */

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : null;
};

/** Largest edge from a sizes attribute ("180x180", "16x16 32x32", "any"). */
export function sizeFromAttr(sizes) {
  if (!sizes) return 0;
  if (/\bany\b/i.test(sizes)) return Infinity;
  return Math.max(0, ...[...sizes.matchAll(/(\d+)\s*x\s*(\d+)/gi)].map((m) => Math.max(Number(m[1]), Number(m[2]))));
}

/**
 * Icon links a page declares: icons, Apple touch icons, the Safari mask icon and the web manifest.
 * @param {string} html
 * @param {string} base the page URL, to resolve relative links
 * @returns {{ icons: Candidate[], manifest: string|null }}
 */
export function iconLinksFromHtml(html, base) {
  const icons = [];
  let manifest = null;
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase();
    const href = attr(tag, 'href');
    if (!href || href.startsWith('data:')) continue;
    let url;
    try {
      url = new URL(href, base).href;
    } catch {
      continue;
    }
    if (rel.split(/\s+/).includes('manifest')) {
      manifest ??= url;
      continue;
    }
    const type = (attr(tag, 'type') ?? '').toLowerCase();
    const vector = type.includes('svg') || /\.svg(\?|#|$)/i.test(url);
    if (rel.includes('mask-icon')) icons.push({ url, kind: 'mask-icon', size: Infinity, vector: true, color: attr(tag, 'color') });
    else if (rel.includes('apple-touch-icon')) icons.push({ url, kind: 'apple-touch', size: sizeFromAttr(attr(tag, 'sizes')) || 180, vector });
    else if (/\bicon\b/.test(rel)) icons.push({ url, kind: vector ? 'site-svg' : 'site-icon', size: vector ? Infinity : sizeFromAttr(attr(tag, 'sizes')), vector });
  }
  return { icons, manifest };
}

/**
 * Icons a web app manifest lists.
 * @param {any} json parsed manifest
 * @param {string} base the manifest URL
 * @returns {Candidate[]}
 */
export function iconsFromManifest(json, base) {
  const out = [];
  for (const icon of Array.isArray(json?.icons) ? json.icons : []) {
    if (!icon?.src || String(icon.src).startsWith('data:')) continue;
    // A maskable icon is drawn for a platform to crop: its glyph is small inside a padded square.
    if (String(icon.purpose ?? '').includes('maskable') && !String(icon.purpose).includes('any')) continue;
    try {
      const url = new URL(icon.src, base).href;
      const vector = String(icon.type ?? '').includes('svg') || /\.svg(\?|#|$)/i.test(url);
      out.push({ url, kind: 'manifest', size: vector ? Infinity : sizeFromAttr(icon.sizes), vector });
    } catch {
      /* a broken entry is skipped */
    }
  }
  return out;
}

/**
 * The frames of a .ico file. PNG frames are returned as PNG bytes; 32-bit BMP frames are decoded to
 * RGBA (bottom-up rows, BGRA order); other depths are skipped.
 * @param {Uint8Array} buf
 * @returns {{ width: number, height: number, png?: Uint8Array, rgba?: Uint8Array }[]}
 */
export function parseIco(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length < 6 || view.getUint16(0, true) !== 0 || view.getUint16(2, true) !== 1) return [];
  const count = view.getUint16(4, true);
  const frames = [];
  for (let i = 0; i < count; i++) {
    const at = 6 + i * 16;
    if (at + 16 > buf.length) break;
    const width = buf[at] || 256;
    const height = buf[at + 1] || 256;
    const size = view.getUint32(at + 8, true);
    const offset = view.getUint32(at + 12, true);
    if (offset + size > buf.length) continue;
    const data = buf.subarray(offset, offset + size);
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
      frames.push({ width, height, png: data });
      continue;
    }
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (data.length < 40 || dv.getUint16(14, true) !== 32) continue;
    const headerSize = dv.getUint32(0, true);
    const rgba = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const src = headerSize + ((height - 1 - y) * width + x) * 4;
        const dst = (y * width + x) * 4;
        rgba[dst] = data[src + 2];
        rgba[dst + 1] = data[src + 1];
        rgba[dst + 2] = data[src];
        rgba[dst + 3] = data[src + 3];
      }
    }
    frames.push({ width, height, rgba });
  }
  return frames;
}

/**
 * How good a found icon is: a full-colour vector beats everything; then big rasters; Simple Icons
 * (a one-colour vector in the brand's colour) beats a small raster; the Safari mask icon (one
 * colour, often the plain glyph) is a last vector resort. Rasters under 48 px are not used.
 * @param {Candidate} c with `size` measured after download when possible
 * @returns {number} higher is better, 0 means unusable
 */
export function scoreCandidate(c) {
  if (c.kind === 'mask-icon') return 30;
  if (c.kind === 'simple-icons') return 60;
  if (c.vector) return 100;
  const s = c.size;
  if (s >= 180) return 90;
  if (s >= 128) return 80;
  if (s >= 96) return 50;
  if (s >= 64) return 40;
  if (s >= 48) return 20;
  return 0;
}

/**
 * Best first; ties keep the order found (the page's own icons come before the icon services).
 * @param {Candidate[]} list
 * @returns {Candidate[]} usable candidates only
 */
export function rankCandidates(list) {
  return list
    .map((c, i) => ({ c, i, s: scoreCandidate(c) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c);
}

const isNearWhite = (d, i, tol) => d[i + 3] > 200 && d[i] >= 255 - tol && d[i + 1] >= 255 - tol && d[i + 2] >= 255 - tol;
const isClear = (d, i) => d[i + 3] < 40;

/**
 * Makes a white background transparent: a flood fill from the four corners through near-white
 * pixels, so white inside the logo (the counter of an "o") stays. With `throughClear`, the fill
 * also starts from transparent corners and passes through transparent pixels, which clears a white
 * disc or rounded square sitting behind a logo on a transparent canvas.
 * @param {Uint8Array} rgba width * height * 4
 * @param {number} width
 * @param {number} height
 * @param {{ tol?: number, throughClear?: boolean }} [opts] tol: how far from pure white still counts
 * @returns {{ rgba: Uint8Array, cleared: number }} a new buffer and how many pixels were cleared
 */
export function clearWhiteBackground(rgba, width, height, { tol = 18, throughClear = false } = {}) {
  const out = new Uint8Array(rgba);
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  // Through a transparent canvas, a light pixel of any opacity is passable too: a disc's
  // anti-aliased rim would otherwise wall its white inside off from the outside.
  const isLightRim = (i) => out[i] > 205 && out[i + 1] > 205 && out[i + 2] > 205;
  const passable = (p) => isNearWhite(out, p * 4, tol) || (throughClear && (isClear(out, p * 4) || isLightRim(p * 4)));
  const seeds = corners.filter(passable);
  if (!throughClear && seeds.length < 4) return { rgba: out, cleared: 0 };
  const seen = new Uint8Array(width * height);
  const stack = [...seeds];
  let cleared = 0;
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!passable(p)) continue;
    if (!isClear(out, p * 4)) {
      out[p * 4 + 3] = 0;
      cleared++;
    }
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  return { rgba: out, cleared };
}

const visible = (rgba) => {
  let n = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] >= 128) n++;
  return n;
};

/** Bounding box of the pixels `keep(i)` selects, or null. */
function bbox(width, height, keep) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0; p < width * height; p++) {
    if (!keep(p * 4)) continue;
    const x = p % width;
    const y = (p - x) / width;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/**
 * Gets a logo ready for the light plate. White that surrounds the rest of the logo (a square, a
 * disc behind it) is a backdrop: removed, so the logo sits on the plate. White that does not
 * surround anything is part of the logo (white text drawn for a dark page): kept and drawn in the
 * ink. Coloured parts are never changed. An app-icon square (isBleedTile) is left as it is.
 * @param {Uint8Array} rgba
 * @param {number} width
 * @param {number} height
 * @param {string} ink #rrggbb, the plate's ink
 * @returns {Uint8Array|null} null when nothing would be visible
 */
export function cleanLogo(rgba, width, height, ink) {
  if (isBleedTile(rgba, width, height)) return new Uint8Array(rgba);
  if (!visible(rgba)) return null;
  const { rgba: cleared, cleared: n } = clearWhiteBackground(rgba, width, height, { throughClear: true });
  let base = new Uint8Array(rgba);
  if (n) {
    const gone = bbox(width, height, (i) => rgba[i + 3] >= 128 && cleared[i + 3] < 128);
    const rest = bbox(width, height, (i) => cleared[i + 3] >= 128);
    const surrounds = rest && gone && gone.minX <= rest.minX && gone.minY <= rest.minY && gone.maxX >= rest.maxX && gone.maxY >= rest.maxY;
    if (surrounds) base = cleared;
  }
  if (whiteShare(base) > 0.3) base = inkWhite(base, ink);
  return visible(base) ? base : null;
}

/**
 * An app-icon style logo: the glyph sits on its own coloured square that fills the image (Dell's
 * blue, Amazon's orange). Drawn edge to edge in the tile instead of on the light plate.
 * @param {Uint8Array} rgba
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function isBleedTile(rgba, width, height) {
  let opaque = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] > 200) opaque++;
  if (opaque < width * height * 0.85) return false;
  // The edge midpoints carry the background colour (corners may be rounded off).
  const at = (x, y) => (y * width + x) * 4;
  const edges = [at(width >> 1, 1), at(width >> 1, height - 2), at(1, height >> 1), at(width - 2, height >> 1)];
  const [r, g, b] = [rgba[edges[0]], rgba[edges[0] + 1], rgba[edges[0] + 2]];
  const same = edges.every((i) => Math.abs(rgba[i] - r) + Math.abs(rgba[i + 1] - g) + Math.abs(rgba[i + 2] - b) < 60 && rgba[i + 3] > 200);
  const white = r > 235 && g > 235 && b > 235;
  return same && !white;
}

/**
 * The brand colour: the most common saturated colour, ignoring near-white, near-black and grey
 * pixels. Null for a black-and-white logo.
 * @param {Uint8Array} rgba
 * @returns {string|null} #rrggbb
 */
export function brandColor(rgba) {
  const bins = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 200) continue;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 40 || min > 225 || max - min < 40) continue;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n++;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bins.set(key, bin);
  }
  const best = [...bins.values()].sort((a, b) => b.n - a.n)[0];
  if (!best || best.n < 12) return null;
  const hex = (v) => Math.round(v / best.n).toString(16).padStart(2, '0');
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

/** White or a light grey (a white logo's anti-aliased edge, a light grey wordmark). */
const isLight = (d, i) => d[i] > 205 && d[i + 1] > 205 && d[i + 2] > 205;

/**
 * The share of a logo's visible pixels that are near white. A logo drawn for a dark page (white
 * text, sometimes with coloured accents) would partly vanish on the light plate.
 * @param {Uint8Array} rgba after the white background was cleared
 * @returns {number} 0..1, and 1 when nothing is visible
 */
export function whiteShare(rgba) {
  let seen = 0;
  let white = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    seen++;
    if (isLight(rgba, i)) white++;
  }
  return seen ? white / seen : 1;
}

/**
 * Recolours the near-white parts of a logo in the ink, keeping its colours: white text on a
 * dark-page logo becomes dark text, the coloured accents stay.
 * @param {Uint8Array} rgba
 * @param {string} ink #rrggbb
 * @returns {Uint8Array} a new buffer
 */
export function inkWhite(rgba, ink) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16));
  const out = new Uint8Array(rgba);
  for (let i = 0; i < out.length; i += 4) {
    if (isLight(out, i)) out.set([r, g, b], i);
  }
  return out;
}
