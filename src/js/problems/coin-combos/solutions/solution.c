// O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination is
// built in one fixed coin order and counted once.
int change(int amount, int* coins, int coinsSize) {
    const int MOD = 1000000007;
    int* ways = calloc(amount + 1, sizeof(int));
    ways[0] = 1;
    for (int i = 0; i < coinsSize; i++) {
        for (int a = coins[i]; a <= amount; a++) {
            // Both terms are below MOD, so the sum stays below 2^31 before reducing.
            ways[a] += ways[a - coins[i]];
            if (ways[a] >= MOD) ways[a] -= MOD;
        }
    }
    int answer = ways[amount];
    free(ways);
    return answer;
}
