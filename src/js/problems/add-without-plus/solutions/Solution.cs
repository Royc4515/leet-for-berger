public class Solution {
    // O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
    // C# ints are 32-bit two's complement and bitwise operators never overflow-check, so the
    // carry falls off the top.
    public int GetSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a ^= b;
            b = carry;
        }
        return a;
    }
}
