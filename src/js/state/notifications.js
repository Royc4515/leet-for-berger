/**
 * The user's notification settings and the reminders they dismissed (stage F7). Pure reducers plus
 * a thin localStorage layer, like state/progress.js. Per user: signing out clears it
 * (state/user-data.js), because a dismissed reminder names a problem the user worked on.
 *
 * Settings store only the kinds turned off, so a kind added later starts on.
 */
import { NOTIFICATION_KINDS } from '../data/notifications.js';
import { shiftDay } from '../data/daily.js';
import { dayKey } from './progress.js';
import { NOTIFICATIONS_KEY } from './user-data.js';

/**
 * A dismissed key is dropped after this many days. Every key names a day, a touch or an absence,
 * so an old one rarely matches again; when it does (still away a month later), showing it again is right.
 */
export const DISMISS_KEEP_DAYS = 30;

/**
 * @typedef {import('../data/notifications.js').NotificationKind} NotificationKind
 * @typedef {{ version: 1, settings: Partial<Record<NotificationKind, false>>, dismissed: Record<string, string> }} NotificationState
 * `dismissed` maps a notification key to the day it was dismissed.
 */

/**
 * A first visit: every kind on, nothing dismissed.
 * @returns {NotificationState}
 */
export function emptyNotificationState() {
  return { version: 1, settings: {}, dismissed: {} };
}

/**
 * Keeps only what this version understands: known kinds turned off, and day-stamped keys.
 * @param {any} raw
 * @returns {NotificationState}
 */
export function normalizeNotificationState(raw) {
  const out = emptyNotificationState();
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return out;
  for (const kind of NOTIFICATION_KINDS) if (raw.settings?.[kind] === false) out.settings[kind] = false;
  for (const [key, day] of Object.entries(raw.dismissed ?? {})) {
    if (typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) out.dismissed[key] = day;
  }
  return out;
}

/**
 * @param {NotificationState} state
 * @param {NotificationKind} kind
 * @returns {boolean}
 */
export function isKindEnabled(state, kind) {
  return state.settings[kind] !== false;
}

/**
 * Turns one kind on or off.
 * @param {NotificationState} state
 * @param {NotificationKind} kind
 * @param {boolean} on
 * @returns {NotificationState}
 */
export function setKindEnabled(state, kind, on) {
  if (!NOTIFICATION_KINDS.includes(kind)) throw new Error(`Unknown notification kind: ${kind}`);
  const settings = { ...state.settings };
  if (on) delete settings[kind];
  else settings[kind] = false;
  return { ...state, settings };
}

/**
 * Records a dismissed notification, and drops keys older than DISMISS_KEEP_DAYS so the record stays small.
 * @param {NotificationState} state
 * @param {string} key a Notification's key (data/notifications.js)
 * @param {Date} now
 * @returns {NotificationState}
 */
export function dismiss(state, key, now) {
  const today = dayKey(now);
  const oldest = shiftDay(today, DISMISS_KEEP_DAYS);
  const dismissed = Object.fromEntries(Object.entries(state.dismissed).filter(([, day]) => day >= oldest));
  dismissed[key] = today;
  return { ...state, dismissed };
}

/* ---------- Browser persistence (thin, defensive) ---------- */

/**
 * @param {Pick<Storage, 'getItem'>|null} [storage] injectable for unit tests
 * @returns {NotificationState}
 */
export function loadNotificationState(storage = globalThis.localStorage) {
  try {
    return normalizeNotificationState(JSON.parse(storage?.getItem(NOTIFICATIONS_KEY) ?? 'null'));
  } catch {
    return emptyNotificationState();
  }
}

/**
 * Best effort, like progress: a blocked storage only means the choice is not remembered.
 * @param {NotificationState} state
 * @param {Pick<Storage, 'setItem'>|null} [storage]
 */
export function saveNotificationState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(NOTIFICATIONS_KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota */
  }
}
