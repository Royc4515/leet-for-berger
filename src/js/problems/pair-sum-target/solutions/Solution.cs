public class Solution {
    // O(n) time, O(n) space - one pass, value -> index.
    public int[] PairSum(int[] nums, int target) {
        var seen = new Dictionary<long, int>();
        for (int j = 0; j < nums.Length; j++) {
            // 64-bit arithmetic: target - nums[j] can leave the 32-bit range.
            if (seen.TryGetValue((long)target - nums[j], out int i)) return new[] { i, j };
            seen[nums[j]] = j;
        }
        return Array.Empty<int>();
    }
}
