// O(rows * cols) to build, O(1) per query: a 2D prefix table plus inclusion-exclusion.
class NumMatrix {
    vector<vector<int>> p;

public:
    NumMatrix(vector<vector<int>>& matrix) {
        int rows = matrix.size(), cols = matrix[0].size();
        // An extra row and column of zeros, so rectangles touching row 0 or column 0 need no special case.
        p.assign(rows + 1, vector<int>(cols + 1, 0));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                // The block above and the block to the left overlap in p[r][c], counted twice.
                p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
            }
        }
    }

    int sumRegion(int row1, int col1, int row2, int col2) {
        // Remove the strip above and the strip to the left, then add back their shared corner.
        return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
    }
};
