// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0212.Word%20Search%20II/Solution.java
import java.util.*;

// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
class Solution {
    private static final class Trie {
        final Trie[] children = new Trie[26];
        int kids;
        int ref = -1;

        void insert(String w, int ref) {
            Trie node = this;
            for (int i = 0; i < w.length(); ++i) {
                int j = w.charAt(i) - 'a';
                if (node.children[j] == null) {
                    node.children[j] = new Trie();
                    node.kids++;
                }
                node = node.children[j];
            }
            node.ref = ref;
        }
    }

    private static final int[] DIRS = {-1, 0, 1, 0, -1};

    // Per-call state lives in locals passed down, not in fields, so one instance can be reused.
    public String[] findWords(String[] board, String[] words) {
        Trie tree = new Trie();
        for (int i = 0; i < words.length; ++i) {
            tree.insert(words[i], i);
        }
        int m = board.length, n = board[0].length();
        char[][] grid = new char[m][];
        for (int i = 0; i < m; ++i) {
            grid[i] = board[i].toCharArray();
        }
        List<String> ans = new ArrayList<>();
        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (tree.children[grid[i][j] - 'a'] != null) {
                    dfs(grid, words, tree, i, j, ans);
                }
            }
        }
        // Natural String order compares UTF-16 code units: dictionary order for lowercase letters.
        Collections.sort(ans);
        return ans.toArray(new String[0]);
    }

    private void dfs(char[][] grid, String[] words, Trie parent, int i, int j, List<String> ans) {
        int idx = grid[i][j] - 'a';
        Trie node = parent.children[idx];
        if (node.ref != -1) {
            // Clearing the mark reports each word once, however many paths spell it.
            ans.add(words[node.ref]);
            node.ref = -1;
        }
        char c = grid[i][j];
        // '#' is not a letter, so the cell cannot be reused further down this path.
        grid[i][j] = '#';
        for (int k = 0; k < 4; ++k) {
            int x = i + DIRS[k], y = j + DIRS[k + 1];
            if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length && grid[x][y] != '#'
                    && node.children[grid[x][y] - 'a'] != null) {
                dfs(grid, words, node, x, y, ans);
            }
        }
        grid[i][j] = c;
        if (node.kids == 0 && node.ref == -1) {
            parent.children[idx] = null;
            parent.kids--;
        }
    }
}
