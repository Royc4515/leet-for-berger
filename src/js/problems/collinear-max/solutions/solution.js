/**
 * O(n^2) time - for each anchor, count the other points per exact direction.
 * @param {number[][]} points
 * @return {number}
 */
function maxPoints(points) {
  const n = points.length;
  if (n <= 2) return n;
  const gcd = (a, b) => {
    while (b) [a, b] = [b, a % b];
    return Math.abs(a);
  };
  let best = 1;
  for (let i = 0; i < n; i++) {
    const directions = new Map();
    for (let j = i + 1; j < n; j++) {
      let dx = points[j][0] - points[i][0];
      let dy = points[j][1] - points[i][1];
      const g = gcd(dx, dy);
      dx /= g;
      dy /= g;
      // One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
      if (dx < 0 || (dx === 0 && dy < 0)) {
        dx = -dx;
        dy = -dy;
      }
      // A number key: dx is in [0, 2 * 10^4] and dy in [-2 * 10^4, 2 * 10^4] after reducing.
      const key = dx * 40001 + dy;
      const count = (directions.get(key) ?? 0) + 1;
      directions.set(key, count);
      if (count + 1 > best) best = count + 1;
    }
  }
  return best;
}
