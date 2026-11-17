// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.cs
public class Solution {
    // O(rows * cols) time - flood fill each new island once. An explicit stack, because a
    // 45,000-cell snake would overflow the call stack with recursion.
    public int CountIslands(string[] grid) {
        int m = grid.Length;
        int n = grid[0].Length;
        var seen = new bool[m * n];
        int[] dirs = { -1, 0, 1, 0, -1 };
        var stack = new Stack<int>();
        int ans = 0;
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] != '1' || seen[i * n + j]) continue;
                ans++;
                seen[i * n + j] = true;
                stack.Push(i * n + j);
                while (stack.Count > 0) {
                    int cell = stack.Pop();
                    int r = cell / n, c = cell % n;
                    for (int k = 0; k < 4; ++k) {
                        int x = r + dirs[k];
                        int y = c + dirs[k + 1];
                        // Mark on push, not on pop, so no cell enters the stack twice.
                        if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] == '1' && !seen[x * n + y]) {
                            seen[x * n + y] = true;
                            stack.Push(x * n + y);
                        }
                    }
                }
            }
        }
        return ans;
    }
}
