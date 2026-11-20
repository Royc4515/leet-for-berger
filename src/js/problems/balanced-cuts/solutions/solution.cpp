class Solution {
public:
    // O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
    long long minLargestPart(vector<int>& nums, int k) {
        // The total reaches 10^10, so the bounds and the midpoint are long long.
        long long low = 0, high = 0;
        for (int v : nums) {
            low = max(low, (long long)v);
            high += v;
        }
        while (low < high) {
            long long mid = (low + high) / 2;
            if (fits(nums, k, mid)) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

private:
    bool fits(const vector<int>& nums, int k, long long cap) {
        int parts = 1;
        long long current = 0;
        for (int v : nums) {
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
};
