import java.util.*;

class Solution {
    // O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
    public int minutesToRot(int[][] grid) {
        int rows = grid.length;
        int cols = grid[0].length;
        Deque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) {
                    queue.add(new int[] { r, c });
                } else if (grid[r][c] == 1) {
                    fresh++;
                }
            }
        }

        int[] dirs = { -1, 0, 1, 0, -1 };
        int minutes = 0;
        // Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing,
        // from being counted as a minute.
        while (!queue.isEmpty() && fresh > 0) {
            for (int size = queue.size(); size > 0; size--) {
                int[] cell = queue.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = cell[0] + dirs[d];
                    int nc = cell[1] + dirs[d + 1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        // Marking when queued, not when popped, so a cell joins the queue once.
                        grid[nr][nc] = 2;
                        fresh--;
                        queue.add(new int[] { nr, nc });
                    }
                }
            }
            minutes++;
        }
        return fresh > 0 ? -1 : minutes;
    }
}
