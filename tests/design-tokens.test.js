// Design system invariants (docs/DESIGN.md, Atlas): token completeness, the colour theme layers,
// WCAG AA contrast in every theme and code theme, the 12 px type floor and scale, radius tokens, no
// literal colours or durations in component rules, and the self-hosted woff2 fonts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CODE_THEMES, CODE_TOKENS, monacoTheme } from '../src/js/data/themes.js';

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

// A token block is a rule whose every selector is :root, [data-theme...] or [data-code-theme...]
// (app.css, "Colour themes"); anything else is a component rule.
const TOKEN_SELECTOR = /^(?::root|\[data-(?:code-)?theme(?:='[\w-]+')?\])$/;

/** Collect every token block: its selector (whitespace removed), whether it sits in an at-rule, its vars. */
function findTokenBlocks(css) {
  const blocks = [];
  let depth = 0;
  let selectorStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const selector = css.slice(selectorStart, i).trim().replace(/\s+/g, '');
      if (selector && selector.split(',').every((part) => TOKEN_SELECTOR.test(part))) {
        const { body, end } = extractBlock(css, i);
        blocks.push({ selector, nested: depth > 0, vars: parseVars(body), start: selectorStart, end });
        i = end - 1;
        selectorStart = end;
        continue;
      }
      depth++;
      selectorStart = i + 1;
    } else if (ch === '}') {
      depth--;
      selectorStart = i + 1;
    } else if (ch === ';' && depth === 0) {
      selectorStart = i + 1;
    }
  }
  return blocks;
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

/** Remove token blocks and `@font-face { ... }` blocks for component rule inspection. */
function stripTokensAndFontFaces(css) {
  const ranges = [
    ...findTokenBlocks(css).map((b) => [b.start, b.end]),
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

const blocks = findTokenBlocks(CSS);
const block = (selector, nested = false) => blocks.find((b) => b.selector === selector && b.nested === nested)?.vars;
const baseRoot = block(':root');
const coarseRoot = block(':root', true);
const darkPalette = block(":root,[data-theme='dark']");
const lightPalette = block("[data-theme='light']");
const derived = block(':root,[data-theme],[data-code-theme]');
const codeBlocks = new Map(blocks.flatMap((b) => {
  const m = b.selector.match(/^\[data-code-theme='([\w-]+)'\]$/);
  return m ? [[m[1], b.vars]] : [];
}));
const componentCss = stripTokensAndFontFaces(CSS);

/** Every var() in a value replaced by its value in `vars`, until none is left. */
function resolve(vars, value) {
  let out = value;
  for (let i = 0; i < 10 && /var\(/.test(out); i++) out = out.replace(/var\((--[a-z0-9-]+)\)/gi, (_, name) => vars.get(name) ?? `missing(${name})`);
  return out;
}

/** The tokens an element sees, layers in cascade order; each value with its var()s resolved. */
function theme(...layers) {
  const merged = new Map(layers.flatMap((l) => [...(l ?? [])]));
  return new Map([...merged].map(([k, v]) => [k, resolve(merged, v)]));
}

const THEMES = {
  dark: theme(baseRoot, darkPalette, derived),
  light: theme(baseRoot, darkPalette, lightPalette, derived),
};
/** The tokens an editor host sees in a code theme: its site palette, then its own code block. */
const codeTheme = (t) => theme(baseRoot, darkPalette, t.scheme === 'light' ? lightPalette : null, derived, codeBlocks.get(t.id));

test('the token layers are all there and the dark theme defines every Atlas token', () => {
  for (const [name, vars] of Object.entries({ baseRoot, coarseRoot, darkPalette, lightPalette, derived })) {
    assert.ok(vars, `${name} token block not found in app.css`);
  }

  const required = [
    '--bg', '--panel', '--panel-2', '--panel-3', '--panel-hover', '--scrim',
    '--border', '--border-strong', '--border-control',
    '--text', '--text-2', '--muted',
    '--accent', '--accent-hover', '--accent-ink', '--accent-soft', '--accent-line', '--accent-glow', '--accent-dim', '--accent-text', '--focus',
    '--ok', '--ok-soft', '--bad', '--bad-solid', '--bad-ink', '--bad-soft', '--warn', '--warn-soft', '--info', '--info-soft',
    '--easy', '--medium', '--hard',
    '--hex-new', '--hex-locked', '--hex-solved', '--hex-assisted', '--road', '--road-lit',
    '--display', '--font', '--mono',
    '--fs-xs', '--fs-sm', '--fs-md', '--fs-lg', '--fs-xl', '--fs-2xl', '--fs-3xl', '--fs-display',
    '--s-1', '--s-2', '--s-3', '--s-4', '--s-5', '--s-6', '--s-7', '--s-8',
    '--r-tag', '--r-sm', '--r-md', '--r-lg', '--r-pill',
    '--shadow-1', '--shadow-2', '--shadow-lamp',
    '--ctl-sm', '--ctl-md', '--ctl-lg',
    '--page', '--page-wide', '--page-narrow', '--header-h', '--tab-bar-h', '--hex',
    '--t-instant', '--t-fast', '--t-base', '--t-slow', '--t-stage', '--t-stagger', '--t-loop', '--t-pulse',
    '--ease', '--ease-in-out', '--ease-spring',
    ...CODE_TOKENS,
  ];
  for (const name of required) assert.ok(THEMES.dark.has(name), `missing token ${name}`);
});

test('each colour is written once: the light palette replaces exactly the dark one, derived tokens only derive', () => {
  // A dark colour the light palette forgot would show through on paper.
  assert.deepEqual([...lightPalette.keys()].sort(), [...darkPalette.keys()].sort(), 'light and dark palettes name different tokens');
  const both = [...derived.keys()].filter((k) => darkPalette.has(k) || baseRoot.has(k));
  assert.deepEqual(both, [], 'derived tokens must not also be palette or base tokens');
  for (const [name, value] of derived) assert.ok(/var\(/.test(value), `derived ${name} must be computed from the palette, got "${value}"`);
  for (const name of baseRoot.keys()) assert.ok(!darkPalette.has(name), `${name} is in both the base and the palette`);
});

test('code themes: one CSS block for each theme that is not a site palette, setting every code token', () => {
  const own = CODE_THEMES.filter((t) => !t.site).map((t) => t.id).sort();
  assert.deepEqual([...codeBlocks.keys()].sort(), own, 'code theme blocks in app.css and CODE_THEMES differ');
  for (const [id, vars] of codeBlocks) assert.deepEqual([...vars.keys()].sort(), [...CODE_TOKENS].sort(), `${id} must set exactly the code tokens`);
  for (const t of CODE_THEMES.filter((x) => x.site)) assert.ok(THEMES[t.scheme], `${t.id} draws on a site palette that exists`);
});

for (const [name, vars] of Object.entries(THEMES)) {
  const c = (fg, bg) => contrastRatio(vars.get(fg), vars.get(bg));

  test(`${name}: medium differs from the lamp, solid danger from danger text`, () => {
    assert.notEqual(vars.get('--medium').toLowerCase(), vars.get('--accent').toLowerCase());
    assert.notEqual(vars.get('--bad-solid').toLowerCase(), vars.get('--bad').toLowerCase());
  });

  test(`${name}: text tokens meet WCAG AA (>= 4.5:1) on every surface`, () => {
    for (const fg of ['--text', '--text-2', '--muted']) {
      for (const bg of ['--bg', '--panel', '--panel-2', '--panel-3']) {
        assert.ok(c(fg, bg) >= 4.5, `${fg} on ${bg} contrast ${c(fg, bg).toFixed(2)}:1 is below 4.5:1`);
      }
    }
  });

  test(`${name}: control borders, the focus ring and the lamp meet >= 3:1 on every surface they sit on`, () => {
    for (const bg of ['--bg', '--panel', '--panel-2']) {
      assert.ok(c('--border-control', bg) >= 3, `--border-control on ${bg} contrast ${c('--border-control', bg).toFixed(2)}:1 is below 3:1`);
      // The lamp as a mark (the next problem's ring, the current tier): a graphic, 3:1.
      assert.ok(c('--accent', bg) >= 3, `--accent on ${bg} contrast ${c('--accent', bg).toFixed(2)}:1 is below 3:1`);
    }
    for (const bg of ['--bg', '--panel', '--panel-2', '--panel-3']) {
      assert.ok(c('--focus', bg) >= 3, `--focus on ${bg} contrast ${c('--focus', bg).toFixed(2)}:1 is below 3:1`);
    }
  });

  test(`${name}: button ink and background pairs meet WCAG AA (>= 4.5:1)`, () => {
    const pairs = [
      ['--accent-ink', '--accent'],
      ['--accent-ink', '--accent-hover'],
      ['--text', '--panel-hover'],
      ['--bad-ink', '--bad-solid'],
      ['--text', '--panel-3'],
    ];
    for (const [fg, bg] of pairs) assert.ok(c(fg, bg) >= 4.5, `${fg} on ${bg} contrast ${c(fg, bg).toFixed(2)}:1 is below 4.5:1`);
  });

  test(`${name}: semantic, difficulty and lamp text meet WCAG AA (>= 4.5:1) where they render`, () => {
    const pairs = [
      ...['--easy', '--medium', '--hard', '--ok', '--bad', '--warn', '--info', '--accent-text'].flatMap((fg) => ['--bg', '--panel', '--panel-2'].map((bg) => [fg, bg])),
      ['--accent-text', '--panel-3'],
    ];
    for (const [fg, bg] of pairs) assert.ok(c(fg, bg) >= 4.5, `${fg} on ${bg} contrast ${c(fg, bg).toFixed(2)}:1 is below 4.5:1`);
  });
}

for (const t of CODE_THEMES) {
  test(`code theme ${t.label}: hex colours Monaco accepts, syntax at 4.5:1, line numbers and cursor at 3:1`, () => {
    const vars = codeTheme(t);
    const read = (token) => vars.get(token);
    for (const token of CODE_TOKENS) assert.match(read(token) ?? '', /^#[0-9a-f]{6}$/i, `${t.id} ${token} must be a #rrggbb colour (Monaco takes no other)`);
    const c = (fg) => contrastRatio(read(fg), read('--code-bg'));
    for (const fg of ['--code-fg', '--code-comment', '--code-keyword', '--code-string', '--code-number', '--code-type', '--code-delimiter', '--code-identifier', '--code-gutter-active', '--code-bracket-1', '--code-bracket-2', '--code-bracket-3']) {
      assert.ok(c(fg) >= 4.5, `${t.id} ${fg} contrast ${c(fg).toFixed(2)}:1 is below 4.5:1`);
    }
    for (const fg of ['--code-gutter', '--code-cursor']) assert.ok(c(fg) >= 3, `${t.id} ${fg} contrast ${c(fg).toFixed(2)}:1 is below 3:1`);
    const monaco = monacoTheme(read, t.scheme);
    assert.equal(monaco.base, t.scheme === 'light' ? 'vs' : 'vs-dark');
    assert.equal(monaco.colors['editor.background'], read('--code-bg'));
  });
}

test('type scale tokens stay >= 12px on the defined scale and all CSS rules use --fs-* tokens', () => {
  const allowedBaseSizes = new Set([12, 13, 14, 16, 20, 26, 34, 48]);
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

test('all border-radius declarations use radius tokens (or calc of one), 50%, inherit, or 0', () => {
  const radiusTokens = new Set([...baseRoot.keys()].filter((k) => k.startsWith('--r-')));
  for (const m of componentCss.matchAll(/(?:^|[;{\s])border-radius\s*:\s*([^;{}]+);/gi)) {
    const val = m[1].trim();
    if (/^calc\(var\(--r-[a-z0-9-]+\)\s*-\s*\d+px\)$/.test(val)) continue;
    for (const part of val.split(/\s+/)) {
      if (part === '0' || part === '50%' || part === 'inherit') continue;
      const ref = part.match(/^var\((--r-[a-z0-9-]+)\)$/);
      assert.ok(ref && radiusTokens.has(ref[1]), `border-radius must use a defined --r-* token, found "${val}"`);
    }
  }
});

test('component rules use no literal colours: every colour comes from a token', () => {
  // Data URIs (icon SVGs) are self-contained images, not rules; the reduced-motion block has none.
  const rules = componentCss.replace(/url\("data:[^"]*"\)/g, 'url()');
  const literal = [...rules.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi)].map((m) => rules.slice(Math.max(0, m.index - 60), m.index + 20).replace(/\s+/g, ' '));
  assert.deepEqual(literal, [], 'literal colours in component rules');
});

test('gaps between items come from the spacing tokens', () => {
  const offenders = [...componentCss.matchAll(/(?:^|[;{\s])((?:row-|column-)?gap)\s*:\s*([^;{}]+);/gi)].map((m) => `${m[1]}: ${m[2].trim()}`).filter((d) => /\d+px/.test(d.replace(/var\([^)]*\)/g, '')));
  assert.deepEqual(offenders, [], 'literal gaps');
});

test('animation and transition timings come from the motion tokens', () => {
  const offenders = [];
  for (const m of componentCss.matchAll(/(?:^|[;{\s])(transition|animation|animation-delay|animation-duration|transition-duration|transition-delay)\s*:\s*([^;{}]+);/gi)) {
    const val = m[2].replace(/var\([^)]*\)/g, '');
    // 1ms is the reduced-motion "instant", the only literal allowed.
    if (/\b(?!1ms\b)\d+(?:\.\d+)?m?s\b/.test(val)) offenders.push(`${m[1]}: ${m[2].trim()}`);
  }
  assert.deepEqual(offenders, [], 'literal durations');
});

test('self-hosted Bricolage Grotesque, Inter and JetBrains Mono woff2 fonts exist, use swap, and stay within budget', () => {
  const faces = findFontFaces(CSS);
  assert.ok(faces.length >= 3, `expected at least 3 @font-face rules, found ${faces.length}`);
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

  assert.ok(families.has('Bricolage Grotesque'), 'Bricolage Grotesque @font-face missing');
  assert.ok(families.has('Inter'), 'Inter @font-face missing');
  assert.ok(families.has('JetBrains Mono'), 'JetBrains Mono @font-face missing');
  assert.ok(totalBytes < 250 * 1024, `self-hosted fonts total ${totalBytes} bytes exceeds 250 KB budget`);
});
