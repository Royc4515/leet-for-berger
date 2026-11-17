class Solution {
public:
    // O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
    long long subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> seen;
        seen.reserve(nums.size() * 2 + 1);
        // Seeding prefix 0 once counts subarrays that start at index 0.
        seen[0] = 1;
        int prefix = 0;      // |prefix| <= 10^8, fits in an int
        long long count = 0; // up to n(n+1)/2, about 5 * 10^9: overflows an int
        for (int v : nums) {
            prefix += v;
            // Look up before inserting, so the empty subarray (i == j) is never counted.
            auto it = seen.find(prefix - k);
            if (it != seen.end()) count += it->second;
            seen[prefix]++;
        }
        return count;
    }
};
