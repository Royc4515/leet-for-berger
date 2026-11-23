public class Solution {
    // O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
    // remembering the largest number seen per digit sum (at most 81 sums) is enough.
    public int MaximumSum(int[] nums) {
        int[] largest = new int[82];
        int best = -1;
        foreach (int v in nums) {
            int s = 0;
            for (int x = v; x > 0; x /= 10) s += x % 10;
            // 0 means "nothing seen yet": every number is at least 1. The sum is at most 2 * 10^9,
            // which still fits in an int.
            if (largest[s] > 0) best = Math.Max(best, largest[s] + v);
            largest[s] = Math.Max(largest[s], v);
        }
        return best;
    }
}
