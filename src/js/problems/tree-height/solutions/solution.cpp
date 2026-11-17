// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0104.Maximum%20Depth%20of%20Binary%20Tree/Solution.cpp
class Solution {
public:
    // O(n) time, O(h) stack: a tree is one node taller than its taller subtree.
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};
