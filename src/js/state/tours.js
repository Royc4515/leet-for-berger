/**
 * Which guided tours this device has seen: the site tour, and one per mode (data/tours.js).
 * A device preference, not user data: it survives sign-out and does not sync, like the layout
 * keys (state/user-data.js). Values are the day the tour was first closed, for debugging only.
 */
import { dayKey } from './progress.js';

/** localStorage key holding `{ [tourId]: 'YYYY-MM-DD' }`. */
export const TOURS_KEY = 'lfb:tours:v1';

/**
 * Reads the stored value; anything malformed reads as "nothing seen", so a broken key never
 * blocks the site, it only shows a tour again.
 * @param {string|null|undefined} raw
 * @returns {Record<string, string>}
 */
export function parseSeen(raw) {
  try {
    const value = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, day]) => typeof day === 'string'));
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, string>} seen
 * @param {string} id
 * @returns {boolean}
 */
export function hasSeen(seen, id) {
  return Object.hasOwn(seen, id);
}

/**
 * Marks a tour as seen. Idempotent: the first day stays, and the same object comes back.
 * @param {Record<string, string>} seen
 * @param {string} id
 * @param {number} [now] epoch ms (a parameter so tests pin the day)
 * @returns {Record<string, string>}
 */
export function markSeen(seen, id, now = Date.now()) {
  if (hasSeen(seen, id)) return seen;
  return { ...seen, [id]: dayKey(new Date(now)) };
}

/**
 * @param {Pick<Storage, 'getItem'>|null|undefined} [storage]
 * @returns {Record<string, string>}
 */
export function loadSeen(storage = globalThis.localStorage) {
  try {
    return parseSeen(storage?.getItem(TOURS_KEY));
  } catch {
    return {};
  }
}

/**
 * Best-effort write: a blocked storage means the tour shows again next time, nothing worse.
 * @param {Record<string, string>} seen
 * @param {Pick<Storage, 'setItem'>|null|undefined} [storage]
 * @returns {void}
 */
export function saveSeen(seen, storage = globalThis.localStorage) {
  try {
    storage?.setItem(TOURS_KEY, JSON.stringify(seen));
  } catch {
    /* storage unavailable */
  }
}
