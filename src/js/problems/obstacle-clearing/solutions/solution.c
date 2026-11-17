// O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a deque
// kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
int minimumObstacles(int** grid, int gridSize, int* gridColSize) {
    int m = gridSize, n = gridColSize[0], total = m * n;
    int* dist = malloc(sizeof(int) * total);
    for (int i = 0; i < total; i++) dist[i] = total;
    dist[0] = 0;
    // A ring buffer serves as the deque. A cell is queued only when its cost strictly drops,
    // and the deque only ever holds costs d and d + 1, so that happens at most twice:
    // 4 * cells + 1 slots leave ample room.
    int cap = 4 * total + 1;
    int* ring = malloc(sizeof(int) * cap);
    int head = 0, size = 1;
    ring[0] = 0;
    const int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    while (size > 0) {
        int cur = ring[head];
        head = (head + 1) % cap;
        size--;
        int r = cur / n, c = cur % n;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
            int w = grid[nr][nc], next = nr * n + nc;
            // Only a strict improvement is queued, so stale entries cost nothing extra.
            if (dist[cur] + w >= dist[next]) continue;
            dist[next] = dist[cur] + w;
            if (w == 0) {
                head = (head - 1 + cap) % cap;
                ring[head] = next;
            } else {
                ring[(head + size) % cap] = next;
            }
            size++;
        }
    }
    int ans = dist[total - 1];
    free(dist);
    free(ring);
    return ans;
}
