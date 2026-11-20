class Solution {
public:
    // O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move
    // costs one, so the wave that first holds the target is the shortest route.
    int shortestClearPath(vector<vector<int>>& grid) {
        int n = grid.size();
        if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;
        vector<vector<bool>> seen(n, vector<bool>(n, false));
        seen[0][0] = true;
        queue<pair<int, int>> q;
        q.push({0, 0});
        int cells = 1;
        while (!q.empty()) {
            // The queue holds exactly one wave right now.
            for (int size = q.size(); size > 0; size--) {
                auto [r, c] = q.front();
                q.pop();
                if (r == n - 1 && c == n - 1) return cells;
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        int nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 0 && !seen[nr][nc]) {
                            // Marking when queued, not when taken out, so a cell joins the queue once.
                            seen[nr][nc] = true;
                            q.push({nr, nc});
                        }
                    }
                }
            }
            cells++;
        }
        return -1;
    }
};
