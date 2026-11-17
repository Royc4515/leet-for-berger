public class Solution {
    // O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
    public int[] SmallerNumbersThanCurrent(int[] nums) {
        int[] freq = new int[101];
        foreach (int v in nums) freq[v]++;
        // smaller[v] = how many elements are below v: a running total of the counts before v.
        int[] smaller = new int[101];
        for (int v = 1; v <= 100; v++) smaller[v] = smaller[v - 1] + freq[v - 1];
        int[] answer = new int[nums.Length];
        for (int i = 0; i < nums.Length; i++) answer[i] = smaller[nums[i]];
        return answer;
    }
}
