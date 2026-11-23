class Solution {
public:
    // O(rows * cols) time, O(cols) extra space: rolling 1D DP tracking largest square side ending at (r, c).
    int largestSquareArea(vector<vector<int>>& grid) {
        int rows = static_cast<int>(grid.size());
        int cols = static_cast<int>(grid[0].size());
        vector<int> dp(cols + 1, 0);
        int best = 0;
        for (int r = 0; r < rows; r++) {
            int prevDiag = 0;
            for (int c = 0; c < cols; c++) {
                int saved = dp[c + 1];
                if (grid[r][c] == 1) {
                    int side = 1 + min({dp[c + 1], dp[c], prevDiag});
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
};
