// O(rows * cols) time - flood fill each new island once, with an explicit stack so the depth
// of a snake-shaped island does not depend on the call stack.
int countIslands(char** grid, int gridSize) {
    int m = gridSize, n = strlen(grid[0]);
    char* seen = calloc(m * n, 1);
    // Each cell is pushed at most once (marked on push), so m * n slots are enough.
    int* stack = malloc(sizeof(int) * m * n);
    int dirs[5] = {-1, 0, 1, 0, -1};
    int ans = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] != '1' || seen[i * n + j]) continue;
            ans++;
            int top = 0;
            seen[i * n + j] = 1;
            stack[top++] = i * n + j;
            while (top > 0) {
                int cell = stack[--top];
                int r = cell / n, c = cell % n;
                for (int k = 0; k < 4; k++) {
                    int x = r + dirs[k], y = c + dirs[k + 1];
                    if (x >= 0 && x < m && y >= 0 && y < n && grid[x][y] == '1' && !seen[x * n + y]) {
                        seen[x * n + y] = 1;
                        stack[top++] = x * n + y;
                    }
                }
            }
        }
    }
    free(seen);
    free(stack);
    return ans;
}
