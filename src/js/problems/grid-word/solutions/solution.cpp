// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0079.Word%20Search/Solution.cpp
class Solution {
public:
    // O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the
    // pathological boards (one letter everywhere) instant.
    bool exist(vector<string>& board, string word) {
        int m = board.size(), n = board[0].size();
        int have[128] = {0}, need[128] = {0};
        for (auto& row : board) for (char c : row) have[(int)c]++;
        for (char c : word) need[(int)c]++;
        // Not enough copies of some letter: no path can exist, so skip the search entirely.
        for (int c = 0; c < 128; c++) if (need[c] > have[c]) return false;
        // A path read backwards is still a path. Starting from the rarer end cuts most branches early.
        if (have[(int)word.front()] > have[(int)word.back()]) reverse(word.begin(), word.end());
        vector<string> grid = board;
        int dirs[5] = {-1, 0, 1, 0, -1};
        function<bool(int, int, int)> dfs = [&](int i, int j, int k) -> bool {
            if (grid[i][j] != word[k]) {
                return false;
            }
            if (k == (int)word.size() - 1) {
                return true;
            }
            char c = grid[i][j];
            // A character that never occurs in a word marks the cell as on the current path.
            grid[i][j] = '#';
            bool found = false;
            for (int u = 0; u < 4 && !found; ++u) {
                int x = i + dirs[u], y = j + dirs[u + 1];
                found = x >= 0 && x < m && y >= 0 && y < n && dfs(x, y, k + 1);
            }
            // Unmark on the way back, or later starting cells would find this cell blocked.
            grid[i][j] = c;
            return found;
        };
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (dfs(i, j, 0)) {
                    return true;
                }
            }
        }
        return false;
    }
};
