// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0337.House%20Robber%20III/Solution.cpp
class Solution {
public:
    // O(n) time, O(h) stack. Each node returns {taken, skipped} totals for its subtree, so no
    // subtree is ever solved twice.
    int rob(TreeNode* root) {
        auto [take, skip] = dfs(root);
        return max(take, skip);
    }

private:
    pair<int, int> dfs(TreeNode* node) {
        if (!node) return {0, 0};
        auto [leftTake, leftSkip] = dfs(node->left);
        auto [rightTake, rightSkip] = dfs(node->right);
        // Taking the node forces both children to be skipped; skipping it frees them.
        return {node->val + leftSkip + rightSkip, max(leftTake, leftSkip) + max(rightTake, rightSkip)};
    }
};
