// O(m * n) time, O(1) extra space - the first row and column store which columns and rows to
// clear; two flags remember whether those marker lines held a zero of their own.
function setZeroes(matrix: number[][]): number[][] {
  const m = matrix.length;
  const n = matrix[0].length;
  const firstRowZero = matrix[0].includes(0);
  const firstColZero = matrix.some((row) => row[0] === 0);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0;
        matrix[0][j] = 0;
      }
    }
  }
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
  }
  // Clear the marker lines last, after every other cell has read them.
  if (firstRowZero) matrix[0].fill(0);
  if (firstColZero) for (const row of matrix) row[0] = 0;
  return matrix;
}
