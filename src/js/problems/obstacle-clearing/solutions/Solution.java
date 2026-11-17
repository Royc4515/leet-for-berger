import java.util.*;

class Solution {
    // O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a
    // deque kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
    public int minimumObstacles(int[][] grid) {
        int m = grid.length, n = grid[0].length, total = m * n;
        int[] dist = new int[total];
        Arrays.fill(dist, total);
        dist[0] = 0;
        // Cells as flat indexes r * n + c: no array object per queued cell.
        ArrayDeque<Integer> q = new ArrayDeque<>();
        q.add(0);
        int[] dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1};
        while (!q.isEmpty()) {
            int cur = q.pollFirst();
            int r = cur / n, c = cur % n;
            for (int k = 0; k < 4; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) {
                    continue;
                }
                int w = grid[nr][nc], next = nr * n + nc;
                // Only a strict improvement is queued, so stale entries cost nothing extra.
                if (dist[cur] + w < dist[next]) {
                    dist[next] = dist[cur] + w;
                    if (w == 0) {
                        q.addFirst(next);
                    } else {
                        q.addLast(next);
                    }
                }
            }
        }
        return dist[total - 1];
    }
}
