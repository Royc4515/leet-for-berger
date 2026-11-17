// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.cpp
class Solution {
public:
    // O(rows * cols) time - flood fill each new island once, with an explicit stack so the
    // depth of a snake-shaped island does not depend on the call stack.
    int countIslands(vector<string>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<char> seen(m * n, 0);
        int dirs[5] = {-1, 0, 1, 0, -1};
        vector<int> stk;
        int ans = 0;
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] != '1' || seen[i * n + j]) continue;
                ++ans;
                seen[i * n + j] = 1;
                stk.push_back(i * n + j);
                while (!stk.empty()) {
                    int cell = stk.back();
                    stk.pop_back();
                    int r = cell / n, c = cell % n;
                    for (int k = 0; k < 4; ++k) {
                        int x = r + dirs[k], y = c + dirs[k + 1];
                        // Mark on push, not on pop, so no cell enters the stack twice.
                        if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] == '1' && !seen[x * n + y]) {
                            seen[x * n + y] = 1;
                            stk.push_back(x * n + y);
                        }
                    }
                }
            }
        }
        return ans;
    }
};
