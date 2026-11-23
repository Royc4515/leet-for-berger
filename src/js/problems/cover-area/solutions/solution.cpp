class Solution {
public:
    // O(1) time - both areas minus the overlap, which is a rectangle when it exists.
    int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
        // Clamp each side at 0 separately: two negative sides would multiply to a positive area.
        int width = max(0, min(ax2, bx2) - max(ax1, bx1));
        int height = max(0, min(ay2, by2) - max(ay1, by1));
        // Each area is at most 4 * 10^8, so the sum still fits in an int.
        return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - width * height;
    }
};
