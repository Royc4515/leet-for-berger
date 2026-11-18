/**
 * User progress: solves, submissions, streak, accuracy, code drafts.
 *
 * Persistence is localStorage for v1 (single user, no backend). The pure reducers below
 * take and return plain objects so they are unit-tested in Node and can later move to a
 * server without touching the UI.
 */

const STORAGE_KEY = 'lfb:progress:v1';

export function emptyState() {
  return { version: 1, problems: {}, activeDays: [], totals: { submissions: 0, accepted: 0 }, drafts: {} };
}

/** Local calendar day, not UTC: a streak should follow the user's midnight, not Greenwich's. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Submissions kept per problem, newest first. Each keeps its code, so the cap protects the 5 MB localStorage quota. */
export const HISTORY_LIMIT = 10;
/** Code longer than this is not kept in history (the verdict still is). */
export const HISTORY_CODE_LIMIT = 20000;

/**
 * @typedef {{ at: string, language: string, verdict: string, passed: number, total: number, code: string|null }} SubmissionRecord
 */

/**
 * Record a submission verdict, and when `detail` is given, a history entry for the problem.
 * @param {ReturnType<typeof emptyState>} state
 * @param {{ problemId: string, accepted: boolean, revealed?: boolean, now?: Date,
 *   detail?: { language: string, verdict: string, passed: number, total: number, code: string } }} sub
 */
export function recordSubmission(state, { problemId, accepted, revealed = false, now = new Date(), detail = null }) {
  const prev = state.problems[problemId] ?? { status: 'attempted', submissions: 0, accepted: 0, revealed: false };
  const entry = {
    ...prev,
    submissions: prev.submissions + 1,
    accepted: prev.accepted + (accepted ? 1 : 0),
    revealed: prev.revealed || revealed,
    status: prev.status === 'solved' || accepted ? 'solved' : 'attempted',
  };
  if (detail) {
    /** @type {SubmissionRecord} */
    const record = {
      at: now.toISOString(),
      language: detail.language,
      verdict: detail.verdict,
      passed: detail.passed,
      total: detail.total,
      code: detail.code.length <= HISTORY_CODE_LIMIT ? detail.code : null,
    };
    entry.history = [record, ...(prev.history ?? [])].slice(0, HISTORY_LIMIT);
  }
  const today = dayKey(now);
  const activeDays = accepted && !state.activeDays.includes(today) ? [...state.activeDays, today].sort() : state.activeDays;
  return {
    ...state,
    problems: { ...state.problems, [problemId]: entry },
    activeDays,
    totals: {
      submissions: state.totals.submissions + 1,
      accepted: state.totals.accepted + (accepted ? 1 : 0),
    },
  };
}

/** @param {ReturnType<typeof emptyState>} state */
export function markRevealed(state, problemId) {
  const prev = state.problems[problemId] ?? { status: 'attempted', submissions: 0, accepted: 0, revealed: false };
  return { ...state, problems: { ...state.problems, [problemId]: { ...prev, revealed: true } } };
}

/**
 * Consecutive days with an accepted submission, ending today or yesterday.
 * Yesterday still counts so the streak does not show 0 every morning before the first solve.
 */
export function computeStreak(activeDays, now = new Date()) {
  const days = new Set(activeDays);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** @param {ReturnType<typeof emptyState>} state */
export function stats(state, now = new Date()) {
  const solved = Object.values(state.problems).filter((p) => p.status === 'solved').length;
  const { submissions, accepted } = state.totals;
  return {
    solved,
    streak: computeStreak(state.activeDays, now),
    accuracy: submissions === 0 ? null : Math.round((accepted / submissions) * 100),
    submissions,
  };
}

/* ---------- Browser persistence (thin, defensive) ---------- */

export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    // Unknown version = shape we cannot trust; start clean instead of crashing the UI.
    return parsed?.version === 1 ? { ...emptyState(), ...parsed } : emptyState();
  } catch {
    return emptyState();
  }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota exceeded: progress is a convenience, never block the user on it.
  }
}

/** Simple observable store so views re-render on change without a framework. */
export function createStore(initial = load()) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    update(fn) {
      state = fn(state);
      save(state);
      listeners.forEach((l) => l(state));
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
