public class Solution {
    // O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
    public long MinLargestPart(int[] nums, int k) {
        // The total reaches 10^10, so the bounds and the midpoint are long.
        long low = 0, high = 0;
        foreach (int v in nums) {
            low = Math.Max(low, v);
            high += v;
        }
        while (low < high) {
            long mid = (low + high) / 2;
            if (Fits(nums, k, mid)) high = mid;
            else low = mid + 1;
        }
        return low;
    }

    private bool Fits(int[] nums, int k, long cap) {
        int parts = 1;
        long current = 0;
        foreach (int v in nums) {
            // Closing a part as late as possible never hurts the parts after it.
            if (current + v > cap) {
                parts++;
                current = v;
            } else {
                current += v;
            }
        }
        return parts <= k;
    }
}
