/**
 * Per-problem, per-language code drafts, and when each was last really edited.
 * Kept apart from progress so autosave on every keystroke does not rewrite the whole
 * progress blob (and a corrupt draft cannot take progress down with it).
 */
/** Every draft key starts with this; state/user-data.js clears by prefix on sign-out. */
export const DRAFT_PREFIX = 'lfb:draft:v1:';
/**
 * Every draft edit time starts with this: the ISO time the draft's code last changed, so "you left
 * this unfinished" (data/notifications.js) counts work, not a problem that was only opened.
 * Cleared with the drafts on sign-out (state/user-data.js).
 */
export const DRAFT_AT_PREFIX = 'lfb:draft-at:v1:';
const key = (problemId, lang) => `${DRAFT_PREFIX}${problemId}:${lang}`;
const atKey = (problemId, lang) => `${DRAFT_AT_PREFIX}${problemId}:${lang}`;

/**
 * @param {string} problemId
 * @param {string} lang language id from engine/codegen.js
 * @param {Pick<Storage, 'getItem'>} [storage] injectable for unit tests
 * @returns {string | null} the saved code, or null when there is none or storage is unavailable
 */
export function loadDraft(problemId, lang, storage = globalThis.localStorage) {
  try {
    return storage.getItem(key(problemId, lang));
  } catch {
    return null;
  }
}

/**
 * Best effort: a full or blocked localStorage loses the draft rather than interrupting typing.
 * The edit time moves only when the code changes, because the editor also saves on close and on a
 * language switch, and that is not work. Code equal to the starter is no draft at all: it is removed,
 * so opening a problem and leaving never counts as leaving it unfinished.
 * @param {string} problemId
 * @param {string} lang
 * @param {string} code
 * @param {{ starter?: string, now?: Date, storage?: Storage }} [opts] `starter`: the generated starter code for `lang`
 */
export function saveDraft(problemId, lang, code, { starter, now = new Date(), storage = globalThis.localStorage } = {}) {
  if (starter !== undefined && code === starter) {
    clearDraft(problemId, lang, storage);
    return;
  }
  try {
    if (storage.getItem(key(problemId, lang)) === code) return;
    storage.setItem(key(problemId, lang), code);
    storage.setItem(atKey(problemId, lang), now.toISOString());
  } catch {
    /* quota or private mode: drafts are best-effort */
  }
}

/**
 * Removes a draft and its edit time.
 * @param {string} problemId
 * @param {string} lang
 * @param {Pick<Storage, 'removeItem'>} [storage]
 */
export function clearDraft(problemId, lang, storage = globalThis.localStorage) {
  try {
    storage.removeItem(key(problemId, lang));
    storage.removeItem(atKey(problemId, lang));
  } catch {
    /* ignore */
  }
}

/**
 * Drafts with a known edit time, for data/notifications.js. A time whose draft is gone is skipped,
 * and drafts saved before edit times existed have none, so they never count as left unfinished.
 * @param {Pick<Storage, 'length'|'key'|'getItem'>} [storage]
 * @returns {{ problemId: string, lang: string, at: string }[]}
 */
export function listDraftEdits(storage = globalThis.localStorage) {
  const out = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k?.startsWith(DRAFT_AT_PREFIX)) continue;
      // Problem ids are kebab-case and language ids are plain words, so the last colon splits them.
      const rest = k.slice(DRAFT_AT_PREFIX.length);
      const cut = rest.lastIndexOf(':');
      if (cut <= 0 || cut === rest.length - 1) continue;
      const problemId = rest.slice(0, cut);
      const lang = rest.slice(cut + 1);
      const at = storage.getItem(k);
      if (storage.getItem(key(problemId, lang)) === null || !Number.isFinite(Date.parse(at ?? ''))) continue;
      out.push({ problemId, lang, at });
    }
  } catch {
    /* storage unavailable: no drafts to report */
  }
  return out;
}
