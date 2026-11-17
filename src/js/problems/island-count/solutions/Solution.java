// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0200.Number%20of%20Islands/Solution.java
import java.util.*;

class Solution {
    // O(rows * cols) time - flood fill each new island once. An explicit stack, because a
    // 45,000-cell snake would overflow the default thread stack with recursion.
    public int countIslands(String[] grid) {
        int m = grid.length, n = grid[0].length();
        boolean[] seen = new boolean[m * n];
        int[] dirs = {-1, 0, 1, 0, -1};
        // Each cell is pushed at most once (marked on push), so m * n slots are enough.
        int[] stack = new int[m * n];
        int ans = 0;
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i].charAt(j) != '1' || seen[i * n + j]) continue;
                ++ans;
                int top = 0;
                seen[i * n + j] = true;
                stack[top++] = i * n + j;
                while (top > 0) {
                    int cell = stack[--top];
                    int r = cell / n, c = cell % n;
                    for (int k = 0; k < 4; ++k) {
                        int x = r + dirs[k], y = c + dirs[k + 1];
                        if (x >= 0 && x < m && y >= 0 && y < n && grid[x].charAt(y) == '1' && !seen[x * n + y]) {
                            seen[x * n + y] = true;
                            stack[top++] = x * n + y;
                        }
                    }
                }
            }
        }
        return ans;
    }
}
