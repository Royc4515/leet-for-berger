import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const BOOT = readFileSync(new URL('../src/js/lang-boot.js', import.meta.url), 'utf8');

/** Runs lang-boot.js against a stand-in page. */
function boot({ languages = ['en-US'], saved = null, blocked = false, fixed = false } = {}) {
  const store = new Map(saved ? [['lfb:site-lang', saved]] : []);
  const attrs = new Map(fixed ? [['data-lang-fixed', '']] : []);
  const root = { lang: 'en', dir: 'ltr', hasAttribute: (k) => attrs.has(k) };
  const prepended = [];
  const header = { prepend: (b) => prepended.push(b) };
  let reloads = 0;
  const makeButton = () => {
    const a = new Map();
    const listeners = [];
    return { type: '', className: '', lang: '', textContent: '', title: '', id: '', setAttribute: (k, v) => a.set(k, v), getAttribute: (k) => a.get(k), addEventListener: (_, cb) => listeners.push(cb), click: () => listeners.forEach((l) => l()) };
  };
  const window = {
    navigator: { languages, language: languages[0] },
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
    location: { reload: () => reloads++ },
    document: { documentElement: root, readyState: 'complete', querySelector: (s) => (s === '.header-right' ? header : null), getElementById: () => null, createElement: makeButton },
    addEventListener: () => {},
  };
  window.window = window;
  vm.runInNewContext(BOOT, window);
  return { root, store, api: window.lfbLang, prepended, reloads: () => reloads };
}

test('lang-boot: the device decides by default; a saved choice wins', () => {
  assert.equal(boot({ languages: ['he-IL', 'en'] }).root.dir, 'rtl');
  assert.equal(boot({ languages: ['he-IL'] }).root.lang, 'he');
  assert.equal(boot({ languages: ['iw'] }).root.lang, 'he', 'the old code for Hebrew');
  assert.equal(boot({ languages: ['en-GB', 'he'] }).root.lang, 'en', 'only the first language counts');
  assert.equal(boot({ languages: ['hu-HU'] }).root.lang, 'en', '"hu" is not Hebrew');
  assert.equal(boot({ languages: ['he-IL'], saved: 'en' }).root.dir, 'ltr');
  assert.equal(boot({ languages: ['en-US'], saved: 'he' }).root.dir, 'rtl');
  assert.equal(boot({ languages: ['en-US'], saved: 'fr' }).root.lang, 'en', 'an unknown value falls back to the device');
  assert.equal(boot({ languages: ['he-IL'], blocked: true }).root.lang, 'he', 'blocked storage: the device');
});

test('lang-boot: set() saves and reloads once; the same language or a bad value does nothing', () => {
  const page = boot();
  page.api.set('he');
  assert.equal(page.store.get('lfb:site-lang'), 'he');
  assert.equal(page.root.dir, 'rtl');
  assert.equal(page.reloads(), 1);
  page.api.set('he');
  assert.equal(page.reloads(), 1);
  page.api.set('xx');
  assert.equal(page.store.get('lfb:site-lang'), 'he');
  const blocked = boot({ blocked: true });
  blocked.api.set('he');
  assert.equal(blocked.reloads(), 0, 'a reload would forget the choice');
  assert.equal(blocked.root.lang, 'en');
});

test('lang-boot: the header button names the other language, in that language, and switches to it', () => {
  const en = boot();
  assert.equal(en.prepended.length, 1);
  const b = en.prepended[0];
  assert.equal(b.id, 'lang-toggle');
  assert.equal(b.textContent, 'עב');
  assert.equal(b.lang, 'he');
  assert.match(b.getAttribute('aria-label'), /עברית/);
  b.click();
  assert.equal(en.store.get('lfb:site-lang'), 'he');
  const he = boot({ languages: ['he'] });
  assert.equal(he.prepended[0].textContent, 'EN');
  assert.equal(he.api.button({ text: true }).textContent, 'English');
});

test('lang-boot: a page fixed to one language keeps it and gets no switch', () => {
  const page = boot({ languages: ['he-IL'], fixed: true });
  assert.equal(page.root.lang, 'en');
  assert.equal(page.root.dir, 'ltr');
  assert.equal(page.prepended.length, 0);
});

// Every tr('...', '...') and tp('...', '...') with literal strings: the Hebrew side has Hebrew in
// it (or is the same Latin term on purpose), and neither side has an em dash.
test('every tr() and tp() pair has Hebrew on its Hebrew side and no em dashes', () => {
  const files = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (f === 'problems') continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  };
  walk('src/js');
  const lit = String.raw`(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\x60(?:[^\x60\\]|\\.)*\x60)`;
  const call = new RegExp(String.raw`\bt[rp]\(\s*(${lit})\s*,\s*(${lit})\s*\)`, 'g');
  let pairs = 0;
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(call)) {
      pairs++;
      const [, en, he] = m;
      assert.ok(!/—/.test(en + he), `${f}: em dash in ${m[0]}`);
      // A pair whose two sides are equal on purpose (a name) is fine; otherwise Hebrew must be Hebrew.
      if (en !== he) assert.match(he, /[֐-׿]/, `${f}: no Hebrew in ${m[0].slice(0, 120)}`);
    }
  }
  assert.ok(pairs >= 10, `found ${pairs} pairs: the scan works`);
});
