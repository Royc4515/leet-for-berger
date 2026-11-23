class Solution {
public:
    // O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
    vector<int> countBits(int n) {
        // n + 1 entries: the count for n itself is part of the answer.
        vector<int> tally(n + 1, 0);
        for (int i = 1; i <= n; i++) tally[i] = tally[i >> 1] + (i & 1);
        return tally;
    }
};
