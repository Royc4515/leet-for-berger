// O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
function largestSquareArea(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  const dp = new Int32Array(cols + 1);
  let best = 0;
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    let prevDiag = 0;
    for (let c = 0; c < cols; c++) {
      const saved = dp[c + 1];
      if (row[c] === 1) {
        let m = dp[c + 1];
        if (dp[c] < m) m = dp[c];
        if (prevDiag < m) m = prevDiag;
        const side = m + 1;
        dp[c + 1] = side;
        if (side > best) best = side;
      } else {
        dp[c + 1] = 0;
      }
      prevDiag = saved;
    }
  }
  return best * best;
}
