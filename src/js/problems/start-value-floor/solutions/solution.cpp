class Solution {
public:
    // O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment
    // is the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
    int minStartValue(vector<int>& nums) {
        int total = 0;  // |total| <= 10^5 * 10^4 = 10^9, within an int
        int lowest = 0;
        for (int v : nums) {
            total += v;
            lowest = min(lowest, total);
        }
        return 1 - lowest;
    }
};
