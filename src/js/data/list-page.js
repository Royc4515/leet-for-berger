/**
 * A long list shown a page at a time (owner's request: the problem list on a phone ends in "Show
 * more" instead of one very long scroll). Pure: counts in, counts out; the view draws the rows.
 */

/**
 * @param {{ total: number, shown: number, size: number }} p
 *   total: rows that match; shown: how many the reader has asked to see; size: rows per page
 * @returns {{ visible: number, left: number, next: number }} rows to draw, rows still hidden,
 *   and how many the next "Show more" adds
 */
export function listPage({ total, shown, size }) {
  const visible = Math.min(total, Math.max(size, shown));
  const left = total - visible;
  return { visible, left, next: Math.min(size, left) };
}
