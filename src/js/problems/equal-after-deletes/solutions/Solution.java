class Solution {
    // O(n) time, O(n) space - a window that never shrinks; best is the highest count of one value seen.
    public int longestEqualSubarray(int[] nums, int k) {
        int[] count = new int[nums.length + 1];
        int best = 0, left = 0;
        for (int right = 0; right < nums.length; right++) {
            best = Math.max(best, ++count[nums[right]]);
            // Too many deletions needed: slide instead of grow. A stale best only stops the window from
            // growing, and growing again needs a real new best.
            if (right - left + 1 - best > k) count[nums[left++]]--;
        }
        return best;
    }
}
