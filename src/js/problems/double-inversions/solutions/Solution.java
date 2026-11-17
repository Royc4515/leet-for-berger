// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0493.Reverse%20Pairs/Solution.java
class Solution {
    private int[] nums;
    private int[] t;

    // O(n log n) - merge sort. Before merging two sorted halves, one forward sweep counts, for
    // each right-half value, the left-half values above twice it.
    public long reversePairs(int[] nums) {
        // A copy: sorting must not change the caller's array.
        this.nums = nums.clone();
        int n = nums.length;
        this.t = new int[n];
        return mergeSort(0, n - 1);
    }

    // The count can pass 2^31 (up to about 5 * 10^9 pairs), hence long.
    private long mergeSort(int l, int r) {
        if (l >= r) {
            return 0;
        }
        int mid = (l + r) >> 1;
        long ans = mergeSort(l, mid) + mergeSort(mid + 1, r);
        int i = l, j = mid + 1, k = 0;
        while (i <= mid && j <= r) {
            // 2L widens before doubling: 2 * nums[j] overflows int near +-2^31.
            if (nums[i] <= nums[j] * 2L) {
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
    }
}
