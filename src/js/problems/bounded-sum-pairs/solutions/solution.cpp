class Solution {
public:
    // O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at most
    // x using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
    long long countBoundedPairs(vector<int>& nums, int lower, int upper) {
        vector<int> a(nums);
        sort(a.begin(), a.end());
        return atMost(a, upper) - atMost(a, lower - 1);
    }

private:
    // A sum of two values is within +-2 * 10^9, which fits in an int; the count does not.
    long long atMost(const vector<int>& a, int limit) {
        long long count = 0;
        int lo = 0;
        int hi = (int)a.size() - 1;
        while (lo < hi) {
            if (a[lo] + a[hi] <= limit) {
                // a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
                count += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return count;
    }
};
