// O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
// mirroring each row, and both moves are plain swaps.
int** rotateGrid(int** matrix, int matrixSize, int* matrixColSize, int* returnSize, int** returnColumnSizes) {
    int n = matrixSize;
    for (int i = 0; i < n; i++) {
        // Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = t;
        }
    }
    for (int i = 0; i < n; i++) {
        for (int l = 0, r = n - 1; l < r; l++, r--) {
            int t = matrix[i][l];
            matrix[i][l] = matrix[i][r];
            matrix[i][r] = t;
        }
    }
    // The rotation happened in place, so the caller's (already malloced) rows are the answer;
    // only the size bookkeeping is new.
    *returnSize = n;
    *returnColumnSizes = malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) (*returnColumnSizes)[i] = matrixColSize[i];
    return matrix;
}
