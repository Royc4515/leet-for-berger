/**
 * Web Push on this device, browser side (ADR 0011): subscribes this browser through the push-only
 * service worker (sw.js at the site root) and talks to the push Edge Function
 * (deploy/supabase/functions/push). Loaded on demand: by the profile page, and on sign-out to
 * forget this device. Inert when accounts are not configured.
 */
import { pushSupport, isAppleMobile, keyBytes, sameKey, pushFunctionUrl } from '../data/push-device.js';

/**
 * The service worker, beside index.html: a worker controls only its own folder and below, so it
 * lives at the root to cover the whole site. It does nothing but show and open notifications.
 */
export const SW_PATH = 'sw.js';

/**
 * @typedef {{ hours: number[], off: string[], timeZone: string, devices: number }} PushView
 * What the push function answers for the signed-in user (GET /settings).
 */

/**
 * @param {{ account: { config: { supabaseUrl: string, supabaseAnonKey: string, enabled: boolean }, accessToken: () => Promise<string|null> }, scope?: any, fetchImpl?: typeof fetch }} deps
 *   `scope` stands in for the browser globals in tests (navigator, Notification, PushManager, matchMedia)
 */
export function createPushClient({ account, scope = globalThis, fetchImpl = (...a) => fetch(...a) }) {
  const { supabaseUrl, supabaseAnonKey, enabled } = account.config;
  const nav = scope.navigator ?? {};
  const base = pushFunctionUrl(supabaseUrl);

  async function call(route, body) {
    const token = await account.accessToken().catch(() => null);
    const headers = { apikey: supabaseAnonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) };
    const res = await fetchImpl(`${base}${route}`, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Reminders are unavailable right now (${res.status})`);
    return data;
  }

  /** @returns {import('../data/push-device.js').PushSupport} */
  function support() {
    return pushSupport({
      hasServiceWorker: Boolean(nav.serviceWorker),
      hasPush: 'PushManager' in scope,
      hasNotification: 'Notification' in scope,
      appleMobile: isAppleMobile(nav),
      standalone: Boolean(scope.matchMedia?.('(display-mode: standalone)')?.matches || nav.standalone === true),
    });
  }

  /** The user's own IANA zone: the server sends at their send hours on their clock. */
  function timeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  /** This browser's push subscription, or null (none, or no Web Push here). */
  async function current() {
    if (support() !== 'ready') return null;
    const reg = await nav.serviceWorker.getRegistration();
    return (await reg?.pushManager?.getSubscription()) ?? null;
  }

  return {
    available: Boolean(enabled),
    support,
    timeZone,
    /** 'granted', 'denied' or 'default' (not asked yet, or the prompt was closed). */
    permission: () => scope.Notification?.permission ?? 'default',
    /** True when this browser has a push subscription. */
    isOn: async () => Boolean(await current().catch(() => null)),

    /**
     * Turns push on for this device and stores it with the user's settings.
     * Call it straight from the click: browsers show the permission prompt only in answer to a
     * gesture (Safari is strict about it), so the prompt is requested before anything is awaited.
     * @param {{ hours?: number[], off?: string[] }} [settings] sent with the subscription
     * @returns {Promise<{ ok: true, view: PushView }|{ ok: false, reason: 'denied'|'dismissed' }>}
     */
    async enable(settings = {}) {
      // don't touch / the first statement on purpose: an await before it loses the user gesture.
      const asked = scope.Notification.requestPermission();
      const permission = await asked;
      if (permission !== 'granted') return { ok: false, reason: permission === 'denied' ? 'denied' : 'dismissed' };
      await nav.serviceWorker.register(SW_PATH);
      const reg = await nav.serviceWorker.ready;
      const { publicKey } = await call('/key');
      const key = keyBytes(publicKey);
      let sub = await reg.pushManager.getSubscription();
      // A subscription made with another key cannot receive this server's pushes: replace it.
      if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
        await sub.unsubscribe();
        sub = null;
      }
      sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      try {
        const view = await call('/subscribe', { subscription: sub.toJSON(), timeZone: timeZone(), ...settings });
        return { ok: true, view };
      } catch (err) {
        // The server does not know this device, so it would never get a push: say off, honestly.
        await sub.unsubscribe().catch(() => {});
        throw err;
      }
    },

    /**
     * Turns push off for this device. The server forgets it first, while the session still works;
     * if that fails, the browser's own unsubscribe still ends it, and the server drops the dead
     * device at its next send (a 404 or 410 from the push service).
     */
    async disable() {
      const sub = await current().catch(() => null);
      if (!sub) return;
      await call('/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    },

    /**
     * Asks the server to push a test to this device: the whole way a reminder goes, from the push
     * function through the browser's push service to here.
     * @returns {Promise<{ sent: boolean }>}
     */
    async test() {
      const sub = await current();
      if (!sub) throw new Error('Turn notifications on for this device first');
      return call('/test', { endpoint: sub.endpoint });
    },

    /** @returns {Promise<PushView>} the signed-in user's send hours, kinds off and device count */
    settings: () => call('/settings'),
    /**
     * Saves part of the settings; what is left out stays. The time zone rides along, so a user who
     * moved gets their pushes on their new clock.
     * @param {{ hours?: number[], off?: string[] }} patch
     * @returns {Promise<PushView>}
     */
    save: (patch) => call('/settings', { ...patch, timeZone: timeZone() }),
  };
}

/**
 * Forgets this device before a sign-out (ADR 0011): a shared phone must never get the previous
 * user's reminders. Quiet: signing out never waits on, or fails because of, reminders.
 * @param {{ account: any }} deps
 */
export async function forgetThisDevice({ account }) {
  if (!account?.config?.enabled) return;
  await createPushClient({ account }).disable().catch(() => {});
}
