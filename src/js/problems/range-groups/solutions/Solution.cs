public class Solution {
    // O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
    // (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
    public int CountSplits(int[][] ranges) {
        const int MOD = 1_000_000_007;
        // Sort a copy of the row references: the caller's array is not ours to reorder.
        var sorted = (int[][])ranges.Clone();
        // CompareTo rather than subtraction, which is the habit that avoids overflow bugs.
        Array.Sort(sorted, (a, b) => a[0].CompareTo(b[0]));
        int blocks = 0;
        int reach = -1; // furthest end seen so far
        foreach (int[] r in sorted) {
            // `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
            if (r[0] > reach) blocks++;
            // Math.Max, not r[1]: a nested range must not shorten the reach of the one around it.
            reach = Math.Max(reach, r[1]);
        }
        // The modulus is applied while doubling: the power is far beyond any fixed-width integer.
        long ways = 1;
        for (int i = 0; i < blocks; i++) ways = ways * 2 % MOD;
        return (int)ways;
    }
}
