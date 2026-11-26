/**
 * The sign-in and reminders offers (owner's request; rules and copy in data/nudges.js): a dialog in
 * the middle of the screen after an Accepted solve or a finished quiz, and the banner on the
 * Problems page. Never on arrival, never inside a session, never over another dialog.
 *
 * Reminders are turned on from a button: the permission prompt must come from the tap itself
 * (auth/push-client.js `enable`), so the push client is loaded before the button can be pressed.
 * Loaded by main.js after the first page, so it is not a startup module.
 */
import { h, toast, tr, siteLang } from './dom.js';
import { nudgeCopy, emptyNudgeState, normalizeNudgeState, nudgeAfterPractice, nudgeAfterSignIn, homeBanner, recordNudge, hideBanner } from '../data/nudges.js';

/** Which offers this device has shown, and banners hidden (a device preference, like the tours). */
const STATE_KEY = 'lfb:nudges:v1';
/** Set when a sign-in starts from an offer: back from the provider, reminders are offered next. */
const AFTER_SIGNIN_KEY = 'lfb:nudge-signin';
/** Fired when an offer changes what the banner should show. */
const CHANGED = 'nudges:changed';
/** After an Accepted verdict the burst plays first; the dialog follows it. */
const AFTER_PRACTICE_MS = 1400;

function loadState() {
  try {
    return normalizeNudgeState(JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null'));
  } catch {
    return emptyNudgeState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked: the offer may come again, which is harmless */
  }
  dispatchEvent(new CustomEvent(CHANGED));
}

const update = (fn) => saveState(fn(loadState()));

/** The offers' copy in the site language (shell copy: dialogs and the banner both follow it). */
const copyNow = () => nudgeCopy(siteLang());

/** The push client, loaded once; null when accounts are off. */
let clientPromise = null;
function pushClient(account) {
  if (!account?.config?.enabled) return Promise.resolve(null);
  clientPromise ??= import('../auth/push-client.js').then((m) => m.createPushClient({ account }));
  return clientPromise;
}

/** What the rules need to know about this device's reminders. */
async function pushFacts(client) {
  if (!client) return { support: 'unsupported', on: false, permission: 'default' };
  return { support: client.support(), on: await client.isOn(), permission: client.permission() };
}

async function facts(account) {
  const client = await pushClient(account);
  const s = account?.get() ?? { status: 'off' };
  return { client, accounts: Boolean(account?.config?.enabled) && s.status !== 'off', signedIn: s.status === 'signed-in', push: await pushFacts(client) };
}

/** No offer inside a session, over another dialog, or while a tour explains the page. */
const busy = () => document.body.classList.contains('lockdown') || Boolean(document.querySelector('dialog[open]'));

/**
 * Turns reminders on from a tap. Must be called straight from the click handler (see top).
 * @returns {Promise<'on'|'denied'|'dismissed'|'error'>}
 */
async function turnOnReminders(client) {
  try {
    const res = await client.enable();
    if (!res.ok) return res.reason;
    toast(copyNow().push.done, 'success');
    // The whole way a reminder goes, as the profile's switch does: proof that it works.
    client.test().catch(() => {});
    dispatchEvent(new CustomEvent(CHANGED));
    return 'on';
  } catch (err) {
    toast(err?.message || tr('Reminders are unavailable right now.', 'התזכורות לא זמינות כרגע.'), 'error');
    return 'error';
  }
}

/** Opens the profile at its reminders, where the iPhone guide and the full settings live. */
function openReminderSettings() {
  location.hash = '#/me';
  // The profile renders on the next route; its reminders section is then in place.
  setTimeout(() => document.getElementById('profile-reminders')?.scrollIntoView({ block: 'start' }), 300);
}

/**
 * The dialog for one offer. Atlas keeps dialogs for decisions; this is the owner's one exception:
 * a one-time offer at a natural pause, so it is seen (docs/DESIGN.md, Dialog).
 * @param {'signin'|'push'} kind
 * @param {{ account: any, client: any, support: string }} deps
 */
function openDialog(kind, { account, client, support }) {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const copy = copyNow()[kind];
  const body = h('p', { id: 'nudge-body' }, copy.body);
  const actions = h('div.modal-actions.nudge-actions');
  const dlg = h(
    'dialog.modal.nudge',
    { 'aria-labelledby': 'nudge-title', 'aria-describedby': 'nudge-body', dataset: { nudge: kind } },
    h('div.modal-card', {}, h('span.nudge-mark', { 'aria-hidden': 'true' }), h('h2#nudge-title', {}, copy.title), body, actions),
  );
  const close = () => {
    if (!dlg.open) return;
    dlg.close();
    dlg.remove();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const later = h('button.btn.btn-ghost', { type: 'button', onClick: close }, copy.later);

  if (kind === 'signin') {
    const start = (provider) => {
      try {
        sessionStorage.setItem(AFTER_SIGNIN_KEY, '1');
      } catch {
        /* storage blocked: reminders are offered after the next solve instead */
      }
      account.signIn(provider);
    };
    actions.append(
      later,
      h('button.btn.btn-secondary', { type: 'button', onClick: () => start('github') }, tr('Continue with GitHub', 'להמשיך עם GitHub')),
      h('button.btn.btn-primary', { type: 'button', onClick: () => start('google') }, tr('Continue with Google', 'להמשיך עם Google')),
    );
  } else if (support === 'ready') {
    const on = h(
      'button.btn.btn-primary',
      {
        type: 'button',
        onClick: async () => {
          on.disabled = true;
          const result = await turnOnReminders(client);
          if (result === 'denied') {
            body.textContent = copy.denied;
            on.remove();
            later.textContent = tr('OK', 'הבנתי');
            later.focus();
            return;
          }
          close();
        },
      },
      copy.action,
    );
    actions.append(later, on);
  } else {
    // An iPhone in Safari: reminders need the site on the Home Screen first; the profile shows how.
    actions.append(later, h('button.btn.btn-primary', { type: 'button', onClick: () => (close(), openReminderSettings()) }, copy.install));
  }

  // Clicks outside the card land on the dialog element itself (padding is on .modal-card).
  dlg.addEventListener('click', (e) => e.target === dlg && close());
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  document.body.append(dlg);
  dlg.showModal();
  // The main action takes focus: Enter does what the dialog is for, Escape says not now.
  actions.lastElementChild?.focus();
}

/**
 * Shows the offer the rules pick for this moment, if any.
 * @param {any} account
 * @param {(f: any, state: any, now: number) => 'signin'|'push'|null} pick
 */
async function offer(account, pick) {
  const f = await facts(account);
  if (busy()) return;
  const kind = pick(f, loadState(), Date.now());
  if (!kind) return;
  update((s) => recordNudge(s, kind, Date.now()));
  openDialog(kind, { account, client: f.client, support: f.push.support });
}

let installed = false;

/**
 * Starts offering: after an Accepted solve or a finished quiz (`practice:done`), and once right
 * after a sign-in an offer started. Idempotent.
 * @param {{ account: any }} deps
 * @returns {void}
 */
export function installNudges({ account }) {
  if (installed || !account?.config?.enabled) return;
  installed = true;
  addEventListener('practice:done', () => {
    setTimeout(() => offer(account, (f, state, now) => nudgeAfterPractice({ ...f, state, now })).catch(() => {}), AFTER_PRACTICE_MS);
  });
  const afterSignIn = () => {
    let pending = false;
    try {
      pending = sessionStorage.getItem(AFTER_SIGNIN_KEY) === '1';
    } catch {
      /* storage blocked */
    }
    if (!pending || account.get().status !== 'signed-in') return;
    try {
      sessionStorage.removeItem(AFTER_SIGNIN_KEY);
    } catch {
      /* storage blocked */
    }
    offer(account, (f, state) => nudgeAfterSignIn({ ...f, state })).catch(() => {});
  };
  account.subscribe(afterSignIn);
  afterSignIn();
}

/**
 * The banner at the top of the Problems page: reminders for a signed-in user without them, sign-in
 * for a guest with progress to save. Empty until it knows, and whenever there is nothing to offer.
 * @param {{ account: any, hasProgress: () => boolean, signal: AbortSignal }} deps
 * @returns {HTMLElement}
 */
export function nudgeBanner({ account, hasProgress, signal }) {
  const host = h('div.nudge-banner-host');
  if (!account?.config?.enabled) return host;
  let token = 0;
  const render = async () => {
    const mine = ++token;
    const f = await facts(account).catch(() => null);
    if (mine !== token || signal.aborted || !f) return;
    const kind = homeBanner({ ...f, hasProgress: hasProgress(), state: loadState(), now: Date.now() });
    if (!kind) return void host.replaceChildren();
    const all = copyNow();
    const copy = all.banner[kind];
    const action =
      kind === 'signin'
        ? h('button.btn.btn-primary', { type: 'button', onClick: () => openDialog('signin', { account, client: f.client, support: f.push.support }) }, copy.action)
        : f.push.support === 'ready'
          ? h('button.btn.btn-primary', { type: 'button', onClick: async (e) => { e.currentTarget.disabled = true; await turnOnReminders(f.client); render(); } }, copy.action)
          : h('button.btn.btn-primary', { type: 'button', onClick: openReminderSettings }, all.push.install);
    host.replaceChildren(
      h(
        'section.nudge-banner',
        { 'aria-labelledby': 'nudge-banner-title', dataset: { nudge: kind } },
        h('span.nudge-mark', { 'aria-hidden': 'true' }),
        h('div.nudge-banner-text', {}, h('h2#nudge-banner-title', {}, copy.title), h('p', {}, copy.body)),
        h('div.nudge-banner-actions', {}, action, h('button.btn.btn-ghost.btn-icon.nudge-hide', { type: 'button', 'aria-label': all.banner.hide, title: all.banner.hide, onClick: () => update((s) => hideBanner(s, kind, Date.now())) }, h('span', { 'aria-hidden': 'true' }, '×'))),
      ),
    );
  };
  addEventListener(CHANGED, render, { signal });
  const unsubscribe = account.subscribe(render);
  signal.addEventListener('abort', unsubscribe);
  render();
  return host;
}
