// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0079.Word%20Search/Solution.cs
public class Solution {
    private int m;
    private int n;
    private char[][] grid;
    private string word;

    // O(rows * cols * 3^len) worst case - backtracking, with two prunes that make the
    // pathological boards (one letter everywhere) instant.
    public bool Exist(string[] board, string word) {
        m = board.Length;
        n = board[0].Length;
        int[] have = new int[128], need = new int[128];
        foreach (string row in board) foreach (char c in row) have[c]++;
        foreach (char c in word) need[c]++;
        // Not enough copies of some letter: no path can exist, so skip the search entirely.
        for (int c = 0; c < 128; c++) if (need[c] > have[c]) return false;
        // A path read backwards is still a path. Starting from the rarer end cuts most branches early.
        if (have[word[0]] > have[word[word.Length - 1]]) {
            char[] r = word.ToCharArray();
            Array.Reverse(r);
            word = new string(r);
        }
        this.word = word;
        grid = new char[m][];
        for (int i = 0; i < m; i++) grid[i] = board[i].ToCharArray();
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (dfs(i, j, 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    private bool dfs(int i, int j, int k) {
        if (grid[i][j] != word[k]) {
            return false;
        }
        if (k == word.Length - 1) {
            return true;
        }
        char c = grid[i][j];
        // A character that never occurs in a word marks the cell as on the current path.
        grid[i][j] = '#';
        int[] dirs = { -1, 0, 1, 0, -1 };
        bool found = false;
        for (int u = 0; u < 4 && !found; ++u) {
            int x = i + dirs[u];
            int y = j + dirs[u + 1];
            found = x >= 0 && x < m && y >= 0 && y < n && dfs(x, y, k + 1);
        }
        // Unmark on the way back, or later starting cells would find this cell blocked.
        grid[i][j] = c;
        return found;
    }
}
