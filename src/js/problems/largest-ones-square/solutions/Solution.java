class Solution {
    // O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
    public int largestSquareArea(int[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        int[] dp = new int[cols + 1];
        int best = 0;
        for (int r = 0; r < rows; r++) {
            int prevDiag = 0;
            for (int c = 0; c < cols; c++) {
                int saved = dp[c + 1];
                if (grid[r][c] == 1) {
                    int side = 1 + Math.min(prevDiag, Math.min(dp[c + 1], dp[c]));
                    dp[c + 1] = side;
                    if (side > best) best = side;
                } else {
                    dp[c + 1] = 0;
                }
                prevDiag = saved;
            }
        }
        return best * best;
    }
}
