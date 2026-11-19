public class Solution {
    // O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
    public int MinutesToRot(int[][] grid) {
        int rows = grid.Length;
        int cols = grid[0].Length;
        var queue = new Queue<(int, int)>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) {
                    queue.Enqueue((r, c));
                } else if (grid[r][c] == 1) {
                    fresh++;
                }
            }
        }

        int[] dirs = { -1, 0, 1, 0, -1 };
        int minutes = 0;
        // Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing,
        // from being counted as a minute.
        while (queue.Count > 0 && fresh > 0) {
            for (int size = queue.Count; size > 0; size--) {
                var (r, c) = queue.Dequeue();
                for (int d = 0; d < 4; d++) {
                    int nr = r + dirs[d];
                    int nc = c + dirs[d + 1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        // Marking when queued, not when popped, so a cell joins the queue once.
                        grid[nr][nc] = 2;
                        fresh--;
                        queue.Enqueue((nr, nc));
                    }
                }
            }
            minutes++;
        }
        return fresh > 0 ? -1 : minutes;
    }
}
