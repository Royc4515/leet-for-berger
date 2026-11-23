class Solution {
    // O(1) time - both areas minus the overlap, which is a rectangle when it exists.
    public int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
        // Clamp each side at 0 separately: two negative sides would multiply to a positive area.
        int width = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
        int height = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
        // Each area is at most 4 * 10^8, so the sum still fits in an int.
        return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - width * height;
    }
}
