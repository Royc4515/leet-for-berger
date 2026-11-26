/**
 * 1v1 Battle: opponent model.
 *
 * v1 ships the bot opponent only. Real-time peers need a server (WebSocket room +
 * server-side judging, otherwise a client can fake its own progress); the
 * `Opponent` contract below is what a future `RemoteOpponent` must implement.
 *
 * @typedef {Object} Opponent
 * @property {string} name
 * @property {(elapsedMs: number) => number} passedAt  tests passed (0..15) at a moment
 */
import { mulberry32 } from '../engine/rng.js';

const BASE_SOLVE_MS = { Easy: 6 * 60e3, Medium: 12 * 60e3, Hard: 20 * 60e3 };

export const BOT_LEVELS = [
  { id: 'rookie', label: 'Rookie bot', speed: 1.6 },
  { id: 'regular', label: 'Regular bot', speed: 1.0 },
  { id: 'grandmaster', label: 'Grandmaster bot', speed: 0.55 },
];

const BOT_LABELS_HE = { rookie: 'בוט מתחיל', regular: 'בוט רגיל', grandmaster: 'בוט גראנדמאסטר' };

/**
 * A bot's name in the page language. Takes a level id or the stored English label (the last race
 * keeps the English one); an unknown value comes back as it is. The race itself stays English.
 * @param {string} levelOrLabel
 * @param {'en' | 'he'} [lang]
 * @returns {string}
 */
export function botLabel(levelOrLabel, lang = 'en') {
  const l = BOT_LEVELS.find((x) => x.id === levelOrLabel || x.label === levelOrLabel);
  if (!l) return levelOrLabel;
  return lang === 'he' ? BOT_LABELS_HE[l.id] : l.label;
}

/**
 * A bot whose test count climbs in steps, like a human fixing one edge case at a time.
 * Seeded so a rematch with the same seed replays the same race.
 * @returns {Opponent}
 */
export function createBot({ difficulty = 'Medium', level = 'regular', seed = 42, total = 15 }) {
  const rnd = mulberry32(seed);
  const lvl = BOT_LEVELS.find((l) => l.id === level) ?? BOT_LEVELS[1];
  const solveMs = BASE_SOLVE_MS[difficulty] * lvl.speed * (0.75 + rnd() * 0.5);

  // Checkpoints: (time fraction, tests passed). First run tends to pass the easy visible ones.
  const checkpoints = [];
  let passed = 0;
  let t = 0.25 + rnd() * 0.15;
  while (passed < total) {
    passed = Math.min(total, passed + 1 + Math.floor(rnd() * 5));
    checkpoints.push({ at: Math.min(1, t) * solveMs, passed });
    t += 0.08 + rnd() * 0.15;
  }
  checkpoints[checkpoints.length - 1].at = solveMs;

  return {
    name: lvl.label,
    solveMs,
    passedAt(elapsedMs) {
      let p = 0;
      for (const c of checkpoints) if (elapsedMs >= c.at) p = c.passed;
      return p;
    },
  };
}
