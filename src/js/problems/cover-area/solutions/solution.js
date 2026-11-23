/**
 * O(1) time - both areas minus the overlap, which is a rectangle when it exists.
 * @return {number}
 */
function computeArea(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  // Clamp each side at 0 separately: two negative sides would multiply to a positive area.
  const width = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
  const height = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - width * height;
}
