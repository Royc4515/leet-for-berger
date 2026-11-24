/**
 * The text a player shares after the daily quiz: the quiz number, the score, one square per
 * question in the order played, the streak and a link, in the quiz's language. Squares only, no
 * question text, so sharing never spoils the quiz for friends who have not played it yet.
 *
 * Pure: no DOM; the view hands the text to the share sheet or the clipboard.
 */

/**
 * @param {{ number: number, results: boolean[], streak?: number, rank?: number|null, players?: number|null, lang?: 'en'|'he', url: string }} p
 * @returns {string}
 */
export function shareText({ number, results, streak = 0, rank = null, players = null, lang = 'en', url }) {
  const correct = results.filter(Boolean).length;
  const squares = results.map((r) => (r ? '🟩' : '🟥')).join('');
  const he = lang === 'he';
  const lines = [
    he ? `חידון יומי #${number} · ${correct}/${results.length}` : `Daily quiz #${number} · ${correct}/${results.length}`,
    squares,
  ];
  const extras = [];
  if (streak > 1) extras.push(he ? `🔥 רצף של ${streak} ימים` : `🔥 ${streak}-day streak`);
  if (rank && players) extras.push(he ? `🏆 מקום ${rank} מתוך ${players}` : `🏆 #${rank} of ${players}`);
  if (extras.length) lines.push(extras.join(' · '));
  lines.push(he ? `אפשר לנסות בעצמך: ${url}` : `Can you beat it? ${url}`);
  return lines.join('\n');
}
