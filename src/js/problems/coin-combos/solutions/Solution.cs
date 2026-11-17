public class Solution {
    // O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination
    // is built in one fixed coin order and counted once.
    public int Change(int amount, int[] coins) {
        const int Mod = 1_000_000_007;
        var ways = new int[amount + 1];
        ways[0] = 1;
        foreach (int c in coins) {
            for (int a = c; a <= amount; a++) {
                // Both terms are below Mod, so the sum stays below 2^31 before reducing.
                ways[a] += ways[a - c];
                if (ways[a] >= Mod) ways[a] -= Mod;
            }
        }
        return ways[amount];
    }
}
