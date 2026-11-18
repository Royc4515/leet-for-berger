/**
 * Merging practice progress across devices (ADR 0006). The browser keeps progress in
 * localStorage; a signed-in user also has a copy on the server. On sign-in and on every change,
 * both are merged so nothing either device recorded is lost.
 *
 * Pure: plain objects in, plain objects out.
 */
import { emptyState, HISTORY_LIMIT } from './progress.js';

const sum = (problems, field) => Object.values(problems).reduce((n, p) => n + (p[field] ?? 0), 0);
const keyOf = (h) => `${h.at}|${h.language}|${h.verdict}|${h.passed}`;

function mergeHistory(a = [], b = []) {
  const seen = new Map();
  for (const h of [...a, ...b]) if (!seen.has(keyOf(h))) seen.set(keyOf(h), h);
  // Newest first; ties keep a stable order so the merge is deterministic.
  return [...seen.values()].sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : keyOf(x) < keyOf(y) ? -1 : 1)).slice(0, HISTORY_LIMIT);
}

function mergeProblem(a, b) {
  if (!a) return b;
  if (!b) return a;
  const out = {
    ...a,
    ...b,
    submissions: Math.max(a.submissions ?? 0, b.submissions ?? 0),
    accepted: Math.max(a.accepted ?? 0, b.accepted ?? 0),
    revealed: Boolean(a.revealed || b.revealed),
    status: a.status === 'solved' || b.status === 'solved' ? 'solved' : 'attempted',
  };
  if (a.history || b.history) {
    out.history = mergeHistory(a.history, b.history);
    // Two devices that practiced apart each counted only their own submits; the merged history is
    // an exact record (up to its cap), so the counts are at least what it proves.
    out.submissions = Math.max(out.submissions, out.history.length);
    out.accepted = Math.max(out.accepted, out.history.filter((h) => h.verdict === 'Accepted').length);
  } else delete out.history;
  return out;
}

/**
 * Merges two progress states. Per problem the counts are the larger of the two, raised to what
 * the merged history proves (summing would double count submits already merged on a previous
 * sync), a solve or a reveal anywhere counts, and histories interleave newest first. Drafts stay local's: unsaved code on
 * this device wins over another device's.
 *
 * Idempotent (merge(a, a) = a) and, drafts aside, order-independent.
 *
 * @param {ReturnType<typeof emptyState>} local
 * @param {any} remote the server's copy; null or another version is ignored
 * @returns {ReturnType<typeof emptyState>}
 */
export function mergeProgress(local, remote) {
  if (!remote || remote.version !== 1) return local;
  const base = { ...emptyState(), ...local };
  const problems = {};
  for (const id of new Set([...Object.keys(base.problems), ...Object.keys(remote.problems ?? {})])) {
    problems[id] = mergeProblem(base.problems[id], remote.problems?.[id]);
  }
  return {
    ...base,
    problems,
    activeDays: [...new Set([...base.activeDays, ...(remote.activeDays ?? [])])].sort(),
    totals: {
      submissions: Math.max(base.totals.submissions, remote.totals?.submissions ?? 0, sum(problems, 'submissions')),
      accepted: Math.max(base.totals.accepted, remote.totals?.accepted ?? 0, sum(problems, 'accepted')),
    },
    drafts: { ...(remote.drafts ?? {}), ...base.drafts },
  };
}
