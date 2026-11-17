// O(h + k) time, O(h) space: an in-order walk of a BST yields values in ascending order, so the
// k-th node popped is the answer and the rest of the tree is never visited.
int kthSmallest(struct TreeNode* root, int k) {
    int cap = 64, top = 0, answer = -1;
    struct TreeNode** stack = malloc(sizeof(struct TreeNode*) * cap);
    struct TreeNode* node = root;
    while (node || top > 0) {
        if (node) {
            if (top == cap) {
                cap *= 2;
                stack = realloc(stack, sizeof(struct TreeNode*) * cap);
            }
            stack[top++] = node;
            node = node->left;
        } else {
            node = stack[--top];
            if (--k == 0) {
                answer = node->val;
                break;
            }
            node = node->right;
        }
    }
    free(stack);
    return answer;
}
