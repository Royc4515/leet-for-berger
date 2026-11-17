// O(n + m) - Kahn's topological order. f[i] is the month course i finishes: its own time plus
// the latest finish among its prerequisites, final once all of them are processed.
int minimumTime(int n, int** relations, int relationsSize, int* relationsColSize, int* time, int timeSize) {
    // Adjacency in compressed form: the courses after i are next[start[i] .. start[i + 1]).
    int* start = calloc(n + 1, sizeof(int));
    int* indeg = calloc(n, sizeof(int));
    for (int e = 0; e < relationsSize; e++) {
        start[relations[e][0]]++;
        indeg[relations[e][1] - 1]++;
    }
    for (int i = 1; i <= n; i++) start[i] += start[i - 1];
    int* next = malloc(sizeof(int) * (relationsSize + 1));
    int* fill = malloc(sizeof(int) * (n + 1));
    memcpy(fill, start, sizeof(int) * (n + 1));
    for (int e = 0; e < relationsSize; e++) next[fill[relations[e][0] - 1]++] = relations[e][1] - 1;
    free(fill);
    int* f = calloc(n, sizeof(int));
    int* q = malloc(sizeof(int) * n);
    int head = 0, tail = 0, ans = 0;
    for (int i = 0; i < n; i++) {
        if (indeg[i] == 0) {
            q[tail++] = i;
            f[i] = time[i];
            if (f[i] > ans) ans = f[i];
        }
    }
    while (head < tail) {
        int i = q[head++];
        for (int e = start[i]; e < start[i + 1]; e++) {
            int j = next[e];
            if (f[i] + time[j] > f[j]) f[j] = f[i] + time[j];
            if (f[j] > ans) ans = f[j];
            if (--indeg[j] == 0) q[tail++] = j;
        }
    }
    free(start);
    free(indeg);
    free(next);
    free(f);
    free(q);
    return ans;
}
