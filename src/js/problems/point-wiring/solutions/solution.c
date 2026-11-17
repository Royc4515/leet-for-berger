// O(n^2) - Prim's algorithm on the complete graph without building it: dist[k] is the cheapest
// wire from outside point k into the tree, computed on the fly.
int minCostConnectPoints(int** points, int pointsSize, int* pointsColSize) {
    int n = pointsSize;
    int* dist = malloc(sizeof(int) * n);
    bool* vis = calloc(n, sizeof(bool));
    for (int i = 0; i < n; i++) dist[i] = INT_MAX;
    dist[0] = 0;
    int ans = 0;
    for (int i = 0; i < n; i++) {
        int j = -1;
        for (int k = 0; k < n; k++) {
            if (!vis[k] && (j == -1 || dist[k] < dist[j])) j = k;
        }
        vis[j] = true;
        ans += dist[j];
        int x = points[j][0], y = points[j][1];
        for (int k = 0; k < n; k++) {
            if (vis[k]) continue;
            int d = abs(points[k][0] - x) + abs(points[k][1] - y);
            if (d < dist[k]) dist[k] = d;
        }
    }
    free(dist);
    free(vis);
    return ans;
}
