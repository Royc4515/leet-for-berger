// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0289.Game%20of%20Life/Solution.cpp
class Solution {
public:
    // O(m * n) time, O(1) extra space - update in place with two transitional states that still
    // remember the current generation: 2 = alive now, dead next; -1 = dead now, alive next.
    // "board[x][y] > 0" is then exactly "alive now", whatever has been rewritten already.
    vector<vector<int>> nextGeneration(vector<vector<int>>& board) {
        int m = board.size(), n = board[0].size();
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                // The 3 x 3 scan below counts the cell itself; start at minus its own state.
                int live = -board[i][j];
                for (int x = i - 1; x <= i + 1; ++x) {
                    for (int y = j - 1; y <= j + 1; ++y) {
                        if (x >= 0 && x < m && y >= 0 && y < n && board[x][y] > 0) ++live;
                    }
                }
                if (board[i][j] == 1 && (live < 2 || live > 3)) {
                    board[i][j] = 2;
                } else if (board[i][j] == 0 && live == 3) {
                    board[i][j] = -1;
                }
            }
        }
        // Second pass: settle the transitional states into the next generation.
        for (auto& row : board) {
            for (int& v : row) {
                if (v == 2) v = 0;
                else if (v == -1) v = 1;
            }
        }
        return board;
    }
};
