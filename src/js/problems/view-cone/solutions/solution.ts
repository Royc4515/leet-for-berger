// O(n log n) time - only directions matter: sort the polar angles and slide a window of the
// view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
function visiblePoints(points: number[][], angle: number, location: number[]): number {
  const [x, y] = location;
  let here = 0;
  const angles: number[] = [];
  for (const [px, py] of points) {
    // A point on the viewer has no direction and is visible whichever way you face.
    if (px === x && py === y) here++;
    else angles.push(Math.atan2(py - y, px - x));
  }
  angles.sort((a, b) => a - b);
  const m = angles.length;
  for (let i = 0; i < m; i++) angles.push(angles[i] + 2 * Math.PI);
  // 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
  const width = (angle * Math.PI) / 180 + 1e-9;
  let best = 0;
  for (let i = 0, j = 0; j < 2 * m; j++) {
    while (angles[j] - angles[i] > width) i++;
    best = Math.max(best, j - i + 1);
  }
  // Math.min(..., m): a window never holds the same direction twice.
  return Math.min(best, m) + here;
}
