// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
public class Solution {
    private sealed class Trie {
        public readonly Trie[] Children = new Trie[26];
        public int Kids;
        public int Ref = -1;

        public void Insert(string w, int r) {
            Trie node = this;
            foreach (char ch in w) {
                int c = ch - 'a';
                if (node.Children[c] == null) {
                    node.Children[c] = new Trie();
                    node.Kids++;
                }
                node = node.Children[c];
            }
            node.Ref = r;
        }
    }

    private static readonly int[] Dirs = { -1, 0, 1, 0, -1 };

    public string[] FindWords(string[] board, string[] words) {
        var tree = new Trie();
        for (int i = 0; i < words.Length; i++) {
            tree.Insert(words[i], i);
        }
        int m = board.Length, n = board[0].Length;
        // Strings are immutable, so the search marks cells in a char copy of the board.
        var grid = new char[m][];
        for (int i = 0; i < m; i++) {
            grid[i] = board[i].ToCharArray();
        }
        var ans = new List<string>();
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (tree.Children[grid[i][j] - 'a'] != null) {
                    Dfs(grid, words, tree, i, j, ans);
                }
            }
        }
        // Ordinal, not the default culture-aware compare: the answer is in plain code-unit order.
        ans.Sort(string.CompareOrdinal);
        return ans.ToArray();
    }

    private static void Dfs(char[][] grid, string[] words, Trie parent, int i, int j, List<string> ans) {
        int idx = grid[i][j] - 'a';
        Trie node = parent.Children[idx];
        if (node.Ref != -1) {
            // Clearing the mark reports each word once, however many paths spell it.
            ans.Add(words[node.Ref]);
            node.Ref = -1;
        }
        char c = grid[i][j];
        // '#' is not a letter, so the cell cannot be reused further down this path.
        grid[i][j] = '#';
        for (int k = 0; k < 4; k++) {
            int x = i + Dirs[k], y = j + Dirs[k + 1];
            if (x >= 0 && x < grid.Length && y >= 0 && y < grid[0].Length && grid[x][y] != '#'
                && node.Children[grid[x][y] - 'a'] != null) {
                Dfs(grid, words, node, x, y, ans);
            }
        }
        grid[i][j] = c;
        if (node.Kids == 0 && node.Ref == -1) {
            parent.Children[idx] = null;
            parent.Kids--;
        }
    }
}
