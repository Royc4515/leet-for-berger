public class Solution {
    // O(n) time - a deque of indices whose values strictly decrease from front to back.
    public int[] MaxSlidingWindow(int[] nums, int k) {
        int n = nums.Length;
        // Each index is pushed once, so an array of n slots with head and tail is enough.
        var dq = new int[n];
        int head = 0, tail = 0;
        var output = new int[n - k + 1];
        for (int i = 0; i < n; i++) {
            // A value no larger than the newcomer can never be a maximum again: it leaves first.
            while (tail > head && nums[dq[tail - 1]] <= nums[i]) tail--;
            dq[tail++] = i;
            // The front is the window maximum unless it has slid out on the left.
            if (dq[head] <= i - k) head++;
            if (i >= k - 1) output[i - k + 1] = nums[dq[head]];
        }
        return output;
    }
}
