public class Solution {
    // O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a
    // deque kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
    public int MinimumObstacles(int[][] grid) {
        int m = grid.Length, n = grid[0].Length, total = m * n;
        var dist = new int[total];
        Array.Fill(dist, total);
        dist[0] = 0;
        // .NET has no deque, so a ring buffer stands in. A cell is queued only when its cost
        // strictly drops, and the deque only ever holds costs d and d + 1, so that happens at
        // most twice: 4 * cells + 1 slots leave ample room.
        int cap = 4 * total + 1;
        var ring = new int[cap];
        int head = 0, size = 1;
        int[] dr = { -1, 1, 0, 0 }, dc = { 0, 0, -1, 1 };
        while (size > 0) {
            int cur = ring[head];
            head = (head + 1) % cap;
            size--;
            int r = cur / n, c = cur % n;
            for (int k = 0; k < 4; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) {
                    continue;
                }
                int w = grid[nr][nc], next = nr * n + nc;
                // Only a strict improvement is queued, so stale entries cost nothing extra.
                if (dist[cur] + w >= dist[next]) {
                    continue;
                }
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
        return dist[total - 1];
    }
}
