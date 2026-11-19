// O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
// long long bounds far outside the int range play the role of "no bound", so a node that is
// exactly INT_MIN or INT_MAX still fits.
static bool bstCheckWalk(struct TreeNode* node, long long low, long long high) {
    if (!node) return true;
    if (node->val <= low || node->val >= high) return false;
    // Going left, this value caps the interval from above; going right, from below.
    return bstCheckWalk(node->left, low, node->val) && bstCheckWalk(node->right, node->val, high);
}

bool isValidBst(struct TreeNode* root) {
    return bstCheckWalk(root, LLONG_MIN, LLONG_MAX);
}
