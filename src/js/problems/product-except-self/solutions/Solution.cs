public class Solution {
    // O(n) time, O(1) extra space besides the output: left products first, right products second.
    public int[] ProductExceptSelf(int[] nums) {
        int n = nums.Length;
        int[] answer = new int[n];
        // answer[i] holds the product of everything left of i; division is out because of zeros.
        int left = 1;
        for (int i = 0; i < n; i++) {
            answer[i] = left;
            left *= nums[i];
        }
        // A single running value is enough for the right side, so no second array is needed.
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= right;
            right *= nums[i];
        }
        return answer;
    }
}
