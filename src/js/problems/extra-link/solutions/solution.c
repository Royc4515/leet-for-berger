// O(n alpha(n)) time - union-find in input order; the first link whose ends are already
// connected closes the cycle, and every other cycle link came before it.
static int findRoot(int* p, int x) {
    // Iterative with path halving: a recursive find can go 10^5 deep before compressing.
    while (p[x] != x) {
        p[x] = p[p[x]];
        x = p[x];
    }
    return x;
}

int* findRedundantConnection(int** edges, int edgesSize, int* edgesColSize, int* returnSize) {
    int n = edgesSize;
    int* p = malloc(sizeof(int) * (n + 1));
    int* size = malloc(sizeof(int) * (n + 1));
    for (int i = 0; i <= n; i++) {
        p[i] = i;
        size[i] = 1;
    }
    int* ans = malloc(sizeof(int) * 2);
    *returnSize = 0;
    for (int i = 0; i < n; i++) {
        int pa = findRoot(p, edges[i][0]), pb = findRoot(p, edges[i][1]);
        if (pa == pb) {
            ans[0] = edges[i][0];
            ans[1] = edges[i][1];
            *returnSize = 2;
            break;
        }
        // Union by size keeps every tree shallow.
        if (size[pa] < size[pb]) {
            int t = pa;
            pa = pb;
            pb = t;
        }
        p[pb] = pa;
        size[pa] += size[pb];
    }
    free(p);
    free(size);
    return ans;
}
