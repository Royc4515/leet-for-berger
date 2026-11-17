// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0632.Smallest%20Range%20Covering%20Elements%20from%20K%20Lists/Solution.java
import java.util.*;

class Solution {
    // O(N log N) time - merge every value with its list index, then slide a window over the
    // merged order: grow on the right, shrink from the left while all k lists are still covered.
    public int[] smallestRange(int[][] nums) {
        int n = 0;
        for (int[] v : nums) {
            n += v.length;
        }
        int k = nums.length;
        // Value and list index packed into one long: sorting primitives avoids boxing, and the
        // value sits in the high bits (offset to be non-negative) so it decides the order.
        long[] t = new long[n];
        for (int i = 0, j = 0; i < k; ++i) {
            for (int x : nums[i]) {
                t[j++] = ((long) (x + 100000) << 32) | i;
            }
        }
        Arrays.sort(t);
        int[] have = new int[k];
        int covered = 0, j = 0;
        int[] ans = null;
        for (long e : t) {
            int b = (int) (e >> 32) - 100000;
            int v = (int) e;
            if (have[v]++ == 0) covered++;
            while (covered == k) {
                int a = (int) (t[j] >> 32) - 100000;
                int w = (int) t[j];
                // Strictly narrower only: b never decreases, so an equally wide window found later
                // starts later, and ties must go to the smaller start.
                if (ans == null || b - a < ans[1] - ans[0]) ans = new int[] {a, b};
                if (--have[w] == 0) covered--;
                ++j;
            }
        }
        return ans;
    }
}
