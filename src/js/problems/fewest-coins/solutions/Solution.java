// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0322.Coin%20Change/Solution.java
import java.util.*;

class Solution {
    // O(amount * coins.length) time - the best way to pay a ends with some coin c, after paying a - c.
    public int coinChange(int[] coins, int amount) {
        // amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable"
        // and, unlike Integer.MAX_VALUE, survives the + 1 below without overflowing.
        final int inf = amount + 1;
        int[] f = new int[amount + 1];
        Arrays.fill(f, inf);
        f[0] = 0;
        // Coins in the outer loop: each pass allows one more denomination, reused any number of times.
        for (int x : coins) {
            // Starting at j = x (not j - x >= 0) also avoids overflow for coins near 2^31 - 1.
            for (int j = x; j <= amount; ++j) {
                f[j] = Math.min(f[j], f[j - x] + 1);
            }
        }
        return f[amount] >= inf ? -1 : f[amount];
    }
}
