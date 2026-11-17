// O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest cost
// using at most j flights.
int findCheapestPrice(int n, int** flights, int flightsSize, int* flightsColSize, int src, int dst, int k) {
    // Far above any real cost (at most 99 flights of 10^4) and safe to add a price to.
    const int inf = 0x3f3f3f3f;
    int* dist = malloc(sizeof(int) * n);
    int* backup = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) dist[i] = inf;
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        // Every flight reads the previous round's costs; relaxing in place could chain several
        // flights in one round and break the stop limit.
        memcpy(backup, dist, sizeof(int) * n);
        bool changed = false;
        for (int i = 0; i < flightsSize; i++) {
            int f = flights[i][0], t = flights[i][1], p = flights[i][2];
            if (backup[f] + p < dist[t]) {
                dist[t] = backup[f] + p;
                changed = true;
            }
        }
        // Nothing improved, so more rounds cannot improve anything either.
        if (!changed) break;
    }
    int ans = dist[dst] == inf ? -1 : dist[dst];
    free(dist);
    free(backup);
    return ans;
}
