// O(n) time, O(n) space - BFS over an array used as a queue; each level is a slice of it.
int** levelOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
    *returnSize = 0;
    *returnColumnSizes = NULL;
    if (!root) return NULL;
    int cap = 1024;
    struct TreeNode** queue = malloc(sizeof(struct TreeNode*) * cap);
    int head = 0, tail = 0;
    queue[tail++] = root;
    int levelsCap = 64;
    int** levels = malloc(sizeof(int*) * levelsCap);
    int* sizes = malloc(sizeof(int) * levelsCap);
    while (head < tail) {
        // Everything between head and tail right now is exactly one level.
        int size = tail - head;
        if (*returnSize == levelsCap) {
            levelsCap *= 2;
            levels = realloc(levels, sizeof(int*) * levelsCap);
            sizes = realloc(sizes, sizeof(int) * levelsCap);
        }
        int* level = malloc(sizeof(int) * size);
        for (int i = 0; i < size; i++) {
            struct TreeNode* node = queue[head++];
            level[i] = node->val;
            if (tail + 2 > cap) {
                cap *= 2;
                queue = realloc(queue, sizeof(struct TreeNode*) * cap);
            }
            if (node->left) queue[tail++] = node->left;
            if (node->right) queue[tail++] = node->right;
        }
        levels[*returnSize] = level;
        sizes[*returnSize] = size;
        (*returnSize)++;
    }
    free(queue);
    *returnColumnSizes = sizes;
    return levels;
}
