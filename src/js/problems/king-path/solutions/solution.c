// O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move costs
// one, so the wave that first holds the target is the shortest route. Each cell is queued at most
// once, so n * n slots are enough.
int shortestClearPath(int** grid, int gridSize, int* gridColSize) {
    int n = gridSize;
    if (grid[0][0] == 1 || grid[n - 1][n - 1] == 1) return -1;
    int* queue = malloc(sizeof(int) * n * n);
    bool* seen = calloc((size_t)n * n, sizeof(bool));
    int head = 0, tail = 0, cells = 1;
    queue[tail++] = 0;
    seen[0] = true;
    int answer = -1;
    while (head < tail && answer < 0) {
        // Everything between head and end right now is exactly one wave.
        for (int end = tail; head < end; head++) {
            int r = queue[head] / n;
            int c = queue[head] % n;
            if (r == n - 1 && c == n - 1) {
                answer = cells;
                break;
            }
            for (int dr = -1; dr <= 1; dr++) {
                for (int dc = -1; dc <= 1; dc++) {
                    int nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 0 && !seen[nr * n + nc]) {
                        // Marking when queued, not when taken out, so a cell joins the queue once.
                        seen[nr * n + nc] = true;
                        queue[tail++] = nr * n + nc;
                    }
                }
            }
        }
        cells++;
    }
    free(queue);
    free(seen);
    return answer;
}
