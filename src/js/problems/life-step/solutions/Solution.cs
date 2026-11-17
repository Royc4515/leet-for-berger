// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0289.Game%20of%20Life/Solution.cs
public class Solution {
    // O(m * n) time, O(1) extra space - update in place with two transitional states that still
    // remember the current generation: 2 = alive now, dead next; -1 = dead now, alive next.
    // "board[x][y] > 0" is then exactly "alive now", whatever has been rewritten already.
    public int[][] NextGeneration(int[][] board) {
        int m = board.Length, n = board[0].Length;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                // The 3 x 3 scan below counts the cell itself; start at minus its own state.
                int live = -board[i][j];
                for (int x = i - 1; x <= i + 1; x++) {
                    for (int y = j - 1; y <= j + 1; y++) {
                        if (x >= 0 && x < m && y >= 0 && y < n && board[x][y] > 0) live++;
                    }
                }
                if (board[i][j] == 1 && (live < 2 || live > 3)) board[i][j] = 2;
                else if (board[i][j] == 0 && live == 3) board[i][j] = -1;
            }
        }
        // Second pass: settle the transitional states into the next generation.
        foreach (var row in board) {
            for (int j = 0; j < n; j++) {
                if (row[j] == 2) row[j] = 0;
                else if (row[j] == -1) row[j] = 1;
            }
        }
        return board;
    }
}
