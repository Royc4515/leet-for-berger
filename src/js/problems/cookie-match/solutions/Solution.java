// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0455.Assign%20Cookies/Solution.java
import java.util.*;

class Solution {
    // O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
    public int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g);
        Arrays.sort(s);
        int m = g.length;
        int n = s.length;
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
