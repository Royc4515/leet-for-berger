// O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.
typedef struct {
    int* p; // (rows + 1) x (cols + 1), row-major
    int width;
} NumMatrix;

NumMatrix* numMatrixCreate(int** matrix, int matrixSize, int* matrixColSize) {
    int rows = matrixSize, cols = matrixColSize[0];
    NumMatrix* obj = malloc(sizeof(NumMatrix));
    obj->width = cols + 1;
    // An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
    obj->p = calloc((size_t)(rows + 1) * (cols + 1), sizeof(int));
    int w = obj->width;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            // The block above and the block to the left overlap in p[r][c], counted twice.
            obj->p[(r + 1) * w + c + 1] = matrix[r][c] + obj->p[r * w + c + 1] + obj->p[(r + 1) * w + c] - obj->p[r * w + c];
        }
    }
    return obj;
}

int numMatrixSumRegion(NumMatrix* obj, int row1, int col1, int row2, int col2) {
    int w = obj->width;
    int* p = obj->p;
    // Remove the strip above and the strip to the left, then add back their shared corner.
    return p[(row2 + 1) * w + col2 + 1] - p[row1 * w + col2 + 1] - p[(row2 + 1) * w + col1] + p[row1 * w + col1];
}

void numMatrixFree(NumMatrix* obj) {
    free(obj->p);
    free(obj);
}
