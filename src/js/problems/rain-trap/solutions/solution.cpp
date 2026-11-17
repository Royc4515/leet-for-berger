class Solution {
public:
    // O(n) time, O(1) space - two pointers that always move the side with the lower wall.
    long long trapRain(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0;
        long long water = 0; // up to about 2 * 10^10: a 32-bit int overflows
        while (lo < hi) {
            // The lower end is bounded by its own side's maximum: the other side is at least as tall.
            if (heights[lo] <= heights[hi]) {
                leftMax = max(leftMax, heights[lo]);
                water += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = max(rightMax, heights[hi]);
                water += rightMax - heights[hi];
                hi--;
            }
        }
        return water;
    }
};
