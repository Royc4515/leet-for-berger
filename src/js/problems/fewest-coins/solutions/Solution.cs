public class Solution {
    // O(amount * coins.Length) time - the best way to pay a ends with some coin c, after paying a - c.
    public int CoinChange(int[] coins, int amount) {
        // amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable".
        int inf = amount + 1;
        int[] f = new int[amount + 1];
        Array.Fill(f, inf);
        f[0] = 0;
        // Coins in the outer loop: each pass allows one more denomination, reused any number of times.
        foreach (int x in coins) {
            // Starting at j = x (not j - x >= 0) also avoids overflow for coins near 2^31 - 1.
            for (int j = x; j <= amount; ++j) {
                f[j] = Math.Min(f[j], f[j - x] + 1);
            }
        }
        return f[amount] >= inf ? -1 : f[amount];
    }
}
