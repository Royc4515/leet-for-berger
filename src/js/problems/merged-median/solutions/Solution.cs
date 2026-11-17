// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.cs
public class Solution {
    private int m;
    private int n;
    private int[] nums1;
    private int[] nums2;

    // O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
    public long MedianTimesTwo(int[] nums1, int[] nums2) {
        m = nums1.Length;
        n = nums2.Length;
        this.nums1 = nums1;
        this.nums2 = nums2;
        // Widen before adding: two values near 2^31 - 1 overflow an int.
        long a = F(0, 0, (m + n + 1) / 2);
        long b = F(0, 0, (m + n + 2) / 2);
        // The two middle positions coincide when the total is odd, which gives twice the middle value.
        return a + b;
    }

    private int F(int i, int j, int k) {
        if (i >= m) {
            return nums2[j + k - 1];
        }
        if (j >= n) {
            return nums1[i + k - 1];
        }
        if (k == 1) {
            return Math.Min(nums1[i], nums2[j]);
        }
        int p = k / 2;
        // A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
        // No sentinel value: inputs span the whole int range, so any sentinel could collide with real data.
        if (i + p - 1 >= m) return F(i, j + p, k - p);
        if (j + p - 1 >= n) return F(i + p, j, k - p);
        return nums1[i + p - 1] < nums2[j + p - 1] ? F(i + p, j, k - p) : F(i, j + p, k - p);
    }
}
