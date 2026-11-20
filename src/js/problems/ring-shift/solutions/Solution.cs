public class Solution {
    // O(n) time, O(1) extra space: reverse everything, then fix the two blocks separately.
    public int[] RingShift(int[] nums, int k) {
        int n = nums.Length;
        // Shifting by n puts every value back where it was, so only k mod n matters (k can be 10^9).
        k %= n;
        // The whole reversal brings the last k values to the front, but backwards; so are the rest.
        Reverse(nums, 0, n - 1);
        Reverse(nums, 0, k - 1);
        Reverse(nums, k, n - 1);
        return nums;
    }

    private void Reverse(int[] a, int lo, int hi) {
        while (lo < hi) {
            (a[lo], a[hi]) = (a[hi], a[lo]);
            lo++;
            hi--;
        }
    }
}
