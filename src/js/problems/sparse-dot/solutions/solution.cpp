class Solution {
public:
    // O(a + b) time - both lists are sorted by index, so a merge finds the shared indices.
    int sparseDot(vector<vector<int>>& a, vector<vector<int>>& b) {
        size_t i = 0, j = 0;
        int dot = 0;
        while (i < a.size() && j < b.size()) {
            if (a[i][0] == b[j][0]) {
                // At most 10^5 * 100 * 100 = 10^9 in total, which fits in an int.
                dot += a[i][1] * b[j][1];
                i++;
                j++;
            } else if (a[i][0] < b[j][0]) {
                // The smaller index can never meet a partner: every later index in the other list is larger.
                i++;
            } else {
                j++;
            }
        }
        return dot;
    }
};
