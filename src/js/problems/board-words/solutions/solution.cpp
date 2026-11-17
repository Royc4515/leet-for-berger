// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0212.Word%20Search%20II/Solution.cpp
// One trie for all words, one backtracking search from each cell that follows the trie, so words
// sharing a beginning share the walk. Found words leave the trie and emptied branches are cut,
// so finished parts of the trie are never walked again.
class Solution {
    struct Trie {
        Trie* children[26] = {};
        int kids = 0;
        int ref = -1;

        ~Trie() {
            for (Trie* child : children) delete child;
        }

        void insert(const string& w, int r) {
            Trie* node = this;
            for (char ch : w) {
                int c = ch - 'a';
                if (!node->children[c]) {
                    node->children[c] = new Trie();
                    node->kids++;
                }
                node = node->children[c];
            }
            node->ref = r;
        }
    };

    vector<string> grid;
    vector<string>* words = nullptr;
    vector<string> ans;

    void dfs(Trie* parent, int i, int j) {
        static const int dirs[5] = {-1, 0, 1, 0, -1};
        int idx = grid[i][j] - 'a';
        Trie* node = parent->children[idx];
        if (node->ref != -1) {
            // Clearing the mark reports each word once, however many paths spell it.
            ans.push_back((*words)[node->ref]);
            node->ref = -1;
        }
        char c = grid[i][j];
        // '#' is not a letter, so the cell cannot be reused further down this path.
        grid[i][j] = '#';
        int m = grid.size(), n = grid[0].size();
        for (int k = 0; k < 4; ++k) {
            int x = i + dirs[k], y = j + dirs[k + 1];
            if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] != '#' && node->children[grid[x][y] - 'a']) {
                dfs(node, x, y);
            }
        }
        grid[i][j] = c;
        if (node->kids == 0 && node->ref == -1) {
            delete node;
            parent->children[idx] = nullptr;
            parent->kids--;
        }
    }

public:
    vector<string> findWords(vector<string>& board, vector<string>& words) {
        Trie tree;
        for (int i = 0; i < (int)words.size(); ++i) {
            tree.insert(words[i], i);
        }
        // Work on a copy so the caller's board is left as it was.
        grid = board;
        this->words = &words;
        ans.clear();
        for (int i = 0; i < (int)grid.size(); ++i) {
            for (int j = 0; j < (int)grid[0].size(); ++j) {
                if (tree.children[grid[i][j] - 'a']) dfs(&tree, i, j);
            }
        }
        sort(ans.begin(), ans.end());
        return ans;
    }
};
