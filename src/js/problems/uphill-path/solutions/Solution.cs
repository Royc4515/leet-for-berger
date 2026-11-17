public class Solution {
    // O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
    // strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
    public int LongestIncreasingPath(int[][] matrix) {
        int m = matrix.Length, n = matrix[0].Length, total = m * n;
        // value * total + index packs a cell into one sortable 64-bit key.
        var keys = new long[total];
        for (int c = 0; c < total; c++) keys[c] = (long)matrix[c / n][c % n] * total + c;
        Array.Sort(keys);
        var best = new int[total];
        int answer = 0;
        int[,] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
        for (int k = total - 1; k >= 0; k--) {
            int c = (int)(keys[k] % total), i = c / n, j = c % n, len = 1;
            for (int d = 0; d < 4; d++) {
                int x = i + dirs[d, 0], y = j + dirs[d, 1];
                if (x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > matrix[i][j]) len = Math.Max(len, best[x * n + y] + 1);
            }
            best[c] = len;
            answer = Math.Max(answer, len);
        }
        return answer;
    }
}
