public class Solution {
    // O(n log n) time. Sorted, the cheapest win for the smallest unbeaten value is the next larger
    // one, so one forward pointer finds every match.
    public int RankBoost(int[] nums) {
        System.Array.Sort(nums);
        int j = 0;
        // j never passes the current index, so nums[j] is always a value already seen or equal to x.
        foreach (int x in nums) {
            if (x > nums[j]) j++;
        }
        return j;
    }
}
