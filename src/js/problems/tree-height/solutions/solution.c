// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0104.Maximum%20Depth%20of%20Binary%20Tree/Solution.c
// O(n) time, O(h) stack: a tree is one node taller than its taller subtree.
int maxDepth(struct TreeNode* root) {
    if (!root) return 0;
    int left = maxDepth(root->left);
    int right = maxDepth(root->right);
    return 1 + (left > right ? left : right);
}
