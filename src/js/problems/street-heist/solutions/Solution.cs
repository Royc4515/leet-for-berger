public class Solution {
    // O(n) time, O(1) space - best(i) = max(best(i - 1), best(i - 2) + nums[i]).
    public int Rob(int[] nums) {
        // Iterative rather than recursive: 10^5 frames is too deep for a default stack.
        int prev = 0, cur = 0; // totals stay <= 5 * 10^8, inside an int
        foreach (int x in nums) {
            // Either skip this house (keep cur) or take it on top of the best that skips its neighbor.
            (prev, cur) = (cur, Math.Max(cur, prev + x));
        }
        return cur;
    }
}
