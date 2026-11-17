// O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.
public class NumMatrix {
    private readonly int[,] p;

    public NumMatrix(int[][] matrix) {
        int rows = matrix.Length, cols = matrix[0].Length;
        // An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
        p = new int[rows + 1, cols + 1];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                // The block above and the block to the left overlap in p[r, c], counted twice.
                p[r + 1, c + 1] = matrix[r][c] + p[r, c + 1] + p[r + 1, c] - p[r, c];
            }
        }
    }

    public int SumRegion(int row1, int col1, int row2, int col2) {
        // Remove the strip above and the strip to the left, then add back their shared corner.
        return p[row2 + 1, col2 + 1] - p[row1, col2 + 1] - p[row2 + 1, col1] + p[row1, col1];
    }
}
