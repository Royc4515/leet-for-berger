public class Solution {
    // O(N log N) time - merge every value with its list index, then slide a window over the
    // merged order: grow on the right, shrink from the left while all k lists are still covered.
    public int[] SmallestRange(int[][] nums) {
        int k = nums.Length, n = 0;
        foreach (var list in nums) n += list.Length;
        // Value and list index packed into one long: the value sits in the high bits (offset to
        // be non-negative) so it decides the order of a plain numeric sort.
        long[] t = new long[n];
        for (int i = 0, j = 0; i < k; i++) {
            foreach (int x in nums[i]) t[j++] = ((long)(x + 100000) << 32) | (uint)i;
        }
        Array.Sort(t);
        int[] have = new int[k];
        int covered = 0, left = 0;
        int[] ans = null;
        foreach (long e in t) {
            int b = (int)(e >> 32) - 100000;
            int v = (int)(e & 0xffffffff);
            if (have[v]++ == 0) covered++;
            while (covered == k) {
                int a = (int)(t[left] >> 32) - 100000;
                int w = (int)(t[left] & 0xffffffff);
                // Strictly narrower only: b never decreases, so an equally wide window found later
                // starts later, and ties must go to the smaller start.
                if (ans == null || b - a < ans[1] - ans[0]) ans = new[] { a, b };
                if (--have[w] == 0) covered--;
                left++;
            }
        }
        return ans;
    }
}
