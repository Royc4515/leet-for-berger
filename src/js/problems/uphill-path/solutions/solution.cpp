class Solution {
public:
    // O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
    // strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
    int longestIncreasingPath(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        vector<pair<int, int>> cells;
        cells.reserve(m * n);
        for (int c = 0; c < m * n; c++) cells.push_back({matrix[c / n][c % n], c});
        sort(cells.rbegin(), cells.rend());
        vector<int> best(m * n, 0);
        int answer = 0;
        const int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (auto [v, c] : cells) {
            int i = c / n, j = c % n, len = 1;
            for (auto& d : dirs) {
                int x = i + d[0], y = j + d[1];
                if (x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > v) len = max(len, best[x * n + y] + 1);
            }
            best[c] = len;
            answer = max(answer, len);
        }
        return answer;
    }
};
