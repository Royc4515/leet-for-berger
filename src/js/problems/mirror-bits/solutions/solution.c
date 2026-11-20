// O(1): always 32 rounds, so leading zeros of n become trailing zeros of the answer.
long long mirrorBits(long long n) {
    // long long holds all 32 bits as a positive number; an int answer would go negative.
    long long out = 0;
    for (int i = 0; i < 32; i++) {
        out = (out << 1) | (n & 1);
        n >>= 1;
    }
    return out;
}
