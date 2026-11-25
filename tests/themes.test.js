// Site and code themes (docs/DESIGN.md "Themes"): the code theme choices (data/themes.js), and the
// boot script that applies the site theme before the first paint (src/js/theme-boot.js), run in a
// VM with a fake page. The colours themselves are checked in tests/design-tokens.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { CODE_THEMES, CODE_THEME_OPTIONS, MATCH_SITE, codeThemeFor, parseCodeThemePref, monacoTheme, CODE_TOKENS } from '../src/js/data/themes.js';

const BOOT = readFileSync(new URL('../src/js/theme-boot.js', import.meta.url), 'utf8');

test('the code themes, the owner\'s three first, are offered after Match site', () => {
  assert.deepEqual(CODE_THEMES.map((t) => t.label), ['Dark Berger', 'Berger Light', 'Shuvat Light Pink', 'Midnight Berger', 'Terminal Berger', 'High Contrast Berger', 'Berger Mint']);
  assert.deepEqual(CODE_THEME_OPTIONS.map((o) => o.value), [MATCH_SITE, ...CODE_THEMES.map((t) => t.id)]);
  assert.equal(new Set(CODE_THEMES.map((t) => t.id)).size, CODE_THEMES.length, 'ids are unique');
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
function boot({ saved = null, systemLight = false, blocked = false, header = true } = {}) {
  const store = new Map(saved == null ? [] : [['lfb:theme', saved]]);
  const listeners = new Map();
  const media = { matches: systemLight, listeners: [], addEventListener: (_, cb) => media.listeners.push(cb) };
  const events = [];
  const meta = { content: '#100f0d' };
  const root = { dataset: {} };
  // Just enough of a page: elements by id, the header row, and buttons with attributes and clicks.
  const byId = new Map();
  const made = [];
  const element = () => {
    const el = { attrs: {}, clicks: [], children: [], className: '' };
    made.push(el);
    // The one inner element the boot script looks for: the sheet button's text.
    el.querySelector = (sel) => (sel === '.theme-toggle-text' && String(el.innerHTML).includes('theme-toggle-text') ? (el.text ??= { textContent: '' }) : null);
    el.setAttribute = (k, v) => (el.attrs[k] = v);
    el.addEventListener = (type, cb) => type === 'click' && el.clicks.push(cb);
    el.click = () => el.clicks.forEach((cb) => cb());
    el.prepend = (child) => {
      el.children.unshift(child);
      if (child.id) byId.set(child.id, child);
    };
    return el;
  };
  const headerRight = header ? element() : null;
  const document = {
    documentElement: root,
    readyState: 'interactive',
    getElementById: (id) => byId.get(id) ?? null,
    querySelector: (sel) => (sel === '.header-right' ? headerRight : sel.startsWith('meta') ? meta : null),
    querySelectorAll: (sel) => (sel === '.theme-toggle' ? made.filter((el) => el.className.split(' ').includes('theme-toggle')) : []),
    createElement: () => element(),
  };
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
    document,
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
  return { root, store, media, events, meta, listeners, headerRight, api: window.lfbTheme };
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
  // The redraw news first, then the user's choice (ui/theme-quips.js answers that one).
  assert.deepEqual(page.events.slice(-2).map((e) => e.type), ['theme:change', 'theme:chosen']);
  assert.deepEqual({ ...page.events.at(-1).detail }, { kind: 'site', from: 'dark', to: 'light' });

  page.api.set('system');
  assert.equal(page.root.dataset.theme, 'dark');
  assert.deepEqual({ ...page.events.at(-1).detail }, { kind: 'site', from: 'light', to: 'system' });
  const chosen = page.events.filter((e) => e.type === 'theme:chosen').length;
  page.media.matches = true;
  page.media.listeners.forEach((cb) => cb());
  assert.equal(page.root.dataset.theme, 'light', 'the device switched to light');
  assert.equal(page.events.at(-1).type, 'theme:change');
  assert.equal(page.events.filter((e) => e.type === 'theme:chosen').length, chosen, 'a device switch is not a choice: no quip');
});

test('boot: a new choice is announced even when the theme stays (System on a dark device to Dark)', () => {
  const page = boot({ saved: 'system' });
  const before = page.events.length;
  page.api.set('dark');
  assert.equal(page.root.dataset.theme, 'dark');
  const after = page.events.slice(before);
  assert.equal(after.filter((e) => e.type === 'theme:change').length, 1, 'the controls showing the choice need the news');
  // Chosen too, but nothing changed on screen, so data/theme-quips.js has nothing to say.
  assert.deepEqual({ ...after.find((e) => e.type === 'theme:chosen').detail }, { kind: 'site', from: 'dark', to: 'dark' });
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

test('boot: the header gets one sun/moon button; a click switches light and dark and saves it', () => {
  const page = boot({ saved: 'system', systemLight: false });
  assert.equal(page.headerRight.children.length, 1);
  const button = page.headerRight.children[0];
  assert.equal(button.id, 'theme-toggle');
  assert.equal(button.type, 'button');
  assert.equal(button.attrs['aria-label'], 'Switch to light theme');
  assert.equal(button.title, 'Switch to light theme');
  assert.equal(button.attrs['aria-pressed'], undefined, 'no pressed state: it would draw the ghost button filled');

  button.click();
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.store.get('lfb:theme'), 'light', 'a click is a choice, so it leaves System');
  assert.equal(button.attrs['aria-label'], 'Switch to dark theme');
  assert.equal(button.title, 'Switch to dark theme');

  button.click();
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(button.attrs['aria-label'], 'Switch to light theme');

  // The button follows changes made elsewhere (Profile, the palette, the device on System).
  page.api.set('light');
  assert.equal(button.attrs['aria-label'], 'Switch to dark theme');
});

test('boot: lfbTheme.button({ text: true }) is the account sheet\'s switch: same click, its text says it', () => {
  const page = boot();
  const sheet = page.api.button({ text: true });
  assert.ok(sheet.className.split(' ').includes('theme-toggle') && !sheet.className.includes('btn-icon'));
  assert.equal(sheet.text.textContent, 'Switch to light theme');
  assert.equal(sheet.attrs['aria-label'], undefined, 'its visible text is its name');
  sheet.click();
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(sheet.text.textContent, 'Switch to dark theme');
  assert.equal(page.headerRight.children[0].attrs['aria-label'], 'Switch to dark theme', 'the header button follows too');
});

test('boot: a page without a header gets no button and still themes', () => {
  const page = boot({ header: false, saved: 'light' });
  assert.equal(page.root.dataset.theme, 'light');
  page.api.toggle();
  assert.equal(page.root.dataset.theme, 'dark');
});

test('both pages load the boot script in <head>, before the stylesheet', () => {
  for (const file of ['index.html', 'privacy.html']) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const script = html.indexOf('<script src="src/js/theme-boot.js"></script>');
    assert.ok(script > 0 && script < html.indexOf('</head>'), `${file} loads theme-boot.js in <head>`);
    assert.ok(script < html.indexOf('src/css/app.css'), `${file} sets the theme before the stylesheet`);
  }
});
