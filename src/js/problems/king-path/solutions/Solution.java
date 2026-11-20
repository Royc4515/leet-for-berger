import java.util.*;

class Solution {
    // O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move
    // costs one, so the wave that first holds the target is the shortest route.
    public int shortestClearPath(int[][] grid) {
        int n = grid.length;
        if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) {
            return -1;
        }
        boolean[][] seen = new boolean[n][n];
        seen[0][0] = true;
        Deque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[] {0, 0});
        int cells = 1;
        while (!queue.isEmpty()) {
            // The queue holds exactly one wave right now.
            for (int size = queue.size(); size > 0; size--) {
                int[] cur = queue.poll();
                if (cur[0] == n - 1 && cur[1] == n - 1) {
                    return cells;
                }
                for (int dr = -1; dr <= 1; dr++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        int nr = cur[0] + dr;
                        int nc = cur[1] + dc;
                        if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 0 && !seen[nr][nc]) {
                            // Marking when queued, not when taken out, so a cell joins the queue once.
                            seen[nr][nc] = true;
                            queue.add(new int[] {nr, nc});
                        }
                    }
                }
            }
            cells++;
        }
        return -1;
    }
}
