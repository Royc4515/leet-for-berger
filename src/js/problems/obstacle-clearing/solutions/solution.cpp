class Solution {
public:
    // O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a
    // deque kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
    int minimumObstacles(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size(), total = m * n;
        vector<int> dist(total, total);
        dist[0] = 0;
        deque<int> q{0};
        const int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
        while (!q.empty()) {
            int cur = q.front();
            q.pop_front();
            int r = cur / n, c = cur % n;
            for (int k = 0; k < 4; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                int w = grid[nr][nc], next = nr * n + nc;
                // Only a strict improvement is queued, so stale entries cost nothing extra.
                if (dist[cur] + w < dist[next]) {
                    dist[next] = dist[cur] + w;
                    if (w == 0) {
                        q.push_front(next);
                    } else {
                        q.push_back(next);
                    }
                }
            }
        }
        return dist[total - 1];
    }
};
