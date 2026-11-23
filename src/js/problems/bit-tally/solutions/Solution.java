class Solution {
    // O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
    public int[] countBits(int n) {
        // n + 1 entries: the count for n itself is part of the answer.
        int[] tally = new int[n + 1];
        for (int i = 1; i <= n; i++) tally[i] = tally[i >> 1] + (i & 1);
        return tally;
    }
}
