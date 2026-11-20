/**
 * O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move costs
 * one, so the wave that first holds the target is the shortest route.
 * @param {number[][]} grid
 * @return {number}
 */
function shortestClearPath(grid) {
  const n = grid.length;
  if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1;
  const seen = new Uint8Array(n * n);
  seen[0] = 1;
  let frontier = [0];
  let cells = 1;
  while (frontier.length) {
    const next = [];
    for (const cell of frontier) {
      const r = Math.floor(cell / n);
      const c = cell % n;
      if (r === n - 1 && c === n - 1) return cells;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= n || nc >= n || grid[nr][nc] === 1 || seen[nr * n + nc]) continue;
          // Marking when queued, not when taken out, so a cell joins the queue once.
          seen[nr * n + nc] = 1;
          next.push(nr * n + nc);
        }
      }
    }
    frontier = next;
    cells++;
  }
  return -1;
}
