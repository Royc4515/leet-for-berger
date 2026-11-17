class Solution {
    // O(n) time, O(1) space - two pointers that always move the side with the lower wall.
    public long trapRain(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        int leftMax = 0, rightMax = 0;
        long water = 0; // up to about 2 * 10^10: a 32-bit int overflows
        while (lo < hi) {
            // The lower end is bounded by its own side's maximum: the other side is at least as tall.
            if (heights[lo] <= heights[hi]) {
                leftMax = Math.max(leftMax, heights[lo]);
                water += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = Math.max(rightMax, heights[hi]);
                water += rightMax - heights[hi];
                hi--;
            }
        }
        return water;
    }
}
