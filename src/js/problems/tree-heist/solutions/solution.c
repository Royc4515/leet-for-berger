static int maxInt(int a, int b) { return a > b ? a : b; }

// O(n) time, O(h) stack. Fills the subtree's best total with the node taken and with it
// skipped, so no subtree is ever solved twice.
static void heist(struct TreeNode* node, int* take, int* skip) {
    if (!node) {
        *take = 0;
        *skip = 0;
        return;
    }
    int leftTake, leftSkip, rightTake, rightSkip;
    heist(node->left, &leftTake, &leftSkip);
    heist(node->right, &rightTake, &rightSkip);
    // Taking the node forces both children to be skipped; skipping it frees them.
    *take = node->val + leftSkip + rightSkip;
    *skip = maxInt(leftTake, leftSkip) + maxInt(rightTake, rightSkip);
}

int rob(struct TreeNode* root) {
    int take, skip;
    heist(root, &take, &skip);
    return maxInt(take, skip);
}
