// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0198.House%20Robber/Solution.java
class Solution {
    // O(n) time, O(1) space - best(i) = max(best(i - 1), best(i - 2) + nums[i]).
    public int rob(int[] nums) {
        // Iterative rather than recursive: 10^5 frames is too deep for a default stack.
        int prev = 0, cur = 0; // totals stay <= 5 * 10^8, inside an int
        for (int x : nums) {
            // Either skip this house (keep cur) or take it on top of the best that skips its neighbor.
            int next = Math.max(cur, prev + x);
            prev = cur;
            cur = next;
        }
        return cur;
    }
}
