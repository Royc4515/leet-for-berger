class Solution {
public:
    // O(number of 1 bits) - n & (n - 1) clears the lowest set bit, so the loop runs once per 1
    // instead of once per bit position. n is 64-bit, so 2^31..2^32-1 stay positive.
    int hammingWeight(long long n) {
        int count = 0;
        while (n != 0) {
            n &= n - 1;
            count++;
        }
        return count;
    }
};
