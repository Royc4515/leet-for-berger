public class Solution {
    // O(1) time - a power of four has exactly one set bit, and that bit sits at an even position.
    public bool IsPowerOfFour(int n) {
        // n > 0 comes first: it rejects zero and negatives and keeps n - 1 from overflowing.
        // 0x55555555 keeps bits 0, 2, 4, ... so powers of two like 2 and 8 fail the last test.
        return n > 0 && (n & (n - 1)) == 0 && (n & 0x55555555) != 0;
    }
}
