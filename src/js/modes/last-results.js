/**
 * Pure parsers and formatters for the most recent Interview and Battle results shown on the
 * Modes hub. Persistence stays in the view layer (via state/user-data.js) so this module stays
 * DOM- and I/O-free (CLAUDE.md invariant 6).
 */
import { bandLabel } from './interview.js';
import { oaFormatLabel } from './mock-oa.js';
import { botLabel } from './battle.js';

const VALID_BANDS = new Set(['strong', 'mid', 'low']);

/**
 * Parses serialized last-session JSON into a safe structure. Corrupt or missing input returns
 * `{ interview: null, battle: null }`.
 * @param {string|null|undefined} raw
 * @returns {{ interview: { formatLabel?: string, score: number, band: string, bandLabel: string, solved: number, total: number } | null, battle: { won: boolean, botName: string, problemTitle: string } | null }}
 */
export function parseLastResults(raw) {
  const empty = { interview: null, battle: null };
  if (!raw || typeof raw !== 'string') return empty;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!data || typeof data !== 'object') return empty;

  const iv = data.interview;
  const interview =
    iv &&
    typeof iv === 'object' &&
    Number.isFinite(iv.score) &&
    Number.isFinite(iv.solved) &&
    Number.isFinite(iv.total) &&
    VALID_BANDS.has(iv.band) &&
    typeof iv.bandLabel === 'string' &&
    iv.bandLabel.length > 0
      ? {
          formatLabel: typeof iv.formatLabel === 'string' && iv.formatLabel ? iv.formatLabel : '',
          score: Math.round(iv.score),
          band: iv.band,
          bandLabel: iv.bandLabel,
          solved: iv.solved,
          total: iv.total,
        }
      : null;

  const bt = data.battle;
  const battle =
    bt &&
    typeof bt === 'object' &&
    typeof bt.won === 'boolean' &&
    typeof bt.botName === 'string' &&
    bt.botName.length > 0 &&
    typeof bt.problemTitle === 'string' &&
    bt.problemTitle.length > 0
      ? {
          won: bt.won,
          botName: bt.botName,
          problemTitle: bt.problemTitle,
        }
      : null;

  return { interview, battle };
}

/**
 * Formats a stored interview result for the Modes hub card.
 * @param {{ formatLabel?: string, score: number, band: string, bandLabel: string, solved: number, total: number } | null | undefined} entry
 * @param {'en' | 'he'} [lang] the stored labels are English; Hebrew maps them by band and format
 * @returns {{ text: string, band: string, bandLabel: string } | null}
 */
export function formatLastInterview(entry, lang = 'en') {
  if (!entry) return null;
  const he = lang === 'he';
  const parts = [];
  if (entry.formatLabel) parts.push(he ? oaFormatLabel(entry.formatLabel, 'he') : entry.formatLabel);
  parts.push(`${entry.score} / 100 (${he ? bandLabel(entry.band, 'he') || entry.bandLabel : entry.bandLabel})`);
  parts.push(he ? `${entry.solved} / ${entry.total} נפתרו` : `${entry.solved} / ${entry.total} solved`);
  return {
    text: he ? `הסשן האחרון: ${parts.join(' · ')}` : `Last session: ${parts.join(' · ')}`,
    band: entry.band,
    bandLabel: entry.bandLabel,
  };
}

/**
 * Formats a stored battle result for the Modes hub card.
 * @param {{ won: boolean, botName: string, problemTitle: string } | null | undefined} entry
 * @param {'en' | 'he'} [lang] the problem title stays English (docs/I18N.md)
 * @returns {{ text: string, won: boolean } | null}
 */
export function formatLastBattle(entry, lang = 'en') {
  if (!entry) return null;
  if (lang === 'he') {
    const bot = botLabel(entry.botName, 'he');
    const outcome = entry.won ? `ניצחון מול ${bot}` : `${bot} סיים ראשון`;
    return { text: `המרוץ האחרון: ${outcome} · ${entry.problemTitle}`, won: entry.won };
  }
  const outcome = entry.won ? `Won vs ${entry.botName}` : `${entry.botName} finished first`;
  return {
    text: `Last race: ${outcome} · ${entry.problemTitle}`,
    won: entry.won,
  };
}
