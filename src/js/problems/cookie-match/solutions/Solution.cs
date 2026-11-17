public class Solution {
    // O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
    public int FindContentChildren(int[] g, int[] s) {
        Array.Sort(g);
        Array.Sort(s);
        int m = g.Length, n = s.Length;
        for (int i = 0, j = 0; i < m; ++i) {
            // Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
            while (j < n && s[j] < g[i]) {
                ++j;
            }
            if (j++ >= n) {
                return i;
            }
        }
        return m;
    }
}
