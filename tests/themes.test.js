// Site and code themes (docs/DESIGN.md "Themes"): the code theme choices (data/themes.js), and the
// boot script that applies the site theme before the first paint (src/js/theme-boot.js), run in a
// VM with a fake page. The colours themselves are checked in tests/design-tokens.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { CODE_THEMES, CODE_THEME_OPTIONS, MATCH_SITE, codeThemeFor, parseCodeThemePref, monacoTheme, CODE_TOKENS } from '../src/js/data/themes.js';

const BOOT = readFileSync(new URL('../src/js/theme-boot.js', import.meta.url), 'utf8');

test('the code themes are the owner\'s three, offered after Match site', () => {
  assert.deepEqual(CODE_THEMES.map((t) => t.label), ['Dark Berger', 'Berger Light', 'Shuvat Light Pink']);
  assert.deepEqual(CODE_THEME_OPTIONS.map((o) => o.value), [MATCH_SITE, 'dark-berger', 'berger-light', 'shuvat-light-pink']);
  // Match site resolves to exactly one theme per site palette.
  for (const scheme of ['dark', 'light']) assert.equal(CODE_THEMES.filter((t) => t.site && t.scheme === scheme).length, 1);
});

test('a saved code theme choice falls back to Match site when missing or unknown', () => {
  assert.equal(parseCodeThemePref('shuvat-light-pink'), 'shuvat-light-pink');
  assert.equal(parseCodeThemePref(MATCH_SITE), MATCH_SITE);
  for (const raw of [null, undefined, '', 'solarized', 42]) assert.equal(parseCodeThemePref(raw), MATCH_SITE);
});

test('Match site follows the site theme; a chosen theme stays whatever the site does', () => {
  assert.equal(codeThemeFor(MATCH_SITE, 'dark').id, 'dark-berger');
  assert.equal(codeThemeFor(MATCH_SITE, 'light').id, 'berger-light');
  for (const site of ['dark', 'light']) {
    assert.equal(codeThemeFor('shuvat-light-pink', site).id, 'shuvat-light-pink');
    assert.equal(codeThemeFor('dark-berger', site).scheme, 'dark');
  }
});

test('monacoTheme maps every code token into Monaco\'s shape: base by scheme, rules without #', () => {
  const read = (token) => `#${(CODE_TOKENS.indexOf(token) + 1).toString(16).padStart(6, '0')}`;
  const dark = monacoTheme(read, 'dark');
  assert.equal(dark.base, 'vs-dark');
  assert.equal(monacoTheme(read, 'light').base, 'vs');
  assert.equal(dark.inherit, true);
  assert.equal(dark.colors['editor.background'], read('--code-bg'));
  assert.equal(dark.colors['scrollbarSlider.background'], `${read('--code-widget-border')}99`);
  for (const rule of dark.rules) assert.match(rule.foreground, /^[0-9a-f]{6}$/);
  assert.equal(dark.rules.find((r) => r.token === 'keyword').foreground, read('--code-keyword').slice(1));
  assert.equal(dark.rules.find((r) => r.token === 'comment').fontStyle, 'italic');
});

/**
 * Runs theme-boot.js against a fake page.
 * @param {{ saved?: string|null, systemLight?: boolean, blocked?: boolean }} opts
 */
function boot({ saved = null, systemLight = false, blocked = false } = {}) {
  const store = new Map(saved == null ? [] : [['lfb:theme', saved]]);
  const listeners = new Map();
  const media = { matches: systemLight, listeners: [], addEventListener: (_, cb) => media.listeners.push(cb) };
  const events = [];
  const meta = { content: '#100f0d' };
  const root = { dataset: {} };
  const window = {
    localStorage: {
      getItem: (k) => {
        if (blocked) throw new Error('blocked');
        return store.get(k) ?? null;
      },
      setItem: (k, v) => {
        if (blocked) throw new Error('blocked');
        store.set(k, v);
      },
    },
    matchMedia: () => media,
    document: { documentElement: root, querySelector: () => meta },
    getComputedStyle: () => ({ getPropertyValue: () => (root.dataset.theme === 'light' ? ' #f5f1ea' : ' #100f0d') }),
    CustomEvent: class {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
    dispatchEvent: (e) => events.push(e),
    addEventListener: (type, cb) => listeners.set(type, cb),
  };
  window.window = window;
  vm.runInNewContext(BOOT, window);
  return { root, store, media, events, meta, listeners, api: window.lfbTheme };
}

test('boot: dark by default, the saved choice otherwise, System follows the device', () => {
  assert.equal(boot().root.dataset.theme, 'dark');
  assert.equal(boot({ saved: 'light' }).root.dataset.theme, 'light');
  assert.equal(boot({ saved: 'system', systemLight: true }).root.dataset.theme, 'light');
  assert.equal(boot({ saved: 'system', systemLight: false }).root.dataset.theme, 'dark');
  assert.equal(boot({ saved: 'neon' }).root.dataset.theme, 'dark', 'an unknown value is the default');
  assert.equal(boot({ blocked: true }).root.dataset.theme, 'dark', 'blocked storage is the default');
});

test('boot: set() saves, applies, updates the browser bar and announces; System tracks the device live', () => {
  const page = boot();
  assert.deepEqual(Array.from(page.api.options, (o) => o.value), ['dark', 'light', 'system']); // Array.from: a main-realm copy of the VM's array
  page.api.set('light');
  assert.equal(page.store.get('lfb:theme'), 'light');
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.api.current(), 'light');
  assert.equal(page.meta.content, '#f5f1ea');
  assert.equal(page.events.at(-1).type, 'theme:change');

  page.api.set('system');
  assert.equal(page.root.dataset.theme, 'dark');
  page.media.matches = true;
  page.media.listeners.forEach((cb) => cb());
  assert.equal(page.root.dataset.theme, 'light', 'the device switched to light');
});

test('boot: a new choice is announced even when the theme stays (System on a dark device to Dark)', () => {
  const page = boot({ saved: 'system' });
  const before = page.events.length;
  page.api.set('dark');
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.events.length, before + 1, 'the controls showing the choice need the news');
});

test('boot: with storage blocked a choice still holds for the page; another tab\'s choice applies here', () => {
  const blocked = boot({ blocked: true });
  blocked.api.set('light');
  assert.equal(blocked.root.dataset.theme, 'light');
  assert.equal(blocked.api.get(), 'light');

  const page = boot();
  page.store.set('lfb:theme', 'light');
  page.listeners.get('storage')({ key: 'lfb:theme' });
  assert.equal(page.root.dataset.theme, 'light');
});

test('both pages load the boot script in <head>, before the stylesheet', () => {
  for (const file of ['index.html', 'privacy.html']) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const script = html.indexOf('<script src="src/js/theme-boot.js"></script>');
    assert.ok(script > 0 && script < html.indexOf('</head>'), `${file} loads theme-boot.js in <head>`);
    assert.ok(script < html.indexOf('src/css/app.css'), `${file} sets the theme before the stylesheet`);
  }
});
