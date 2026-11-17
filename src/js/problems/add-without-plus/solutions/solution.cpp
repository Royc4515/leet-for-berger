class Solution {
public:
    // O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
    int getSum(int a, int b) {
        // Signed overflow and left-shifting a negative value are undefined in C++17; unsigned
        // arithmetic wraps modulo 2^32, which is exactly two's complement addition.
        unsigned int x = (unsigned int)a, y = (unsigned int)b;
        while (y != 0) {
            unsigned int carry = (x & y) << 1;
            x ^= y;
            y = carry;
        }
        return (int)x;
    }
};
