public class Solution {
    // O(m * n) time - four walls close in; each sweep reads one side of the current layer.
    public int[] SpiralOrder(int[][] matrix) {
        int m = matrix.Length, n = matrix[0].Length;
        int[] output = new int[m * n];
        int k = 0;
        int top = 0, bottom = m - 1, left = 0, right = n - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) output[k++] = matrix[top][c];
            for (int r = top + 1; r <= bottom; r++) output[k++] = matrix[r][right];
            // A lone leftover row or column was already read by the two sweeps above.
            if (top < bottom && left < right) {
                for (int c = right - 1; c >= left; c--) output[k++] = matrix[bottom][c];
                for (int r = bottom - 1; r > top; r--) output[k++] = matrix[r][left];
            }
            top++;
            bottom--;
            left++;
            right--;
        }
        return output;
    }
}
