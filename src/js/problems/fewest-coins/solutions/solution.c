// O(amount * coinsSize) time - the best way to pay a ends with some coin c, after paying a - c.
int coinChange(int* coins, int coinsSize, int amount) {
    // amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable".
    int inf = amount + 1;
    int* f = malloc(sizeof(int) * (amount + 1));
    f[0] = 0;
    for (int j = 1; j <= amount; j++) f[j] = inf;
    // Coins in the outer loop: each pass allows one more denomination, reused any number of times.
    for (int i = 0; i < coinsSize; i++) {
        int x = coins[i];
        // Starting at j = x (not j - x >= 0) also avoids overflow for coins near 2^31 - 1.
        for (int j = x; j <= amount; j++) {
            if (f[j - x] + 1 < f[j]) f[j] = f[j - x] + 1;
        }
    }
    int ans = f[amount] >= inf ? -1 : f[amount];
    free(f);
    return ans;
}
