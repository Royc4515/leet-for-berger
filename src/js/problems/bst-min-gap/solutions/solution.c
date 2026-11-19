// O(n) time, O(h) space: in-order visits a BST in ascending order, and in a sorted list the
// closest pair is always two neighbors, so compare each value with the one visited before it.
static void minGapWalk(struct TreeNode* node, int* pre, int* ans) {
    if (!node) return;
    minGapWalk(node->left, pre, ans);
    if (node->val - *pre < *ans) *ans = node->val - *pre;
    *pre = node->val;
    minGapWalk(node->right, pre, ans);
}

int minGap(struct TreeNode* root) {
    // Values are at most 10^5, so val - (-2^30) cannot overflow and the first difference,
    // against "no previous value", is too large to ever win.
    int ans = 1 << 30, pre = -(1 << 30);
    minGapWalk(root, &pre, &ans);
    return ans;
}
