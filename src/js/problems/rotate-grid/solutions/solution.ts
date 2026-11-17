// O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
// mirroring each row, and both moves are plain swaps.
function rotateGrid(matrix: number[][]): number[][] {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    // Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
    for (let j = i + 1; j < n; j++) {
      const t = matrix[i][j];
      matrix[i][j] = matrix[j][i];
      matrix[j][i] = t;
    }
  }
  for (const row of matrix) row.reverse();
  return matrix;
}
