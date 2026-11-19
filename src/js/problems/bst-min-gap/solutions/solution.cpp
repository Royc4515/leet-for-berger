// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0783.Minimum%20Distance%20Between%20BST%20Nodes/Solution.cpp
class Solution {
public:
    // O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
    // closest pair is always two neighbors, so compare each value with the one visited before it.
    int minGap(TreeNode* root) {
        // Values are at most 10^5, so val - (-2^30) cannot overflow and the first difference,
        // against "no previous value", is too large to ever win.
        const int inf = 1 << 30;
        int ans = inf, pre = -inf;
        function<void(TreeNode*)> dfs = [&](TreeNode* node) {
            if (!node) {
                return;
            }
            dfs(node->left);
            ans = min(ans, node->val - pre);
            pre = node->val;
            dfs(node->right);
        };
        dfs(root);
        return ans;
    }
};
