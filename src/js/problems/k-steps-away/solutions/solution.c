// O(n + m log m): nodes only point down, so record every parent first; then the tree is an
// undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
// Nodes are numbered in breadth-first order, so parents, children and "seen" live in int arrays.
static int countNodes(struct TreeNode* node) {
    // Recursion is safe: the tree height is at most 300.
    return node ? 1 + countNodes(node->left) + countNodes(node->right) : 0;
}

static int cmpInt(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

int* kStepsAway(struct TreeNode* root, int target, int k, int* returnSize) {
    int n = countNodes(root);
    struct TreeNode** nodes = malloc(sizeof(struct TreeNode*) * n);
    int* par = malloc(sizeof(int) * n);
    int* lc = malloc(sizeof(int) * n);
    int* rc = malloc(sizeof(int) * n);
    int size = 0, start = 0;
    nodes[size] = root;
    par[size++] = -1;
    for (int h = 0; h < size; h++) {
        struct TreeNode* node = nodes[h];
        if (node->val == target) start = h;
        lc[h] = rc[h] = -1;
        if (node->left) {
            lc[h] = size;
            nodes[size] = node->left;
            par[size++] = h;
        }
        if (node->right) {
            rc[h] = size;
            nodes[size] = node->right;
            par[size++] = h;
        }
    }
    // The seen flags stop the search from stepping back to where it came from.
    bool* seen = calloc(n, sizeof(bool));
    int* frontier = malloc(sizeof(int) * n);
    int* next = malloc(sizeof(int) * n);
    int fsize = 1;
    frontier[0] = start;
    seen[start] = true;
    for (int step = 0; step < k && fsize > 0; step++) {
        int nsize = 0;
        for (int i = 0; i < fsize; i++) {
            int u = frontier[i];
            int nbs[3] = {lc[u], rc[u], par[u]};
            for (int j = 0; j < 3; j++) {
                int v = nbs[j];
                if (v >= 0 && !seen[v]) {
                    seen[v] = true;
                    next[nsize++] = v;
                }
            }
        }
        int* t = frontier;
        frontier = next;
        next = t;
        fsize = nsize;
    }
    int* out = malloc(sizeof(int) * (fsize > 0 ? fsize : 1));
    for (int i = 0; i < fsize; i++) out[i] = nodes[frontier[i]]->val;
    qsort(out, fsize, sizeof(int), cmpInt);
    *returnSize = fsize;
    free(nodes);
    free(par);
    free(lc);
    free(rc);
    free(seen);
    free(frontier);
    free(next);
    return out;
}
