/**
 * Interview Simulator: pure session logic (timer, lockdown counters, analytics).
 * The view layer (ui/views/interview.js) owns DOM and lockdown side effects; this file
 * stays pure so the scoring rules are unit-testable.
 */

export const DEFAULT_DURATION_MS = 45 * 60 * 1000;

/**
 * @param {{ problemIds: string[], durationMs?: number, now?: number }} opts
 */
export function createSession({ problemIds, durationMs = DEFAULT_DURATION_MS, now = Date.now() }) {
  if (!problemIds.length) throw new Error('An interview needs at least one problem.');
  return {
    problemIds,
    durationMs,
    startedAt: now,
    endedAt: null,
    tabSwitches: 0,
    runs: 0,
    submissions: 0,
    perProblem: Object.fromEntries(problemIds.map((id) => [id, { bestPassed: 0, total: 15, acceptedAtMs: null }])),
  };
}

export function remainingMs(session, now = Date.now()) {
  const end = session.endedAt ?? now;
  return Math.max(0, session.durationMs - (end - session.startedAt));
}

export function isOver(session, now = Date.now()) {
  return session.endedAt !== null || remainingMs(session, now) === 0;
}

/**
 * @param {ReturnType<typeof createSession>} session
 * @param {{ problemId: string, passed: number, total: number, accepted: boolean, kind: 'run'|'submit', now?: number }} ev
 */
export function recordAttempt(session, { problemId, passed, total, accepted, kind, now = Date.now() }) {
  if (isOver(session, now)) return session;
  const prev = session.perProblem[problemId];
  if (!prev) return session;
  const acceptedAtMs = prev.acceptedAtMs ?? (accepted && kind === 'submit' ? now - session.startedAt : null);
  return {
    ...session,
    runs: session.runs + (kind === 'run' ? 1 : 0),
    submissions: session.submissions + (kind === 'submit' ? 1 : 0),
    perProblem: {
      ...session.perProblem,
      [problemId]: { bestPassed: Math.max(prev.bestPassed, passed), total, acceptedAtMs },
    },
  };
}

export function recordTabSwitch(session, now = Date.now()) {
  return isOver(session, now) ? session : { ...session, tabSwitches: session.tabSwitches + 1 };
}

export function finish(session, now = Date.now()) {
  return session.endedAt ? session : { ...session, endedAt: Math.min(now, session.startedAt + session.durationMs) };
}

/**
 * Score: test coverage dominates, speed is a tiebreaker-sized bonus, and integrity
 * violations cost points. Weights are intentionally simple so a candidate can predict them.
 */
export function analytics(session) {
  const problems = Object.entries(session.perProblem).map(([id, p]) => ({
    id,
    coverage: p.total ? p.bestPassed / p.total : 0,
    solved: p.acceptedAtMs !== null,
    solveTimeMs: p.acceptedAtMs,
  }));
  const usedMs = (session.endedAt ?? Date.now()) - session.startedAt;
  const coverage = problems.reduce((a, p) => a + p.coverage, 0) / problems.length;
  const speedBonus = problems.filter((p) => p.solved).length ? Math.max(0, 1 - usedMs / session.durationMs) * 10 : 0;
  const integrityPenalty = Math.min(20, session.tabSwitches * 5);
  const score = Math.max(0, Math.round(coverage * 90 + speedBonus - integrityPenalty));
  return {
    score,
    usedMs,
    solved: problems.filter((p) => p.solved).length,
    problems,
    runs: session.runs,
    submissions: session.submissions,
    tabSwitches: session.tabSwitches,
  };
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
