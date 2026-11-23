// O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
int largestSquareArea(int** grid, int gridSize, int* gridColSize) {
    int cols = gridColSize[0];
    int* dp = calloc((size_t)(cols + 1), sizeof(int));
    int best = 0;
    for (int r = 0; r < gridSize; r++) {
        int prevDiag = 0;
        for (int c = 0; c < cols; c++) {
            int saved = dp[c + 1];
            if (grid[r][c] == 1) {
                int m = dp[c + 1] < dp[c] ? dp[c + 1] : dp[c];
                if (prevDiag < m) m = prevDiag;
                int side = m + 1;
                dp[c + 1] = side;
                if (side > best) best = side;
            } else {
                dp[c + 1] = 0;
            }
            prevDiag = saved;
        }
    }
    free(dp);
    return best * best;
}
