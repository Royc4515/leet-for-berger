// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.cpp
class Solution {
public:
    // O(n) - reserve 2n once, then append the original n values twice.
    vector<int> doubleArray(vector<int>& nums) {
        vector<int> ans;
        ans.reserve(nums.size() * 2);
        // Appending to nums while iterating over it would invalidate the iterators on reallocation.
        ans.insert(ans.end(), nums.begin(), nums.end());
        ans.insert(ans.end(), nums.begin(), nums.end());
        return ans;
    }
};
