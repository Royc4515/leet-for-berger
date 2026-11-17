// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.cpp
class Solution {
public:
    // O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
    long long medianTimesTwo(vector<int>& nums1, vector<int>& nums2) {
        int m = nums1.size(), n = nums2.size();
        function<int(int, int, int)> f = [&](int i, int j, int k) {
            if (i >= m) {
                return nums2[j + k - 1];
            }
            if (j >= n) {
                return nums1[i + k - 1];
            }
            if (k == 1) {
                return min(nums1[i], nums2[j]);
            }
            int p = k / 2;
            // A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
            // No sentinel value: inputs span the whole int range, so any sentinel could collide with real data.
            if (i + p - 1 >= m) return f(i, j + p, k - p);
            if (j + p - 1 >= n) return f(i + p, j, k - p);
            return nums1[i + p - 1] < nums2[j + p - 1] ? f(i + p, j, k - p) : f(i, j + p, k - p);
        };
        // Widen before adding: two values near 2^31 - 1 overflow an int.
        long long a = f(0, 0, (m + n + 1) / 2);
        long long b = f(0, 0, (m + n + 2) / 2);
        // The two middle positions coincide when the total is odd, which gives twice the middle value.
        return a + b;
    }
};
