// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0493.Reverse%20Pairs/Solution.cpp
class Solution {
public:
    // O(n log n) - merge sort. Before merging two sorted halves, one forward sweep counts, for
    // each right-half value, the left-half values above twice it.
    long long reversePairs(vector<int>& input) {
        // A copy: sorting must not change the caller's array.
        vector<int> nums = input;
        int n = nums.size();
        // A heap buffer: a variable-length stack array of 10^5 ints is not standard C++.
        vector<int> t(n);
        // The count can pass 2^31 (up to about 5 * 10^9 pairs), hence long long.
        function<long long(int, int)> mergeSort = [&](int l, int r) -> long long {
            if (l >= r) {
                return 0;
            }
            int mid = (l + r) >> 1;
            long long ans = mergeSort(l, mid) + mergeSort(mid + 1, r);
            int i = l, j = mid + 1, k = 0;
            while (i <= mid && j <= r) {
                // 2LL widens before doubling: 2 * nums[j] overflows int near +-2^31.
                if (nums[i] <= nums[j] * 2LL) {
                    ++i;
                } else {
                    ans += mid - i + 1;
                    ++j;
                }
            }
            i = l;
            j = mid + 1;
            while (i <= mid && j <= r) {
                if (nums[i] <= nums[j]) {
                    t[k++] = nums[i++];
                } else {
                    t[k++] = nums[j++];
                }
            }
            while (i <= mid) {
                t[k++] = nums[i++];
            }
            while (j <= r) {
                t[k++] = nums[j++];
            }
            for (i = l; i <= r; ++i) {
                nums[i] = t[i - l];
            }
            return ans;
        };
        return mergeSort(0, n - 1);
    }
};
