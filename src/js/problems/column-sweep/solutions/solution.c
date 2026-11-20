// O(n) time and space: a level-order walk records each node's column; counting columns first and
// then filling them in walk order gives the required order (higher first, left before right)
// without any sorting.
int** columnOrder(struct TreeNode* root, int* returnSize, int** returnColumnSizes) {
    *returnSize = 0;
    *returnColumnSizes = NULL;
    if (!root) return NULL;
    int cap = 1024;
    struct TreeNode** queue = malloc(sizeof(struct TreeNode*) * cap);
    int* colOf = malloc(sizeof(int) * cap);
    int head = 0, tail = 0, low = 0, high = 0;
    queue[tail] = root;
    colOf[tail++] = 0;
    while (head < tail) {
        struct TreeNode* node = queue[head];
        int col = colOf[head++];
        if (col < low) low = col;
        if (col > high) high = col;
        if (tail + 2 > cap) {
            cap *= 2;
            queue = realloc(queue, sizeof(struct TreeNode*) * cap);
            colOf = realloc(colOf, sizeof(int) * cap);
        }
        if (node->left) {
            queue[tail] = node->left;
            colOf[tail++] = col - 1;
        }
        if (node->right) {
            queue[tail] = node->right;
            colOf[tail++] = col + 1;
        }
    }
    // The walk order is also the visit order, so the queue now lists every node top-down.
    int width = high - low + 1;
    int* sizes = calloc(width, sizeof(int));
    for (int i = 0; i < tail; i++) sizes[colOf[i] - low]++;
    int** out = malloc(sizeof(int*) * width);
    for (int c = 0; c < width; c++) out[c] = malloc(sizeof(int) * sizes[c]);
    int* filled = calloc(width, sizeof(int));
    for (int i = 0; i < tail; i++) {
        int c = colOf[i] - low;
        out[c][filled[c]++] = queue[i]->val;
    }
    free(filled);
    free(queue);
    free(colOf);
    *returnSize = width;
    *returnColumnSizes = sizes;
    return out;
}
