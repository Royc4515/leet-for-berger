class Solution {
public:
    // O(n) time, O(1) space: the answer is the longest window that holds at most k zeros. The left
    // edge only moves forward, so each element enters and leaves the window once.
    int longestRunWithFlips(vector<int>& nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            // One new zero may be paid for by dropping many ones first, so this is a loop.
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};
