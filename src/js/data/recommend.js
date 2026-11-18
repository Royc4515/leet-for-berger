/**
 * What to practice next: the daily problem and weak spots, both derived from solve data.
 *
 * Pure: no DOM, no I/O, time and progress are parameters.
 */
import { mulberry32 } from '../engine/rng.js';
import { pathOrder } from './learning-path.js';

/**
 * FNV-1a over a string, so a day key becomes a well-mixed 32-bit seed.
 * @param {string} s
 * @returns {number}
 */
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * The problem of the day: the same for everyone on a given calendar day, like LeetCode's.
 * Ids are sorted first so the pick does not depend on catalog order.
 * @param {string[]} ids eligible problem ids
 * @param {string} day day key "YYYY-MM-DD" (state/progress.js dayKey)
 * @returns {string|null}
 */
export function dailyProblem(ids, day) {
  if (!ids.length) return null;
  const sorted = [...ids].sort();
  return sorted[Math.floor(mulberry32(hashString(`daily:${day}`))() * sorted.length)];
}

/**
 * @typedef {{ status: string, submissions: number, accepted: number, revealed: boolean }} ProblemProgress
 * @typedef {{ topic: string, title: string, score: number, unsolved: number, assisted: number, failedSubmits: number, next: string|null }} WeakSpot
 */

/**
 * Topics where the learner struggles, weakest first. Signals per problem in the topic:
 * attempted but never solved (2 points: the clearest sign), solved only after revealing the
 * solution (2 points: it was not really solved), and each rejected submit (0.5, capped at 2
 * per problem so one stubborn problem cannot dominate). Topics with no signal are left out, so
 * someone who has not practiced yet gets no weak spots rather than invented ones.
 *
 * @param {import('./learning-path.js').PathTier[]} path
 * @param {Record<string, ProblemProgress>} progress state.problems
 * @param {number} [limit]
 * @returns {WeakSpot[]}
 */
export function weakSpots(path, progress, limit = 3) {
  const out = [];
  for (const tier of path) {
    for (const tp of tier.topics) {
      let unsolved = 0;
      let assisted = 0;
      let failedSubmits = 0;
      let score = 0;
      for (const p of tp.problems) {
        const s = progress[p.id];
        if (!s) continue;
        const failed = Math.max(0, s.submissions - s.accepted);
        failedSubmits += failed;
        score += Math.min(2, failed * 0.5);
        if (s.status !== 'solved' && s.submissions > 0) {
          unsolved++;
          score += 2;
        }
        if (s.status === 'solved' && s.revealed) {
          assisted++;
          score += 2;
        }
      }
      if (score <= 0) continue;
      // Practice where it hurts: an attempted problem first, then the first untouched one.
      const next =
        tp.problems.find((p) => progress[p.id] && progress[p.id].status !== 'solved')?.id ??
        tp.problems.find((p) => !progress[p.id])?.id ??
        null;
      out.push({ topic: tp.id, title: tp.title, score, unsolved, assisted, failedSubmits, next });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

/**
 * Daily problem candidates: the essential path, so the daily always teaches a core pattern.
 * @param {import('./learning-path.js').PathTier[]} path
 * @returns {string[]}
 */
export function dailyCandidates(path) {
  return pathOrder(path).map((p) => p.id);
}
