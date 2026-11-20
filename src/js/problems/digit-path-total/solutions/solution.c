// O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
static int digitPathWalk(struct TreeNode* node, int above) {
    if (!node) return 0;
    // Appending a digit to a decimal number: multiply by ten, then add it.
    int here = above * 10 + node->val;
    // Only a node with no children ends a path; a missing child contributes nothing.
    if (!node->left && !node->right) return here;
    return digitPathWalk(node->left, here) + digitPathWalk(node->right, here);
}

int digitPathTotal(struct TreeNode* root) {
    return digitPathWalk(root, 0);
}
