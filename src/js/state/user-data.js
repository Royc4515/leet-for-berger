/**
 * The one list of what this site stores per user in the browser (ADR 0006). Signing out clears
 * all of it, so the next person on the device starts as a guest. A new per-user store must be
 * added here; tests/user-data.test.js fails if a source file persists a key this list misses.
 *
 * Not listed on purpose: layout and language preferences (lfb:split:*, lfb:lang, lfb:about-open,
 * lfb:map-view, lfb:tours:v1, lfb:quiz-lang) are about the device, not the account; lfb:seen-solved is a per-tab sessionStorage
 * number for the Problems page count-up; lfb:return-to is the per-tab route a sign-in started from. The GitHub link lives in memory only (auth/github-sync.js).
 */
import { STORAGE_KEY as PROGRESS_KEY } from './progress.js';
import { DRAFT_PREFIX } from './drafts.js';

/**
 * localStorage key holding quiz progress (state/quiz-progress.js). Defined here, not there: this
 * module loads on every page and must not pull the quiz code into the startup graph.
 */
export const QUIZ_STORAGE_KEY = 'lfb:quiz:v1';

/**
 * Window event sent when quiz progress is saved (state/quiz-progress.js); account sync listens
 * (auth/account.js). Named here for the same reason as the key: the listener loads at startup.
 * detail.source: 'local' for a play on this device, 'sync' for a merge the sync wrote itself.
 */
export const QUIZ_SAVED_EVENT = 'quiz:saved';

/** localStorage key holding the most recent Interview and Battle results shown on the Modes hub. */
export const LAST_SESSIONS_KEY = 'lfb:last-sessions:v1';

/** Exact localStorage keys holding a user's data. */
export const USER_KEYS = [PROGRESS_KEY, LAST_SESSIONS_KEY, QUIZ_STORAGE_KEY];
/** localStorage key prefixes holding a user's data (one key per problem and language). */
export const USER_KEY_PREFIXES = [DRAFT_PREFIX];

/**
 * @param {string} key
 * @returns {boolean} true when the key belongs to a user's data
 */
export function isUserKey(key) {
  return USER_KEYS.includes(key) || USER_KEY_PREFIXES.some((p) => key.startsWith(p));
}

/**
 * Removes every per-user key from a Storage. Best-effort: a blocked or throwing storage means
 * there is nothing to clear.
 * @param {Pick<Storage, 'length'|'key'|'removeItem'>|null|undefined} [storage]
 * @returns {string[]} the keys removed
 */
export function clearUserData(storage = globalThis.localStorage) {
  const removed = [];
  try {
    // Collect first: removing while iterating shifts the indexes.
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    for (const k of keys) {
      if (k && isUserKey(k)) {
        storage.removeItem(k);
        removed.push(k);
      }
    }
  } catch {
    /* storage unavailable */
  }
  return removed;
}
