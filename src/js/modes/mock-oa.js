/**
 * Mock OA: picks the problems for a timed online assessment. The session itself (timer,
 * lockdown, scoring, report) is the interview session in modes/interview.js.
 *
 * Pure: the random seed is a parameter, so a given setup always yields the same problems.
 */
import { mulberry32 } from '../engine/rng.js';

/**
 * Formats modelled on common OA shapes: slots are filled in order, one problem per slot.
 * @type {{ id: string, label: string, minutes: number, slots: string[], note: string }[]}
 */
export const OA_FORMATS = [
  { id: 'screen', label: 'Phone screen', minutes: 45, slots: ['Medium'], note: '1 Medium, 45 minutes' },
  { id: 'oa', label: 'Online assessment', minutes: 70, slots: ['Easy', 'Medium'], note: '1 Easy + 1 Medium, 70 minutes' },
  { id: 'hard-oa', label: 'Hard OA', minutes: 90, slots: ['Medium', 'Medium', 'Hard'], note: '2 Medium + 1 Hard, 90 minutes' },
];

/**
 * @typedef {{ id: string, difficulty: string }} OaCandidate
 */

/**
 * One problem per slot. Prefers unsolved problems, then problems of the slot's difficulty;
 * when a difficulty runs out it borrows the nearest one so a small company set still yields a
 * full OA. Never repeats a problem.
 *
 * @param {{ candidates: OaCandidate[], format: { slots: string[] }, seed: number, solved?: Set<string> }} opts
 * @returns {string[]} problem ids, possibly fewer than slots when candidates run out
 */
export function pickOaProblems({ candidates, format, seed, solved = new Set() }) {
  const rand = mulberry32(seed);
  const order = ['Easy', 'Medium', 'Hard'];
  // Shuffle once so ties are broken by the seed, not by catalog order.
  const pool = candidates.map((c) => ({ c, r: rand() }));
  const taken = new Set();
  const picks = [];
  for (const want of format.slots) {
    const best = pool
      .filter(({ c }) => !taken.has(c.id))
      .map(({ c, r }) => ({
        c,
        // Lower is better: unsolved first, then distance from the wanted difficulty, then the seed.
        key: [solved.has(c.id) ? 1 : 0, Math.abs(order.indexOf(c.difficulty) - order.indexOf(want)), r],
      }))
      .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2])[0];
    if (!best) break;
    taken.add(best.c.id);
    picks.push(best.c.id);
  }
  return picks;
}
