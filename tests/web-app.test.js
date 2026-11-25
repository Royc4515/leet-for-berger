// The web app shell Web Push needs (ADR 0011, part C): the manifest and its icons, the Home Screen
// icon, the push-only service worker (run here in a sandbox with a fake push), and their deploy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');
/** Width and height from a PNG's header, and whether it has an alpha channel. */
function png(path) {
  const b = readFileSync(new URL(path, ROOT));
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${path} is a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), alpha: b[25] === 6 };
}

test('the manifest: a standalone app on this site, with real icons of the sizes it says', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.display, 'standalone', 'an iPhone gets Web Push only as a Home Screen web app');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.ok(m.short_name.length <= 12, 'the Home Screen label fits under the icon');
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/);
  for (const icon of m.icons) {
    const [w, h] = icon.sizes.split('x').map(Number);
    const real = png(icon.src);
    assert.deepEqual([real.width, real.height], [w, h], icon.src);
    assert.equal(real.alpha, false, `${icon.src}: opaque, or a launcher shows black corners`);
  }
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any'));
});

test('index.html links the manifest and the iPhone Home Screen icon', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" href="src\/brand\/apple-touch-icon\.png" \/>/);
  const icon = png('src/brand/apple-touch-icon.png');
  assert.deepEqual([icon.width, icon.height, icon.alpha], [180, 180, false]);
  assert.equal(png('src/brand/badge-96.png').alpha, true, 'the badge is a white mark on transparent');
});

test('Pages ships the service worker and the manifest at the site root', () => {
  const pages = read('.github/workflows/pages.yml');
  assert.match(pages, /cp [^\n]*\bmanifest\.webmanifest\b[^\n]*_site\//);
  assert.match(pages, /cp sw\.js _site\//);
});

/** Loads sw.js as a browser would, against a fake worker scope; returns its handlers and a record. */
function loadWorker({ tabs = [] } = {}) {
  const handlers = {};
  const shown = [];
  const opened = [];
  const self = {
    addEventListener: (type, fn) => (handlers[type] = fn),
    skipWaiting: () => {},
    registration: { scope: 'https://fork.example/lfb/', showNotification: async (title, opts) => shown.push({ title, ...opts }) },
    clients: { claim: async () => {}, matchAll: async () => tabs, openWindow: async (url) => opened.push(url) },
  };
  vm.runInNewContext(read('sw.js'), { self, URL, console });
  const run = async (type, event) => {
    let done;
    handlers[type]({ ...event, waitUntil: (p) => (done = p) });
    await done;
  };
  return { handlers, shown, opened, run };
}

test('sw.js: handles push and taps only; no fetch handler, so it never caches or serves a page', () => {
  const w = loadWorker();
  assert.deepEqual(Object.keys(w.handlers).sort(), ['activate', 'install', 'notificationclick', 'push']);
  assert.doesNotMatch(read('sw.js'), /addEventListener\(\s*['"]fetch/);
  for (const path of read('sw.js').match(/src\/brand\/[\w-]+\.png/g)) assert.ok(existsSync(new URL(path, ROOT)), `${path} exists`);
});

test('sw.js push: shows the title, body and tag; the link opens on this copy of the site, hash routes only', async () => {
  const w = loadWorker();
  const data = (obj) => ({ data: { json: () => obj, text: () => JSON.stringify(obj) } });
  await w.run('push', data({ title: 'Keep your 3-day streak', body: 'Solve one problem today. 2 h 5 min left.', url: 'https://royc4515.github.io/leet-for-berger/#/daily', tag: 'streak' }));
  assert.equal(w.shown[0].title, 'Keep your 3-day streak');
  assert.equal(w.shown[0].tag, 'streak');
  assert.equal(w.shown[0].data.url, 'https://fork.example/lfb/#/daily', 'the route, on the origin that runs the worker');
  await w.run('push', data({ title: 'x', url: 'https://evil.example/#/problem/rain-trap' }));
  assert.equal(w.shown[1].data.url, 'https://fork.example/lfb/#/problem/rain-trap', 'another origin never opens');
  await w.run('push', data({ title: 'x', url: 'javascript:alert(1)' }));
  assert.equal(w.shown[2].data.url, 'https://fork.example/lfb/');
  await w.run('push', data({ title: 'x', url: 'https://a.example/#/daily"><img' }));
  assert.equal(w.shown[3].data.url, 'https://fork.example/lfb/', 'only a plain route');
  // Not JSON, or nothing at all: still a notification with the site's name.
  await w.run('push', { data: { json: () => { throw new Error('not json'); }, text: () => 'hello' } });
  assert.deepEqual([w.shown[4].title, w.shown[4].body, w.shown[4].tag], ['Leet-For-Berger', 'hello', 'reminder']);
  await w.run('push', {});
  assert.equal(w.shown[5].title, 'Leet-For-Berger');
});

test('sw.js tap: focuses an open tab of the site and moves it to the page; else opens one', async () => {
  const log = [];
  const tab = { url: 'https://fork.example/lfb/#/map', focus: async () => log.push('focus'), navigate: async (u) => (log.push(`navigate ${u}`), tab) };
  const other = { url: 'https://other.example/', focus: async () => log.push('wrong tab') };
  const w = loadWorker({ tabs: [other, tab] });
  const notification = (url) => ({ notification: { data: { url }, close: () => log.push('close') } });
  await w.run('notificationclick', notification('https://fork.example/lfb/#/daily'));
  assert.deepEqual(log, ['close', 'focus', 'navigate https://fork.example/lfb/#/daily'], 'focus first, while the tap counts');

  const none = loadWorker();
  await none.run('notificationclick', notification('https://fork.example/lfb/#/quiz/daily'));
  assert.deepEqual(none.opened, ['https://fork.example/lfb/#/quiz/daily']);

  // A tab the worker does not control has no navigate: it is still focused, nothing throws.
  const plain = { url: 'https://fork.example/lfb/', focus: async () => log.push('focus plain') };
  await loadWorker({ tabs: [plain] }).run('notificationclick', notification('https://fork.example/lfb/#/daily'));
  assert.equal(log.at(-1), 'focus plain');
});
