public class Solution {
    // O(n) time - all values are >= 1, so a longer window never has a smaller product and the
    // leftmost valid start only moves forward.
    public long CountProductBelow(int[] nums, int k) {
        // With k <= 1 no product qualifies, and the shrink loop would run past the window.
        if (k <= 1) return 0;
        long product = 1; // below k * 10^4 < 10^13 before shrinking, so a long is enough
        int left = 0;
        long count = 0; // up to n(n + 1) / 2, about 5 * 10^9: overflows an int
        for (int right = 0; right < nums.Length; right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left++];
            }
            // Every window that ends at right and starts in [left, right] fits.
            count += right - left + 1;
        }
        return count;
    }
}
