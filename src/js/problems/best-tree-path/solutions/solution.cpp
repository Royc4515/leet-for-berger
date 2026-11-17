// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.cpp
class Solution {
public:
    // O(n) time, O(h) stack. Each node returns its best downward chain; the answer also tries
    // the path that bends at the node and uses both chains.
    int maxPathSum(TreeNode* root) {
        int best = INT_MIN;
        down(root, best);
        return best;
    }

private:
    int down(TreeNode* node, int& best) {
        if (!node) return 0;
        // A negative chain only lowers the sum, so it is dropped (counted as 0).
        int left = max(0, down(node->left, best));
        int right = max(0, down(node->right, best));
        best = max(best, node->val + left + right);
        // The parent can extend only one side: a path cannot fork.
        return node->val + max(left, right);
    }
};
