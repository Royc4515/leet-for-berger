import java.util.*;

class Solution {
    // O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
    public long subarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        // Seeding prefix 0 once counts subarrays that start at index 0.
        seen.put(0, 1);
        int prefix = 0; // |prefix| <= 10^8, fits in an int
        long count = 0; // up to n(n+1)/2, about 5 * 10^9: overflows an int
        for (int v : nums) {
            prefix += v;
            // Look up before inserting, so the empty subarray (i == j) is never counted.
            count += seen.getOrDefault(prefix - k, 0);
            seen.merge(prefix, 1, Integer::sum);
        }
        return count;
    }
}
