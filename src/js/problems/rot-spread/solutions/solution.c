// O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
// The queue holds cell indexes r * cols + c; each cell enters at most once, so rows * cols slots
// are enough.
int minutesToRot(int** grid, int gridSize, int* gridColSize) {
    int rows = gridSize;
    int cols = gridColSize[0];
    int* queue = malloc(sizeof(int) * rows * cols);
    int head = 0, tail = 0, fresh = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) {
                queue[tail++] = r * cols + c;
            } else if (grid[r][c] == 1) {
                fresh++;
            }
        }
    }

    const int dr[4] = {-1, 1, 0, 0};
    const int dc[4] = {0, 0, -1, 1};
    int minutes = 0;
    // Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing, from
    // being counted as a minute.
    while (head < tail && fresh > 0) {
        for (int end = tail; head < end; head++) {
            int r = queue[head] / cols;
            int c = queue[head] % cols;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d];
                int nc = c + dc[d];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    // Marking when queued, not when popped, so a cell joins the queue once.
                    grid[nr][nc] = 2;
                    fresh--;
                    queue[tail++] = nr * cols + nc;
                }
            }
        }
        minutes++;
    }
    free(queue);
    return fresh > 0 ? -1 : minutes;
}
