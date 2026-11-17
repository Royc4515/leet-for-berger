class Solution {
public:
    // O(n^2) time, O(1) extra space - a clockwise quarter turn is a transpose followed by
    // mirroring each row, and both moves are plain swaps.
    vector<vector<int>> rotateGrid(vector<vector<int>>& matrix) {
        int n = (int)matrix.size();
        for (int i = 0; i < n; i++) {
            // Start at i + 1 so each off-diagonal pair is swapped once, not swapped back.
            for (int j = i + 1; j < n; j++) swap(matrix[i][j], matrix[j][i]);
        }
        for (auto& row : matrix) reverse(row.begin(), row.end());
        return matrix;
    }
};
