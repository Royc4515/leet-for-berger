// O(log x) time: peel the last digit and append it to the result, once per digit.
int flipDigits(int x) {
    // Widen to long long before negating (-(-2^31) does not fit in int) and for the result, which
    // can reach 10 digits. One range check at the end then covers both signs.
    long long rest = x < 0 ? -(long long)x : (long long)x;
    long long flipped = 0;
    while (rest > 0) {
        flipped = flipped * 10 + rest % 10;
        rest /= 10;
    }
    if (x < 0) flipped = -flipped;
    if (flipped < -2147483648LL || flipped > 2147483647LL) return 0;
    return (int)flipped;
}
