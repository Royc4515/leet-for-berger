class Solution {
    // O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
    // mirroring each row, and both moves are plain swaps.
    public int[][] rotateGrid(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            // Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
            for (int j = i + 1; j < n; j++) {
                int t = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = t;
            }
        }
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int t = row[l];
                row[l] = row[r];
                row[r] = t;
            }
        }
        return matrix;
    }
}
