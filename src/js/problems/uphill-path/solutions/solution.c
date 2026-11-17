static int compareDesc(const void* a, const void* b) {
    long long x = *(const long long*)a, y = *(const long long*)b;
    return (x < y) - (x > y);
}

// O(mn log mn) time, O(mn) space. Cells are settled from the largest value down, so every
// strictly larger neighbor is already final. No recursion: a path can be 40,000 cells long.
int longestIncreasingPath(int** matrix, int matrixSize, int* matrixColSize) {
    int m = matrixSize, n = matrixColSize[0], total = m * n;
    // value * total + index packs a cell into one sortable 64-bit key.
    long long* keys = malloc(sizeof(long long) * total);
    for (int c = 0; c < total; c++) keys[c] = (long long)matrix[c / n][c % n] * total + c;
    qsort(keys, total, sizeof(long long), compareDesc);
    int* best = calloc(total, sizeof(int));
    int answer = 0;
    const int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    for (int k = 0; k < total; k++) {
        int c = (int)(keys[k] % total), i = c / n, j = c % n, len = 1;
        for (int d = 0; d < 4; d++) {
            int x = i + dirs[d][0], y = j + dirs[d][1];
            if (x >= 0 && x < m && y >= 0 && y < n && matrix[x][y] > matrix[i][j] && best[x * n + y] + 1 > len) len = best[x * n + y] + 1;
        }
        best[c] = len;
        if (len > answer) answer = len;
    }
    free(keys);
    free(best);
    return answer;
}
