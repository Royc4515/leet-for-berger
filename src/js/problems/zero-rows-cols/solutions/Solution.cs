public class Solution {
    // O(m * n) time, O(1) extra space - the first row and column store which columns and rows
    // to clear; two flags remember whether those marker lines held a zero of their own.
    public int[][] SetZeroes(int[][] matrix) {
        int m = matrix.Length, n = matrix[0].Length;
        bool firstRowZero = false, firstColZero = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRowZero = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstColZero = true;
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                if (matrix[i][j] == 0) {
                    matrix[i][0] = 0;
                    matrix[0][j] = 0;
                }
            }
        }
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        }
        // Clear the marker lines last, after every other cell has read them.
        if (firstRowZero) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstColZero) for (int i = 0; i < m; i++) matrix[i][0] = 0;
        return matrix;
    }
}
