class Solution {
    // O(n) time, O(1) space: track the three largest and two smallest numbers in one pass.
    public int maxTripleProduct(int[] nums) {
        int max1 = -1001, max2 = -1001, max3 = -1001;
        int min1 = 1001, min2 = 1001;
        for (int v : nums) {
            if (v >= max1) {
                max3 = max2;
                max2 = max1;
                max1 = v;
            } else if (v >= max2) {
                max3 = max2;
                max2 = v;
            } else if (v > max3) {
                max3 = v;
            }
            if (v <= min1) {
                min2 = min1;
                min1 = v;
            } else if (v < min2) {
                min2 = v;
            }
        }
        return Math.max(max1 * max2 * max3, min1 * min2 * max1);
    }
}
