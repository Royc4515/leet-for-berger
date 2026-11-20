class Solution {
public:
    // O(n) time and space: a level-order walk appends values to their column in exactly the
    // required order (higher first, left before right), so nothing needs sorting.
    vector<vector<int>> columnOrder(TreeNode* root) {
        vector<vector<int>> out;
        if (!root) return out;
        map<int, vector<int>> columns;
        queue<pair<TreeNode*, int>> q;
        q.push({root, 0});
        while (!q.empty()) {
            auto [node, col] = q.front();
            q.pop();
            columns[col].push_back(node->val);
            if (node->left) q.push({node->left, col - 1});
            if (node->right) q.push({node->right, col + 1});
        }
        // std::map keeps its keys sorted, which is the left-to-right column order.
        for (auto& entry : columns) {
            out.push_back(move(entry.second));
        }
        return out;
    }
};
