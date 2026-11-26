/**
 * When the site asks a guest to sign in, and a signed-in user to turn on reminders (owner's
 * request): never on arrival, only after something was done here (an Accepted solve, a finished
 * quiz), as a dialog in the middle of the screen; plus a banner on the Problems page that offers the
 * same until it is done. Spaced so it never nags: a guest is asked at most 3 times, 3 days apart;
 * a signed-in user without reminders at most 4 times, 7 days apart; a banner hidden with its X
 * stays hidden for 7 days. Browsers refuse a permission prompt that does not come from a tap, and a
 * refusal is final (ADR 0011), so reminders are only ever offered, through a button.
 *
 * Pure: no DOM; time comes in as `now` (ms).
 */

const DAY = 24 * 60 * 60 * 1000;

/** How often and how far apart each dialog may come. */
export const NUDGE_RULES = Object.freeze({
  signin: Object.freeze({ max: 3, gapDays: 3 }),
  push: Object.freeze({ max: 4, gapDays: 7 }),
  bannerHideDays: 7,
});

/** What each dialog and banner says. */
export const NUDGE_COPY = Object.freeze({
  signin: Object.freeze({
    title: 'Save your progress',
    body: 'Your solves live only in this browser. Sign in to keep them on every device and keep your streak alive.',
    later: 'Not now',
  }),
  push: Object.freeze({
    title: "Don't lose your streak",
    body: 'A reminder at 16:00 and 20:00, only when something is due. Never on your rest day.',
    action: 'Turn on reminders',
    install: 'Show me how',
    later: 'Not now',
    denied: 'Notifications are blocked for this site. Allow them in the browser\'s site settings (the icon by the address), then turn reminders on from your profile.',
    done: 'Reminders on. A test notification is on its way.',
  }),
  banner: Object.freeze({
    push: Object.freeze({ title: "Don't lose your streak", body: 'Turn on reminders: a nudge before your streak ends, only when something is due.', action: 'Turn on reminders' }),
    signin: Object.freeze({ title: 'Save your progress', body: 'Your solves live only in this browser. Sign in to keep them on every device.', action: 'Sign in' }),
    hide: 'Hide for a week',
  }),
});

/**
 * @typedef {{ count: number, at: number }} NudgeLog how many times a dialog was shown, and when last
 * @typedef {{ signin: NudgeLog, push: NudgeLog, bannerHiddenUntil: { signin: number, push: number } }} NudgeState
 * @typedef {'ready'|'install'|'update'|'unsupported'} PushSupport data/push-device.js
 * @typedef {{ accounts: boolean, signedIn: boolean, push: { support: PushSupport, on: boolean, permission: string } }} NudgeFacts
 */

/** @returns {NudgeState} */
export function emptyNudgeState() {
  return { signin: { count: 0, at: 0 }, push: { count: 0, at: 0 }, bannerHiddenUntil: { signin: 0, push: 0 } };
}

const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);

/**
 * A stored state, or an empty one when it is missing or malformed.
 * @param {unknown} raw
 * @returns {NudgeState}
 */
export function normalizeNudgeState(raw) {
  const r = raw && typeof raw === 'object' ? /** @type {any} */ (raw) : {};
  const log = (l) => ({ count: num(l?.count), at: num(l?.at) });
  return { signin: log(r.signin), push: log(r.push), bannerHiddenUntil: { signin: num(r.bannerHiddenUntil?.signin), push: num(r.bannerHiddenUntil?.push) } };
}

/** Whether reminders can still be offered to a signed-in user (never once the browser refused). */
function pushOfferable({ signedIn, push }) {
  return signedIn && !push.on && push.support !== 'unsupported' && push.permission !== 'denied';
}

/** Whether a dialog's limits allow it now. */
function spaced(log, rule, now) {
  return log.count < rule.max && (log.count === 0 || now - log.at >= rule.gapDays * DAY);
}

/**
 * The dialog to show after something was done (an Accepted solve, a finished quiz), or null.
 * @param {NudgeFacts & { state: NudgeState, now: number }} p
 * @returns {'signin'|'push'|null}
 */
export function nudgeAfterPractice({ accounts, signedIn, push, state, now }) {
  if (!accounts) return null;
  if (!signedIn) return spaced(state.signin, NUDGE_RULES.signin, now) ? 'signin' : null;
  return pushOfferable({ signedIn, push }) && spaced(state.push, NUDGE_RULES.push, now) ? 'push' : null;
}

/**
 * The dialog right after a sign-in that the sign-in dialog started: reminders, now that there is an
 * account to send them to. Not held back by the 7-day gap (this is the moment), only by the count.
 * @param {NudgeFacts & { state: NudgeState }} p
 * @returns {'push'|null}
 */
export function nudgeAfterSignIn({ accounts, signedIn, push, state }) {
  return accounts && pushOfferable({ signedIn, push }) && state.push.count < NUDGE_RULES.push.max ? 'push' : null;
}

/**
 * The banner on the Problems page, or null: reminders for a signed-in user without them; sign-in
 * for a guest who has done something worth saving.
 * @param {NudgeFacts & { hasProgress: boolean, state: NudgeState, now: number }} p
 * @returns {'signin'|'push'|null}
 */
export function homeBanner({ accounts, signedIn, push, hasProgress, state, now }) {
  if (!accounts) return null;
  if (signedIn) return pushOfferable({ signedIn, push }) && now >= state.bannerHiddenUntil.push ? 'push' : null;
  return hasProgress && now >= state.bannerHiddenUntil.signin ? 'signin' : null;
}

/**
 * Notes that a dialog was shown.
 * @param {NudgeState} state
 * @param {'signin'|'push'} kind
 * @param {number} now
 * @returns {NudgeState}
 */
export function recordNudge(state, kind, now) {
  return { ...state, [kind]: { count: state[kind].count + 1, at: now } };
}

/**
 * Hides a banner for a week (its X).
 * @param {NudgeState} state
 * @param {'signin'|'push'} kind
 * @param {number} now
 * @returns {NudgeState}
 */
export function hideBanner(state, kind, now) {
  return { ...state, bannerHiddenUntil: { ...state.bannerHiddenUntil, [kind]: now + NUDGE_RULES.bannerHideDays * DAY } };
}
