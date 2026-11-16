/**
 * Per-problem, per-language code drafts.
 * Kept apart from progress so autosave on every keystroke does not rewrite the whole
 * progress blob (and a corrupt draft cannot take progress down with it).
 */
const key = (problemId, lang) => `lfb:draft:v1:${problemId}:${lang}`;

export function loadDraft(problemId, lang) {
  try {
    return localStorage.getItem(key(problemId, lang));
  } catch {
    return null;
  }
}

export function saveDraft(problemId, lang, code) {
  try {
    localStorage.setItem(key(problemId, lang), code);
  } catch {
    /* quota or private mode: drafts are best-effort */
  }
}

export function clearDraft(problemId, lang) {
  try {
    localStorage.removeItem(key(problemId, lang));
  } catch {
    /* ignore */
  }
}
