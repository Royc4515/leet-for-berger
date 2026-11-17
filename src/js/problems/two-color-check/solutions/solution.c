// O(V + E) time - color each component by BFS with alternating colors (1 and -1); BFS keeps
// a 10^5-node path off the call stack.
bool isBipartite(int** graph, int graphSize, int* graphColSize) {
    int n = graphSize;
    int* color = calloc(n, sizeof(int));
    // Each node is queued once, when it is colored, so n slots are enough.
    int* q = malloc(sizeof(int) * n);
    bool ok = true;
    // Every node is a possible start: the graph may be disconnected.
    for (int i = 0; i < n && ok; i++) {
        if (color[i]) continue;
        color[i] = 1;
        int head = 0, tail = 0;
        q[tail++] = i;
        while (head < tail && ok) {
            int a = q[head++];
            for (int k = 0; k < graphColSize[a]; k++) {
                int b = graph[a][k];
                if (color[b] == color[a]) {
                    ok = false;
                    break;
                }
                if (!color[b]) {
                    color[b] = -color[a];
                    q[tail++] = b;
                }
            }
        }
    }
    free(color);
    free(q);
    return ok;
}
