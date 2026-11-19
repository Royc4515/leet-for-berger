/**
 * O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
 * @param {number[][]} grid
 * @return {number}
 */
function minutesToRot(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let frontier = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) frontier.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }

  let minutes = 0;
  // Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing, from
  // being counted as a minute.
  while (frontier.length > 0 && fresh > 0) {
    const next = [];
    for (const [r, c] of frontier) {
      for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          // Marking when queued, not when popped, so a cell joins a wave once.
          grid[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    frontier = next;
    minutes++;
  }
  return fresh > 0 ? -1 : minutes;
}
