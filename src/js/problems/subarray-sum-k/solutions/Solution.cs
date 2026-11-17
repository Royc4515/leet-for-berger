public class Solution {
    // O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
    public long SubarraySum(int[] nums, int k) {
        // Seeding prefix 0 once counts subarrays that start at index 0.
        var seen = new Dictionary<int, int> { [0] = 1 };
        int prefix = 0; // |prefix| <= 10^8, fits in an int
        long count = 0; // up to n(n+1)/2, about 5 * 10^9: overflows an int
        foreach (int v in nums) {
            prefix += v;
            // Look up before inserting, so the empty subarray (i == j) is never counted.
            if (seen.TryGetValue(prefix - k, out int c)) count += c;
            seen[prefix] = seen.GetValueOrDefault(prefix) + 1;
        }
        return count;
    }
}
