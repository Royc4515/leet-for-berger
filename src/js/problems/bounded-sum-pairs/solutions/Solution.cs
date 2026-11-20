public class Solution {
    // O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at most
    // x using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
    public long CountBoundedPairs(int[] nums, int lower, int upper) {
        int[] a = (int[])nums.Clone();
        Array.Sort(a);
        return AtMost(a, upper) - AtMost(a, lower - 1);
    }

    // A sum of two values is within +-2 * 10^9, which fits in an int; the count does not.
    private long AtMost(int[] a, int limit) {
        long count = 0;
        int lo = 0;
        int hi = a.Length - 1;
        while (lo < hi) {
            if (a[lo] + a[hi] <= limit) {
                // a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
                count += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return count;
    }
}
