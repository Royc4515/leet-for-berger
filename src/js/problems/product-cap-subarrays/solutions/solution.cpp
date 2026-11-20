class Solution {
public:
    // O(n) time - all values are >= 1, so a longer window never has a smaller product and the
    // leftmost valid start only moves forward.
    long long countProductBelow(vector<int>& nums, int k) {
        // With k <= 1 no product qualifies, and the shrink loop would run past the window.
        if (k <= 1) return 0;
        long long product = 1; // below k * 10^4 < 10^13 before shrinking, so 64 bits are enough
        int left = 0;
        long long count = 0; // up to n(n + 1) / 2, about 5 * 10^9: overflows an int
        for (int right = 0; right < (int)nums.size(); right++) {
            product *= nums[right];
            while (product >= k) {
                product /= nums[left++];
            }
            // Every window that ends at right and starts in [left, right] fits.
            count += right - left + 1;
        }
        return count;
    }
};
