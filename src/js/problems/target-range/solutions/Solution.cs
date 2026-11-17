// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/Solution.cs
public class Solution {
    // O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
    public int[] SearchRange(int[] nums, int target) {
        // target + 1 cannot overflow: |target| <= 10^9.
        int l = Search(nums, target);
        int r = Search(nums, target + 1);
        // An empty run [l, r) means the target is absent.
        return l == r ? new int[] {-1, -1} : new int[] {l, r - 1};
    }

    private int Search(int[] nums, int x) {
        int left = 0, right = nums.Length;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] >= x) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return left;
    }
}
