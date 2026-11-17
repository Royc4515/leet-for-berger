// O(m * n) time - four walls close in; each sweep reads one side of the current layer.
int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {
    int m = matrixSize, n = matrixColSize[0];
    int* out = malloc(sizeof(int) * m * n);
    int k = 0;
    int top = 0, bottom = m - 1, left = 0, right = n - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out[k++] = matrix[top][c];
        for (int r = top + 1; r <= bottom; r++) out[k++] = matrix[r][right];
        // A lone leftover row or column was already read by the two sweeps above.
        if (top < bottom && left < right) {
            for (int c = right - 1; c >= left; c--) out[k++] = matrix[bottom][c];
            for (int r = bottom - 1; r > top; r--) out[k++] = matrix[r][left];
        }
        top++;
        bottom--;
        left++;
        right--;
    }
    *returnSize = k;
    return out;
}
