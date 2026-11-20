class Solution {
public:
    // O(n log n) time. Sorted, the cheapest win for the smallest unbeaten value is the next larger
    // one, so one forward pointer finds every match.
    int rankBoost(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        int j = 0;
        // j never passes the current index, so nums[j] is always a value already seen or equal to x.
        for (int x : nums) {
            if (x > nums[j]) j++;
        }
        return j;
    }
};
