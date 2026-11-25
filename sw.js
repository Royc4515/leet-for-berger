/**
 * The push-only service worker (ADR 0011): shows a reminder the push function sends, and opens the
 * page it names when the notification is tapped.
 *
 * don't touch / no `fetch` handler, on purpose: this worker never caches or serves a page, so a
 * deploy is never hidden behind a stale copy and the site works exactly as it does without it.
 *
 * It lives at the site root because a worker only controls its own folder and below (ADR 0011).
 */

// A new version takes over at once: there is no cache to migrate, so nothing to wait for.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/**
 * The page to open: the push names a hash route of the public site; it is opened on this copy of
 * the site (a fork or a local run opens itself, never another origin).
 * @param {unknown} url
 * @returns {string}
 */
function target(url) {
  const page = new URL(self.registration.scope);
  try {
    const hash = new URL(String(url)).hash;
    if (/^#\/[\w/-]*$/.test(hash)) page.hash = hash;
  } catch {
    // No usable link: the home page.
  }
  return page.href;
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'Leet-For-Berger';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      // One per kind: a newer streak reminder replaces the older one instead of stacking.
      tag: typeof data.tag === 'string' && data.tag ? data.tag : 'reminder',
      icon: 'src/brand/icon-192.png',
      badge: 'src/brand/badge-96.png',
      data: { url: target(data.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? self.registration.scope;
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const tab = tabs.find((c) => c.url.startsWith(self.registration.scope));
      if (tab) {
        // Focus first, while the tap still counts as the user's. Then the open tab goes to the page;
        // a tab this worker does not control cannot be sent, so it is just shown.
        await tab.focus();
        if (tab.navigate) await tab.navigate(url).catch(() => {});
        return;
      }
      return self.clients.openWindow(url);
    })(),
  );
});
