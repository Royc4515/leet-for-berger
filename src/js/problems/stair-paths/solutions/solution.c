// O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
int climbStairs(int n) {
    const int MOD = 1000000007;
    int a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        // Two residues can sum past 2^31 - 1, so add in 64 bits before reducing.
        int c = (int)(((long long)a + b) % MOD);
        a = b;
        b = c;
    }
    return b;
}
