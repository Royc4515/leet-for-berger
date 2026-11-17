// O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
// smallest available course is always taken next, which yields the smallest order.
static void heapPush(int* h, int* size, int v) {
    int i = (*size)++;
    h[i] = v;
    while (i > 0 && h[(i - 1) / 2] > h[i]) {
        int p = (i - 1) / 2, t = h[p];
        h[p] = h[i];
        h[i] = t;
        i = p;
    }
}

static int heapPop(int* h, int* size) {
    int top = h[0];
    h[0] = h[--(*size)];
    int i = 0;
    for (;;) {
        int l = 2 * i + 1, m = i;
        if (l < *size && h[l] < h[m]) m = l;
        if (l + 1 < *size && h[l + 1] < h[m]) m = l + 1;
        if (m == i) break;
        int t = h[m];
        h[m] = h[i];
        h[i] = t;
        i = m;
    }
    return top;
}

int* findOrder(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize, int* returnSize) {
    int n = numCourses, m = prerequisitesSize;
    // Compressed adjacency (CSR): out-degree counts, prefix sums as offsets, then fill.
    int* start = calloc(n + 1, sizeof(int));
    int* indeg = calloc(n, sizeof(int));
    int* adj = malloc(sizeof(int) * (m ? m : 1));
    for (int k = 0; k < m; k++) {
        start[prerequisites[k][1] + 1]++;
        indeg[prerequisites[k][0]]++;
    }
    for (int i = 0; i < n; i++) start[i + 1] += start[i];
    int* fill = malloc(sizeof(int) * n);
    memcpy(fill, start, sizeof(int) * n);
    for (int k = 0; k < m; k++) adj[fill[prerequisites[k][1]]++] = prerequisites[k][0];
    // Each course enters the heap at most once, so n slots are enough.
    int* heap = malloc(sizeof(int) * n);
    int hs = 0;
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) heapPush(heap, &hs, i);
    }
    int* ans = malloc(sizeof(int) * n);
    int cnt = 0;
    while (hs > 0) {
        int i = heapPop(heap, &hs);
        ans[cnt++] = i;
        for (int e = start[i]; e < start[i + 1]; e++) {
            if (--indeg[adj[e]] == 0) heapPush(heap, &hs, adj[e]);
        }
    }
    free(start);
    free(indeg);
    free(adj);
    free(fill);
    free(heap);
    // Courses on a cycle are never released, so a short order means no valid order exists.
    *returnSize = cnt == n ? n : 0;
    return ans;
}
