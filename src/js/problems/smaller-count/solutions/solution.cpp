class Solution {
public:
    // O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
    vector<int> smallerNumbersThanCurrent(vector<int>& nums) {
        int freq[101] = {0};
        for (int v : nums) freq[v]++;
        // smaller[v] = how many elements are below v: a running total of the counts before v.
        int smaller[101] = {0};
        for (int v = 1; v <= 100; v++) smaller[v] = smaller[v - 1] + freq[v - 1];
        vector<int> answer(nums.size());
        for (size_t i = 0; i < nums.size(); i++) answer[i] = smaller[nums[i]];
        return answer;
    }
};
