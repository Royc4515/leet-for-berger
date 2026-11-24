/**
 * Per-problem, per-language code drafts.
 * Kept apart from progress so autosave on every keystroke does not rewrite the whole
 * progress blob (and a corrupt draft cannot take progress down with it).
 */
/** Every draft key starts with this; state/user-data.js clears by prefix on sign-out. */
export const DRAFT_PREFIX = 'lfb:draft:v1:';
const key = (problemId, lang) => `${DRAFT_PREFIX}${problemId}:${lang}`;

/**
 * @param {string} problemId
 * @param {string} lang language id from engine/codegen.js
 * @returns {string | null} the saved code, or null when there is none or storage is unavailable
 */
export function loadDraft(problemId, lang) {
  try {
    return localStorage.getItem(key(problemId, lang));
  } catch {
    return null;
  }
}

/**
 * Best effort: a full or blocked localStorage loses the draft rather than interrupting typing.
 * @param {string} problemId
 * @param {string} lang
 * @param {string} code
 */
export function saveDraft(problemId, lang, code) {
  try {
    localStorage.setItem(key(problemId, lang), code);
  } catch {
    /* quota or private mode: drafts are best-effort */
  }
}

/**
 * @param {string} problemId
 * @param {string} lang
 */
export function clearDraft(problemId, lang) {
  try {
    localStorage.removeItem(key(problemId, lang));
  } catch {
    /* ignore */
  }
}
