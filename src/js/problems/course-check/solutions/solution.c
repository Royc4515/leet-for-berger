// O(V + E) time - Kahn's algorithm on a compressed adjacency array (CSR): count out-degrees,
// prefix-sum them into start offsets, then fill, so no per-node dynamic arrays are needed.
bool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {
    int n = numCourses, m = prerequisitesSize;
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
    int* q = malloc(sizeof(int) * n);
    int head = 0, tail = 0;
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) q[tail++] = i;
    }
    while (head < tail) {
        int i = q[head++];
        for (int e = start[i]; e < start[i + 1]; e++) {
            if (--indeg[adj[e]] == 0) q[tail++] = adj[e];
        }
    }
    free(start);
    free(indeg);
    free(adj);
    free(fill);
    free(q);
    // Courses on a cycle never reach in-degree 0, so they are never queued.
    return tail == n;
}
