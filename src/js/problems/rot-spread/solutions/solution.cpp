class Solution {
public:
    // O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
    int minutesToRot(vector<vector<int>>& grid) {
        int rows = grid.size();
        int cols = grid[0].size();
        queue<pair<int, int>> q;
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) {
                    q.push({r, c});
                } else if (grid[r][c] == 1) {
                    fresh++;
                }
            }
        }

        const int dirs[5] = {-1, 0, 1, 0, -1};
        int minutes = 0;
        // Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing,
        // from being counted as a minute.
        while (!q.empty() && fresh > 0) {
            for (int size = q.size(); size > 0; size--) {
                auto [r, c] = q.front();
                q.pop();
                for (int d = 0; d < 4; d++) {
                    int nr = r + dirs[d];
                    int nc = c + dirs[d + 1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        // Marking when queued, not when popped, so a cell joins the queue once.
                        grid[nr][nc] = 2;
                        fresh--;
                        q.push({nr, nc});
                    }
                }
            }
            minutes++;
        }
        return fresh > 0 ? -1 : minutes;
    }
};
