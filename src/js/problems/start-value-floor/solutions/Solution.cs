public class Solution {
    // O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment
    // is the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
    public int MinStartValue(int[] nums) {
        int total = 0; // |total| <= 10^5 * 10^4 = 10^9, within an int
        int lowest = 0;
        foreach (int v in nums) {
            total += v;
            if (total < lowest) lowest = total;
        }
        return 1 - lowest;
    }
}
