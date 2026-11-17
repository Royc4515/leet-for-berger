// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0518.Coin%20Change%20II/Solution.java
class Solution {
    // O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination
    // is built in one fixed coin order and counted once.
    public int change(int amount, int[] coins) {
        final int MOD = 1_000_000_007;
        int[] ways = new int[amount + 1];
        ways[0] = 1;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) {
                // Both terms are below MOD, so the sum stays below 2^31 before reducing.
                ways[a] += ways[a - c];
                if (ways[a] >= MOD) ways[a] -= MOD;
            }
        }
        return ways[amount];
    }
}
