// Design system invariants (docs/DESIGN.md): token completeness, WCAG AA contrast,
// 12 px type floor and scale, radius tokens, and self-hosted woff2 font assets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS_URL = new URL('../src/css/app.css', import.meta.url);
const RAW_CSS = readFileSync(CSS_URL, 'utf8');
const CSS = RAW_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Extract the brace-balanced body starting right at `{`. */
function extractBlock(text, openBraceIdx) {
  let depth = 0;
  for (let i = openBraceIdx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return { body: text.slice(openBraceIdx + 1, i), end: i + 1 };
    }
  }
  throw new Error(`Unclosed block at index ${openBraceIdx}`);
}

/** Parse CSS custom properties inside a declaration block body. */
function parseVars(body) {
  const vars = new Map();
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    vars.set(m[1], m[2].trim());
  }
  return vars;
}

/** Collect all `:root` blocks with whether each lives inside `@media`. */
function findRootBlocks(css) {
  const roots = [];
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    else if (css.startsWith(':root', i) && /^:root\s*\{/.test(css.slice(i, i + 20))) {
      const openIdx = css.indexOf('{', i);
      const { body, end } = extractBlock(css, openIdx);
      roots.push({ nested: depth > 0, vars: parseVars(body), start: i, end });
      i = end - 1;
    }
  }
  return roots;
}

/** Parse `@font-face` blocks into property maps. */
function findFontFaces(css) {
  const faces = [];
  for (const m of css.matchAll(/@font-face\s*\{/g)) {
    const openIdx = m.index + m[0].length - 1;
    const { body, end } = extractBlock(css, openIdx);
    const props = new Map();
    for (const d of body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/gi)) {
      props.set(d[1].toLowerCase(), d[2].trim());
    }
    faces.push({ props, start: m.index, end });
  }
  return faces;
}

/** Remove `:root { ... }` and `@font-face { ... }` blocks for component rule inspection. */
function stripRootsAndFontFaces(css) {
  const ranges = [
    ...findRootBlocks(css).map((b) => [b.start, b.end]),
    ...findFontFaces(css).map((b) => [b.start, b.end]),
  ].sort((a, b) => a[0] - b[0]);
  let out = '';
  let pos = 0;
  for (const [start, end] of ranges) {
    if (start > pos) out += css.slice(pos, start);
    pos = Math.max(pos, end);
  }
  return out + css.slice(pos);
}

function parseHex(hex) {
  const clean = hex.trim();
  assert.match(clean, /^#[0-9a-f]{6}$/i, `expected 6-digit hex colour, got "${hex}"`);
  return [
    parseInt(clean.slice(1, 3), 16),
    parseInt(clean.slice(3, 5), 16),
    parseInt(clean.slice(5, 7), 16),
  ];
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const roots = findRootBlocks(CSS);
const baseRoot = roots.find((r) => !r.nested)?.vars;
const coarseRoot = roots.find((r) => r.nested)?.vars;
const componentCss = stripRootsAndFontFaces(CSS);

test('base :root defines all required tokens and separates medium from accent and solid danger', () => {
  assert.ok(baseRoot, 'top-level :root block not found');
  assert.ok(coarseRoot, 'coarse-pointer :root override block not found');

  const required = [
    '--bg', '--panel', '--panel-2', '--panel-3', '--panel-hover',
    '--border', '--border-strong', '--border-control',
    '--text', '--text-2', '--muted',
    '--accent', '--accent-ink', '--accent-soft', '--accent-hover',
    '--ok', '--ok-soft', '--bad', '--bad-solid', '--bad-ink', '--bad-soft', '--warn', '--info',
    '--easy', '--medium', '--hard',
    '--fs-xs', '--fs-sm', '--fs-md', '--fs-lg', '--fs-xl', '--fs-2xl', '--fs-display',
    '--font', '--mono',
    '--s-1', '--s-2', '--s-3', '--s-4', '--s-5', '--s-6', '--s-7',
    '--r-tag', '--r-sm', '--r-md', '--r-pill',
    '--ctl-sm', '--ctl-md', '--ctl-lg',
    '--page', '--page-narrow', '--header-h',
    '--t-fast', '--t-med', '--ease',
  ];
  for (const name of required) {
    assert.ok(baseRoot.has(name), `missing token ${name} in :root`);
  }

  assert.notEqual(baseRoot.get('--medium').toLowerCase(), baseRoot.get('--accent').toLowerCase());
  assert.notEqual(baseRoot.get('--bad-solid').toLowerCase(), baseRoot.get('--bad').toLowerCase());
});

test('text tokens meet WCAG AA (>= 4.5:1) on every surface', () => {
  const surfaces = ['--bg', '--panel', '--panel-2', '--panel-3'];
  const texts = ['--text', '--text-2', '--muted'];
  for (const fg of texts) {
    for (const bg of surfaces) {
      const ratio = contrastRatio(baseRoot.get(fg), baseRoot.get(bg));
      assert.ok(ratio >= 4.5, `${fg} on ${bg} contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
    }
  }
});

test('control border meets >= 3:1 on resting control surfaces', () => {
  for (const bg of ['--bg', '--panel', '--panel-2']) {
    const ratio = contrastRatio(baseRoot.get('--border-control'), baseRoot.get(bg));
    assert.ok(ratio >= 3.0, `--border-control on ${bg} contrast ${ratio.toFixed(2)}:1 is below 3.0:1`);
  }
});

test('button ink and background pairs meet WCAG AA (>= 4.5:1)', () => {
  const pairs = [
    ['--accent-ink', '--accent'],
    ['--accent-ink', '--accent-hover'],
    ['--text', '--panel-hover'],
    ['--bad-ink', '--bad-solid'],
    ['--text', '--panel-3'],
    ['--text-2', '--bg'],
    ['--text-2', '--panel'],
    ['--text-2', '--panel-2'],
    ['--text-2', '--panel-3'],
  ];
  for (const [fg, bg] of pairs) {
    const ratio = contrastRatio(baseRoot.get(fg), baseRoot.get(bg));
    assert.ok(ratio >= 4.5, `${fg} on ${bg} contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
  }
});

test('difficulty and selected-state text meet WCAG AA (>= 4.5:1) where they render', () => {
  // Difficulty is a dot plus a 12 px word (no tinted pill), so the word itself must pass on the
  // surfaces it sits on: page, cards, inset rows and hovered table rows. A selected segment shows
  // accent text on --panel-3.
  const pairs = [
    ...['--easy', '--medium', '--hard'].flatMap((fg) => ['--bg', '--panel', '--panel-2'].map((bg) => [fg, bg])),
    ['--accent', '--panel-3'],
    ['--accent', '--panel-2'],
  ];
  for (const [fg, bg] of pairs) {
    const ratio = contrastRatio(baseRoot.get(fg), baseRoot.get(bg));
    assert.ok(ratio >= 4.5, `${fg} on ${bg} contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
  }
});

test('type scale tokens stay >= 12px on the defined scale and all CSS rules use --fs-* tokens', () => {
  const allowedBaseSizes = new Set([12, 13, 14, 16, 20, 26, 38]);
  const fsTokens = new Set();

  for (const [name, val] of baseRoot) {
    if (!name.startsWith('--fs-')) continue;
    fsTokens.add(name);
    const m = val.match(/^(\d+(?:\.\d+)?)px$/);
    assert.ok(m, `${name} must be in px, got "${val}"`);
    const px = Number(m[1]);
    assert.ok(px >= 12, `${name} (${px}px) violates 12px floor`);
    assert.ok(allowedBaseSizes.has(px), `${name} (${px}px) is not on the approved type scale`);
  }

  for (const [name, val] of coarseRoot) {
    if (!name.startsWith('--fs-')) continue;
    const m = val.match(/^(\d+(?:\.\d+)?)px$/);
    assert.ok(m, `coarse ${name} must be in px, got "${val}"`);
    const px = Number(m[1]);
    assert.ok(px >= 12, `coarse ${name} (${px}px) violates 12px floor`);
    assert.ok(name === '--fs-md' ? px === 15 : allowedBaseSizes.has(px), `unexpected coarse ${name}: ${val}`);
  }

  for (const m of componentCss.matchAll(/(?:^|[;{\s])font-size\s*:\s*([^;{}]+);/gi)) {
    const val = m[1].trim();
    if (val === 'inherit') continue;
    const ref = val.match(/^var\((--fs-[a-z0-9-]+)\)$/);
    assert.ok(ref && fsTokens.has(ref[1]), `font-size must use a defined --fs-* token, found "${val}"`);
  }

  for (const m of componentCss.matchAll(/(?:^|[;{\s])font\s*:\s*([^;{}]+);/gi)) {
    const val = m[1].trim();
    if (val === 'inherit') continue;
    assert.ok(!/\b\d+(?:\.\d+)?(?:px|rem|em|pt)\b/i.test(val), `font shorthand uses literal size: "${val}"`);
    const ref = val.match(/var\((--fs-[a-z0-9-]+)\)/);
    assert.ok(ref && fsTokens.has(ref[1]), `font shorthand must reference a defined --fs-* token: "${val}"`);
  }
});

test('all border-radius declarations use radius tokens, 50%, inherit, or 0', () => {
  const radiusTokens = new Set([...baseRoot.keys()].filter((k) => k.startsWith('--r-')));
  for (const m of componentCss.matchAll(/(?:^|[;{\s])border-radius\s*:\s*([^;{}]+);/gi)) {
    const parts = m[1].trim().split(/\s+/);
    for (const part of parts) {
      if (part === '0' || part === '50%' || part === 'inherit') continue;
      const ref = part.match(/^var\((--r-[a-z0-9-]+)\)$/);
      assert.ok(ref && radiusTokens.has(ref[1]), `border-radius must use a defined --r-* token, found "${m[1].trim()}"`);
    }
  }
});

test('self-hosted Inter and JetBrains Mono woff2 fonts exist, use swap, and stay within budget', () => {
  const faces = findFontFaces(CSS);
  assert.ok(faces.length >= 2, `expected at least 2 @font-face rules, found ${faces.length}`);
  const families = new Set();
  const seenFiles = new Set();
  let totalBytes = 0;

  for (const face of faces) {
    assert.equal(face.props.get('font-display'), 'swap', 'every @font-face must use font-display: swap');
    const family = (face.props.get('font-family') ?? '').replace(/^['"]|['"]$/g, '');
    families.add(family);
    const src = face.props.get('src') ?? '';
    assert.ok(!/https?:/i.test(src), `@font-face src must be local, got "${src}"`);
    const urlMatch = src.match(/url\(['"]?([^'")]+)['"]?\)\s*format\(['"]woff2['"]\)/i);
    assert.ok(urlMatch, `expected local woff2 url in @font-face src, got "${src}"`);
    assert.ok(urlMatch[1].startsWith('../fonts/'), `expected ../fonts/ path, got "${urlMatch[1]}"`);

    if (!seenFiles.has(urlMatch[1])) {
      seenFiles.add(urlMatch[1]);
      const buf = readFileSync(new URL(urlMatch[1], CSS_URL));
      assert.equal(buf.subarray(0, 4).toString('ascii'), 'wOF2', `${urlMatch[1]} is not a valid WOFF2 file`);
      totalBytes += buf.length;
    }
  }

  assert.ok(families.has('Inter'), 'Inter @font-face missing');
  assert.ok(families.has('JetBrains Mono'), 'JetBrains Mono @font-face missing');
  assert.ok(totalBytes < 250 * 1024, `self-hosted fonts total ${totalBytes} bytes exceeds 250 KB budget`);
});
