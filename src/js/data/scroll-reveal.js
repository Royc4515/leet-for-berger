/**
 * Scroll maths for a block that appears below what the reader is looking at, such as the quiz's
 * feedback after an answer (owner's request: on a phone the explanation and the Next button must
 * come into view on their own, never under the bottom bar or the sticky quiz header).
 *
 * Pure: viewport coordinates in, a distance out; the view measures and scrolls.
 */

/**
 * How far to scroll down so the block shows as much as fits: all of it when it fits, else from its
 * top. Never scrolls its top under the sticky parts above, and never scrolls up.
 * @param {{ top: number, bottom: number, viewTop: number, viewBottom: number }} r
 *   top/bottom: the block; viewTop/viewBottom: the visible band between sticky bars (viewport px)
 * @returns {number} pixels to scroll down, 0 to stay
 */
export function revealDelta({ top, bottom, viewTop, viewBottom }) {
  if (bottom <= viewBottom) return 0;
  return Math.max(0, Math.min(bottom - viewBottom, top - viewTop));
}
