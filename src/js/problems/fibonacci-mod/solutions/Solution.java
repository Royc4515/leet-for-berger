// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0509.Fibonacci%20Number/Solution.java
class Solution {
    // O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
    // the plain recursion is exponential and a memoized one is 10^6 frames deep.
    public int fibonacciMod(int n) {
        final int MOD = 1_000_000_007;
        int a = 0, b = 1;
        while (n-- > 0) {
            // Two residues can sum to about 2 * 10^9, past the int range, so add in long.
            int c = (int) (((long) a + b) % MOD);
            a = b;
            b = c;
        }
        return a;
    }
}
