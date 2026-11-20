public class Solution {
    // O(log x) time: peel the last digit and append it to the result, once per digit.
    public int FlipDigits(int x) {
        // Widen to long before negating (-(-2^31) does not fit in int) and for the result, which
        // can reach 10 digits. One range check at the end then covers both signs.
        long rest = x < 0 ? -(long)x : (long)x;
        long flipped = 0;
        while (rest > 0) {
            flipped = flipped * 10 + rest % 10;
            rest /= 10;
        }
        if (x < 0) flipped = -flipped;
        if (flipped < int.MinValue || flipped > int.MaxValue) return 0;
        return (int)flipped;
    }
}
