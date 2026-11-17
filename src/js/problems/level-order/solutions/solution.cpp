class Solution {
public:
    // O(n) time, O(w) space - BFS, one level per outer iteration.
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> out;
        if (!root) return out;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            // The queue holds exactly one level right now; its size is that level's size.
            int size = q.size();
            vector<int> level;
            level.reserve(size);
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front();
                q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            out.push_back(move(level));
        }
        return out;
    }
};
