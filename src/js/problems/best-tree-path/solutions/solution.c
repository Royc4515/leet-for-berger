// O(n) time, O(h) stack. Returns the best downward chain from node and records the path that
// bends at node (both chains) in *best.
static int bestDown(struct TreeNode* node, int* best) {
    if (!node) return 0;
    // A negative chain only lowers the sum, so it is dropped (counted as 0).
    int left = bestDown(node->left, best);
    int right = bestDown(node->right, best);
    if (left < 0) left = 0;
    if (right < 0) right = 0;
    if (node->val + left + right > *best) *best = node->val + left + right;
    // The parent can extend only one side: a path cannot fork.
    return node->val + (left > right ? left : right);
}

int maxPathSum(struct TreeNode* root) {
    int best = INT_MIN;
    bestDown(root, &best);
    return best;
}
