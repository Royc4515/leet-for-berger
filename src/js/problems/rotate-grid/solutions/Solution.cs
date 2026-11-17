public class Solution {
    // O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
    // mirroring each row, and both moves are plain swaps.
    public int[][] RotateGrid(int[][] matrix) {
        int n = matrix.Length;
        for (int i = 0; i < n; i++) {
            // Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
            for (int j = i + 1; j < n; j++) {
                (matrix[i][j], matrix[j][i]) = (matrix[j][i], matrix[i][j]);
            }
        }
        foreach (int[] row in matrix) System.Array.Reverse(row);
        return matrix;
    }
}
