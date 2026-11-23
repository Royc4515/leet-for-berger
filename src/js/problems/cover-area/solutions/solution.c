// O(1) time - both areas minus the overlap, which is a rectangle when it exists.
static int lo(int a, int b) { return a < b ? a : b; }
static int hi(int a, int b) { return a > b ? a : b; }

int computeArea(int ax1, int ay1, int ax2, int ay2, int bx1, int by1, int bx2, int by2) {
    // Clamp each side at 0 separately: two negative sides would multiply to a positive area.
    int width = hi(0, lo(ax2, bx2) - hi(ax1, bx1));
    int height = hi(0, lo(ay2, by2) - hi(ay1, by1));
    // Each area is at most 4 * 10^8, so the sum still fits in an int.
    return (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - width * height;
}
