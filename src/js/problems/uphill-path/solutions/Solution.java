import java.util.*;

class Solution {
    // O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
    // strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
    public int longestIncreasingPath(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length, total = m * n;
        // Sorting value * total + index as one long sorts cells by value with primitive speed.
        long[] keys = new long[total];
        for (int c = 0; c < total; c++) keys[c] = (long) matrix[c / n][c % n] * total + c;
        Arrays.sort(keys);
        int[] best = new int[total];
        int answer = 0;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int k = total - 1; k >= 0; k--) {
            int c = (int) (keys[k] % total), i = c / n, j = c % n, len = 1;
            for (int[] d : dirs) {
                int x = i + d[0], y = j + d[1];
                if (x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > matrix[i][j]) len = Math.max(len, best[x * n + y] + 1);
            }
            best[c] = len;
            answer = Math.max(answer, len);
        }
        return answer;
    }
}
