// O(1) time - a power of two has exactly one set bit, and n & (n - 1) clears the lowest one.
bool isPowerOfTwo(int n) {
    // n > 0 comes first: it rejects zero and negatives and keeps n - 1 from overflowing at -2^31.
    return n > 0 && (n & (n - 1)) == 0;
}
