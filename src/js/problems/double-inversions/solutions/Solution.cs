public class Solution {
    // O(n log n) - bottom-up merge sort. Before merging two sorted runs, one forward sweep
    // counts, for each right-run value, the left-run values above twice it.
    public long ReversePairs(int[] nums) {
        int n = nums.Length;
        var a = (int[])nums.Clone();
        var buf = new int[n];
        // The count can pass 2^31 (up to about 5 * 10^9 pairs), hence long.
        long count = 0;
        for (int width = 1; width < n; width *= 2) {
            for (int lo = 0; lo < n; lo += 2 * width) {
                int mid = Math.Min(lo + width, n), hi = Math.Min(lo + 2 * width, n);
                // As the right value grows, the first left value above twice it only moves
                // right.
                int i = lo;
                for (int j = mid; j < hi; j++) {
                    // 2L widens before doubling: 2 * a[j] overflows int near +-2^31.
                    while (i < mid && a[i] <= 2L * a[j]) {
                        i++;
                    }
                    count += mid - i;
                }
                int p = lo, q = mid;
                for (int k = lo; k < hi; k++) {
                    buf[k] = (q >= hi || (p < mid && a[p] <= a[q])) ? a[p++] : a[q++];
                }
            }
            (a, buf) = (buf, a);
        }
        return count;
    }
}
