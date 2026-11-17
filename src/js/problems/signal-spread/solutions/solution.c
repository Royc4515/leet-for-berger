// O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node with
// the smallest tentative time can no longer improve once it is popped. C has no priority
// queue, so a small array-backed min-heap of (distance, node) pairs is written out here.
typedef struct { int d, v; } HeapItem;

static void heapPush(HeapItem* h, int* size, int d, int v) {
    int i = (*size)++;
    while (i > 0 && h[(i - 1) / 2].d > d) {
        h[i] = h[(i - 1) / 2];
        i = (i - 1) / 2;
    }
    h[i].d = d;
    h[i].v = v;
}

static HeapItem heapPop(HeapItem* h, int* size) {
    HeapItem top = h[0], last = h[--(*size)];
    int i = 0;
    for (;;) {
        int c = 2 * i + 1;
        if (c >= *size) break;
        if (c + 1 < *size && h[c + 1].d < h[c].d) c++;
        if (h[c].d >= last.d) break;
        h[i] = h[c];
        i = c;
    }
    h[i] = last;
    return top;
}

int networkDelayTime(int** times, int timesSize, int* timesColSize, int n, int k) {
    // Adjacency in compressed form: the links of node u are to[start[u] .. start[u + 1]).
    int* start = calloc(n + 2, sizeof(int));
    for (int i = 0; i < timesSize; i++) start[times[i][0] + 1]++;
    for (int i = 1; i <= n + 1; i++) start[i] += start[i - 1];
    int* fill = malloc(sizeof(int) * (n + 2));
    memcpy(fill, start, sizeof(int) * (n + 2));
    int* to = malloc(sizeof(int) * (timesSize + 1));
    int* weight = malloc(sizeof(int) * (timesSize + 1));
    for (int i = 0; i < timesSize; i++) {
        int at = fill[times[i][0]]++;
        to[at] = times[i][1];
        weight[at] = times[i][2];
    }
    int* dist = malloc(sizeof(int) * (n + 1));
    for (int i = 0; i <= n; i++) dist[i] = INT_MAX;
    dist[k] = 0;
    // Every push follows a strict improvement along one link, so E + 1 slots suffice.
    HeapItem* heap = malloc(sizeof(HeapItem) * (timesSize + 1));
    int size = 0;
    heapPush(heap, &size, 0, k);
    while (size > 0) {
        HeapItem top = heapPop(heap, &size);
        // A stale entry: the node was already settled with a smaller time.
        if (top.d > dist[top.v]) continue;
        for (int e = start[top.v]; e < start[top.v + 1]; e++) {
            int nd = top.d + weight[e];
            if (nd < dist[to[e]]) {
                dist[to[e]] = nd;
                heapPush(heap, &size, nd, to[e]);
            }
        }
    }
    // The last node to hear the signal decides; one that never hears it makes the answer -1.
    int ans = 0;
    for (int v = 1; v <= n; v++) {
        if (dist[v] > ans) ans = dist[v];
    }
    free(start);
    free(fill);
    free(to);
    free(weight);
    free(dist);
    free(heap);
    return ans == INT_MAX ? -1 : ans;
}
