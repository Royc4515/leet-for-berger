// O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.
class NumMatrix {
  /**
   * @param {number[][]} matrix
   */
  constructor(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    // An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
    this.p = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // The block above and the block to the left overlap in p[r][c], counted twice.
        this.p[r + 1][c + 1] = matrix[r][c] + this.p[r][c + 1] + this.p[r + 1][c] - this.p[r][c];
      }
    }
  }

  /**
   * @param {number} row1
   * @param {number} col1
   * @param {number} row2
   * @param {number} col2
   * @return {number}
   */
  sumRegion(row1, col1, row2, col2) {
    const p = this.p;
    // Remove the strip above and the strip to the left, then add back their shared corner.
    return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
  }
}
