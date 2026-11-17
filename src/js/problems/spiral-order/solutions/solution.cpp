class Solution {
public:
    // O(m * n) time - four walls close in; each sweep reads one side of the current layer.
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> out;
        out.reserve(matrix.size() * matrix[0].size());
        int top = 0, bottom = (int)matrix.size() - 1, left = 0, right = (int)matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);
            for (int r = top + 1; r <= bottom; r++) out.push_back(matrix[r][right]);
            // A lone leftover row or column was already read by the two sweeps above.
            if (top < bottom && left < right) {
                for (int c = right - 1; c >= left; c--) out.push_back(matrix[bottom][c]);
                for (int r = bottom - 1; r > top; r--) out.push_back(matrix[r][left]);
            }
            top++;
            bottom--;
            left++;
            right--;
        }
        return out;
    }
};
