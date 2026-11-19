// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.cs
public class Solution {
    // O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
    public int[] CommonValues(int[] nums1, int[] nums2) {
        var common = new HashSet<int>(nums1);
        // Keeps only the values also in nums2; a set holds each of them once.
        common.IntersectWith(nums2);
        int[] ans = new int[common.Count];
        common.CopyTo(ans);
        Array.Sort(ans);
        return ans;
    }
}
